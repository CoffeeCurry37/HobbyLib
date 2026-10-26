// Build an incremental snapshot from captured public pages, with current parsing rules.
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
const root=resolve(process.argv[2]),basePath=join(root,'manifest-before-v012.json');
if(!existsSync(basePath))writeFileSync(basePath,readFileSync('lib/radar/fate-crawl-manifest.json'));
const base=JSON.parse(readFileSync(basePath)),radar=loadRadar(),{parseHtml}=radar.get('collector'),{offerKey}=radar.get('identity'),{fateRelated}=radar.get('recognition'),products=new Map(),sources=[],excluded=[];
const unrelated=/DIABOLIK LOVERS|マジックザギャザリング|FIRE EMBLEM|ファイナルファンタジー|MARVEL VS|Wanderer|Mazes of Fate|Fates Warning|Paradox Live|リリカルなのは/i;
function relevant(p){const title=p.title.normalize('NFKC');if(unrelated.test(title))return false;return fateRelated(title)||fateRelated(p.facts?.series||'')||/月姫|月姬|MELTY BLOOD|空の境界|魔法使いの夜|TYPE[ -]?MOON|衛宮さんち|氷室の天地|エルメロイ|コハエース|ちびちゅき|ファイヤーガール|月の珊瑚/i.test(title+' '+(p.facts?.series||''))||fateRelated(p.description||'');}
function add(original,publisher=false){
 if(!original.title||!original.offer?.url)return;
 if(!publisher&&!relevant(original)){excluded.push({title:original.title,url:original.offer.url,reason:'关键词命中，未能确认是 Fate / TYPE-MOON 商品'});return;}
 const p=structuredClone(original),key=offerKey(p.offer),prior=products.get(key);
 const placeholder=u=>/noimage|\/blank\.(?:gif|png)|\/items\/temple?tes\//i.test(u||'');
 if(placeholder(p.image))p.image='';p.images=[...new Set([p.image,...(p.images||[])].filter(u=>u&&!placeholder(u)))].slice(0,12);
 if(p.facts?.year&&!/^(19|20)\d{2}$/.test(p.facts.year))delete p.facts.year;
 if(prior){p.image=p.image||prior.image;p.images=p.images.length?p.images:prior.images;p.categoryLabel=p.categoryLabel||prior.categoryLabel;p.facts={...prior.facts,...p.facts};}
 if(['Mercari','Yahoo 拍卖','Yahoo 购物'].includes(p.offer.source))delete p.provisional;
 else if(p.offer.source==='Mandarake'&&!p.categoryLabel)p.provisional=true;
 else p.provisional=false;
 products.set(key,p);
}
const labels={'suruga-main':'骏河屋 · Fate 在售续采','suruga-games':'骏河屋 · 综合补充','suruga-game-soft':'骏河屋 · 主机游戏软件与硬件','suruga-portable':'骏河屋 · 掌机游戏软件与硬件','suruga-pc':'骏河屋 · 影像碟片补充','suruga-doujin':'骏河屋 · 同人续采','amiami-figures':'AmiAmi · 历史手办与玩具续采','amiami-used':'AmiAmi · 二手入口','yahoo-fate':'Yahoo · Fate 在售与拍卖','mercari-fate':'Mercari · Fate 挂牌','mandarake-fate':'Mandarake · 最新 Fate 公开列表','melon-fate':'Melonbooks · 漫画小说新品检索','aniplex-current':'Aniplex · 当前 Fate 商品目录'};
for(const [id,name] of Object.entries(labels)){
 const folder=join(root,'crawl-v012'),file=join(folder,id+'-checkpoint.json');if(!existsSync(file))continue;const capture=JSON.parse(readFileSync(file));let count=0;
 for(const page of capture.pages){const data=JSON.parse(readFileSync(join(folder,page.file))),html=join(folder,page.file.replace('.json','.html')),parsed=existsSync(html)?parseHtml(readFileSync(html,'utf8'),data.url||page.url).products:data.products;
  for(const p of parsed){const old=data.products?.find(q=>offerKey(q.offer)===offerKey(p.offer));add({...p,facts:{...old?.facts,...p.facts},offer:{...p.offer,observedAt:old?.offer.observedAt||p.offer.observedAt}});count++;}
 }
 sources.push({name,url:capture.url,pages:capture.pages.length,count,total:capture.total,status:capture.status,next:capture.next,failures:capture.failures?.length||0,coverage:capture.next?'本轮有限分页；已保存原站实际下一页':'仅表示本次入口结果；详情或失败记录另列'});
 mkdirSync('public/fate-crawl/v12',{recursive:true});writeFileSync('public/fate-crawl/v12/'+id+'-checkpoint.json',JSON.stringify({...capture,pages:capture.pages.map(p=>({url:p.url,count:p.count}))},null,2));
}
const detailLabels={'verified-games':'骏河屋 · 游戏平台、JAN 与发售详情复核','legacy-games':'骏河屋 · 既有游戏原始发售复核','amiami-history':'AmiAmi · 历史及二手详情','mercari':'Mercari · 商品实际分类与图片','mandarake':'Mandarake · 详情验证断点','aniplex-current':'Aniplex · 当前商品详情','yahoo-kuji':'Yahoo · 一番赏实拍与拼套详情','suruga-games':'骏河屋 · 综合商品详情'};
for(const [id,name] of Object.entries(detailLabels)){
 const folder=join(root,'details-v012'),auditFile=join(folder,'audit-'+id+'.json');if(!existsSync(auditFile))continue;const audit=JSON.parse(readFileSync(auditFile));let count=0,first='';
 for(const file of readdirSync(folder).filter(f=>new RegExp('^'+id+'-[a-f0-9]{16}\\.json$').test(f)).sort()){
  const data=JSON.parse(readFileSync(join(folder,file)));first||=data.url;const html=join(folder,file.replace('.json','.html')),parsed=existsSync(html)?parseHtml(readFileSync(html,'utf8'),data.url).products:data.products;
  for(const p of parsed){const old=data.products?.find(q=>offerKey(q.offer)===offerKey(p.offer));add({...p,facts:{...old?.facts,...p.facts},offer:{...p.offer,observedAt:old?.offer.observedAt||data.at||p.offer.observedAt}});count++;}
 }
 sources.push({name,url:first||audit.failures?.[0]?.url||'https://order.mandarake.co.jp/order/',pages:audit.completed,count,total:audit.targets,status:audit.status||'partial',next:audit.next||null,failures:audit.failures.length,pauseReason:audit.pauseReason,coverage:'商品区域实际分类、发行字段及原始图片；验证墙后的详情未读取'});
 writeFileSync('public/fate-crawl/v12/'+id+'-details-audit.json',JSON.stringify(audit,null,2));
}
// Variant responses provide each Aniplex SKU's date/price. Preserve those exact facts.
const eventFolder=join(root,'aniplex-v012'),events=JSON.parse(readFileSync(join(eventFolder,'audit-events.json')));let eventCount=0;
for(const file of readdirSync(eventFolder).filter(f=>/^detail-[a-f0-9]{16}\.json$/.test(f))){const data=JSON.parse(readFileSync(join(eventFolder,file)));const parsed=parseHtml(readFileSync(join(eventFolder,file.replace('.json','.html')),'utf8'),data.url).products;
 for(const old of data.products){const current=parsed.find(q=>offerKey(q.offer)===offerKey(old.offer)),event=old.facts?.event||'',ky=event.match(/京まふ\s*(\d{4})/),aj=event.match(/AnimeJapan\s*(\d{4})/),cm=event.match(/コミックマーケット\s*(\d+)/),canonical=ky?'京まふ '+ky[1]:aj?'AnimeJapan '+aj[1]:cm?'コミックマーケット '+cm[1]:event;
  add({...old,categoryLabel:current?.categoryLabel||old.categoryLabel,facts:{...current?.facts,...old.facts,event:canonical}});eventCount++;
 }}
