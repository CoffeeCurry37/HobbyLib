import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
import {supplement as baseSupplement} from './nov4-plan.mjs';
const dir='research/series-evidence-20261110/extella-wafer3',priv='work/series-evidence-20261110/extella-wafer3';
export function supplement(item,m,at){
 if(m.status!=='supported')return{skip:'unconfirmed-member'};
 const r=baseSupplement(item,m,at);if(!r.item)return r;
 for(const [key,value] of Object.entries(m.identityBinding)){
  if(key==='offerUrls'){if(JSON.stringify([...new Set(item.offers.map(o=>o.url))].sort())!==JSON.stringify(value))return{skip:'reviewed-retailer-binding-changed'};}
  else if(JSON.stringify(item[key]??null)!==JSON.stringify(value))return{skip:'reviewed-identity-changed'};
 }
 return r;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/extella-wafer3-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Do not recreate after production writes');
 const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261110/wafers','work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh','work/series-evidence-20261104/tenyear-aj','work/series-evidence-20261104/kyomaf','work/series-evidence-20261105/kyomaf-aj','work/series-evidence-20261105/aj26-ky22','work/series-evidence-20261105/cards','work/series-evidence-20261105/books-media'];
 const applied=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=['extella','wafer3'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows),observations=read(dir+'/web-observations.json');
 assert.equal(rows.length,41);assert.equal(new Set(rows.map(r=>r.itemId)).size,41);
 const changes=[],at=new Date().toISOString();
 for(const m of rows){
  assert.ok(!applied.has(m.itemId),'Historical overlap');
  if(m.status!=='supported'){for(const ref of [m.retailerObservation,m.imageObservation].filter(Boolean)){const o=observations.find(o=>o.id===ref.id);assert.equal(hash(JSON.stringify(o)),ref.sha256)}assert.equal(supplement(originals.get(m.itemId),m,at).skip,'unconfirmed-member');continue;}
  if(m.retailerObservation){const o=observations.find(o=>o.id===m.retailerObservation.id);assert.equal(hash(JSON.stringify(o)),m.retailerObservation.sha256);}
  for(const source of [m.source,...(m.additionalSources||[])])assert.equal(cached(source.url).source.sha256,source.sha256);
  const original=originals.get(m.itemId),r=supplement(original,m,at);assert.ok(r.item,r.skip);assert.ok(!/待补款式/.test(original.title));
  assert.ok(r.item.evidence.slice(-2).every(e=>e.method.length<=300&&e.value.length<=500));
  changes.push({item:r.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 assert.equal(changes.length,38);write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:g.candidates,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length,protected:rows.filter(r=>r.groupId===g.groupId&&r.status==='protected').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:41,prepared:38,pending:3,protected:0,groups,priorOverlap:0,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地公开抓取回执；网页工具的可读零售观察另计，观察JSON哈希不是原HTML哈希。费用不可用。'});
 console.log(JSON.stringify({prepared:38,pending:3,protected:0,groups:groups.map(g=>({label:g.label,ready:g.ready,pending:g.pending}))}));
}


