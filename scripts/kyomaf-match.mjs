import assert from 'node:assert/strict';
import {read,write,cached,clean} from './four-series-common.mjs';
const dir='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf',year=Number(process.argv[2]);
const g=read(dir+'/order.json').find(x=>Number(x.label.slice(-4))===year),rows=read(priv+'/'+year+'-targets.json'),catalogue=read(dir+'/catalogue-'+year+'.json'),facts=read(dir+'/facts-'+year+'.json');
const norm=s=>clean(s).replace(/&Lambda;/g,'Λ').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const plain=s=>clean(s.replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' '));
const pages=new Map(),results=[];
for(const t of rows){
 const base={itemId:t.id,groupId:t.groupId,title:t.title};
 if(t.editorial||t.manualFields?.length||t.locked||t.summary){results.push({...base,status:'protected'});continue}
 const obs=t.officialObservations||[],urls=[...new Set(obs.map(o=>o.url))],url=urls[0];
 if(urls.length!==1||!catalogue.entries.includes(url)){results.push({...base,status:'pending',reason:'no-single-official-catalogue-item',urls:t.sourceUrls});continue}
 if(!pages.has(url)){
  const {body,source}=cached(url),sku=new URL(url).pathname.slice(1,-5);
  const product=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{try{const p=JSON.parse(m[1]);return Array.isArray(p)?p:p['@graph']||[p]}catch{return []}}).find(p=>p['@type']==='Product');
  assert.equal(product?.sku,sku);
  const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2].replace(/&Lambda;/g,'Λ'))}));
  assert.equal(new Set(variants.map(v=>v.id)).size,variants.length);
  const sections=[...body.matchAll(/<h2 class="footer-item__title">[\s\S]*?<div class="itemDetail">([\s\S]*?)<\/div>/g)].map(m=>plain(m[0])).filter(s=>/^商品/.test(s.trim())).join('\n');
  assert.ok(facts[sku],sku);
  for(const anchor of facts[sku].anchors)assert.ok(norm(sections).includes(norm(anchor)),sku+': '+anchor);
  pages.set(url,{sku,title:clean(product.name),source,variants,sections});
 }
 const p=pages.get(url),vs=p.variants.filter(v=>norm(v.label)===norm(t.title)&&obs.every(o=>o.variant===v.id&&norm(o.listingTitle)===norm(v.label)));
 if(vs.length!==1){results.push({...base,status:'pending',reason:'variant-id-or-full-title-mismatch',url});continue}
 const v=vs[0],f=facts[p.sku],catalogueSource=catalogue.pages.find(p=>p.entries.some(e=>e.url===url)).source;
 const years=[...v.label.matchAll(/京まふ\s*(20\d{2})/g)].map(m=>+m[1]);
 if(years.some(y=>y!==year)){results.push({...base,status:'pending',reason:'official-variant-year-differs',url,officialTitle:v.label});continue}
 results.push({...base,status:'supported',scope:'官方年度目录、商品号及完整规格',sourceRole:'official-product',sku:p.sku,variantId:v.id,officialTitle:v.label,source:p.source,second:url,catalogueSource,contextSource:g.source,notes:f.notes||null,summary:'京まふ '+year+' 的「'+v.label+'」。'+f.fact+(f.variantFacts?.[v.id]||'')});
}
assert.equal(results.length,g.candidates);
write(dir+'/cases-'+year+'.json',{year,candidates:results.length,rows:results});
write(dir+'/products-'+year+'.json',[...pages].map(([url,p])=>({url,sku:p.sku,title:p.title,source:p.source,variants:p.variants})));
console.log(JSON.stringify({year,ready:results.filter(r=>r.status==='supported').length,pending:results.filter(r=>r.status==='pending'),protected:results.filter(r=>r.status==='protected').length}));

