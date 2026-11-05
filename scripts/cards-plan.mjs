import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
import {supplement as baseSupplement} from './nov4-plan.mjs';
const dir='research/series-evidence-20261105/cards',priv='work/series-evidence-20261105/cards';
const norm=u=>{try{const x=new URL(u);return x.origin+x.pathname}catch{return ''}};
export function supplement(item,m,at){
 const r=baseSupplement(item,m,at);if(!r.item)return r;
 if(item.productLine!==m.productLine)return{skip:'reviewed-series-changed'};
 const urls=[...new Set(item.offers.map(o=>norm(o.url)))].sort();
 if(JSON.stringify(urls)!==JSON.stringify(m.retailerBinding.offerUrls)||!urls.includes(m.retailerBinding.url))return{skip:'reviewed-retailer-binding-changed'};
 const append=r.item.evidence.slice(-2);
 append[0].field='厂商系列款式与规格';
 append[0].method=m.scope+'；留存零售编号 '+m.retailerBinding.code+'（'+m.retailerBinding.knownAt+'）';
 append[1].method=m.notes;
 return{item:{...r.item,evidence:[...item.evidence,...append]}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/cards-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Do not recreate a production plan after writes started');
 const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh','work/series-evidence-20261104/tenyear-aj','work/series-evidence-20261104/kyomaf','work/series-evidence-20261105/kyomaf-aj','work/series-evidence-20261105/aj26-ky22'];
 const applied=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=['ticket','sticker'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows),observations=read(dir+'/web-observations.json');
 assert.equal(rows.length,48);assert.equal(new Set(rows.map(r=>r.itemId)).size,48);
 const changes=[],at=new Date().toISOString();
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!applied.has(m.itemId));assert.equal(cached(m.source.url).source.sha256,m.source.sha256);
  for(const ref of m.observationSources){const o=observations.find(o=>o.id===ref.id);assert.equal(hash(JSON.stringify(o)),ref.sha256)}
  const original=originals.get(m.itemId),r=supplement(original,m,at);assert.ok(r.item,r.skip);
  assert.ok(r.item.evidence.slice(-2).every(e=>e.method.length<=300&&e.value.length<=500));
  changes.push({item:r.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 assert.equal(changes.length,42);
 write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:24,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length,protected:rows.filter(r=>r.groupId===g.groupId&&r.status==='protected').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:48,prepared:42,pending:6,protected:0,groups,priorOverlap:0,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地公开抓取回执；网页工具观察另计，观察JSON哈希不是原HTML哈希。费用不可用。'});
 console.log(JSON.stringify({prepared:42,pending:6,groups:groups.map(g=>({label:g.label,ready:g.ready,pending:g.pending}))}));
}

