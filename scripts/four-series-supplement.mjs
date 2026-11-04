import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pub,priv,parent,read,write,hash,cached} from './four-series-common.mjs';

export function supplement(item, match, at) {
  if (!item || item.id !== match.itemId) return {skip:'missing-target'};
  if (item.editorial || item.manualFields?.length || item.locked || item.archivedInto || item.origin === 'doujin') return {skip:'protected-target'};
  if (item.summary) return {skip:'existing-summary-preserved'};
  if (item.title !== match.title) return {skip:'target-title-changed'};
  assert.equal(match.status, 'supported');
  assert.ok(match.summary?.length > 0 && match.summary.length <= 500);
  assert.ok(Array.isArray(item.evidence) && item.evidence.length <= 148);
  const official = match.source;
  const secondary = match.secondary;
  if (match.sku) {
    const observations = item.offers.filter(o=>o.url?.startsWith('https://online.aniplex.co.jp/'));
    assert.ok(observations.length && observations.every(o=>o.url === official.url && o.variant === match.variantId));
  }
  const officialFact = match.sku ? match.sku+' / '+match.variantId+' / '+match.officialTitle : (match.award || '系列')+' / '+match.officialTitle;
  const proof = [
    {field:match.sku?'官方商品规格':'官方系列与奖级',value:officialFact+'；SHA-256 '+official.sha256,url:official.url,at:official.at,
     method:match.sku?'官方目录及详情页完整规格，对应本记录的商品号和选项':'官方奖品图鉴，记录系列或奖级范围'},
    {field:'summary',value:match.summary,url:secondary?.url || official.url,at,
     method:secondary?'官方负责奖级和规格；具体成员或组合另据骏河屋目录。成员依据摘要 SHA-256 '+secondary.factSha256:'据该官方商品页补齐空白简介，保留原始资料'}
  ];
  return {item:{...item,summary:match.summary,evidence:[...item.evidence,...proof]}};
}

if (process.argv[1]?.replaceAll('\\','/').endsWith('/four-series-supplement.mjs')) {
  assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already applied or in progress; use saved receipts');
  const snapshot=read('work/v6/production-after.json');
  const originals=new Map(snapshot.items.map(i=>[i.id,i]));
  const priorIds=new Set(['','/historical-events'].flatMap(p=>fs.readFileSync(parent+p+'/apply-receipts.jsonl','utf8')
    .trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
  const rows=[0,1,2,3].flatMap(n=>read(pub+'/items-'+n+'.json').rows);
  assert.equal(rows.length,251);
  assert.equal(new Set(rows.map(r=>r.itemId)).size,251);
  const changes=[], validatedSources=new Map(), at=new Date().toISOString();
  for(const row of rows.filter(r=>r.status==='supported')){
    assert.ok(!priorIds.has(row.itemId));
    if(!validatedSources.has(row.source.url)) validatedSources.set(row.source.url,cached(row.source.url).source.sha256);
    assert.equal(validatedSources.get(row.source.url),row.source.sha256);
    const original=originals.get(row.itemId), result=supplement(original,row,at);
    assert.ok(result.item,'Unexpected skip: '+result.skip);
    changes.push({item:result.item,expectedVersion:hash(JSON.stringify(original)),match:row});
  }
  write(priv+'/proposed-changes.json',changes);
  write(pub+'/review.json',{at,reviewed:rows.length,ready:changes.length,pending:rows.filter(r=>r.status==='pending').length,
    protected:rows.filter(r=>r.status==='protected').length,priorRoundOverlap:0,completeSeries:0,fullProductVerified:0,
    sourcesVerified:validatedSources.size,changedFields:['summary','evidence']});
  console.log(JSON.stringify(read(pub+'/review.json')));
}
