import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/books-media',priv='work/series-evidence-20261105/books-media',global='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(global),at=new Date().toISOString();
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===34&&!p.skipped);
assert.equal(previous.seriesWithItemReview,49);assert.equal(previous.productionApplied,4805);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified'),ids=new Set(receipts.flatMap(r=>r.ids));
assert.equal(receipts.length,2);assert.equal(ids.size,34);
const cases=['turas','babylonia'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&ids.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:g.protected,freshVersionSkips:cases.filter(r=>r.groupId===g.groupId&&r.status==='supported'&&!ids.has(r.itemId)).length,complete:false}));
for(const g of groups)assert.ok(!previous.rows.some(r=>r.groupId===g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const progress={...previous,at,seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),protectionBreakdown:{acceptedEditorial:3,existingV6Summary:6},pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261105/books-media/next-sources.json'};
assert.equal(progress.coveredSnapshotItems,6611);assert.equal(progress.productionApplied,4839);assert.equal(progress.pendingEvidence,1762);assert.equal(progress.protectedExisting,9);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(global,progress);
write(dir+'/resume.json',{at,completedLocalDate:'2026-11-10',timezone:'America/Chicago',stage:p.stage,groups,candidates:50,productionApplied:34,batches:2,pendingEvidence:10,protectedExisting:6,protectionMeaning:'6条动画V6既有简介及证据原样保留，不是新增人工认可；此前3条人工认可同样保留。',freshVersionSkips:0,unresolved:cases.filter(r=>r.status==='pending'),maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:70,previousOutstanding:'../cards/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮2批34条已成功写入并完整读回；历史全部成功批次同样禁止重放。',note:'研究完成于11月5日，11月10日按用户继续指令恢复写入；此前审批未执行，不存在漏记生产批次。仅补空缺简介和追加两条证据，不增加完整核实。',historicalScope:'巴比伦尼亚原组30个历史编号中仅25个在原当前投影；另外5个历史映射保留，未重建或作为本轮候选统计。'});
Object.assign(review,{stage:p.stage,productionApplied:34,maintenanceClosed:true,completedAt:at,groups:review.groups.map(({status,...g})=>({...g,status:'evidence-supplemented-not-fully-verified'}))});write(dir+'/review.json',review);
const ts=targetRows();
const next=[
 {groupId:'series-23fffc96bf0a6a91',label:'Fate/Grand Order ウエハース2（第2弹）',candidates:24,sources:['https://www.bandai.co.jp/catalog/item.php?jan_cd=4549660224976000'],scope:'2018普通第2弹，勿混同巴比伦尼亚动画版第2弹或复刻第2弹。官方文字列全25种，含24普通编号和隐藏款；本轮后续候选24条，须逐一绑定原卡号和角色，不因目录25种新增缺失成员。',status:'official-text-located-item-review-not-started'},
 {groupId:'series-51eab3b1ff4440c6',label:'Fate/Grand Order ツインウエハース 特別弾 2025',candidates:24,sources:['https://www.bandai.co.jp/candy/products/2025/4570117918803000.html','https://www.bandai.co.jp/catalog/item.php?jan_cd=4570117918803000'],secondarySources:['https://www.suruga-ya.jp/product/detail/GN815102'],scope:'官方确认全24种，一包1张卡和2枚威化。当前条目多为待补款式编号；须结合原图、卡背编号、既有来源和零售ST/SST清单逐项绑定，不能把目录位置当角色证据。25年版勿混同24年特别弹，包装JAN不可当单卡JAN。',status:'official-page-and-retailer-lineup-located-item-review-not-started'}
];
for(const g of next){assert.equal(ts.filter(t=>t.groupId===g.groupId).length,g.candidates);assert.ok(!rows.some(r=>r.groupId===g.groupId))}
const observations=[
 {id:'wafer2-source-discovery',url:next[0].sources[0],at,kind:'public-web-search-text-observation',facts:{edition:'2018普通第2弹',cardTypes:25,numberedRegularEntries:24,secretEntries:1},scope:'只定位来源；未逐条核对，不计生产补证'},
 {id:'wafer-special25-source-discovery',url:next[1].sources[0],at,kind:'public-web-search-text-observation',facts:{edition:'特別弾2025',cardTypes:24,cardsPerPack:1,wafersPerPack:2},scope:'只定位来源；不把厂商总目录顺序绑定匿名候选'}
].map(o=>({...o,observationSha256:hash(JSON.stringify(o)),hashMeaning:'所列事实观察JSON哈希，非原HTML哈希'}));
write(dir+'/next-sources.json',{at,stage:'source-discovery-only',groups:next,observations,pendingFirst:'本轮10条及此前1752条待查，仅取得新独立版本/包装/图案证据时再审；6条已有简介不重写。',nextRule:'按顺序核对威化第2弹24条、特别弹2025的24条，优先官方编号与款式明确者。先读原始身份和证据，现有占位编号不能直接映射。',productionApplied:0});
console.log(JSON.stringify({reviewed:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,protected:progress.protectedExisting,remaining:progress.seriesAwaitingItemReview,closed:true}));

