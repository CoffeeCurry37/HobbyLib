import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write} from './four-series-common.mjs';
const root='research/series-evidence-20261103',pub='research/series-evidence-20261104/books',priv='work/series-evidence-20261104/books';
const live=read(pub+'/production.json'),cases=read(pub+'/cases.json');
assert.ok(live.finalReadbackPassed&&live.maintenanceClosed);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
const ids=new Set(receipts.flatMap(r=>r.ids));assert.equal(ids.size,live.productionApplied);
const refresh=read(pub+'/refresh/production.json'),binding=read(pub+'/refresh/binding.json');
assert.ok(refresh.maintenanceClosed&&refresh.finalReadbackPassed&&refresh.productionApplied===1);
const extra=fs.readFileSync(priv+'/refresh/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
assert.equal(extra.length,1);assert.deepEqual(extra[0].ids,[binding.survivorId]);assert.ok(!ids.has(binding.survivorId)&&!ids.has(binding.sourceId));ids.add(binding.survivorId);
const names={'series-532136185275f3fb':'FGO material','series-559546cccd31fa68':'ロード・エルメロイII世の事件簿'};
const previous=read(root+'/current-progress.json'),baseline=previous.rows.filter(x=>!names[x.groupId]);
assert.equal(baseline.reduce((n,r)=>n+r.productionApplied,0),4384);
const rows=Object.entries(names).map(([groupId,label])=>{
 const items=cases.filter(r=>r.groupId===groupId),updated=items.filter(r=>ids.has(r.itemId)).length;
 const protectedExisting=items.filter(r=>r.status==='protected').length,pendingEvidence=items.filter(r=>r.status==='pending').length;
 return {groupId,label,snapshotItems:items.length,productionApplied:updated,pendingEvidence,protectedExisting,
  freshVersionSkips:items.length-updated-pendingEvidence-protectedExisting,archivedWithinVersionSkips:items.filter(i=>i.itemId===binding.sourceId).length,complete:false};
});
const all=[...baseline,...rows],sum=k=>all.reduce((n,r)=>n+r[k],0),at=new Date().toISOString();
const unresolved=cases.filter(c=>!ids.has(c.itemId)&&c.itemId!==binding.sourceId);
write(pub+'/resume.json',{at,stage:'closed',groups:rows,productionApplied:ids.size,batches:receipts.length+extra.length,
  initialApplied:live.productionApplied,initialVersionSkips:live.skipped,refreshedSurvivor:refresh.productionApplied,alreadyArchived:[binding],
  unresolved:unresolved.map(c=>({id:c.itemId,title:c.title,reason:c.reason||'protected-or-changed'})),previousOutstanding:'../resume.json',nextSources:'next-sources.json'});
write(root+'/current-progress.json',{...previous,at,rows:all,seriesWithItemReview:all.length,seriesAwaitingItemReview:previous.baselineQueueGroups-all.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),maintenanceClosed:true,lastLiveCounts:live.counts,liveRelations:live.relations,nextSourceFile:'../series-evidence-20261104/books/resume.json'});
console.log(JSON.stringify({updated:ids.size,series:all.length,cumulative:sum('productionApplied'),covered:sum('snapshotItems'),pending:sum('pendingEvidence')}));
