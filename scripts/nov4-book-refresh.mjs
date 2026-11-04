// Rebuild only a still-active target from its freshly read state after a merge.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash} from './four-series-common.mjs';
import {supplement} from './nov4-plan.mjs';
import {loadRadar} from './load-radar.mjs';
const out='research/series-evidence-20261104/books',priv='work/series-evidence-20261104/books';
const dir=priv+'/refresh',pub=out+'/refresh';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(pub,{recursive:true});
assert.ok(!fs.existsSync(dir+'/apply-receipts.jsonl'));
const skipped=read(out+'/production.json').skippedItems.map(r=>r.id);
assert.equal(skipped.length,2);
const current=fs.readdirSync(priv+'/before').flatMap(n=>read(priv+'/before/'+n).items).filter(i=>skipped.includes(i.id));
assert.equal(current.length,2);
const archived=current.find(i=>i.archivedInto),survivor=current.find(i=>!i.archivedInto);
assert.ok(archived && survivor && archived.archivedInto===survivor.id);
const matches=read(out+'/cases.json').filter(m=>skipped.includes(m.itemId));
assert.equal(matches.length,2);assert.equal(matches[0].summary,matches[1].summary);
assert.ok(matches.every(m=>m.source.sha256===matches[0].source.sha256 && m.title===survivor.title));
const m=matches.find(m=>m.itemId===survivor.id);
const after=supplement(survivor,m,new Date().toISOString()).item;
assert.ok(after);
const proposed={action:'catalogue-curation',changes:[{expectedVersion:hash(JSON.stringify(survivor)),item:after}],relations:[]};
const radar=loadRadar(),db=radar.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems}=radar.get('store');
try{
 await withDatabase(db,()=>saveItems('books-refresh',[survivor,archived]));
 const call=b=>withDatabase(db,()=>radar.get('service').postAction(new Request('https://example.test/api/maintenance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),'books-refresh','standalone'));
 const stale=structuredClone(proposed);stale.changes[0].expectedVersion='0'.repeat(64);assert.equal((await call(stale)).status,409);
 const ok=await call(proposed);assert.equal(ok.status,200);assert.ok((await ok.json()).ok);
 const byId=new Map(db.raw.prepare('SELECT data FROM items').all().map(r=>JSON.parse(r.data)).map(i=>[i.id,i]));
 assert.deepEqual(byId.get(archived.id),archived);assert.deepEqual(byId.get(survivor.id),after);
 for(const k of new Set([...Object.keys(survivor),...Object.keys(after)]))if(!['summary','evidence'].includes(k))assert.deepEqual(after[k],survivor[k]);
 assert.deepEqual(after.evidence.slice(0,survivor.evidence.length),survivor.evidence);
}finally{db.close();radar.close()}
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const planSha256=hash(stable([{id:after.id,summary:after.summary,evidence:after.evidence.slice(-2)}]));
write(dir+'/batches.json',[proposed]);write(pub+'/simulation.json',{passed:true,batches:1,changes:1,planSha256,mode:'fresh-merged-survivor-and-archive-isolated-API',archiveUnchanged:true,existingFieldsAndOffersPreserved:true,staleVersionRejected:true});
write(pub+'/binding.json',{sourceId:archived.id,survivorId:survivor.id,title:survivor.title,sourceAction:'already-archived-before-this-round',nextAction:'only-current-survivor-eligible',archivedTargetWritten:false});
console.log(JSON.stringify({ready:1,alreadyArchived:1}));
