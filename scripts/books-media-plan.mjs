import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
import {supplement as baseSupplement} from './nov4-plan.mjs';
const dir='research/series-evidence-20261105/books-media',priv='work/series-evidence-20261105/books-media';
export function supplement(item,m,at){
 const r=baseSupplement(item,m,at);if(!r.item)return r;
 const b=m.identityBinding;
 if((item.isbn||'')!==b.isbn||(item.jan||'')!==b.jan||(item.productLine||'')!==b.productLine)return{skip:'reviewed-identity-changed'};
 if(JSON.stringify([...new Set(item.offers.map(o=>o.url))].sort())!==JSON.stringify(b.offerUrls))return{skip:'reviewed-retailer-binding-changed'};
 return r;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/books-media-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Do not recreate plan after production writes');
 const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh','work/series-evidence-20261104/tenyear-aj','work/series-evidence-20261104/kyomaf','work/series-evidence-20261105/kyomaf-aj','work/series-evidence-20261105/aj26-ky22','work/series-evidence-20261105/cards'];
 const applied=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=['turas','babylonia'].flatMap(k=>read(dir+'/cases-'+k+'.json').rows),observations=read(dir+'/web-observations.json');
 assert.equal(rows.length,50);assert.equal(new Set(rows.map(r=>r.itemId)).size,50);
 const changes=[],at=new Date().toISOString();
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!applied.has(m.itemId));for(const source of [m.source,...(m.additionalSources||[]),...(m.catalogueSource?[m.catalogueSource]:[])])assert.equal(cached(source.url).source.sha256,source.sha256);
  for(const ref of [...(m.observationSources||[]),...(m.observation?[m.observation]:[])]){const o=observations.find(o=>o.id===ref.id);assert.ok(o);assert.equal(hash(JSON.stringify(o)),ref.sha256)}
  const original=originals.get(m.itemId),r=supplement(original,m,at);assert.ok(r.item,r.skip);
  assert.ok(r.item.evidence.slice(-2).every(e=>e.method.length<=300&&e.value.length<=500));
  changes.push({item:r.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 assert.equal(changes.length,34);
 write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:25,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length,protected:rows.filter(r=>r.groupId===g.groupId&&r.status==='protected').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:50,prepared:34,pending:10,protected:6,protectionMeaning:'6条V6已有简介原样保留；既有3条人工认可资料亦保持不变，不能把两者称作9条人工认可。',groups,priorOverlap:0,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));write(dir+'/protected.json',rows.filter(r=>r.status==='protected'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地公开抓取回执；网页搜索工具观察另计，观察JSON哈希不是原HTML哈希。费用不可用。'});
 console.log(JSON.stringify({prepared:34,pending:10,protected:6,groups:groups.map(g=>({label:g.label,ready:g.ready,pending:g.pending,protected:g.protected}))}));
}

