import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
export {supplement} from './tenyear-aj-plan.mjs';
import {supplement} from './tenyear-aj-plan.mjs';
const secondRound=process.argv.includes('--aj26-ky22'),round=secondRound?'aj26-ky22':'kyomaf-aj';
const dir='research/series-evidence-20261105/'+round,priv='work/series-evidence-20261105/'+round;
if(process.argv[1]?.replaceAll('\\','/').endsWith('/nov5-events-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already started; do not recreate applied plan');
 const old=read('work/v6/production-after.json'),originals=new Map(old.items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh','work/series-evidence-20261104/tenyear-aj','work/series-evidence-20261104/kyomaf'];
 if(secondRound)priorDirs.push('work/series-evidence-20261105/kyomaf-aj');
 const priorIds=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=(secondRound?[2026,2022]:[2024,2022]).flatMap(y=>read(dir+'/cases-'+y+'.json').rows),count=secondRound?29:46;
 assert.equal(rows.length,count);assert.equal(new Set(rows.map(r=>r.itemId)).size,count);
 const at=new Date().toISOString(),changes=[];
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!priorIds.has(m.itemId));assert.equal(cached(m.source.url).source.sha256,m.source.sha256);
  assert.equal(cached(m.catalogueSource.url).source.sha256,m.catalogueSource.sha256);
  const original=originals.get(m.itemId),result=supplement(original,m,at);assert.ok(result.item,result.skip);
  changes.push({item:result.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:rows.filter(r=>r.groupId===g.groupId).length,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length,protected:rows.filter(r=>r.groupId===g.groupId&&r.status==='protected').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:count,prepared:changes.length,pending:rows.filter(r=>r.status==='pending').length,protected:rows.filter(r=>r.status==='protected').length,groups,priorOverlap:0,officialVariantMatches:changes.length,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地公开抓取回执；浏览搜索访问另计，无额外模型API调用。费用信息不可用。'});
 console.log(JSON.stringify(read(dir+'/review.json')));
}