sources.push({name:'Aniplex · 京まふ / AnimeJapan / TYPE-MOON Comiket',url:'https://online.aniplex.co.jp/event',pages:events.events.reduce((n,e)=>n+e.pages,0)+events.details,count:eventCount,total:eventCount,status:events.failures.length?'partial':'completed',next:null,failures:events.failures.length,coverage:'原站活动分页及独立 SKU；无解析商品的旧页面另列，不视为历史目录完整'});
writeFileSync('public/fate-crawl/v12/aniplex-events-audit.json',JSON.stringify(events,null,2));
// Revisit existing missing images with the current parser and exact original listing.
let revisited=0;const missing=join(root,'missing-v012');if(existsSync(missing))for(const file of readdirSync(missing).filter(f=>/^amiami-[a-f0-9]{16}\.json$/.test(f))){const d=JSON.parse(readFileSync(join(missing,file)));for(const p of parseHtml(readFileSync(join(missing,file.replace('.json','.html')),'utf8'),d.url).products){add(p);revisited++;}}
sources.push({name:'AmiAmi · 已收录无图商品复核',url:'https://www.amiami.jp/top/search/list?s_keywords=Fate',pages:revisited,count:revisited,total:revisited,status:'completed',next:null});
let publisherCount=0;const publisher=join(root,'publisher-v012'),publisherAudit=JSON.parse(readFileSync(join(publisher,'audit-publisher.json'))),publisherIndex=new Map(readdirSync(publisher).filter(f=>f.startsWith('search-')).flatMap(f=>JSON.parse(readFileSync(join(publisher,f))).result?.book||[]).filter(p=>p.type===1).map(p=>[p.itemCode,p]));
for(const file of readdirSync(publisher).filter(f=>/^detail-\d{12}\.json$/.test(f))){const d=JSON.parse(readFileSync(join(publisher,file))),entry=publisherIndex.get(file.match(/\d+/)[0]);if(publisherAudit.excludedDigital?.some(p=>p.url===d.url))continue;if(entry?.disp_author_name){const {strip}=radar.get('collector');d.product.facts.artists=[...entry.disp_author_name.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m=>strip(m[1]).replace(/^(?:著者|漫画|原作|イラスト|編者|監修|編集)\s*/, '').trim()).filter(Boolean).slice(0,15);}add(d.product,true);publisherCount++;}
sources.push({name:'KADOKAWA · Fate / TYPE-MOON 实体发行档案',url:'https://www.kadokawa.co.jp/product/search/',pages:publisherAudit.queries.reduce((n,q)=>n+Math.ceil(q.count/100),0)+publisherCount,count:publisherCount,total:publisherIndex.size-(publisherAudit.excludedDigital?.length||0),status:publisherCount+(publisherAudit.excludedDigital?.length||0)===publisherIndex.size?'completed':'partial',next:publisherAudit.failures[0]?.url||null,failures:publisherAudit.failures.length,imageFailures:publisherAudit.imageFailures?.length||0,coverage:'逐页确认实体装帧，排除电子专售；ISBN / JAN、新装版、小说与漫画区分；未来发售日保留，出版社未公开的封面留空'});
writeFileSync('public/fate-crawl/v12/publisher-audit.json',JSON.stringify(publisherAudit,null,2));
const extra=join(root,'kodansha-v012/products.json');if(existsSync(extra)){const values=JSON.parse(readFileSync(extra));for(const p of values)add(p,true);sources.push({name:'讲谈社 · turas realta 实体卷号补全',url:'https://www.kodansha.co.jp/titles/1000030527',pages:values.length,count:values.length,total:values.length,status:'completed',next:null,coverage:'系列公开分页和实体商品页：ISBN、发行日期、定价与对应封面'});}
const output='public/fate-crawl/v12',values=[...products.values()],files=[...base.files],sizes=base.files.map(f=>JSON.parse(readFileSync('public'+f)).length);let buffer=[],bytes=2,number=0;
const flush=()=>{if(!buffer.length)return;const file=output+'/batch-'+number+++'.json';writeFileSync(file,JSON.stringify(buffer));files.push('/'+file.slice(7));sizes.push(buffer.length);buffer=[];bytes=2;};
for(const p of values){const size=Buffer.byteLength(JSON.stringify(p))+1;if(buffer.length>=500||bytes+size>2800000)flush();buffer.push(p);bytes+=size;}flush();
let count=0;const offsets=sizes.map(n=>{const offset=count;count+=n;return offset;});
const manifest={...base,id:'fate-v012-'+createHash('sha256').update(base.id+JSON.stringify(values)).digest('hex').slice(0,16),previousSnapshot:{id:base.id,batches:base.files.length},count,files,offsets,capturedAt:new Date().toISOString(),observations:base.observations+values.length,sources:[...base.sources,...sources],coverage:{complete:false,remaining:'AmiAmi 历史手办第17页起，Aniplex 当前入口第145条起；骏河屋综合第43页与同人分段第216页起及更早年份；Yahoo 第401条、Mercari 第4页、Mandarake 第4页起。Mandarake 详情年龄验证、Melonbooks 不可读页面与未公开图片仍待补。'}};
writeFileSync('lib/radar/fate-crawl-manifest.json',JSON.stringify(manifest,null,2));writeFileSync('public/fate-crawl/manifest.json',JSON.stringify(manifest,null,2));writeFileSync(output+'/audit.json',JSON.stringify({newObservations:values.length,images:values.filter(p=>p.image).length,excluded:excluded.length,sources},null,2));writeFileSync(output+'/excluded.json',JSON.stringify(excluded,null,2));
console.log(JSON.stringify({id:manifest.id,newObservations:values.length,images:values.filter(p=>p.image).length,totalBatches:files.length,newBatches:number,excluded:excluded.length}));radar.close();
