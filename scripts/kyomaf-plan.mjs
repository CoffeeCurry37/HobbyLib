import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
import {supplement as baseSupplement} from './tenyear-aj-plan.mjs';
const dir='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf';
export function supplement(item,m,at){
 if(!m.retailerBinding)return baseSupplement(item,m,at);
 const result=baseSupplement(item,{...m,sku:undefined},at);if(!result.item)return result;
 const b=m.retailerBinding;
 assert.equal(b.itemId,m.itemId);assert.equal(b.targetTitle,m.title);assert.equal(b.officialUrl,m.source.url);assert.equal(b.variantId,m.variantId);assert.equal(b.officialTitle,m.officialTitle);
 if(item.image!==b.reviewedImage)return {skip:'reviewed-image-changed'};
 if(!item.offers.length||!item.offers.every(o=>o.url===b.retailerUrl))return {skip:'reviewed-retailer-binding-changed'};
 const appended=result.item.evidence.slice(-2);
 appended[0].value=m.sku+' / '+m.variantId+' / '+m.officialTitle+'；SHA-256 '+m.source.sha256;
 appended[0].method=m.scope+'；年度目录 '+m.catalogueSource.url;
 appended[1].method=b.method+' 挂牌 '+b.retailerUrl+'；完整图像校验记录见 GitHub kyomaf/visual-bindings.json。';
 assert.ok(appended[1].method.length<=300,'Visual comparison method exceeds API limit');
 return {item:{...result.item,evidence:[...item.evidence,...appended]}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/kyomaf-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already started; do not recreate applied plan');
 const old=read('work/v6/production-after.json'),originals=new Map(old.items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh','work/series-evidence-20261104/tenyear-aj'];
 const priorIds=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=[2021,2025,2026,2023].flatMap(y=>read(dir+'/cases-'+y+'.json').rows);
 assert.equal(rows.length,106);assert.equal(new Set(rows.map(r=>r.itemId)).size,106);
 const at=new Date().toISOString(),changes=[];
 const bindings=read(dir+'/visual-bindings.json');
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!priorIds.has(m.itemId));assert.equal(cached(m.source.url).source.sha256,m.source.sha256);
  assert.equal(cached(m.catalogueSource.url).source.sha256,m.catalogueSource.sha256);
  if(m.retailerBinding){
   assert.deepEqual(m.retailerBinding,bindings.find(b=>b.itemId===m.itemId));
   for(const i of m.retailerBinding.images)assert.equal(hash(fs.readFileSync('work/series-evidence-20261103/cache/'+hash(i.url)+'.img')),i.sha256);
  }
  const original=originals.get(m.itemId),result=supplement(original,m,at);assert.ok(result.item,result.skip);
  changes.push({item:result.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:rows.filter(r=>r.groupId===g.groupId).length,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:106,prepared:changes.length,pending:rows.filter(r=>r.status==='pending').length,protected:rows.filter(r=>r.status==='protected').length,groups,priorOverlap:0,officialVariantMatches:rows.filter(r=>r.status==='supported'&&!r.retailerBinding).length,visualRetailerMatches:rows.filter(r=>r.retailerBinding).length,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地公开抓取回执；搜索访问另计，无额外模型API调用。费用信息不可用。'});
 console.log(JSON.stringify(read(dir+'/review.json')));
}

