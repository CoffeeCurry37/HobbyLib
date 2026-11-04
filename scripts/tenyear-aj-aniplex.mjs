import assert from 'node:assert/strict';
import {read,write,cached,clean,targetRows} from './four-series-common.mjs';
const out='research/series-evidence-20261104/tenyear-aj';
const norm=s=>clean(s).normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const plain=s=>clean(s.replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' '));
const plans={
2021:['https://online.aniplex.co.jp/LDIFdrMc','https://online.aniplex.co.jp/animejapan2021','https://online.aniplex.co.jp/on/demandware.store/Sites-ANX-Site/ja_JP/Search-UpdateGrid?cgid=animejapan2021&start=12&sz=12'],
2019:['https://online.aniplex.co.jp/myxVrEyi']
};
const facts=read(out+'/aj-facts.json'),all=targetRows(),catalogues=[];
for(const g of read(out+'/order.json').slice(2)){
 const year=Number(g.label.slice(-4)),pages=new Map();
 for(const u of plans[year]){
  const {body,source}=cached(u),tiles=[...body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)];
  const entries=tiles.map(([tile])=>new URL(clean(tile.match(/href="([^"]+\.html)"/)[1]),u).href);
  catalogues.push({year,source,displayedTotal:Number(body.match(/(\d+)\s*件の結果/)?.[1])||null,entries});
 }
 if(year===2021){
  const general=catalogues.filter(c=>c.source.url.includes('animejapan2021'));
  assert.equal(new Set(general.flatMap(c=>c.entries)).size,19);
  assert.equal(catalogues.find(c=>c.source.url.endsWith('/LDIFdrMc')).entries.length,7);
 }else assert.equal(catalogues.find(c=>c.year===2019).entries.length,9);
 const rows=[];
 for(const t of all.filter(t=>t.groupId===g.groupId)){
  const base={groupId:t.groupId,itemId:t.id,title:t.title};
  if(t.editorial||t.manualFields?.length||t.locked||t.summary){rows.push({...base,status:'protected'});continue}
  const obs=t.officialObservations,urls=[...new Set(obs.map(o=>o.url))],u=urls[0],c=catalogues.find(c=>c.year===year&&c.entries.includes(u));
  if(urls.length!==1||!c){rows.push({...base,status:'pending',reason:'no-exact-official-event-catalogue-entry',urls});continue}
  if(!pages.has(u)){
   const {body,source}=cached(u),sku=new URL(u).pathname.slice(1,-5);
   const product=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{try{const p=JSON.parse(m[1]);return Array.isArray(p)?p:p['@graph']||[p]}catch{return []}}).find(p=>p['@type']==='Product');
   assert.equal(product?.sku,sku);
   const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2].replace(/&Lambda;/g,'Λ'))}));
   const spec=plain((body.split(/<span>商品(?:内容|概要|仕様)<\/span>/)[1]||'').split(/<!-- ご注意 -->|<\/section>/)[0]);
   assert.ok(facts[sku]);for(const anchor of facts[sku].anchors)assert.ok(norm(spec).includes(norm(anchor)),sku+': '+anchor);
   pages.set(u,{sku,source,variants,spec});
  }
  const p=pages.get(u),vs=p.variants.filter(v=>norm(v.label)===norm(t.title)&&obs.every(o=>o.variant===v.id&&norm(o.listingTitle)===norm(v.label)));
  if(vs.length!==1){rows.push({...base,status:'pending',reason:'variant-id-or-full-title-mismatch',url:u});continue}
  const v=vs[0],f=facts[p.sku];let fact=f.fact;
  if(f.characterDimensions){
   const name=v.label.match(/（(.+)）/)[1],line=p.spec.split('\n').map(s=>s.trim()).find(s=>s.startsWith(name+'：'));
   const size=line?.match(/W(\d+)mm×H(\d+)mm/);assert.ok(size,name);fact+='本款宽 '+size[1]+'、高 '+size[2]+' 毫米。';
  }
  rows.push({...base,status:'supported',scope:'官方年度目录、商品号及完整规格',sourceRole:'official-product',sku:p.sku,variantId:v.id,officialTitle:v.label,source:p.source,second:u,
    catalogueSource:c.source,contextSource:g.source,notes:f.notes||null,summary:'AnimeJapan '+year+' 的「'+v.label+'」。'+fact});
 }
 assert.equal(rows.length,g.candidates);write(out+'/aj-'+year+'.json',{year,candidates:rows.length,rows});
 console.log(JSON.stringify({year,ready:rows.filter(r=>r.status==='supported').length,held:rows.filter(r=>r.status!=='supported')}));
}
write(out+'/catalogues.json',catalogues);

