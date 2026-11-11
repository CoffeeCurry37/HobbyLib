import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/extella-wafer3',priv='work/series-evidence-20261110/extella-wafer3',global='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(global),at=new Date().toISOString();
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===38&&!p.skipped);
assert.equal(previous.seriesWithItemReview,53);assert.equal(previous.productionApplied,4864);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified'),ids=new Set(receipts.flatMap(r=>r.ids));
assert.equal(receipts.length,2);assert.equal(ids.size,38);
const cases=['extella','wafer3'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&ids.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:g.protected,freshVersionSkips:cases.filter(r=>r.groupId===g.groupId&&r.status==='supported'&&!ids.has(r.itemId)).length,complete:false}));
for(const g of groups)assert.ok(!previous.rows.some(r=>r.groupId===g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const fieldPending=cases.filter(r=>r.unresolvedFields?.length).map(r=>({itemId:r.itemId,title:r.title,confirmedSummaryApplied:ids.has(r.itemId),confirmed:'官方目录No.25、SSR、シークレット',unresolvedFields:r.unresolvedFields,needed:r.recheckRule,source:r.source}));
write(dir+'/field-pending.json',fieldPending);
const progress={...previous,at,seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261110/extella-wafer3/next-sources.json',latestPartialFieldPendingFile:'../series-evidence-20261110/extella-wafer3/field-pending.json',countingNote:'pendingEvidence统计未安全补简介的记录；已补简介记录仍可有未决字段，均不等于完整核实。'};
assert.equal(progress.coveredSnapshotItems,6700);assert.equal(progress.productionApplied,4902);assert.equal(progress.pendingEvidence,1788);assert.equal(progress.protectedExisting,9);assert.equal(progress.seriesAwaitingItemReview,1793);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(global,progress);
write(dir+'/resume.json',{at,startedLocalDate:'2026-11-10',completedLocalDate:'2026-11-11',timezone:'America/Chicago',stage:p.stage,groups,candidates:41,productionApplied:38,batches:2,pendingEvidence:3,additionalFieldPending:fieldPending,protectedExisting:0,freshVersionSkips:0,unresolved:cases.filter(r=>r.status==='pending'),maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:70,previousOutstanding:'../wafers/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮2批38条成功写入并完整读回；上一轮2批25条及历史全部成功批次同样禁止重放。',note:'只补空缺简介和追加两条证据，原认可资料全部保留，不增加完整核实。No.25只确认官方隐藏款目录标签，未猜角色。'});
Object.assign(review,{stage:p.stage,productionApplied:38,maintenanceClosed:true,completedAt:at,additionalFieldPending:1,groups:review.groups.map(({status,...g})=>({...g,status:'evidence-supplemented-not-fully-verified'}))});write(dir+'/review.json',review);
const next=[
 {groupId:'series-4c96c482cd244d03',label:'ぴくりる! FGO 亚克力立牌 vol.6',candidates:17,sources:['https://www.hobbystock.jp/item/view/hso-ccg-00015320','https://www.hobbystock.jp/item/view/hso-ccg-00015313','https://www.hobbystock.jp/item/view/hso-ccg-00015314','https://www.hobbystock.jp/item/view/hso-ccg-00015316'],scope:'17条来源记录不等于17种角色；先逐件比对10种单品的角色、职阶、JAN及图片。官方尺寸写明角色间有差异，不能把共通约值当每款精确尺寸；十种套装特典亚瑟与单品分开，现有来源重复不自动合并。',status:'manufacturer-source-discovery-only'},
 {groupId:'series-d86ef97205e2fcc2',label:'ぴくりる! FGO 亚克力立牌 vol.5',candidates:16,sources:['https://www.hobbystock.jp/sp/sm/fgo/?m=1054-html'],scope:'厂商专题页已显示vol.5十种亚克力立牌入口；先取得每款官方详情，再逐条绑定。不能混入同vol徽章、其他vol或套购特典，也不以标题相似自动合并。',status:'manufacturer-index-discovery-only'}
];
for(const g of next){assert.equal(targetRows().filter(t=>t.groupId===g.groupId).length,g.candidates);assert.ok(!rows.some(r=>r.groupId===g.groupId))}
const observations=[
 {id:'pikuriru6-discovery',url:next[0].sources[0],at,kind:'public-web-text-observation',facts:{manufacturer:'HOBBY STOCK',medium:'acrylic stand',volume:6,regularTypes:10,bundleBonus:'セイバー/アーサー・ペンドラゴン〔プロトタイプ〕',material:'acrylic',accessory:'base',nominalSize:'约96×71mm，角色间存在差异',listedReleaseMonth:'2026-08'},scope:'仅来源发现，不推定每条候选完整身份、尺寸或库存'},
 {id:'pikuriru5-discovery',url:next[1].sources[0],at,kind:'public-web-text-observation',facts:{volume:5,medium:'acrylic stand',regularTypes:10,indexExamples:['キャスター/マーリン','アサシン/山の翁']},scope:'仅厂商专题入口，未核对16条候选'}
].map(o=>({...o,observationSha256:hash(JSON.stringify(o)),hashMeaning:'事实观察JSON哈希，非原HTML哈希'}));
write(dir+'/next-sources.json',{at,stage:'source-discovery-only',groups:next,observations,deferredCandidates:[
 ...read('research/series-evidence-20261110/wafers/next-sources.json').deferredCandidates,
 {groupId:'series-b27ff243c6d91b13',label:'FGO 電撃コミックアンソロジー',candidates:19,protectedSnapshot:18,reason:'原快照18条已有认可及简介；不重复复核，剩余逻辑目录另排。未将来源发现算为本轮逐件研究。'},
 {groupId:'series-65c03c5948711584',label:'Fate/stay night 漫画版',candidates:20,protectedSnapshot:20,reason:'20条已有认可及简介，保持原样；不以补证名义覆盖。'},
 ...[['series-6e7a05f8ba7baa8a','威化第10弹',19,18],['series-d7f99cae71703da1','威化第4弹',18,16],['series-779431cc21291cf9','威化第5弹',18,17],['series-b4e38ff302717c6d','威化第8弹',18,17]].map(([groupId,label,candidates,placeholders])=>({groupId,label,candidates,placeholders,reason:'大部分为本地匿名席位，需独立身份映射；不能把目录顺序或共用宣传图当绑定。'}))
],pendingFirst:'EXTELLA三条拍卖需原详情/实物/版本绑定；威化3 No.25需实际卡背与角色对应证据。已有官方目录不足以猜补。',nextRule:'先vol.6的17条，再vol.5的16条；优先官方单款来源明确且无既有认可资料的候选。',productionApplied:0});
console.log(JSON.stringify({reviewed:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,protected:progress.protectedExisting,remaining:progress.seriesAwaitingItemReview,additionalFieldPending:fieldPending.length,closed:true}));

