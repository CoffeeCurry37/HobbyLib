import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {loadRadar}from'./load-radar.mjs';
const r=loadRadar(),s=JSON.parse(fs.readFileSync('work/v6/production-before.json')),changes=JSON.parse(fs.readFileSync('work/v6/changes.json')),splits=JSON.parse(fs.readFileSync('work/v6/official-splits.json'));
const map=new Map(changes.map(c=>[c.item.id,c])),used=new Set(),groups=[];
for(const id of new Set(splits.map(x=>x.fromId))){const ids=[...new Set([id,...splits.filter(x=>x.fromId===id).map(x=>x.toId)])];groups.push(ids.map(k=>{used.add(k);return map.get(k);}));}
for(const c of changes)if(!used.has(c.item.id))groups.push([c]);
const batches=[];let batch=[];for(const group of groups){if(batch.length+group.length>20){batches.push(batch);batch=[];}batch.push(...group);}if(batch.length)batches.push(batch);
fs.writeFileSync('work/v6/batches.json',JSON.stringify(batches.map(changes=>({action:'catalogue-curation',changes:changes.map(({item,expectedVersion})=>({item,...(expectedVersion?{expectedVersion}:{} )})),relations:[]}))));
const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs}=r.get('store'),{postAction}=r.get('service');let succeeded=0;
try {await withDatabase(db,async()=>{await saveItems('v6-test',s.items);await savePrefs('v6-test',s.prefs);});for(const x of s.relations)db.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('v6-test',x.id,x.fromId,x.toId,x.kind,x.quantity);
 for(const [n,b]of JSON.parse(fs.readFileSync('work/v6/batches.json')).entries()){
  const response=await withDatabase(db,()=>postAction(new Request('https://example.test/api/maintenance',{method:'POST',body:JSON.stringify(b)}),'v6-test','standalone')),out=await response.json();if(response.status!==200||!out.ok||out.busy)throw Error(JSON.stringify({batch:n,status:response.status,out}));succeeded++;if(succeeded%20===0)console.log(JSON.stringify({simulated:succeeded,total:batches.length}));
 }
 const after=db.raw.prepare('SELECT data FROM items').all().map(x=>JSON.parse(x.data)),byId=new Map(after.map(x=>[x.id,x]));
 const cleanBatches=JSON.parse(fs.readFileSync('work/v6/batches.json'));for(const b of cleanBatches)for(const c of b.changes)c.item=byId.get(c.item.id);fs.writeFileSync('work/v6/batches.json',JSON.stringify(cleanBatches));
 const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const hash=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
 const originals=s.items.map(x=>({id:x.id,personal:Object.fromEntries(['ownership','quantity','notes','rating','priority','watchlisted','manualOrder','catalogNodeId','createdAt'].map(k=>[k,x[k]]))}));
 for(const x of originals)for(const [k,v]of Object.entries(x.personal))assert.deepEqual(byId.get(x.id)[k],v,x.id+':'+k);
 for(const x of s.items.filter(i=>i.origin==='doujin'))assert.equal(stable(byId.get(x.id)),stable(x));
 const beforeOffers=s.items.flatMap(i=>i.offers).map(hash).sort(),afterOffers=after.flatMap(i=>i.offers).map(hash).sort();assert.deepEqual(beforeOffers,afterOffers);
 const links=db.raw.prepare('SELECT id,from_id fromId,to_id toId,kind,quantity FROM relations').all();assert.equal(hash(links.sort((a,b)=>a.id.localeCompare(b.id))),hash([...s.relations].sort((a,b)=>a.id.localeCompare(b.id))));
 const report={at:new Date().toISOString(),passed:true,batches:succeeded,changes:changes.length,activeBefore:s.items.length,activeAfter:after.length,offers:beforeOffers.length,offersMultisetHash:hash(beforeOffers),personalHash:hash(originals),doujinUnchanged:s.items.filter(i=>i.origin==='doujin').length,relationsUnchanged:links.length,atomicSplitGroups:new Set(splits.map(x=>x.fromId)).size};fs.writeFileSync('research/production-v6-20261102/simulation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{db.close();}
