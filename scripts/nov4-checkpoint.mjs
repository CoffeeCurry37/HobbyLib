import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write} from './four-series-common.mjs';
const publicRoot='research/series-evidence-20261103';
const pub='research/series-evidence-20261104',priv='work/series-evidence-20261104';
const baseline=read(priv+'/baseline-progress.json');
assert.equal(baseline.productionApplied,4220);
const result=read(pub+'/production.json');
assert.ok(result.finalReadbackPassed&&result.maintenanceClosed);
const batchReceipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
const ids=new Set(batchReceipts.flatMap(r=>r.ids));assert.equal(ids.size,result.productionApplied);
const revisits=read(pub+'/prize-recheck.json').rows,fresh=read(pub+'/new-cases.json');
const groups=read(pub+'/sources.json');
const before=baseline.rows.map(row=>({...row}));
for(const r of revisits.filter(r=>ids.has(r.itemId))){
 const g=before.find(g=>g.groupId===r.groupId);assert.ok(g.pendingEvidence>0);
 g.pendingEvidence--;g.productionApplied++;
}
const newer=groups.map(g=>{
 const rows=fresh.filter(r=>r.groupId===g.groupId);
 const applied=rows.filter(r=>ids.has(r.itemId)).length;
 const held=rows.filter(r=>r.status==='protected').length,pending=rows.filter(r=>r.status==='pending').length;
 return {groupId:g.groupId,label:g.type==='wafer'?'威化卡片 · '+g.label:g.label,snapshotItems:rows.length,productionApplied:applied,
  pendingEvidence:pending,protectedExisting:held,freshVersionSkips:rows.length-applied-held-pending,complete:false};
});
const combined=[...before,...newer],sum=key=>combined.reduce((n,r)=>n+r[key],0);
assert.equal(combined.length,new Set(combined.map(r=>r.groupId)).size);
assert.equal(sum('productionApplied'),baseline.productionApplied+ids.size);
const left=[...revisits,...fresh].filter(r=>r.status==='pending'||(r.status==='supported'&&!ids.has(r.itemId))).map(r=>({
 id:r.itemId,groupId:r.groupId,title:r.title,reason:r.reason||'live-version-changed',source:r.detail||r.source?.url||r.official||null}));
const gapTypes=Object.fromEntries([...Map.groupBy(left,r=>r.reason)].map(([k,v])=>[k,v.length]));
const at=new Date().toISOString();
write(pub+'/resume.json',{at,stage:'closed',baselineCommit:'9523fab6d0f5b4e73893fd3f0bb97388291f1d05',revisited:revisits.length,
 recheckApplied:revisits.filter(r=>ids.has(r.itemId)).length,recheckPending:revisits.filter(r=>!ids.has(r.itemId)).length,
 newCandidates:fresh.length,newGroups:newer.length,newApplied:newer.reduce((n,g)=>n+g.productionApplied,0),
 productionApplied:ids.size,verifiedBatches:batchReceipts.length,groups:newer,gapTypes,outstanding:left,
 nextChecks:['ルギマート用途需带品名和用途的包装或厂商单品说明。','核对 AJ2025 与 AJ2026 的原销售批次和再贩，尤其 XXL 新尺码；逐件读取最新目标后才考虑归属。','有编号、姓名或稀有度冲突的卡优先看卡背。无身份锚点的内部占位只与系列目录并存。','选下一系列时先核实厂商或主办方目录，再按未处理商品数排序。']});
write(publicRoot+'/current-progress.json',{...baseline,at,seriesWithItemReview:combined.length,seriesAwaitingItemReview:baseline.baselineQueueGroups-combined.length,
 coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),
 freshVersionSkips:sum('freshVersionSkips'),rows:combined,maintenanceClosed:true,lastLiveCounts:result.counts,liveRelations:result.relations,
 nextSourceFile:'../series-evidence-20261104/resume.json'});
console.log(JSON.stringify({groups:combined.length,cumulative:sum('productionApplied'),covered:sum('snapshotItems'),pending:sum('pendingEvidence'),outstanding:left.length}));
