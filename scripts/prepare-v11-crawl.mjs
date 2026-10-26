// Build a bounded incremental import from captured, product-scoped source pages.
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
const root=resolve(process.argv[2]),basePath=join(root,'manifest-before-v011.json');
if(!existsSync(basePath))writeFileSync(basePath,readFileSync('lib/radar/fate-crawl-manifest.json'));
const base=JSON.parse(readFileSync(basePath)),radar=loadRadar(),{parseHtml}=radar.get('collector'),{offerKey}=radar.get('identity'),products=new Map(),sources=[];
const add=p=>{if(!p.title||!p.offer?.url)return;const q=structuredClone(p);q.provisional=false;
 if(/noimage|\/blank\.(?:gif|png)|\/items\/temple?tes\//i.test(q.image))q.image='';
 q.images=(q.images||[]).filter(u=>u&&!/noimage|\/blank\.(?:gif|png)|\/items\/temple?tes\//i.test(u)).slice(0,12);
 if(q.facts?.year&&!/^(19|20)\d{2}$/.test(q.facts.year))delete q.facts.year;
 if(['Mercari','Yahoo 拍卖','Yahoo 购物'].includes(q.offer.source))delete q.provisional;
 products.set(offerKey(q.offer),q);
};
// Refresh older AmiAmi records from their captured category breadcrumbs, including book/CD pages.
let oldAmi=0;for(const file of readdirSync(join(root,'expanded-source')).filter(f=>/^amiami-.*\.json$/.test(f)&&!/^amiami-(?:figures|books|music|typemoon-books)\.json$/.test(f))){
 const path=join(root,'expanded-source',file),data=JSON.parse(readFileSync(path)),html=path.replace(/\.json$/,'.html');if(!data.url||!existsSync(html))continue;
 for(const p of parseHtml(readFileSync(html,'utf8'),data.url).products){const prior=data.products?.find(o=>offerKey(o.offer)===offerKey(p.offer));add({...p,image:p.image||prior?.image||'',facts:{...prior?.facts,...p.facts}});oldAmi++;}
}
console.log(JSON.stringify({phase:'AmiAmi captured categories',pages:oldAmi}));
sources.push({name:'AmiAmi · 已收录书籍、CD、手办分类复核',url:'https://www.amiami.jp/top/search/list?s_keywords=Fate',pages:oldAmi,count:oldAmi,total:oldAmi,status:'completed',next:null,coverage:'重新解析此前保存的商品页实际分类；不把历史售价作为当前库存'});
// Reparse every new detail with the current parser; preserve older event/variant facts.
for(const id of ['aniplex','kuji','suruga-kuji-new','amiami-stock','yahoo-kuji-lots']){
 const folder=join(root,'enrichment-v011'),audit=JSON.parse(readFileSync(join(folder,'audit-'+id+'.json')));let n=0;
 for(const file of readdirSync(folder).filter(f=>new RegExp('^'+id+'-[a-f0-9]{16}\\.json$').test(f)).sort()){
  const data=JSON.parse(readFileSync(join(folder,file)));let html=join(folder,file.replace('.json','.html'));
  if(id==='aniplex'&&!existsSync(html)){const code=new URL(data.url).pathname.slice(1,-5);html=join(root,'expanded-source/aniplex-'+code+'.html');}
  const parsed=id==='yahoo-kuji-lots'&&existsSync(html)?parseHtml(readFileSync(html,'utf8'),data.url).products:data.products;
  for(const p of parsed||[]){const prior=data.products?.find(o=>offerKey(o.offer)===offerKey(p.offer));add({...p,facts:{...prior?.facts,...p.facts}});n++;}
 }
 console.log(JSON.stringify({phase:id,count:n}));
 sources.push({name:({'aniplex':'Aniplex · 已收录全部款式图片复核','kuji':'骏河屋 · 已收录一番赏复核','suruga-kuji-new':'骏河屋 · 新采一番赏详情','amiami-stock':'AmiAmi · 在售商品详情','yahoo-kuji-lots':'Yahoo · 一番赏卖家拼套详情'})[id],url:id==='aniplex'?'https://online.aniplex.co.jp/fateproject':id.startsWith('amiami')?'https://www.amiami.jp/top/search/list?s_keywords=Fate&s_st_list_newitem_available=1':id.startsWith('yahoo')?'https://auctions.yahoo.co.jp/search/search?p=Fate+一番くじ':'https://www.suruga-ya.jp/search?search_word=Fate+一番くじ',pages:audit.completed,count:n,total:audit.targets,status:audit.status||'completed',next:audit.next,failures:audit.failures.length,coverage:'商品独立图、实际来源分类及发行字段；组合成员只采用明确内容证据'});
}
// Research pages were captured separately, and contain verified complete-award sets.
let researched=0;for(const file of readdirSync(join(root,'kuji-research')).filter(f=>/^(?:suruga|extra)-\d+\.html$/.test(f))){const code=file.match(/\d+/)[0],url='https://www.suruga-ya.jp/product/detail/'+code;for(const p of parseHtml(readFileSync(join(root,'kuji-research',file),'utf8'),url).products){add(p);researched++;}}
sources.push({name:'一番赏 · 2014 两期逐赏来源补查',url:'https://www.suruga-ya.jp/search?search_word=一番くじ+Fate+10周年',pages:researched,count:researched,total:researched,status:'completed',next:null,coverage:'实际捕获的商品页；已知款数和包装件数保存在赏级目录，未确认单款不编造'});
for(const id of ['suruga-kuji','yahoo-kuji','suruga-doujin','amiami-stock']){
 const folder=join(root,'crawl-v011'),capture=JSON.parse(readFileSync(join(folder,id+'-checkpoint.json')));let n=0;
 for(const page of capture.pages){const data=JSON.parse(readFileSync(join(folder,page.file)));for(const original of data.products){
  const p=structuredClone(original);if(id==='suruga-doujin'){p.facts={...p.facts,series:'Fate 综合'};const brand=(p.facts.brand||'').normalize('NFKC');if(/^TYPE[ -]?MOON(?: BOOKS)?$/i.test(brand)){p.facts.publisher='TYPE-MOON';p.facts.origin='commercial';}else{p.facts.origin='doujin';p.facts.circle=p.facts.brand||'';const credits=p.title.split(/\s+\/\s+/);if(credits.length>2)p.facts.artists=credits.slice(1,-1).slice(0,15);}}
  // Detail pages win over list cards for the same listing.
  if(!products.has(offerKey(p.offer)))add(p);n++;
 }}
 const prior=base.sources.find(s=>s.name==='骏河屋 · Fate 同人原作');
 sources.push({name:({'suruga-kuji':'骏河屋 · 一番赏分页续采','yahoo-kuji':'Yahoo · 一番赏分页续采','suruga-doujin':'骏河屋 · 同人分页续采','amiami-stock':'AmiAmi · 在售分页'})[id],url:capture.url,pages:capture.pages.length,count:n,total:capture.total,status:capture.status,next:capture.next,failures:capture.failures.length,...(id==='suruga-doujin'?{pendingPartitions:prior?.pendingPartitions||[]}:{}),coverage:capture.next?'本轮有限分页，断点已保存，后续页待继续':'当前入口的分页已经结束'});
 writeFileSync('public/fate-crawl/'+id+'-v11-checkpoint.json',JSON.stringify({...capture,pages:capture.pages.map(p=>({url:p.url,count:p.count}))},null,2));
}
const missingFile=join(root,'enrichment-v011/missing-images-products.json');if(existsSync(missingFile))for(const p of JSON.parse(readFileSync(missingFile)))add(p);
const output='public/fate-crawl/v11';mkdirSync(output,{recursive:true});const values=[...products.values()],files=[...base.files],sizes=base.files.map(f=>JSON.parse(readFileSync('public'+f)).length);let buffer=[],bytes=2,number=0;
const flush=()=>{if(!buffer.length)return;const file=output+'/batch-'+number+++'.json';writeFileSync(file,JSON.stringify(buffer));files.push('/'+file.slice(7));sizes.push(buffer.length);buffer=[];bytes=2;};
for(const p of values){const size=Buffer.byteLength(JSON.stringify(p))+1;if(buffer.length>=500||bytes+size>3000000)flush();buffer.push(p);bytes+=size;}flush();
const offsets=[];let count=0;for(const n of sizes){offsets.push(count);count+=n;}
const manifest={...base,id:'fate-v011-'+createHash('sha256').update(base.id+JSON.stringify(values)).digest('hex').slice(0,16),previousSnapshot:{id:base.id,batches:base.files.length},count,files,offsets,capturedAt:new Date().toISOString(),observations:base.observations+values.length,sources:[...base.sources,...sources],coverage:{...base.coverage,complete:false,remaining:'骏河屋一番赏第 13 页、同人 2019–2021 分段第 204 页及更早年份；Yahoo 第 251 条起；AmiAmi 非在售历史手办页；原站未公开的单款图片与发行信息'}};
writeFileSync('lib/radar/fate-crawl-manifest.json',JSON.stringify(manifest,null,2));writeFileSync('public/fate-crawl/manifest.json',JSON.stringify(manifest,null,2));writeFileSync(output+'/audit.json',JSON.stringify({newObservations:values.length,sources},null,2));
console.log(JSON.stringify({id:manifest.id,newObservations:values.length,totalBatches:files.length,newBatches:number,observations:manifest.observations}));radar.close();
