// Audit an applied explicit review batch, including untouched records and surviving original offers.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const [beforePath,afterPath,decisionsPath,output]=process.argv.slice(2),before=JSON.parse(readFileSync(beforePath)),after=JSON.parse(readFileSync(afterPath)),decisions=JSON.parse(readFileSync(decisionsPath)),manifest=JSON.parse(readFileSync('lib/radar/editorial-manifest.json'));
const r=loadRadar(),{editorialStatus,currentEditorial}=r.get('editorial'),{buildCatalogue}=r.get('taxonomy'),{offerKey}=r.get('identity'),by=new Map([...after.items,...after.archived||[]].map(i=>[i.id,i])),reviewed=new Set(decisions.map(d=>manifest.ids[d.ordinal-1]));
let untouched=0;for(const i of [...before.items,...before.archived||[]]){const next=by.get(i.id);assert.ok(next,'Missing '+i.id);if(!reviewed.has(i.id)){assert.deepEqual(next,i,'Unexpected edit '+i.id);untouched++;}else{assert.notEqual(editorialStatus(next,manifest.id),'stale');assert.notEqual(editorialStatus(next,manifest.id),'pending');const keeper=next.archivedInto?by.get(next.archivedInto):next;for(const offer of i.offers)assert.ok(keeper.offers.some(o=>offerKey(o)===offerKey(offer)),'Lost original offer '+i.id);}}
const counts={};for(const id of manifest.ids){const status=editorialStatus(by.get(id),manifest.id);counts[status]=(counts[status]||0)+1;}assert.equal(counts.stale||0,0);
const tree=buildCatalogue(after.items,after.prefs,after.relations),path=n=>tree.ancestors(tree.itemNodes.get(manifest.ids[n-1])).map(n=>n.name);
for(const n of [43,44,45,46,64,65,66,69])assert.equal(path(n)[0],'其他收藏','Wrong franchise #'+n);
for(const n of [48,49,53])assert.ok(path(n).includes('其他 TYPE-MOON'),'Missing Type-Moon project #'+n);
assert.equal(by.get(manifest.ids[40]).majorClass,'影像');assert.equal(by.get(manifest.ids[46]).majorClass,'大型周边');assert.equal(by.get(manifest.ids[78]).majorClass,'影像');
assert.ok(after.relations.some(x=>x.fromId==='source-780596777861e69912bc65d97da11fdc'&&x.toId===manifest.ids[40]&&x.kind==='bonus'));
assert.ok(path(70).includes('一番くじ Fateシリーズ 10周年記念第一弾 タイプムーンエースSpecial'));
const parent=after.items.find(i=>i.catalogueKey==='books:delightworks:reference:fgo-game-artbook:');assert.ok(parent&&currentEditorial(parent));const children=after.relations.filter(x=>x.fromId===parent.id&&x.kind==='contains');assert.equal(children.length,12);assert.equal(by.get(manifest.ids[58]).archivedInto,manifest.ids[55]);
assert.equal(after.items.filter(i=>i.origin==='doujin').length,before.items.filter(i=>i.origin==='doujin').length);
const report={at:new Date().toISOString(),reviewed:decisions.length,untouchedOriginalRecords:untouched,counts,nextPendingOrdinal:manifest.ids.findIndex(id=>editorialStatus(by.get(id),manifest.id)==='pending')+1,newParentId:parent.id,seriesChildren:children.length,active:after.items.length,archived:after.archived.length,relations:after.relations.length,checks:['every batch record accounted for','all other originals byte-equivalent as JSON values','original offers preserved after merge','correct franchise paths and bonus linkage','same-product archive tracked','doujin count unchanged']};writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));r.close();
