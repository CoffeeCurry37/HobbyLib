import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/aj26-ky22',priv='work/series-evidence-20261105/aj26-ky22',globalPath='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(globalPath);
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===29&&!p.skipped);
assert.equal(previous.seriesWithItemReview,45);assert.equal(previous.productionApplied,4734);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
const applied=new Set(receipts.flatMap(r=>r.ids));assert.equal(applied.size,29);assert.equal(receipts.length,2);
const cases=[2026,2022].flatMap(y=>read(dir+'/cases-'+y+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&applied.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:g.protected,freshVersionSkips:0,complete:false}));
const oldIds=new Set(previous.rows.map(r=>r.groupId));for(const g of groups)assert.ok(!oldIds.has(g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const progress={...previous,at:new Date().toISOString(),seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261105/aj26-ky22/next-sources.json'};
assert.equal(progress.coveredSnapshotItems,6513);assert.equal(progress.productionApplied,4763);assert.equal(progress.pendingEvidence,1746);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(globalPath,progress);
const queue=read('research/series-evidence-20261103/queue-index.json').groups,ts=targetRows();
const picks=[
 {groupId:'series-f9bdeb076f26b3db',url:'https://www.bandai.co.jp/catalog/item.php?jan_cd=4582769993725000',anchors:['チケットライクコレクション Fate/Grand Order','ノーマル20種','シークレット2種','チケット型ミニポスター1枚入り'],scope:'厂商说明22种（20普通+2隐藏），该页面为单包1枚；24条候选含单款、包、盒，候选数量不等于款式数量。',next:'逐款核对官方图案/款名及零售编号；两条隐藏款不可从内部席位号推定。另证整盒数量与配置，不保证齐款。'},
 {groupId:'series-b588c56ae22b3618',url:'https://bandai-lifestyle.jp/products/details.php?detail=4582769993459000',anchors:['モバイルステッカーコレクション Fate/Grand Order Vol.2','ノーマル20種','シークレット2種','ステッカー1枚入り','2枚入り'],scope:'厂商此页为单包1枚，明确与2枚入り版同款式；不能将1枚包装规格写给2枚包或BOX。24条候选包括单款、包、盒和零售全22种组合。',next:'核对款名、隐藏款及图片，再分开1枚包/2枚包/BOX/零售齐款组合；不由同款式推定同包装或整盒齐款。'}
];
const next=picks.map(({groupId,url,anchors,scope,next})=>{
 assert.ok(!rows.some(r=>r.groupId===groupId));const g=queue.find(g=>g.id===groupId),targets=ts.filter(t=>t.groupId===groupId);assert.equal(targets.length,24);
 const {body,source}=cached(url),plain=clean(body.replace(/<[^>]+>/g,' ')).replace(/\s+/g,'');
 for(const a of anchors)assert.ok(plain.includes(a.replace(/\s+/g,'')),a);
 return {groupId,label:g.label,candidates:targets.length,source:source.url,capture:source,status:'source-discovery-only',scope,next};
});
write(dir+'/next-sources.json',{at:new Date().toISOString(),stage:'source-discovery-only',basis:'两个厂商官方产品页规格明确，各覆盖24条候选；只发现来源，尚未逐件核对。25条的书目/音像等较大组仍保留原队列，需独立处理卷次、媒介与套装范围。',groups:next,additionalCapture:{urls:2,requests:2,cacheHits:0,paidModelApiCalls:0},nextRule:'官方整弹说明仅证明明确范围；单款/隐藏款/包/盒/零售齐款组合逐项对证，有明确证据才写入。'});
const limits=cases.filter(r=>r.notes).map(({itemId,title,sku,variantId,notes,source})=>({itemId,title,sku,variantId,notes,source,action:'supported-summary-applied-unconfirmed-fields-omitted'}));
write(dir+'/field-limits.json',limits);
write(dir+'/resume.json',{at:new Date().toISOString(),stage:'applied-read-back-and-closed',groups,candidates:29,productionApplied:29,batches:2,pendingEvidence:0,protectedExisting:0,freshVersionSkips:0,officialVariantMatches:29,unresolved:[],fieldLimits:'field-limits.json',sourceCorrection:'source-correction.json',maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:p.siteVersion,previousOutstanding:'../kyomaf-aj/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮2批29条已成功写入并完整读回；所有历史成功批次同样禁止重放。',note:'只补空缺简介和证据，不等于完整核实；既有1746条待查未清空，3条原认可资料保留。'});
Object.assign(review,{stage:p.stage,productionApplied:p.productionApplied,maintenanceClosed:true});write(dir+'/review.json',review);
console.log(JSON.stringify({groups:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,remaining:progress.seriesAwaitingItemReview,next:next.map(g=>({label:g.label,candidates:g.candidates}))}));

