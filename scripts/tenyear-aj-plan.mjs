import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
import {supplement as baseSupplement} from './nov4-plan.mjs';
const dir='research/series-evidence-20261104/tenyear-aj',priv='work/series-evidence-20261104/tenyear-aj';
export function supplement(item,m,at){
 const result=baseSupplement(item,m,at);if(!result.item)return result;
 const appended=result.item.evidence.slice(-2);
 appended[0].field=m.sourceRole==='official-product'?'官方商品规格':m.sourceRole==='official-context-with-contemporary-report'?'官方系列公告':'奖品资料来源';
 if(m.source.kind)appended[0].value=appended[0].value.replace('SHA-256','观察记录 SHA-256');
 appended[0].method=m.scope+'；来源类型：'+m.sourceRole+(m.knownAt?'；零售编号留存于 '+m.knownAt:'')+(m.catalogueSource?'；年度目录 '+m.catalogueSource.url:'');
 appended[1].method=(m.notes||'已对照完整款名与商品或奖级范围')+(m.additionalSources?.length?'；补充来源 '+m.additionalSources.join(' '):'');
 return {...result,item:{...result.item,evidence:[...item.evidence,...appended]}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/tenyear-aj-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already started; do not recreate applied plan');
 const s=read('work/v6/production-after.json'),byId=new Map(s.items.map(i=>[i.id,i]));
 const priorDirs=['work/series-evidence-20261103','work/series-evidence-20261103/historical-events','work/series-evidence-20261103/four-series','work/series-evidence-20261104','work/series-evidence-20261104/books','work/series-evidence-20261104/books/refresh'];
 const priorIds=new Set(priorDirs.flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const rows=['kuji-2','kuji-1','aj-2021','aj-2019'].flatMap(s=>read(dir+'/'+s+'.json').rows);
 assert.equal(rows.length,135);assert.equal(new Set(rows.map(r=>r.itemId)).size,135);
 const changes=[],at=new Date().toISOString();
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!priorIds.has(m.itemId));
  if(m.source.kind){const obs=read(dir+'/web-observations.json').find(o=>o.id===m.source.observationId);assert.equal(hash(JSON.stringify(obs)),m.source.sha256)}
  else assert.equal(cached(m.source.url).source.sha256,m.source.sha256);
  const original=byId.get(m.itemId),result=supplement(original,m,at);assert.ok(result.item,result.skip);
  changes.push({item:result.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 write(priv+'/proposed-changes.json',changes);
 const groups=read(dir+'/order.json').map(g=>({...g,reviewed:rows.filter(r=>r.groupId===g.groupId).length,ready:rows.filter(r=>r.groupId===g.groupId&&r.status==='supported').length,pending:rows.filter(r=>r.groupId===g.groupId&&r.status==='pending').length}));
 write(dir+'/review.json',{at,stage:'prepared-no-production-write',candidates:135,prepared:changes.length,pending:rows.filter(r=>r.status==='pending').length,protected:rows.filter(r=>r.status==='protected').length,groups,priorOverlap:0,fullProductVerified:0,fullSeriesVerified:0,productionApplied:0});
 write(dir+'/pending.json',rows.filter(r=>r.status==='pending'));
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([k,v])=>[k,v.length])),requests:logs.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,scope:'本地抓取回执，搜索索引访问另记；无API费用信息。'});
 console.log(JSON.stringify(read(dir+'/review.json')));
}

