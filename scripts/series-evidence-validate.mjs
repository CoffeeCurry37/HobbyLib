import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
import {output as dir, work as priv, privateRoot, historical, fourSeries, nov4, nov4Books, tenyearAj, kyomaf, nov5Events, aj26Ky22, nov5Cards, nov5BooksMedia, nov10Wafers, nov10ExtellaWafer3, nov11Pikuriru, nov11ClimaxKengou, nov12FoxtailBadges, nov12EmiyaChara22, nov12ElmelloiGlitter, nov12Tsuikore45, nov12GlitterfMochi16, nov13AuroraEF,nov13LinkSamurai,nov13TsukihimeStrangefake,nov13StrangefakeMirror,nov14MeltyCapsule} from './series-evidence-paths.mjs';
const {supplement}=nov14MeltyCapsule ? await import('./melty-capsule-plan.mjs') : nov13StrangefakeMirror ? await import('./strangefake-mirror-plan.mjs') : nov13TsukihimeStrangefake ? await import('./tsukihime-strangefake-plan.mjs') : nov13LinkSamurai ? await import('./link-samurai-plan.mjs') : nov13AuroraEF ? await import('./aurora-ef-plan.mjs') : nov12GlitterfMochi16 ? await import('./glitterf-mochi16-plan.mjs') : nov12Tsuikore45 ? await import('./tsuikore45-plan.mjs') : nov12ElmelloiGlitter ? await import('./elmelloi-glitter-plan.mjs') : nov12EmiyaChara22 ? await import('./emiya-chara22-plan.mjs') : nov12FoxtailBadges ? await import('./foxtail-badges-plan.mjs') : nov11ClimaxKengou ? await import('./climax-kengou-plan.mjs') : nov11Pikuriru ? await import('./pikuriru-plan.mjs') : nov10ExtellaWafer3 ? await import('./extella-wafer3-plan.mjs') : nov10Wafers ? await import('./wafers-plan.mjs') : nov5BooksMedia ? await import('./books-media-plan.mjs') : nov5Cards ? await import('./cards-plan.mjs') : nov5Events || aj26Ky22 ? await import('./nov5-events-plan.mjs') : kyomaf ? await import('./kyomaf-plan.mjs') : tenyearAj ? await import('./tenyear-aj-plan.mjs') : nov4 || nov4Books ? await import('./nov4-plan.mjs') : fourSeries ? await import('./four-series-supplement.mjs') : await import('./series-evidence-enrichment.mjs');
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x),hash=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
const s=JSON.parse(fs.readFileSync('work/v6/production-after.json')),changes=JSON.parse(fs.readFileSync(priv+'/proposed-changes.json')),originals=new Map(s.items.map(i=>[i.id,i])),batches=[];
for(let n=0;n<changes.length;n+=20)batches.push({action:'catalogue-curation',changes:changes.slice(n,n+20).map(({item,expectedVersion})=>({item,expectedVersion})),relations:[]});
const r=loadRadar(),db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs}=r.get('store'),{postAction}=r.get('service');
const api=b=>withDatabase(db,()=>postAction(new Request('https://example.test/api/maintenance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),'series-proof','standalone'));
let completed=0;
try{
 await withDatabase(db,async()=>{await saveItems('series-proof',s.items);await savePrefs('series-proof',s.prefs);});
 for(const x of s.relations)db.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('series-proof',x.id,x.fromId,x.toId,x.kind,x.quantity);
 const stale=structuredClone(batches[0]);stale.changes[0].expectedVersion='0'.repeat(64);assert.equal((await api(stale)).status,409);
 const personal=structuredClone(batches[0]);personal.changes[0].item.quantity++;assert.notEqual((await api(personal)).status,200);
 const first=changes[0],protectedItem={...originals.get(first.item.id),locked:true};assert.equal(supplement(protectedItem,first.match,new Date().toISOString()).skip,'protected-target');
 assert.equal(supplement({...originals.get(first.item.id),summary:'user wording'},first.match,new Date().toISOString()).skip,'existing-summary-preserved');
 assert.equal(supplement({...originals.get(first.item.id),title:'another identity'},first.match,new Date().toISOString()).skip,'target-title-changed');
 if (historical) {
  const receipts = fs.readFileSync(privateRoot + '/apply-receipts.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
  const applied = new Set(receipts.filter(r => r.status === 'verified').flatMap(r => r.ids));
  for (const change of changes) assert.ok(!applied.has(change.item.id), 'Prior round already applied');
 }
 if(kyomaf){
  for(const c of changes.filter(c=>c.match.retailerBinding)){
   const old=originals.get(c.item.id),at=new Date().toISOString();
   assert.equal(supplement({...old,image:'https://example.test/different.jpg'},c.match,at).skip,'reviewed-image-changed');
   assert.equal(supplement({...old,offers:old.offers.map(o=>({...o,url:'https://example.test/different'}))},c.match,at).skip,'reviewed-retailer-binding-changed');
  }
 }
 if(nov5Cards)for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,offers:old.offers.map(o=>({...o,url:'https://example.test/other'}))},c.match,new Date().toISOString()).skip,'reviewed-retailer-binding-changed');}
 if(nov5BooksMedia)for(const c of changes){const old=originals.get(c.item.id),at=new Date().toISOString();assert.equal(supplement({...old,jan:'different-identity'},c.match,at).skip,'reviewed-identity-changed');assert.equal(supplement({...old,offers:[...old.offers,{url:'https://example.test/other'}]},c.match,at).skip,'reviewed-retailer-binding-changed');}
 if(nov10Wafers||nov10ExtellaWafer3||nov11Pikuriru||nov11ClimaxKengou||nov12FoxtailBadges||nov12EmiyaChara22||nov12ElmelloiGlitter||nov12Tsuikore45||nov12GlitterfMochi16||nov13AuroraEF||nov13LinkSamurai||nov13TsukihimeStrangefake||nov13StrangefakeMirror||nov14MeltyCapsule){for(const c of changes){const old=originals.get(c.item.id),at=new Date().toISOString();assert.equal(supplement({...old,member:'another identity'},c.match,at).skip,'reviewed-identity-changed');assert.equal(supplement({...old,offers:[...old.offers,{url:'https://example.test/other'}]},c.match,at).skip,'reviewed-retailer-binding-changed');}for(const m of JSON.parse(fs.readFileSync(dir+'/pending.json'))){assert.equal(supplement(originals.get(m.itemId),m,new Date().toISOString()).skip,'unconfirmed-member');assert.ok(!changes.some(c=>c.item.id===m.itemId));}}
 if(nov11Pikuriru){for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,jan:'another-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.ok(!/\\d+mm|アーサー|エリザベート/.test(c.item.summary));assert.equal(c.item.jan,old.jan);}assert.equal(changes.length,33);}
 if(nov11ClimaxKengou){for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,isbn:'another-isbn'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.jan,old.jan);}assert.equal(changes.length,31);}
 if(nov12FoxtailBadges){for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,isbn:'another-isbn'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.jan,old.jan);if(c.match.recordKind==='pack')assert.ok(!/10枚|1枚|458082200/.test(c.item.summary));if(c.match.recordKind==='single')assert.ok(!/エリザベート|アーサー/.test(c.item.summary));}assert.equal(changes.length,42);}
 if(nov12EmiyaChara22){for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,isbn:'another-isbn'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(supplement({...old,jan:'another-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.jan,old.jan);if(c.match.recordKind==='pack')assert.ok(!/10枚|1枚|457012/.test(c.item.summary));if(c.match.recordKind==='box')assert.ok(c.item.summary.includes('是否必定集齐尚待确认'));}assert.equal(changes.length,26);}
 if(nov12ElmelloiGlitter){for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.jan,old.jan);assert.equal(c.item.isbn,old.isbn);if(c.match.sourceRole==='retailer')assert.equal(c.item.evidence[old.evidence.length].field,'销售来源');if(c.match.recordKind==='pack')assert.ok(!/10枚|1枚|454540/.test(c.item.summary));if(c.match.recordKind==='box')assert.ok(c.item.summary.includes('不保证集齐'));}assert.equal(changes.length,23);assert.equal(JSON.parse(fs.readFileSync(dir+'/pending.json')).length,2);}
 if(nov12Tsuikore45){assert.equal(changes.length,24);const allCases=changes.map(c=>c.match);assert.equal(allCases.filter(m=>m.recordKind==='single').length,20);assert.equal(allCases.filter(m=>m.recordKind==='pack').length,2);for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.jan,old.jan);assert.equal(c.item.isbn,old.isbn);assert.ok(!/ゴルドルフ|カドック|68|95|457012178/.test(c.item.summary));assert.ok(c.item.summary.includes('专用收纳盒另售'));if(c.match.recordKind==='pack')assert.ok(c.item.summary.includes('单件装为1个'));}}
 if(nov12GlitterfMochi16){assert.equal(changes.length,23);assert.equal(changes.filter(c=>c.match.recordKind==='single').length,19);assert.equal(JSON.parse(fs.readFileSync(dir+'/field-pending.json')).items.length,7);for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.jan,old.jan);assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.title,old.title);if(c.match.sourceRole==='retailer')assert.equal(c.item.evidence[old.evidence.length].field,'销售来源');if(c.match.recordKind==='box')assert.ok(c.item.summary.includes('不保证集齐'));if(c.match.recordKind==='pack')assert.ok(!/BOX为|全9种套装|原封/.test(c.item.summary));if(/謎のアルターエゴ・A|耀星|孫市/.test(old.title))assert.ok(c.item.summary.includes('名称字形差异继续待查'));}}
 if(nov13AuroraEF){assert.equal(changes.length,22);assert.equal(changes.filter(c=>c.match.recordKind==='single').length,19);assert.equal(JSON.parse(fs.readFileSync(dir+'/field-pending.json')).items.length,22);for(const c of changes){const old=originals.get(c.item.id);assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');assert.equal(c.item.jan,old.jan);assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.title,old.title);assert.equal(c.item.evidence[old.evidence.length].field,'销售来源');assert.ok(c.item.summary.includes('高度因来源存在差异'));assert.ok(!/74|76|56|454540|1BOX|1个|1枚/.test(c.item.summary));if(c.match.recordKind==='pack')assert.ok(c.item.summary.includes('封入数量'));if(/謎のアルターエゴ・A/.test(old.title))assert.ok(c.item.summary.includes('A与Λ'));}}
 if(nov13LinkSamurai){
  assert.equal(changes.length,21);assert.equal(changes.filter(c=>c.match.recordKind==='family').length,3);assert.equal(changes.filter(c=>c.match.recordKind==='seller-bundle').length,1);
  assert.equal(JSON.parse(fs.readFileSync(dir+'/pending.json')).length,1);
  for(const c of changes){const old=originals.get(c.item.id);assert.equal(c.item.jan,old.jan);assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.title,old.title);
   assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');
   if(c.match.recordKind==='family')assert.ok(c.item.summary.includes('逻辑目录'));
   if(c.match.recordKind==='seller-bundle'){assert.equal(c.item.evidence[old.evidence.length].field,'销售来源');assert.ok(c.item.summary.includes('不视为官方限定套装'));assert.equal(c.item.jan,'');}
   if(c.match.region==='EU'&&c.match.groupId==='series-f38ab0c1f9c9b4e6')assert.ok(c.item.summary.includes('2019年3月22日'));
   if(c.match.region==='EU'&&c.match.groupId==='series-422361b32a4e0c43')assert.ok(c.item.summary.includes('2023年9月29日'));
   if(c.item.id==='115deb04-1006-4b00-ba43-6284953d2b39')assert.ok(c.item.summary.includes('魔境のサージェント')&&!c.item.summary.includes('正義の弓道家'));
   if(c.item.id==='source-f36b99cf0321a137d3ad11ba71b28cc8')assert.ok(c.item.summary.includes('正義の弓道家')&&!c.item.summary.includes('魔境のサージェント'));
  }
 }

 if(nov13TsukihimeStrangefake){
  assert.equal(changes.length,22);assert.equal(changes.filter(c=>c.match.recordKind==='logical-series').length,3);
  assert.equal(changes.filter(c=>c.match.volume).length,19);assert.equal(changes.filter(c=>c.match.recordKind==='retailer-bound-volume').length,4);
  assert.equal(JSON.parse(fs.readFileSync(dir+'/pending.json')).length,0);
  const fp=JSON.parse(fs.readFileSync(dir+'/field-pending.json'));assert.equal(fp.items.length,2);
  assert.equal(JSON.parse(fs.readFileSync(dir+'/same-volume-records.json')).groups.length,4);
  for(const c of changes){const old=originals.get(c.item.id);
   assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.jan,old.jan);assert.equal(c.item.title,old.title);
   assert.equal(supplement({...old,isbn:'wrong-isbn'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');
   if(c.match.dateConflict){assert.ok(!/2026-03-03|2026-03-04/.test(c.item.summary));assert.ok(c.item.summary.includes('暂不补写日期'));assert.ok(fp.items.some(x=>x.itemId===c.item.id));}
   if(c.match.recordKind==='retailer-bound-volume')assert.equal(c.item.isbn,'');
   if(c.match.groupId==='series-e7b0b5feefeb87f2'&&c.match.volume)assert.ok(c.item.jan.startsWith('491'));
  }
 }

 if(nov13StrangefakeMirror){
  assert.equal(changes.length,22);assert.equal(changes.filter(c=>c.match.recordKind==='single').length,18);
  assert.equal(changes.filter(c=>c.match.nameConflict).length,2);assert.equal(changes.filter(c=>c.match.variantPending).length,3);
  assert.equal(JSON.parse(fs.readFileSync(dir+'/pending.json')).length,0);
  assert.equal(JSON.parse(fs.readFileSync(dir+'/field-pending.json')).items.length,9);
  for(const c of changes){const old=originals.get(c.item.id);assert.equal(c.item.title,old.title);assert.equal(c.item.jan,'');assert.equal(c.item.isbn,'');
   assert.equal(supplement({...old,jan:'wrong-jan'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');
   assert.ok(!/497038|456248|7月30|9月29/.test(c.item.summary));
   if(c.match.nameConflict)assert.ok(c.item.summary.includes('角色及图款对应继续待查')&&!c.item.summary.includes('FRANCESCA'));
   if(c.match.variantPending)assert.ok(c.item.summary.includes('具体画面对照继续待查'));
   if(c.match.recordKind==='retailer-complete-set')assert.ok(c.item.summary.includes('不视为厂家原封BOX'));
   if(c.match.recordKind==='unspecified-package')assert.ok(c.item.summary.includes('不补封入数量'));
   if(c.match.groupId==='series-27a7fb010a9ce561')assert.ok(c.item.summary.includes('最大尺寸约65×65mm'));
  }
 }
 if(nov14MeltyCapsule){
  assert.equal(changes.length,20);assert.equal(changes.filter(c=>c.match.recordKind==='publisher-bound-volume').length,9);assert.equal(changes.filter(c=>c.match.recordKind==='logical-series').length,1);assert.equal(JSON.parse(fs.readFileSync(dir+'/field-pending.json')).items.length,8);
  for(const c of changes){const old=originals.get(c.item.id);assert.equal(c.item.isbn,old.isbn);assert.equal(c.item.jan,old.jan);assert.equal(c.item.title,old.title);assert.equal(supplement({...old,isbn:'wrong-isbn'},c.match,new Date().toISOString()).skip,'reviewed-identity-changed');
   if(c.match.groupId==='series-01c35cca0008ca4b'){assert.ok(c.item.summary.includes('57mm'));assert.ok(!/56mm|马口铁|PET|9月30日/.test(c.item.summary));if(c.match.variantPending)assert.ok(c.item.summary.includes('具体画面对照继续待查'));if(c.match.recordKind==='hidden-single')assert.ok(c.item.summary.includes('具体角色和图案继续待查'));}
   if(c.match.recordKind==='publisher-bound-volume')assert.ok(c.item.summary.includes('B6变形判'));
  }
 }

 const priorChanges = historical || fourSeries || nov4 || nov4Books || tenyearAj || kyomaf || nov5Events || aj26Ky22 || nov5Cards || nov5BooksMedia || nov10Wafers || nov10ExtellaWafer3 || nov11Pikuriru || nov11ClimaxKengou || nov12FoxtailBadges || nov12EmiyaChara22 || nov12ElmelloiGlitter || nov12Tsuikore45 || nov12GlitterfMochi16 || nov13AuroraEF || nov13LinkSamurai || nov13TsukihimeStrangefake || nov13StrangefakeMirror || nov14MeltyCapsule ? JSON.parse(fs.readFileSync(privateRoot + '/proposed-changes.json')) : changes;
 const carabiner=priorChanges.find(c=>/カラビナ\(カルデア\)/.test(c.item.title));assert.ok(carabiner&&!/フォウ|80×65/.test(carabiner.item.summary),'Do not copy another variant size');
 for(const batch of batches){const response=await api(batch),v=await response.json();assert.equal(response.status,200,JSON.stringify(v));assert.ok(v.ok&&!v.busy);completed++;if(completed%25===0)console.log(JSON.stringify({simulated:completed,total:batches.length}));}
 const after=db.raw.prepare('SELECT data FROM items').all().map(x=>JSON.parse(x.data)),afterById=new Map(after.map(i=>[i.id,i])),changedIds=new Set(changes.map(c=>c.item.id));
 for(const old of s.items){const now=afterById.get(old.id);assert.ok(now);if(!changedIds.has(old.id)){assert.deepEqual(now,old);continue;}const expected=changes.find(c=>c.item.id===old.id).item;assert.deepEqual(now,expected);for(const key of new Set([...Object.keys(old),...Object.keys(now)]))if(!['summary','evidence'].includes(key))assert.deepEqual(now[key],old[key],old.id+':'+key);assert.deepEqual(now.evidence.slice(0,old.evidence.length),old.evidence);assert.ok(!old.editorial&&!old.locked);}
 assert.equal(after.length,s.items.length);const links=db.raw.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations').all().map(x=>({...x}));assert.equal(hash(links.sort((a,b)=>a.id.localeCompare(b.id))),hash([...s.relations].sort((a,b)=>a.id.localeCompare(b.id))));
 assert.deepEqual(JSON.parse(db.raw.prepare('SELECT data FROM preferences').get().data),s.prefs);
 const report={at:new Date().toISOString(),passed:true,mode:'isolated-API-copy',batches:completed,changes:changes.length,activeBefore:s.items.length,activeAfter:after.length,relationsPreserved:links.length,allOtherFieldsAndOffersPreserved:true,priorEvidencePreserved:true,acceptedEditorialPreserved:s.items.filter(i=>i.editorial).length,staleVersionRejected:true,personalMutationRejected:true,existingSummaryPreserved:true,unrelatedVariantSizeOmitted:true,fullProductVerified:0,productionApplied:0,planSha256:hash(changes.map(c=>({id:c.item.id,summary:c.item.summary,evidence:c.item.evidence.slice(-2)})))};
 fs.writeFileSync(dir+'/simulation.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(priv+'/batches.json',JSON.stringify(batches));console.log(JSON.stringify(report));
}finally{db.close();r.close();}


