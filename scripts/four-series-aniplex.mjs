import assert from 'node:assert/strict';
import {pub,priv,read,write,sources,targetRows,cached,clean} from './four-series-common.mjs';
const n=Number(process.argv[2]);
assert.ok(n===0||n===1);
const group=sources[n];
const catalogue=read(pub+'/catalogue-'+n+'.json');
const entries=new Map(catalogue.entries.map(e=>[e.url,e]));
const norm=s=>clean(s).normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const specs = [
 ['綿100%','面料为纯棉'],['高さ約40cm','包身高约 40 厘米'],['約440×212mm','水枪约 440 × 212 毫米'],
 ['58cm','帽围可调，标示尺寸为 58 厘米'],['高さ約70cm','玩偶高约 70 厘米'],['約12×17cm','贴纸规格约 12 × 17 厘米，材质为 PET'],
 ['約160×65mm','眼镜盒约 160 × 65 毫米'],['傘下直径 約105cm','撑开后伞下直径约 105 厘米'],
 ['ブローチ本体…亜鉛合金','胸针主体为锌合金'],['台座サイズ：約W60×H50mm','底座约宽 60、高 50 毫米'],
 ['アクリル・亜鉛合金','挂件由亚克力和锌合金制成'],['高さ約12cm','毛绒挂件高约 12 厘米'],
 ['約707×543mm','挂画约 707 × 543 毫米'],['約220×310mm','文件夹约 220 × 310 毫米'],
 ['約60×32cm','鼠标垫约 60 × 32 厘米'],['W140×H200mm','内装色纸每张宽 140、高 200 毫米'],
 ['75mm','内装徽章的规格为 75 毫米'],['約60×95mm','内装透明卡每张约 60 × 95 毫米'],
 ['約35×40cm','靠垫约 35 × 40 厘米'],['56mm','内装徽章的规格为 56 毫米'],['綿100%','面料为纯棉'],['綿100%','面料为纯棉'],
 ['全高約13cm','毛绒挂件全高约 13 厘米'],['全高約13cm','磁吸毛绒挂件全高约 13 厘米']
];
const pageMap=new Map();
for(const {url} of read(priv+'/details-'+n+'.json')){
 const {body,source}=cached(url),sku=new URL(url).pathname.slice(1,-5);
 const product=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{
  try{const x=JSON.parse(m[1]);return Array.isArray(x)?x:x['@graph']||[x]}catch{return []}
 }).find(p=>p['@type']==='Product');
 assert.equal(product?.sku,sku);
 const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2])}));
 assert.equal(new Set(variants.map(v=>v.id)).size,variants.length);
 let fact;
 if(n===0){
  assert.match(sku,/^itemNYYwmMZm\d\d$/);
  const [literal,description]=specs[Number(sku.slice(-2))-1];
  const block=(body.match(/<span>商品(?:内容|概要)<\/span>([\s\S]*?)※/)||[])[1];
  const text=clean(block?.replace(/<[^>]+>/g,' '));
  assert.ok(norm(text).includes(norm(literal))&&norm(text).includes(norm('発売元：Aniplex（Shanghai）Ltd.')));
  fact=description+'。官方标注发行方为 Aniplex（上海）。';
 }else{
  const productFacts=read(pub+'/aj-facts.json')[sku];
  assert.ok(productFacts);
  const anchor=norm(body.replace(/<[^>]+>/g,' '));
  for(const fragment of productFacts.anchors)assert.ok(anchor.includes(norm(fragment)),sku+': '+fragment);
  fact=productFacts.fact;
 }
 pageMap.set(url,{sku,title:clean(product.name),variants,fact,source,catalogue:catalogue.source.url});
}
const rows=[];
for(const i of targetRows().filter(i=>i.groupId===group.groupId)){
 const base={itemId:i.id,groupId:i.groupId,title:i.title};
 if(i.editorial||i.manualFields?.length||i.locked||i.summary){rows.push({...base,status:'protected'});continue}
 const observations=i.officialObservations||[],urls=[...new Set(observations.map(o=>o.url))],page=urls.length===1?pageMap.get(urls[0]):null;
 const stripped=n===0?i.title.replace(/^Fate\/Grand Order 简体字版10周年\s+/,''):i.title;
 const candidates=page?.variants.filter(v=>norm(v.label)===norm(stripped)&&observations.every(o=>
   o.variant===v.id && (!o.listingTitle||norm(o.listingTitle)===norm(v.label))))||[];
 if(candidates.length!==1){rows.push({...base,status:'pending',reason:page?'variant-label-or-key-not-unique':'outside-confirmed-event-catalogue',sourceUrls:urls});continue}
 const variant=candidates[0],display=variant.label.replace(/\s*\/\s*Fate\/Grand Order 簡体字版10周年グッズ\s*$/,'');
 const scope=/コンプリートBOX/i.test(display)?'此规格为完整盒装。':/単品・ランダム封入/.test(display)?'此规格为随机单包。':'';
 const summary='《'+group.label+'》的「'+display+'」。'+scope+page.fact;
 rows.push({...base,status:'supported',officialTitle:variant.label,sku:page.sku,variantId:variant.id,source:page.source,
  proof:'official-catalogue-url-full-variant-label-and-observed-variant-key',summary});
}
assert.equal(rows.length,group.snapshotItems);
write(pub+'/items-'+n+'.json',{series:group.label,reviewed:rows.length,sourcePages:[...pageMap.values()],rows});
console.log(JSON.stringify({series:group.label,reviewed:rows.length,statuses:Object.fromEntries([...Map.groupBy(rows,r=>r.status)].map(([k,v])=>[k,v.length])),gaps:rows.filter(r=>r.status==='pending').map(r=>r.title).slice(0,4)}));
