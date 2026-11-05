import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,hash} from './four-series-common.mjs';
const round=process.argv.includes('--aj26-ky22')?'aj26-ky22':'kyomaf-aj';
const dir='research/series-evidence-20261105/'+round,priv='work/series-evidence-20261105/'+round;
const command=process.argv[2],year=Number(process.argv[3]),g=read(dir+'/order.json').find(x=>x.year===year);
assert.ok(g);
const plain=s=>clean(s.replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' '));
const norm=s=>clean(s).replace(/&Lambda;/g,'Λ').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const productPage=url=>{
 const {body,source}=cached(url),sku=new URL(url).pathname.slice(1,-5);
 const product=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{try{const p=JSON.parse(m[1]);return Array.isArray(p)?p:p['@graph']||[p]}catch{return []}}).find(p=>p['@type']==='Product');
 assert.equal(product?.sku,sku);
 const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2].replace(/&Lambda;/g,'Λ'))}));
 assert.equal(new Set(variants.map(v=>v.id)).size,variants.length);
 const sections=[...body.matchAll(/<h2 class="footer-item__title">[\s\S]*?<div class="itemDetail">([\s\S]*?)<\/div>/g)].map(m=>plain(m[0])).filter(s=>/^商品/.test(s.trim())).join('\n');
 return {url,sku,title:clean(product.name),source,variants,sections};
};
if(command==='catalogue'){
 const {body,source}=cached(g.source);
 if(body.includes('<article id="product_tile"')){
  const queue=[g.source],seen=new Set(),pages=[],missing=[];let total;
  for(let i=0;i<queue.length;i++){
   const u=queue[i];if(seen.has(u))continue;seen.add(u);
   if(!fs.existsSync('work/series-evidence-20261103/cache/'+hash(u)+'.json')){missing.push({url:u,groupId:g.groupId});continue}
   const {body,source}=cached(u);const n=Number(body.match(/(\d+)\s*件の結果/)?.[1]);if(n)total??=n;
   const entries=[...body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)].map(([tile])=>({url:new URL(clean(tile.match(/href="([^"]+\.html)"/)[1]),u).href}));
   const next=[...body.matchAll(/(?:href|data-url)="([^"]+)"/g)].map(m=>clean(m[1])).filter(s=>s.includes('Search-UpdateGrid?')&&s.includes('cgid='+new URL(g.source).pathname.slice(1))&&s.includes('start='));
   pages.push({source,entries});queue.push(...next.map(n=>new URL(n,u).href));assert.ok(queue.length<20);
  }
  write(priv+'/'+year+'-pagination.json',missing);
  if(!missing.length){const entries=[...new Set(pages.flatMap(p=>p.entries.map(e=>e.url)))];assert.equal(entries.length,total);write(dir+'/catalogue-'+year+'.json',{year,groupId:g.groupId,mode:'all-grid-pages',total,pages,entries});}
  console.log(JSON.stringify({year,pages:pages.length,total,entries:pages.reduce((n,p)=>n+p.entries.length,0),missing}));
 }else{
 const sections=[...body.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(m=>m[0]).filter(s=>/<h3>[^]*?alt="Fate\/?\s*Grand\s*Order"[^]*?<\/h3>/.test(s));
 assert.equal(sections.length,1,'Expected one FGO landing-page section');
 const section=sections[0];
 const entries=[...new Set([...section.matchAll(/href="([^"]+\.html)"/g)].map(m=>new URL(clean(m[1]),g.source).href))];
 assert.ok(entries.length);assert.ok(!/Search-UpdateGrid|start=/.test(section),'Unexpected pagination');
 const existing=read(priv+'/'+year+'-targets.json').flatMap(t=>t.officialObservations.map(o=>o.url));
 for(const u of existing)assert.ok(entries.includes(u),'Target absent from FGO section '+u);
 write(dir+'/catalogue-'+year+'.json',{year,groupId:g.groupId,mode:'complete-static-FGO-section',total:entries.length,pages:[{source,entries:entries.map(url=>({url}))}],entries,pagination:'单页活动专题中的完整 FGO 商品区块；无分页。并非全活动或完整发行史。'});
 console.log(JSON.stringify({year,entries}));
 }
}else if(command==='inspect'){
 for(const {url} of read(priv+'/'+year+'-capture.json').filter(r=>r.url.endsWith('.html')))console.log(JSON.stringify(productPage(url)));
}else if(command==='match'){
 const rows=read(priv+'/'+year+'-targets.json'),catalogue=read(dir+'/catalogue-'+year+'.json'),facts=read(dir+'/facts-'+year+'.json'),pages=new Map(),results=[];
 for(const t of rows){
  const base={itemId:t.id,groupId:t.groupId,title:t.title};
  if(t.editorial||t.manualFields?.length||t.locked||t.summary){results.push({...base,status:'protected'});continue}
  const obs=t.officialObservations||[],urls=[...new Set(obs.map(o=>o.url))],url=urls[0];
  if(urls.length!==1||!catalogue.entries.includes(url)){results.push({...base,status:'pending',reason:'no-single-official-catalogue-item',urls:t.sourceUrls});continue}
  if(!pages.has(url)){
   const p=productPage(url);assert.ok(facts[p.sku],p.sku);
   for(const anchor of facts[p.sku].anchors)assert.ok(norm(p.sections).includes(norm(anchor)),p.sku+': '+anchor);
   pages.set(url,p);
  }
  const p=pages.get(url),vs=p.variants.filter(v=>norm(v.label)===norm(t.title)&&obs.every(o=>o.variant===v.id&&norm(o.listingTitle)===norm(v.label)));
  if(vs.length!==1){results.push({...base,status:'pending',reason:'variant-id-or-full-title-mismatch',url});continue}
  const v=vs[0],f=facts[p.sku],years=[...v.label.matchAll(/(?:京まふ|AnimeJapan|AJ)\s*(20\d{2})/g)].map(m=>+m[1]);
  if(g.expectedWork&&!norm(v.label).endsWith(norm('/'+g.expectedWork))){results.push({...base,status:'pending',reason:'official-work-differs',url,officialTitle:v.label});continue}
  if(years.some(y=>y!==year)){results.push({...base,status:'pending',reason:'official-variant-year-differs',url,officialTitle:v.label});continue}
  const catalogueSource=catalogue.pages.find(p=>p.entries.some(e=>e.url===url)).source;
  results.push({...base,status:'supported',scope:'官方活动目录、商品号及完整规格',sourceRole:'official-product',sku:p.sku,variantId:v.id,officialTitle:v.label,source:p.source,second:url,catalogueSource,contextSource:g.source,notes:f.notes||null,summary:g.label+' 的「'+v.label+'」。'+f.fact+(f.variantFacts?.[v.id]||'')});
 }
 assert.equal(results.length,g.candidates);
 write(dir+'/cases-'+year+'.json',{year,candidates:results.length,rows:results});
 write(dir+'/products-'+year+'.json',[...pages.values()].map(({sections,...p})=>p));
 console.log(JSON.stringify({year,ready:results.filter(r=>r.status==='supported').length,pending:results.filter(r=>r.status==='pending'),protected:results.filter(r=>r.status==='protected').length}));
}else throw Error('Use catalogue, inspect or match');

