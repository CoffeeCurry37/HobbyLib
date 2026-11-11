import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/wafers',priv='work/series-evidence-20261110/wafers',global='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(global),at=new Date().toISOString();
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===25&&!p.skipped);
assert.equal(previous.seriesWithItemReview,51);assert.equal(previous.productionApplied,4839);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified'),ids=new Set(receipts.flatMap(r=>r.ids));
assert.equal(receipts.length,2);assert.equal(ids.size,25);
const cases=['wafer2','special25'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&ids.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:g.protected,freshVersionSkips:cases.filter(r=>r.groupId===g.groupId&&r.status==='supported'&&!ids.has(r.itemId)).length,complete:false}));
for(const g of groups)assert.ok(!previous.rows.some(r=>r.groupId===g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const progress={...previous,at,seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261110/wafers/next-sources.json'};
assert.equal(progress.coveredSnapshotItems,6659);assert.equal(progress.productionApplied,4864);assert.equal(progress.pendingEvidence,1785);assert.equal(progress.protectedExisting,9);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(global,progress);
write(dir+'/resume.json',{at,completedLocalDate:'2026-11-10',timezone:'America/Chicago',stage:p.stage,groups,candidates:48,productionApplied:25,batches:2,pendingEvidence:23,protectedExisting:0,freshVersionSkips:0,unresolved:cases.filter(r=>r.status==='pending'),maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:70,previousOutstanding:'../../series-evidence-20261105/books-media/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮2批25条成功写入并完整读回；上一轮2批34条及历史全部成功批次同样禁止重放。',note:'只补空缺简介和追加两条证据，原认可资料全部保留，不增加完整核实。匿名占位缺的是身份映射，不是缺少实际卡号清单。'});
Object.assign(review,{stage:p.stage,productionApplied:25,maintenanceClosed:true,completedAt:at,groups:review.groups.map(({status,...g})=>({...g,status:'evidence-supplemented-not-fully-verified'}))});write(dir+'/review.json',review);
const ts=targetRows();
const next=[
 {groupId:'series-c2022bfe93fba72b',label:'Fate/EXTELLA',candidates:24,sources:['https://www.marv.jp/titles/cs/711/','https://www.marv.jp/titles/cs/715/'],scope:'先区分各平台通常版、REGALIA、VELBER、Celebration、Best Collection及组件特典；官方PS4 REGALIA不能覆盖PSV版，双平台VELBER有独立组成。保留原JAN、平台、二手缺件及挂牌，不根据相似标题合并，也不把EXTELLA LINK混入。',status:'manufacturer-source-discovery-only'},
 {groupId:'series-1121bbdd36248e9f',label:'Fate/Grand Order 威化第3弹',candidates:17,sources:['https://www.bandai.co.jp/candy/products/2018/4549660251392000.html'],scope:'官方文字列出24种明确款及1种隐藏款；当前17条具有既有目录编号/角色，先逐条比对，不能仅凭官方全25种新增商品。保留标点与原名，不把包装JAN写成单卡JAN。',status:'official-numbered-lineup-discovery-only'}
];
for(const g of next){assert.equal(ts.filter(t=>t.groupId===g.groupId).length,g.candidates);assert.ok(!rows.some(r=>r.groupId===g.groupId))}
const observations=[
 {id:'extella-regalia-ps4-discovery',url:next[0].sources[0],at,kind:'public-web-text-observation',facts:{platform:'PS4',edition:'REGALIA BOX',contents:['PS4游戏','绘制收纳盒','Fate/EXTELLA material','Nero服装代码']},scope:'制造商页面可读，仅定位版本入口，未逐项写入'},
 {id:'extella-velber-discovery',url:next[0].sources[1],at,kind:'public-web-text-observation',facts:{platforms:['PS4','PSVita'],edition:'VELBER BOX',contents:['PS4游戏','PSVita游戏','绘制收纳盒','material','鼠标垫','Nero与Gilgamesh服装代码']},scope:'官方固定组合范围；不能据此推定二手挂牌完整'},
 {id:'wafer3-discovery',url:next[1].sources[0],at,kind:'public-web-text-observation',facts:{edition:'2018第3弹',cardTypes:25,numberedNamedEntries:24,secretEntries:1},scope:'仅来源发现，尚未核对17条原目标'}
].map(o=>({...o,observationSha256:hash(JSON.stringify(o)),hashMeaning:'所列事实观察JSON哈希，非原HTML哈希'}));
write(dir+'/next-sources.json',{at,stage:'source-discovery-only',groups:next,observations,deferredCandidates:[
 {groupId:'series-88cfca913affa7c3',label:'威化第12弹',candidates:22,reason:'原投影21个匿名占位加目录；先解决可追踪身份映射，不能把总款数补证算作全部成员完成。'},
 {groupId:'series-2055bee462bc50c0',label:'巴比伦尼亚威化第1弹',candidates:21,reason:'原投影20个匿名占位加目录；与本轮特别弹同类缺口，仍属未逐件研究队列。'},
 {groupId:'series-806ed68ef12d1ffc',label:'西脇だっと Fate/stay night',candidates:21,reason:'派生卷目可能与另一组20条已有认可漫画单卷重叠；需先核对原ID、ISBN及映射，不能覆盖认可资料或直接归并。'}],pendingFirst:'本轮23个占位仅在取得旧ID与实际卡号的独立对应、或形成明确的历史映射整理方案后再处理。已保存真实ST/SST清单，无需重复抓总目录。',nextRule:'先Fate/EXTELLA 24条，再威化第3弹17条；优先厂商版本或编号已明确的候选。较大但匿名的组保留待查，不静默删除。',productionApplied:0});
console.log(JSON.stringify({reviewed:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,protected:progress.protectedExisting,remaining:progress.seriesAwaitingItemReview,closed:true}));

