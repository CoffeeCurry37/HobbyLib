import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached,parent} from './four-series-common.mjs';
const dir='research/series-evidence-20261104',priv='work/series-evidence-20261104';
export function supplement(item,m,at){
 if(!item||item.id!==m.itemId)return {skip:'missing-target'};
 if(item.editorial||item.manualFields?.length||item.locked||item.archivedInto||item.origin==='doujin')return {skip:'protected-target'};
 if(item.summary)return {skip:'existing-summary-preserved'};
 if(item.title!==m.title)return {skip:'target-title-changed'};
 assert.equal(m.status,'supported');assert.ok(m.summary&&m.summary.length<=500);
 assert.ok(Array.isArray(item.evidence)&&item.evidence.length<=148);
 if(m.sku){
  const obs=item.offers.filter(o=>o.url?.startsWith('https://online.aniplex.co.jp/'));
  assert.ok(obs.length&&obs.every(o=>o.url===m.source.url&&o.variant===m.variantId));
 }
 const proof=m.sku?m.sku+' / '+m.variantId+' / '+m.officialTitle:(m.award?m.award+' / ':'')+m.officialTitle;
 const second=m.second||m.source.url;
 const facts=[{field:'官方来源',value:proof+'；SHA-256 '+m.source.sha256,url:m.source.url,at:m.source.at,method:m.scope},
  {field:'summary',value:m.summary,url:second,at,method:m.notes||('来源范围：'+m.scope)}];
 return {item:{...item,summary:m.summary,evidence:[...item.evidence,...facts]}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/nov4-plan.mjs')){
 assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already started; resume using verified batches');
 const old=read('work/v6/production-after.json'),originals=new Map(old.items.map(i=>[i.id,i]));
 const priorIds=new Set(['','/historical-events','/four-series'].flatMap(p=>fs.readFileSync(parent+p+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
 const review=read(dir+'/prize-recheck.json').rows,newCases=read(dir+'/new-cases.json'),rows=[...review,...newCases];
 assert.equal(new Set(rows.map(r=>r.itemId)).size,rows.length);
 const changes=[],seen=new Set(),at=new Date().toISOString();
 for(const m of rows.filter(r=>r.status==='supported')){
  assert.ok(!priorIds.has(m.itemId));
  if(!seen.has(m.source.url)){assert.equal(cached(m.source.url).source.sha256,m.source.sha256);seen.add(m.source.url)}
  const original=originals.get(m.itemId),result=supplement(original,m,at);assert.ok(result.item,result.skip);
  changes.push({item:result.item,expectedVersion:hash(JSON.stringify(original)),match:m});
 }
 write(priv+'/proposed-changes.json',changes);
 write(dir+'/review.json',{at,previousRevisited:review.length,newGroups:new Set(newCases.map(i=>i.groupId)).size,newCandidates:newCases.length,
  recheckReady:review.filter(i=>i.status==='supported').length,newReady:newCases.filter(i=>i.status==='supported').length,
  prepared:changes.length,pending:rows.filter(i=>i.status==='pending').length,protected:rows.filter(i=>i.status==='protected').length,
  productionApplied:0,stage:'frozen-before-production',priorOverlap:0});
 const logs=fs.readdirSync(priv).filter(n=>n.endsWith('.receipts.jsonl')).flatMap(n=>fs.readFileSync(priv+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(l=>({...JSON.parse(l),collection:n})));
 write(dir+'/capture-summary.json',{captureReceipts:logs.length,uniqueUrls:new Set(logs.map(r=>r.url)).size,
  statuses:Object.fromEntries([...Map.groupBy(logs,r=>r.status)].map(([s,arr])=>[s,arr.length])),
  freshRequests:logs.filter(r=>!r.cacheHit).reduce((n,r)=>n+r.requestCount,0),cacheHits:logs.filter(r=>r.cacheHit).length,paidModelApiCalls:0,
  cost:'not available',scope:'Local capture receipts only. Search index access and local reviews excluded.'});
 console.log(JSON.stringify(read(dir+'/review.json')));
}
