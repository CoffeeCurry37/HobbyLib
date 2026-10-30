import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {REPORT,DATA,read,sha,safeDataDir} from './common.mjs';
export function openStore(dir=DATA){
 const db=new DatabaseSync(resolve(safeDataDir(dir),'pilot.sqlite'));
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS inputs(id TEXT PRIMARY KEY, hash TEXT NOT NULL, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS outputs(layer TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(layer,id,hash));
 CREATE TABLE IF NOT EXISTS current_output(layer TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(layer,id));
 CREATE TABLE IF NOT EXISTS reviews(id TEXT NOT NULL,revision INTEGER NOT NULL,at TEXT NOT NULL,input_hash TEXT NOT NULL,proposal_hash TEXT,data TEXT NOT NULL,PRIMARY KEY(id,revision),FOREIGN KEY(id) REFERENCES inputs(id));`);
 const output=(layer,id)=>{const x=db.prepare('SELECT o.hash,o.data FROM outputs o JOIN current_output c USING(layer,id,hash) WHERE layer=? AND id=?').get(layer,id);return x?{hash:x.hash,data:JSON.parse(x.data)}:null;};
 function initialize(){
  const samples=read(resolve(DATA,'samples.json')),manifest=read(resolve(REPORT,'manifest.json'));
  if(samples.length!==300||sha(samples.map(({raw,...rest})=>rest))!==sha(manifest))throw Error('Frozen sample manifest mismatch');
  db.exec('BEGIN IMMEDIATE');try{
   for(const s of samples){const h=sha(s),old=db.prepare('SELECT hash FROM inputs WHERE id=?').get(s.id);if(old&&old.hash!==h)throw Error('Immutable input changed: '+s.id);db.prepare('INSERT OR IGNORE INTO inputs VALUES(?,?,?)').run(s.id,h,JSON.stringify(s));}
   for(const [layer,file] of [['baseline','baseline-30.json'],['proposal','proposals-30.json']])for(const v of read(resolve(REPORT,file)).rows){if(!/^P0(?:0[1-9]|[12]\d|30)$/.test(v.id))throw Error('Only first30 outputs authorized');const h=sha(v);db.prepare('INSERT OR IGNORE INTO outputs VALUES(?,?,?,?)').run(layer,v.id,h,JSON.stringify(v));db.prepare('INSERT INTO current_output VALUES(?,?,?) ON CONFLICT(layer,id) DO UPDATE SET hash=excluded.hash').run(layer,v.id,h);}
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 const history=id=>db.prepare('SELECT revision,at,input_hash,proposal_hash,data FROM reviews WHERE id=? ORDER BY revision').all(id).map(x=>({...JSON.parse(x.data),revision:x.revision,at:x.at,inputHash:x.input_hash,proposalHash:x.proposal_hash}));
 function detail(id){const x=db.prepare('SELECT hash,data FROM inputs WHERE id=?').get(id);if(!x)return null;return {...JSON.parse(x.data),inputHash:x.hash,baseline:output('baseline',id)?.data||null,proposal:output('proposal',id)?.data||null,proposalHash:output('proposal',id)?.hash||null,reviews:history(id)};}
 function saveReview(id,v){const s=detail(id);if(!s)throw Error('Unknown sample');
  if(!['accept','correct','defer'].includes(v.decision))throw Error('请选择审核结论');
  for(const k of ['reviewer','reason'])if(typeof v[k]!=='string'||!v[k].trim()||v[k].length>4000)throw Error('请填写审核者和理由');
  if(!Number.isInteger(v.expectedRevision)||v.expectedRevision<0||v.inputHash!==s.inputHash||v.proposalHash!==s.proposalHash)throw Error('页面依据已变化，请刷新后重审');
  if(v.decision==='accept'&&!s.proposal)throw Error('未处理样本不能直接接受建议');
  if(v.decision==='correct'&&(!v.correction||!v.correction.trim()))throw Error('请填写修正内容');
  for(const k of ['correction','targetId','scope'])if(v[k]!=null&&(typeof v[k]!=='string'||v[k].length>8000))throw Error('字段过长或格式不正确');
  const clean={decision:v.decision,reviewer:v.reviewer.trim(),reason:v.reason.trim(),correction:v.correction||'',targetId:v.targetId||'',scope:v.scope||'single-sample',blind:Boolean(v.blind),humanAuthorship:'user-entered; not independently certified'};
  db.exec('BEGIN IMMEDIATE');try{const revision=Number(db.prepare('SELECT COALESCE(MAX(revision),0) AS n FROM reviews WHERE id=?').get(id).n);if(revision!==v.expectedRevision)throw Error('审核记录已更新，请刷新后保存');const at=new Date().toISOString();db.prepare('INSERT INTO reviews VALUES(?,?,?,?,?,?)').run(id,revision+1,at,s.inputHash,s.proposalHash,JSON.stringify(clean));db.exec('COMMIT');return history(id).at(-1);}catch(e){db.exec('ROLLBACK');throw e;}
 }
 const list=()=>db.prepare('SELECT id,data FROM inputs ORDER BY id').all().map(x=>{const {raw,...m}=JSON.parse(x.data),p=output('proposal',x.id),r=history(x.id);return {...m,processed:!!p,priority:p?.data.priority||null,reviewCount:r.length,reviewDecision:r.at(-1)?.decision||null};});
 return {initialize,detail,list,saveReview,history,close:()=>db.close(),db};
}
