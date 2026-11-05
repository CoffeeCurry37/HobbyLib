import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/cards',priv='work/series-evidence-20261105/cards',global='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(global),at=new Date().toISOString();
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===42&&!p.skipped);
assert.equal(previous.seriesWithItemReview,47);assert.equal(previous.productionApplied,4763);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified'),ids=new Set(receipts.flatMap(r=>r.ids));
assert.equal(receipts.length,3);assert.equal(ids.size,42);
const cases=['ticket','sticker'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&ids.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:g.protected,freshVersionSkips:cases.filter(r=>r.groupId===g.groupId&&r.status==='supported'&&!ids.has(r.itemId)).length,complete:false}));
for(const g of groups)assert.ok(!previous.rows.some(r=>r.groupId===g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const progress={...previous,at,seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261105/cards/next-sources.json'};
assert.equal(progress.coveredSnapshotItems,6561);assert.equal(progress.productionApplied,4805);assert.equal(progress.pendingEvidence,1752);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(global,progress);
const unresolved=cases.filter(r=>r.status==='pending');
write(dir+'/resume.json',{at,stage:p.stage,groups,candidates:48,productionApplied:42,batches:3,pendingEvidence:6,protectedExisting:0,freshVersionSkips:0,unresolved,maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:70,previousOutstanding:'../aj26-ky22/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮3批42条成功写入并完整读回；历史全部成功批次同样禁止重放。',note:'仅补空缺简介并追加两条证据；非完整核实。先前1746条待查及3条认可资料保留。'});
Object.assign(review,{stage:p.stage,productionApplied:42,maintenanceClosed:true,groups:review.groups.map(({status,...g})=>({...g,status:'evidence-supplemented-not-fully-verified'}))});write(dir+'/review.json',review);
const ts=targetRows();
const next=[
 {groupId:'series-69c56fbae780ba75',label:'Fate/Grand Order -turas réalta-',candidates:25,sources:[...new Set(ts.filter(t=>t.groupId==='series-69c56fbae780ba75').flatMap(t=>t.sourceUrls).filter(u=>u.startsWith('https://www.kodansha.co.jp/')))],scope:'23条卷册、1条系列页、1条1至22卷零售组合。逐卷核对ISBN、纸本/电子版、系列页边界；不把组合当单本。',status:'retained-official-links-access-blocked',access:'本轮公开网页工具抽查卷1及23官方页均返回403；未逐卷补证，未绕过。'},
 {groupId:'series-1203beeb5e6df4c7',label:'Fate/Grand Order -絶対魔獣戦線バビロニア-',candidates:25,sources:['https://anime.fate-go.jp/ep7-tv/bddvd/','https://anime.fate-go.jp/ep7-tv/package/','https://anime.fate-go.jp/ep7-tv/bddvd/?no=shop'],scope:'当前25条混有TV动画BD/DVD、舞台BD/DVD、主题曲CD、原声CD、套装及特典；仅TV官方BD页不能覆盖全部。媒介不明及跨媒介混合挂牌先保留待查，不自动拆分或归并。原组30个历史编号中5个不在当前投影，须保留历史映射。',status:'source-discovery-only'}
];
for(const g of next)assert.equal(ts.filter(t=>t.groupId===g.groupId).length,g.candidates);
write(dir+'/next-sources.json',{at,stage:'source-discovery-only',groups:next,pendingFirst:'本轮6条仅在取得新图案编号对应或包装JAN证据后重查；重复403不反复抓取。',nextRule:'先尝试25条turas réalta书目；若出版商访问仍受限，保存断点并推进25条巴比伦尼亚的明确TV条目。后续保留24条威化第2弹、24条特别弹2025等原队列。',productionApplied:0});
console.log(JSON.stringify({reviewed:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,remaining:progress.seriesAwaitingItemReview,closed:true}));

