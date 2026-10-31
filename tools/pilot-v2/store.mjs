import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {ROOT,sha,safeDataDir} from '../pilot-workbench/common.mjs';
import {loadInputs,buildModel,visibility,identityCompatible} from './model.mjs';
export function openV2Store(dir=resolve(ROOT,'work/pilot-300-v2')){
 const db=new DatabaseSync(resolve(safeDataDir(dir),'pilot-v2.sqlite'));
 db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;');
 db.exec("CREATE TABLE IF NOT EXISTS inputs(id TEXT PRIMARY KEY,hash TEXT NOT NULL,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS runs(hash TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS observations(source_key TEXT PRIMARY KEY,product_id TEXT NOT NULL,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS reviews(id TEXT NOT NULL,revision INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(id,revision)); CREATE TABLE IF NOT EXISTS descriptions(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,text TEXT NOT NULL); CREATE TABLE IF NOT EXISTS scenarios(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,value TEXT NOT NULL);");
 let model,input,modelHash;
 function observeInTransaction(v){
  if(!v||typeof v.sourceKey!=='string'||!v.sourceKey.trim()||!model.products.some(p=>p.id===v.productId)||!Number.isFinite(Date.parse(v.observedAt))||!['historical','unreachable','available','sold','ended'].includes(v.status))throw Error('无效观察');
  const oldRow=db.prepare('SELECT data FROM observations WHERE source_key=?').get(v.sourceKey),old=oldRow?JSON.parse(oldRow.data):null;
  if(old&&(old.productId!==v.productId||!identityCompatible(old.identity||{},v.identity||{})))throw Error('同挂牌身份冲突；不覆盖');
  if(old&&Date.parse(v.observedAt)<Date.parse(old.observedAt))return {changed:false,reason:'older-observation'};
  const seq=old?.eventSequence||0,clean={...v,eventSequence:seq};
  if(old&&sha(clean)===sha(old))return {changed:false,reason:'same-observation'};
  if(old&&Date.parse(v.observedAt)===Date.parse(old.observedAt))return {changed:false,reason:'same-time-conflict'};
  clean.eventSequence=seq+1;
  db.prepare('INSERT INTO observations VALUES(?,?,?) ON CONFLICT(source_key) DO UPDATE SET data=excluded.data').run(v.sourceKey,v.productId,JSON.stringify(clean));
  return {changed:true,eventSequence:clean.eventSequence};
 }
 function observe(v){db.exec('BEGIN IMMEDIATE');try{const result=observeInTransaction(v);db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
 function initialize(){
  input=loadInputs();model=buildModel(input);modelHash=sha(model);
  db.exec('BEGIN IMMEDIATE');try{
   for(const s of input.samples){const hash=sha(s),old=db.prepare('SELECT hash FROM inputs WHERE id=?').get(s.id);if(old&&old.hash!==hash)throw Error('冻结输入被修改 '+s.id);db.prepare('INSERT OR IGNORE INTO inputs VALUES(?,?,?)').run(s.id,hash,JSON.stringify(s));}
   db.prepare('INSERT OR IGNORE INTO runs VALUES(?,?)').run(modelHash,JSON.stringify(model));
   for(const row of model.rows){const s=input.samples.find(s=>s.id===row.id),p=model.products.find(p=>p.id===row.productId);observeInTransaction({sourceKey:s.sourceKey,productId:p.id,sampleId:s.id,url:s.url,source:s.source,observedAt:s.observedAt,status:['P015','P026','P028'].includes(s.id)?'unreachable':'historical',confirmed:false,price:s.raw.offer?.price??null,currency:'JPY',condition:s.raw.offer?.condition||'待核对',identity:{...p.identity,...(s.id==='P011'?{platform:'PS4'}:{})},missing:s.id==='P029'?['PS4游戏本体']:[],history:s.raw.offer?.history||[]});}
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  return {modelHash,rows:model.rows.length,products:model.products.length};
 }
 function reviews(id){return db.prepare('SELECT data FROM reviews WHERE id=? ORDER BY revision').all(id).map(r=>JSON.parse(r.data));}
 function state(p){
  const offers=db.prepare('SELECT data FROM observations WHERE product_id=?').all(p.id).map(o=>JSON.parse(o.data));
  const scenario=db.prepare('SELECT * FROM scenarios WHERE id=?').get(p.id)||{value:'original',revision:0};
  let displayed=offers;
  if(scenario.value!=='original'){
   const base=offers[0]||{sourceKey:'simulation-only',productId:p.id,price:null};
   displayed=scenario.value==='ended'?[{...base,status:'sold',confirmed:true}]:scenario.value==='unreachable'?[{...base,status:'unreachable',confirmed:false}]:scenario.value==='multi'?[{...base,status:'sold',confirmed:true},{...base,sourceKey:'simulation-second-source',status:'available',confirmed:true}]:[{...base,status:'available',confirmed:true}];
  }
  const manual=db.prepare('SELECT revision,text FROM descriptions WHERE id=?').get(p.id);
  return {...p,summary:manual?.text||p.summary,summaryRevision:manual?.revision||0,manualSummary:!!manual,offers:displayed,originalOffers:offers,scenario:scenario.value,scenarioRevision:scenario.revision,visibility:visibility(p.mode,displayed),simulation:scenario.value!=='original'};
 }
 function snapshot(){return {...model,hash:modelHash,products:model.products.map(state),rows:model.rows.map(r=>({...r,reviews:reviews(r.id)}))};}
 function detail(id){
  const p=model.products.find(p=>p.id===id);if(!p)return null;
  return {...state(p),rows:model.rows.filter(r=>r.productId===id).map(r=>({...r,input:input.samples.find(s=>s.id===r.id),baseline:input.baseline.find(b=>b.id===r.id),originalProposal:input.proposals.find(p=>p.id===r.id),reviews:reviews(r.id)})),modelHash};
 }
 function saveReview(id,v){
  const row=model.rows.find(r=>r.id===id);if(!row)throw Error('仅支持首30条审核');
  if(!v||v.modelHash!==modelHash||v.inputHash!==row.inputHash||!Number.isInteger(v.expectedRevision))throw Error('审核依据变化，请刷新');
  if(!['accept','correct','defer'].includes(v.decision)||typeof v.reviewer!=='string'||!v.reviewer.trim()||v.reviewer.length>100||typeof v.reason!=='string'||!v.reason.trim()||v.reason.length>4000)throw Error('请填写审核人、结论和理由');
  if(v.decision==='correct'&&(typeof v.correction!=='string'||!v.correction.trim()))throw Error('请填写修正');
  if(v.correction!=null&&(typeof v.correction!=='string'||v.correction.length>4000))throw Error('修正过长');
  db.exec('BEGIN IMMEDIATE');try{
   const revision=reviews(id).length;if(revision!==v.expectedRevision)throw Error('审核已有新版本，请刷新');
   const result={id,revision:revision+1,reviewer:v.reviewer.trim(),reason:v.reason.trim(),decision:v.decision,correction:v.correction||'',inputHash:row.inputHash,modelHash,at:new Date().toISOString(),scope:'single-sample',humanAuthorship:'entered-in-pilot-ui; not independently certified',blind:false};
   db.prepare('INSERT INTO reviews VALUES(?,?,?)').run(id,result.revision,JSON.stringify(result));db.exec('COMMIT');return result;
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 function change(id,v,type){
  const p=model.products.find(p=>p.id===id);if(!p||!v||v.modelHash!==modelHash||!Number.isInteger(v.expectedRevision))throw Error('依据变化或商品不存在');
  const table=type==='summary'?'descriptions':'scenarios';
  let value;if(type==='summary'){value=v.text;if(typeof value!=='string'||value.length>600||!value.trim()||value.split(/[。！？!?]/).filter(x=>x.trim()).length>3)throw Error('简介需1–3句，最多600字');}
  else{value=v.value;if(!['original','ended','unreachable','multi','relisted'].includes(value))throw Error('无效演示状态');}
  db.exec('BEGIN IMMEDIATE');try{
   const old=db.prepare('SELECT revision FROM '+table+' WHERE id=?').get(id);if((old?.revision||0)!==v.expectedRevision)throw Error('记录已有新版本，请刷新');
   db.prepare('INSERT INTO '+table+' VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,'+(type==='summary'?'text':'value')+'=excluded.'+(type==='summary'?'text':'value')).run(id,v.expectedRevision+1,value);
   db.exec('COMMIT');return detail(id);
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 return {initialize,snapshot,detail,saveReview,change,observe,db,close:()=>db.close(),get model(){return model;}};
}
