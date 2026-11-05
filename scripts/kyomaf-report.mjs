import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf',globalPath='research/series-evidence-20261103/current-progress.json';
const p=read(dir+'/production.json'),review=read(dir+'/review.json'),previous=read(globalPath);
assert.ok(p.maintenanceClosed&&p.finalReadbackPassed&&p.productionApplied===106&&!p.skipped);
assert.equal(previous.seriesWithItemReview,39);assert.equal(previous.productionApplied,4582);
const receipts=fs.readFileSync(priv+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified');
const applied=new Set(receipts.flatMap(r=>r.ids));assert.equal(applied.size,106);assert.equal(receipts.length,6);
const cases=[2021,2025,2026,2023].flatMap(y=>read(dir+'/cases-'+y+'.json').rows);
const groups=review.groups.map(g=>({groupId:g.groupId,label:g.label,snapshotItems:g.reviewed,productionApplied:cases.filter(r=>r.groupId===g.groupId&&applied.has(r.itemId)).length,pendingEvidence:g.pending,protectedExisting:0,freshVersionSkips:0,complete:false}));
const oldIds=new Set(previous.rows.map(r=>r.groupId));for(const g of groups)assert.ok(!oldIds.has(g.groupId));
const rows=[...previous.rows,...groups],sum=k=>rows.reduce((n,r)=>n+r[k],0);
const progress={...previous,at:new Date().toISOString(),seriesWithItemReview:rows.length,seriesAwaitingItemReview:1848-rows.length,coveredSnapshotItems:sum('snapshotItems'),productionApplied:sum('productionApplied'),protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:p.counts,liveRelations:p.relations,maintenanceClosed:true,rows,nextSourceFile:'../series-evidence-20261104/kyomaf/next-sources.json'};
assert.equal(progress.coveredSnapshotItems,6438);assert.equal(progress.productionApplied,4688);assert.equal(progress.pendingEvidence,1746);
assert.equal(progress.coveredSnapshotItems,progress.productionApplied+progress.protectedExisting+progress.pendingEvidence+progress.freshVersionSkips);
write(globalPath,progress);
const nav=cached('https://online.aniplex.co.jp/itemeTxTCNim.html');
const links=[...nav.body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:new URL(clean(m[1]),nav.source.url).href,label:clean(m[2].replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ')}));
const queue=read('research/series-evidence-20261103/queue-index.json').groups,ts=targetRows();
const choices=[
 ['series-5a345df5342f76d8','京まふ2024','https://online.aniplex.co.jp/KddfgCVO'],
 ['series-2ef3a64390060d91','AnimeJapan2022','https://online.aniplex.co.jp/animejapan2022'],
 ['series-5062e494236396ff','AnimeJapan2026 Fate/Grand Order オフィシャルグッズ','https://online.aniplex.co.jp/EOyBwVvu'],
 ['series-b27a728651d41744','京まふ2022','https://online.aniplex.co.jp/VxfcUhGK']
];
const next=choices.map(([id,label,url])=>{assert.ok(links.some(l=>l.label===label&&l.url===url));assert.ok(!rows.some(g=>g.groupId===id));const g=queue.find(g=>g.id===id),targets=ts.filter(r=>r.groupId===id);assert.equal(targets.length,g.activeSnapshotCount);assert.ok(targets.every(t=>t.officialObservations?.length));return {groupId:id,label:g.label,candidates:targets.length,source:url,existingOfficialProductUrls:[...new Set(targets.flatMap(t=>t.officialObservations.map(o=>o.url)))],status:'source-discovery-only'};});
write(dir+'/next-sources.json',{at:new Date().toISOString(),stage:'source-discovery-only',basis:'优先已有逐件官方商品号和站内活动入口的未检查分组，按覆盖量继续；25/24条书目、音像、卡片等较大组仍在原队列，尚需进一步确认版次或单款目录。',navigationSource:nav.source,groups:next,nextRule:'先确认活动目录实际链接与全部分页，再核对每个商品号及规格。当前只发现入口，尚未逐件研究或写入。'});
write(dir+'/resume.json',{at:new Date().toISOString(),stage:'applied-read-back-and-closed',groups,candidates:106,productionApplied:106,batches:6,pendingEvidence:0,protectedExisting:0,freshVersionSkips:0,officialVariantMatches:103,visualRetailerMatches:3,unresolved:[],maintenanceClosed:true,environmentRevision:p.environmentRevision,deploymentId:p.deploymentId,siteVersion:p.siteVersion,previousOutstanding:'../tenyear-aj/resume.json',nextSources:'next-sources.json',doNotReplay:'本轮6批106条已成功写入并完整读回；所有历史成功批次同样禁止重放。',note:'本轮只补空缺简介和证据，不等于完整核实。既有1746条待查未清空；3条原认可资料保留。'});
Object.assign(review,{stage:p.stage,productionApplied:p.productionApplied,maintenanceClosed:true});write(dir+'/review.json',review);
console.log(JSON.stringify({groups:progress.seriesWithItemReview,covered:progress.coveredSnapshotItems,applied:progress.productionApplied,pending:progress.pendingEvidence,remaining:progress.seriesAwaitingItemReview,next:next.map(g=>({label:g.label,candidates:g.candidates}))}));

