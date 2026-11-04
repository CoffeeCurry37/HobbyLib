import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pub,priv,read,write,sources} from './four-series-common.mjs';
const progressPath='research/series-evidence-20261103/current-progress.json';
const previous=read(progressPath), production=read(pub+'/production.json');
assert.ok(production.finalReadbackPassed && production.maintenanceClosed);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
const applied=new Set(receipts.flatMap(r=>r.ids));
assert.equal(applied.size,production.productionApplied);
const oldRows=previous.rows.filter(r=>!sources.some(s=>s.groupId===r.groupId));
const results=[], outstanding=[];
for(const [n,series] of sources.entries()) {
  const rows=read(pub+'/items-'+n+'.json').rows;
  const updated=rows.filter(r=>applied.has(r.itemId));
  assert.ok(updated.every(r=>r.status==='supported'));
  const pending=rows.filter(r=>r.status==='pending');
  const skipped=rows.filter(r=>r.status==='supported'&&!applied.has(r.itemId));
  const protectedRows=rows.filter(r=>r.status==='protected');
  assert.equal(rows.length,updated.length+pending.length+protectedRows.length+skipped.length);
  results.push({groupId:series.groupId,label:series.label,snapshotItems:rows.length,productionApplied:updated.length,
    pendingEvidence:pending.length,protectedExisting:protectedRows.length,freshVersionSkips:skipped.length,complete:false});
  const retailer= n>=2 ? read(pub+'/retailer-'+n+'.json') : {};
  for(const row of pending){
    let next='查找带有完整角色、职阶、造型和奖级的单件编号或包装；总览图只作参考。';
    if(row.reason.includes('set-or-lot')||/\d+種セット|\d+個セット/.test(row.title)) next='核对独立套装编号或零售清单，分清官方发奖单位、零售全款组合及卖家自组范围。';
    if(n===3) next='零售全款清单限定クロエ的水着造型，核对本条原挂牌与实物包装是否为同款。';
    if(n===2&&row.title.includes('ルギマート')) next='核对实物类型。旧标题写挂件，官方奖级说明还列有杯垫。';
    outstanding.push({id:row.itemId,groupId:series.groupId,title:row.title,award:row.award||null,
      officialSource:row.awardSource||series.officialSource,secondarySource:retailer[row.award]?.url||null,reason:row.reason,next});
  }
  for(const row of skipped)outstanding.push({id:row.itemId,groupId:series.groupId,title:row.title,reason:'live-version-skip',next:'读取正式库最新记录，再判断是否仍需补充。'});
}
assert.equal(results.reduce((n,r)=>n+r.productionApplied,0),applied.size);
const rows=[...oldRows,...results],sum=k=>rows.reduce((n,r)=>n+r[k],0);
assert.equal(rows.length,new Set(rows.map(r=>r.groupId)).size);
write(pub+'/resume.json',{closed:true,productionApplied:applied.size,verifiedBatches:receipts.length,groups:results,
  outstanding,completedJournal:'verified-batches.json',retryPolicy:'Only review the named gaps or changed live versions. Verified batches are closed.'});
write(progressPath,{...previous,at:new Date().toISOString(),seriesWithItemReview:rows.length,
  seriesAwaitingItemReview:previous.baselineQueueGroups-rows.length,coveredSnapshotItems:sum('snapshotItems'),
  productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),
  freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:production.counts,liveRelations:production.relations,
  rows,maintenanceClosed:true,nextSourceFile:'four-series/resume.json'});
console.log(JSON.stringify({applied:applied.size,outstanding:outstanding.length,cumulative:sum('productionApplied'),series:rows.length}));
