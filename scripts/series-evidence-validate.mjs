import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
import {output as dir, work as priv, privateRoot, historical, fourSeries, nov4, nov4Books, tenyearAj, kyomaf, nov5Events, aj26Ky22, nov5Cards, nov5BooksMedia} from './series-evidence-paths.mjs';
const {supplement}=nov5BooksMedia ? await import('./books-media-plan.mjs') : nov5Cards ? await import('./cards-plan.mjs') : nov5Events || aj26Ky22 ? await import('./nov5-events-plan.mjs') : kyomaf ? await import('./kyomaf-plan.mjs') : tenyearAj ? await import('./tenyear-aj-plan.mjs') : nov4 || nov4Books ? await import('./nov4-plan.mjs') : fourSeries ? await import('./four-series-supplement.mjs') : await import('./series-evidence-enrichment.mjs');
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
 const priorChanges = historical || fourSeries || nov4 || nov4Books || tenyearAj || kyomaf || nov5Events || aj26Ky22 || nov5Cards || nov5BooksMedia ? JSON.parse(fs.readFileSync(privateRoot + '/proposed-changes.json')) : changes;
 const carabiner=priorChanges.find(c=>/カラビナ\(カルデア\)/.test(c.item.title));assert.ok(carabiner&&!/フォウ|80×65/.test(carabiner.item.summary),'Do not copy another variant size');
 for(const batch of batches){const response=await api(batch),v=await response.json();assert.equal(response.status,200,JSON.stringify(v));assert.ok(v.ok&&!v.busy);completed++;if(completed%25===0)console.log(JSON.stringify({simulated:completed,total:batches.length}));}
 const after=db.raw.prepare('SELECT data FROM items').all().map(x=>JSON.parse(x.data)),afterById=new Map(after.map(i=>[i.id,i])),changedIds=new Set(changes.map(c=>c.item.id));
 for(const old of s.items){const now=afterById.get(old.id);assert.ok(now);if(!changedIds.has(old.id)){assert.deepEqual(now,old);continue;}const expected=changes.find(c=>c.item.id===old.id).item;assert.deepEqual(now,expected);for(const key of new Set([...Object.keys(old),...Object.keys(now)]))if(!['summary','evidence'].includes(key))assert.deepEqual(now[key],old[key],old.id+':'+key);assert.deepEqual(now.evidence.slice(0,old.evidence.length),old.evidence);assert.ok(!old.editorial&&!old.locked);}
 assert.equal(after.length,s.items.length);const links=db.raw.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations').all().map(x=>({...x}));assert.equal(hash(links.sort((a,b)=>a.id.localeCompare(b.id))),hash([...s.relations].sort((a,b)=>a.id.localeCompare(b.id))));
 assert.deepEqual(JSON.parse(db.raw.prepare('SELECT data FROM preferences').get().data),s.prefs);
 const report={at:new Date().toISOString(),passed:true,mode:'isolated-API-copy',batches:completed,changes:changes.length,activeBefore:s.items.length,activeAfter:after.length,relationsPreserved:links.length,allOtherFieldsAndOffersPreserved:true,priorEvidencePreserved:true,acceptedEditorialPreserved:s.items.filter(i=>i.editorial).length,staleVersionRejected:true,personalMutationRejected:true,existingSummaryPreserved:true,unrelatedVariantSizeOmitted:true,fullProductVerified:0,productionApplied:0,planSha256:hash(changes.map(c=>({id:c.item.id,summary:c.item.summary,evidence:c.item.evidence.slice(-2)})))};
 fs.writeFileSync(dir+'/simulation.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(priv+'/batches.json',JSON.stringify(batches));console.log(JSON.stringify(report));
}finally{db.close();r.close();}
