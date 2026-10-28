import {offerExtras,titleCatalogue,canonicalBrand,editionVariant} from './catalog';
import {Offer} from './types';
import {extractMetadata,extractProductKeywords,Metadata} from './metadata';
import {readHtml,text,all,first,cls,tag,attr,hasClass,tableFields,structuredProducts,Element,decode,attrs} from './html';
import {listingKey,offerKey} from './identity';
import {ANIPLEX_EVENTS} from './aniplex-events';
export {decode} from './html';
export type Parsed={provisional?:boolean;title:string;description:string;image:string;images?:string[];categoryLabel?:string;offer:Offer;extraOffers?:Offer[];facts?:Metadata;tags?:string[]};
const ALLOWED=['booth.pm','www.gamecity.ne.jp','fes.fate-go.jp','store.kadokawa.co.jp','order.mandarake.co.jp','www.mandarake.co.jp','mandarake.co.jp','www.suruga-ya.jp','jp.mercari.com','auctions.yahoo.co.jp','shopping.yahoo.co.jp','store.shopping.yahoo.co.jp','www.amiami.jp','www.amiami.com','slist.amiami.jp','www.goodsmile.com','api.openbd.jp','online.aniplex.co.jp','www.aniplexplus.com','p-bandai.jp','www.bandai.co.jp','bandai-hobby.net','www.melonbooks.co.jp','org.melonbooks.co.jp','ecs.toranoana.jp','ec.toranoana.jp','typemoon.com','www.kadokawa.co.jp','www.kodansha.co.jp','www.hanmoto.com','www.taito.co.jp','hobby-maniax.com','www.taghobby.com','1kuji.com','www.1kuji.com','www.bandaispirits.co.jp','on-line.1kuji.com'];
export function safeUrl(raw:string){let u:URL;try{u=new URL(raw);}catch{throw new Error('网址格式不正确');}if(u.protocol!=='https:'||u.username||u.password||u.port||!(ALLOWED.includes(u.hostname)||/^[a-z0-9-]+\.booth\.pm$/.test(u.hostname)))throw new Error('仅支持已列出的商店 HTTPS 公开页面');if(/\/(?:kaitori|buyback)(?:\/|$)/i.test(u.pathname))throw new Error('这是回收估价页，不是商品出售页；不能作为购买价格采集');if(/(?:addbasket|addMypageList|watchlist\/(?:add|delete)|logout)/i.test(u.pathname))throw new Error('只能读取商品页或搜索页');return u;}
export const strip=(s:string)=>text(readHtml(s));
export function yen(s:string):number|null{const taxed=s.match(/税込\s*([\d,]+)\s*円/);const m=s.match(/(?:[¥￥]\s*([\d,]+)|([\d,]+)\s*(?:円|yen|JPY))/i);return taxed?Number(taxed[1].replaceAll(',','')):m?Number((m[1]||m[2]).replaceAll(',','')):null;}
export function sourceName(url:string){const h=new URL(url).hostname;return h.includes('mandarake')?'Mandarake':h.includes('suruga-ya')?'骏河屋':h.includes('mercari')?'Mercari':h==='auctions.yahoo.co.jp'?'Yahoo 拍卖':h.includes('shopping.yahoo.co.jp')?'Yahoo 购物':h.includes('melonbooks')?'Melonbooks':h.includes('toranoana')?'Toranoana':/(?:^|\.)booth\.pm$/.test(h)?'BOOTH':h;}
export function isDetailUrl(url:string){const u=new URL(url);return /melonbooks\.co\.jp$/.test(u.hostname)&&/\/detail\/detail\.php/.test(u.pathname)||/toranoana\.jp$/.test(u.hostname)&&/\/item\/\d+/.test(u.pathname)||/(?:^|\.)booth\.pm$/.test(u.hostname)&&/\/items\/\d+/.test(u.pathname)||/\/detailPage\/item|\/product\/(?:detail|other)\/|\/(?:en\/)?item\/m\d+|\/shops\/product\/|\/jp\/auction\//.test(u.pathname)||u.hostname==='store.shopping.yahoo.co.jp'||u.hostname==='online.aniplex.co.jp'&&/^\/item[\w-]+\.html$/.test(u.pathname)||u.hostname==='www.amiami.jp'&&/\/top\/detail\/(?:detail|review)$/.test(u.pathname)&&!!(u.searchParams.get('gcode')||u.searchParams.get('scode'));}
export function makeOffer(url:string,body:string,price:number|null,level:'list'|'detail'='list'):Offer{const u=new URL(url),now=new Date().toISOString();
 const sold=/sold\s*out|売り切れ|品切れ|在庫なし|在庫切れ|販売終了|このオークションは終了|落札されました/i.test(body);
 const buy=/在庫あり|在庫あります|in stock|カート(?:に入れる)?|add to cart|購入手続きへ|購入画面に進む|入札する|今すぐ落札/i.test(body);
 const availability=sold?'sold':/在庫確認/.test(body)?'unknown':buy?'available':'unknown';
 return {variant:editionVariant(body),id:listingKey(url),source:sourceName(url),url,price,currency:'JPY',priceBasis:/税込/.test(body)?'tax_included':'unspecified',priceKind:u.hostname==='auctions.yahoo.co.jp'?'bid':'ask',condition:body.normalize('NFKC').match(/ランク\s*[A-D](?:[+-])?|未開封|未使用|傷(?:み|あり)|美品|箱(?:欠品|欠)/i)?.[0]||'未提取',availability,extras:offerExtras(body),bonus:/特典なし|特典欠|特典無|付録欠|付録なし|ブロマイド欠|without bonus|no bonus/i.test(body)?'absent':/特典のみ|特典単品|特典単体|入場特典|入場者特典|来場者特典|bonus only/i.test(body)?'only':/特典付|特典付き|with bonus/i.test(body)?'included':'unknown',observation:level,verifiedAt:level==='detail'&&availability!=='unknown'?now:undefined,stockNote:/在庫確認します/.test(body)?'可申请购买；店铺仍需确认库存':'',observedAt:now,history:[]};
}
const imageOf=(n:Element,url:string)=>{const a=tag(n,'img')?.attrs;try{return a&&(a['data-src']||a.src)?new URL(a['data-src']||a.src,url).href:'';}catch{return '';}};
const metadataMarkup=(n:Element):string=>'<'+n.tag+'>'+n.children.map(x=>typeof x==='string'?x.replaceAll('&','&amp;').replaceAll('<','&lt;'):metadataMarkup(x)).join('')+'</'+n.tag+'>';
function yahooCategory(doc:Element){const crumb=first(doc,n=>n.tag==='ol'&&/gv-Breadcrumb--/.test(n.attrs.class||''));return crumb?all(crumb,n=>n.tag==='li').map(text).filter(t=>t!=='オークショントップ').join(' > '):'';}
const linkOf=(n:Element,url:string)=>{const a=tag(n,'a')?.attrs.href;try{return a?safeUrl(new URL(a,url).href).href:'';}catch{return '';}};
function parentsHave(n:Element,name:string){let parent=n.parent;while(parent){if(hasClass(parent,name))return true;parent=parent.parent;}return false;}
function slices(html:string,re:RegExp){const starts=[...html.matchAll(re)];return starts.map((m,i)=>html.slice(m.index!,starts[i+1]?.index??html.length));}
function mandCard(n:Element,url:string,category=''):Parsed|null{
 const t=cls(n,'title');if(!t)return null;const title=text(t),detail=linkOf(t,url);if(!title||!detail)return null;
 const desc=text(n).slice(0,2500),offer=makeOffer(detail,desc,yen(text(cls(n,'price'))));
 offer.extras=offerExtras(title);if(offer.extras.some(e=>e.status==='absent'))offer.bonus='absent';else if(offer.extras.some(e=>e.status==='included'))offer.bonus='included';offer.shop=text(cls(n,'shop'));if(offer.condition==='未提取')offer.condition='搜索/同商品列表；成色需逐条详情核对';
 // Keep the historic v0.3 item ID for existing integrations, while dedup uses canonical URL identity.
 offer.id=new URL(detail).searchParams.get('itemCode')||offer.id;
 const actual=text(cls(n,'category'))||category,adult=first(n,x=>x.attrs['data-adult']!==undefined)?.attrs['data-adult'];
 return {title,description:desc,image:imageOf(n,url),offer,...(actual?{categoryLabel:actual}:{}),facts:{...titleCatalogue(title),...(actual?{category:actual}:{}),...(adult==='1'?{ageRating:'r18' as const}:adult==='0'?{ageRating:'all' as const}:{})}};
}
function mandarake(html:string,url:string,doc:Element):Parsed[]{
 if(isDetailUrl(url)){
  if(structuredProducts(html).length)return genericDetail(html,url,doc);
  const title=text(tag(doc,'h1')),panel=cls(doc,'detail_panel');if(!title||!panel)return [];
  const fields=tableFields(panel),description=[fields['商品情報'],fields['商品状態'],text(cls(panel,'caption'))].filter(Boolean).join(' ');
  const actualPrice=fields['販売価格']||text(cls(panel,'shohin_price')),metaPrice=attr(panel,'itemprop','price')?.attrs.content;
  const price=yen(actualPrice)??(metaPrice&&/^[\d,]+$/.test(metaPrice)?Number(metaPrice.replaceAll(',','')):null);
  const offer=makeOffer(url,title+' '+text(cls(panel,'basicinfo'))+' '+text(cls(panel,'basket'))+' '+text(cls(panel,'cart'))+' '+text(first(panel,x=>!!x.attrs['data-getinfo']))+' '+description,price,'detail');
  // Purchase controls are generated in the panel; never use recommendations or footer cart links.
  const panelText=text(panel).replace(text(cls(panel,'general-note')),'');
  const live=makeOffer(url,title+' '+panelText,price,'detail');Object.assign(offer,{availability:live.availability,verifiedAt:live.verifiedAt,stockNote:live.stockNote});
  offer.priceBasis=/税込/.test(actualPrice)?'tax_included':'unspecified';offer.id=new URL(url).searchParams.get('itemCode')||offer.id;
  offer.shop=fields['発送店舗']||'';offer.condition=fields['商品状態']||'未提取';offer.productKey=fields['商品番号']?.match(/\((\d+)-/)?.[1];
  const other=cls(doc,'other_item'),extras=other?all(other,x=>hasClass(x,'block')).map(n=>mandCard(n,url)).filter((x):x is Parsed=>!!x):[];
  // The site's explicit same-product section is authoritative for shop aggregation; recommended items are excluded.
  for(const p of extras)p.offer.productKey=offer.productKey;
  const image=attr(doc,'itemprop','image')?.attrs.href||imageOf(cls(doc,'pic')||panel,url);
  const facts=extractMetadata(html);if(fields['カテゴリ'])facts.category=fields['カテゴリ'].slice(0,300);
  const tags=all(cls(doc,'tag')||{tag:'root',attrs:{},children:[]},x=>x.tag==='a').map(x=>text(x)).filter(Boolean);
  const categoryLabel=fields['カテゴリ']||tags.find(t=>/^(?:book|comic|manga|novel|フィギュア|同人誌|男性向同人誌|女性向同人誌)$/i.test(t));
  return [{title,description,image,offer,extraOffers:extras.map(p=>p.offer),facts,tags,...(categoryLabel?{categoryLabel}:{})}];
 }
 const code=new URL(url).searchParams.get('categoryCode')||'';
 const category=code==='01'?'書籍':/^0301/.test(code)?'男性向同人誌':/^0303/.test(code)?'女性向同人誌':'';
 const sections=slices(html,/<div\b[^>]*data-itemidx=["']\d+["'][^>]*>/gi);
 if(sections.length)return sections.map(s=>mandCard(readHtml(s.split('<!-- /block -->')[0]),url,category)).filter((x):x is Parsed=>!!x);
 return slices(html,/<(?:div|li|article)\b[^>]*class=["'](?:item|item-box|item_box|product-item)["'][^>]*>/gi).map(s=>{const n=readHtml(s),a=first(n,x=>x.tag==='a'&&!!x.attrs.href?.includes('detailPage'));if(!a)return null;const title=text(a)||tag(a,'img')?.attrs.alt||'',detail=linkOf(a,url);if(!title||!detail)return null;return {title,description:text(n).slice(0,2500),image:imageOf(n,url),offer:makeOffer(detail,title+' '+text(n),yen(text(cls(n,'price'))))};}).filter((x):x is Parsed=>!!x);
}
function surugaya(html:string,url:string,doc:Element):Parsed[]{
 if(new URL(url).pathname.startsWith('/product/other/')){
  const title=text(tag(doc,'h1')).replace(/の取り扱い店舗一覧$/,'').trim();if(!title)return [];
  const detail=all(doc,n=>n.tag==='a').map(n=>n.attrs.href).find(h=>h?.includes('/product/detail/')&&h.includes('item_detailInfo'));
  const offer=makeOffer(url,'',null,'list');offer.productKey=new URL(url).pathname.split('/').pop();offer.shop='各店列表待加载';offer.stockNote='跳转到各店列表，价格区间不能当作单店报价；需浏览器加载';
  return [{title,description:offer.stockNote,image:imageOf(doc,url),offer,facts:{...titleCatalogue(title),...(detail?{}:{})}}];
 }
 if(isDetailUrl(url)||structuredProducts(html).length)return genericDetail(html,url,doc);
 return slices(html,/<div\b[^>]*class=["']item["'][^>]*>/gi).flatMap(s=>{
  const n=readHtml(s.split('<div class="pagination')[0]),t=cls(n,'title'),title=text(t),detail=t?linkOf(t,url):'';if(!title||!detail)return [];
  const prices=cls(n,'item_price'),primary=prices?all(prices,e=>e.tag==='p'&&hasClass(e,'price_teika')&&/^(?:中古|新品|予約)[:：]/.test(text(e))):[],primaryText=primary.map(text).join(' '),soldText=text(prices?cls(prices,'price'):undefined)||text(prices).match(/^(?:品切れ|売り切れ)/)?.[0]||'',fallback=prices?all(prices,e=>hasClass(e,'text-red')&&!parentsHave(e,'makeplaTit')).map(text).join(' '):'';
  const price=yen(primaryText)??yen(fallback),mainUrl=new URL(detail);mainUrl.searchParams.delete('tenpo_cd');const offer=makeOffer(mainUrl.href,soldText+' '+primaryText,price);
  if(/品切れ|売り切れ/.test(soldText)){offer.availability='sold';offer.price=null;}else if(price!==null){offer.availability='available';offer.stockNote='搜索页列出可售价格；详情库存待复核';}
  offer.productKey=mainUrl.pathname.split('/').pop();offer.extras=offerExtras(title);offer.condition=title.normalize('NFKC').match(/ランク\s*[A-D](?:[+-])?|\(状態[:：][^)]*\)|\[(?:破損品|箱欠品|箱破損|経年劣化|難あり)[^\]]*\]/i)?.[0]||primaryText.match(/中古|新品|予約/)?.[0]||'详情待核对';
  const extras:Offer[]=[],market=cls(n,'makeplaTit'),marketUrl=market?linkOf(market,url):'';if(market&&marketUrl){const marketplace=makeOffer(marketUrl,'',new URL(marketUrl).pathname.startsWith('/product/detail/')&&new URL(marketUrl).searchParams.get('tenpo_cd')?yen(text(market)):null);marketplace.availability='available';marketplace.condition='各店成色待复核';marketplace.shop='骏河屋 marketplace';marketplace.stockNote=`各店搜索提示 ${yen(text(market))??'未知'} JPY；${new URL(marketUrl).pathname.startsWith('/product/detail/')&&new URL(marketUrl).searchParams.get('tenpo_cd')?'详情待复核':'列表最低价，未当作单店报价'}`;extras.push(marketplace);}
  const release=text(cls(n,'release_date')).replace(/\[|\]|発売日[:：]/g,'').trim();const category=text(cls(n,'background-kishu'));const brand=text(cls(n,'brand')).replace(/^\[|\]$/g,'').trim();
  const selected=new URL(url).searchParams,originalWork=selected.get('subgenre')==='Fate'?'Fate 综合':selected.get('series')?.startsWith('Fate')?'Fate 综合':'';
  const credits=/同人誌/.test(category)?title.split(/\s+\/\s+/):[];
  const official=/^TYPE[ -]?MOON(?: BOOKS)?$/i.test(brand.normalize('NFKC'));
  return [{title,description:text(cls(n,'item_detail')).slice(0,2500),image:imageOf(n,url),categoryLabel:category,offer,extraOffers:extras,facts:{...titleCatalogue(title),category,...(originalWork?{series:originalWork}:{}),...(credits.length>1&&!official?{circle:brand||credits.at(-1),artists:credits.slice(1,-1).slice(0,15),origin:'doujin' as const}:{}),...(brand?{brand:canonicalBrand(brand),publisher:/本|書籍|ムック|雑誌|同人誌/.test(category)&&official||/本|書籍|ムック|雑誌/.test(category)?brand:undefined}:{}),...(release?{releaseDate:release,...(/^(?:19|20)\d{2}/.test(release)?{year:release.slice(0,4)}:{})}:{})}}];
 });
}
// Anonymous SSR search payloads contain photos even when lazy <img> tags have no src.
// Only search-result entries may enrich an already parsed, identically named listing.
function mercariSearchPhotos(html:string){
 const chunks:string[]=[];
 for(const match of html.matchAll(/<script\b[^>]*>\s*self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?\s*<\/script>/gi)){
  try{const chunk=JSON.parse(match[1]);if(chunk[0]===1&&typeof chunk[1]==='string')chunks.push(chunk[1]);}catch{}
 }
 const photos=new Map<string,{name:string;images:string[]}>();let budget=100000;
 function walk(value:any,depth=0){
  if(!value||typeof value!=='object'||depth>50||--budget<0)return;
  for(const [key,child] of Object.entries(value)){
   if(key.includes('/v2/entities:search')&&child&&typeof child==='object'){
    const result=child as any;
    if(result.meta&&Array.isArray(result.items))for(const item of result.items){
     if(typeof item?.id!=='string'||typeof item.name!=='string')continue;
     const images=[...(Array.isArray(item.photos)?item.photos.map((p:any)=>p?.uri):[]),...(Array.isArray(item.thumbnails)?item.thumbnails:[])].filter((u:any)=>{
      if(typeof u!=='string')return false;try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password&&['static.mercdn.net','assets.mercari-shops-static.com'].includes(x.hostname);}catch{return false;}
     });
     photos.set(item.id,{name:item.name,images:[...new Set<string>(images)].slice(0,10)});
    }
   }else walk(child,depth+1);
  }
 }
 for(const line of chunks.join('').split('\n')){const at=line.indexOf(':');if(at<0)continue;try{walk(JSON.parse(line.slice(at+1)));}catch{}}
 return photos;
}
function mercari(html:string,url:string,doc:Element):Parsed[]{
 if(isDetailUrl(url))return genericDetail(html,url,doc);
 const photos=mercariSearchPhotos(html);
 return all(doc,n=>n.tag==='a'&&/\/(?:item\/m\d+|shops\/product\/)/.test(n.attrs.href||'')).flatMap(n=>{const detail=linkOf(n,url);if(!detail)return [];
  const title=text(attr(n,'data-testid','thumbnail-item-name'))||tag(n,'img')?.attrs.alt?.replace(/のサムネイル$/,'')||'';if(!title)return [];
  const offer=makeOffer(detail,text(n)+' '+all(n,x=>!!x.attrs['aria-label']).map(x=>x.attrs['aria-label']).join(' '),yen(text(attr(n,'data-testid','item-tile-price'))||text(n)));
  const saved=photos.get(new URL(detail).pathname.split('/').at(-1)||''),images=saved?.name.normalize('NFKC')===title.normalize('NFKC')?saved.images:[],image=imageOf(n,url)||images[0]||'';
  return [{title,description:title,image,images:[...new Set([image,...images].filter(Boolean))].slice(0,10),offer}];
 });
}
function yahooListingState(html:string,url:string,parsed:{products:Parsed[];next:string|null;total:number|null}){
 const request=new URL(url);
 if(request.hostname!=='auctions.yahoo.co.jp'||!request.pathname.startsWith('/search/search')||parsed.products.length)return parsed;
 const raw=html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];if(!raw)return parsed;
 let data;try{data=JSON.parse(raw);}catch{return parsed;}
 const listing=data?.props?.pageProps?.initialState?.search?.items?.listing;
 if(!Array.isArray(listing?.items)||listing.metadata?.searchEngineStatus!=='200')return parsed;
 const price=(n:any)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
 const products:Parsed[]=listing.items.flatMap((p:any)=>{
  if(typeof p.auctionId!=='string'||!/^[a-zA-Z0-9]+$/.test(p.auctionId)||typeof p.title!=='string'||!p.title.trim())return [];
  const title=p.title.trim(),category=(Array.isArray(p.categoryPath)?p.categoryPath:[]).filter((c:any)=>c.id!==0&&typeof c.name==='string').map((c:any)=>c.name).join(' > ');
  const offer=makeOffer('https://auctions.yahoo.co.jp/jp/auction/'+p.auctionId,title,price(p.price));
  offer.listingTitle=title;offer.buyout=price(p.buyNowPrice);offer.priceKind=p.isFixedPrice===true?'ask':'bid';
  offer.priceBasis=p.taxFlag===0||p.taxFlag===1?'tax_included':'unspecified';
  offer.condition=p.itemCondition==='NEW'?'未使用':typeof p.itemCondition==='string'?'来源状态 '+p.itemCondition+'（详情待核对）':'详情待核对';
  offer.stockNote='公开搜索结果；库存及竞拍结束时间须进入原站核对。';
  return [{title,description:title,image:typeof p.imageUrl==='string'&&p.imageUrl.startsWith('https://')?p.imageUrl:'',offer,...(category?{categoryLabel:category}:{}),facts:{...(category?{category}:{}),...(p.category?.isAdult===true?{ageRating:'r18' as const}:{})}}];
 });
 if(!products.length)return parsed;
 const total=Number.isSafeInteger(listing.totalResultsAvailable)&&listing.totalResultsAvailable>=0?listing.totalResultsAvailable:null;
 let next=parsed.next;const offset=Number(data.query?.b),limit=Number(listing.metadata?.limit);
 // Require echoed offset/page size, full result window, and remaining count.
 if(!next&&Number.isSafeInteger(offset)&&offset>0&&limit===Number(data.query?.n)&&limit===listing.items.length&&String(offset)===request.searchParams.get('b')&&String(limit)===request.searchParams.get('n')&&total!==null&&offset+limit<=total){const page=new URL(request);page.searchParams.set('b',String(offset+limit));next=page.href;}
 return {...parsed,products,total,next,needsBrowser:false,parseMethod:'yahoo-public-search-state'};
}

function yahooAuctions(html:string,url:string,doc:Element):Parsed[]{
 if(isDetailUrl(url))return genericDetail(html,url,doc);
 return all(doc,n=>hasClass(n,'Product')).flatMap(n=>{const a=cls(n,'Product__titleLink');if(!a)return [];let detail='';try{detail=safeUrl(a.attrs.href).href;}catch{return [];}const title=a.attrs['data-auction-title']||text(a),body=text(n);
  const offer=makeOffer(detail,body,yen(body.match(/現在\s*([\d,]+円)/)?.[1]||''));offer.buyout=yen(body.match(/即決\s*([\d,]+円)/)?.[1]||'');offer.condition=text(cls(n,'Product__icon'))||body.match(/未使用|目立った傷や汚れなし|傷や汚れあり/)?.[0]||'详情待核对';
  if(url.includes('/closedsearch/')){offer.availability='sold';offer.priceKind='closed';}
  return [{title,description:body.slice(0,2500),image:a.attrs['data-auction-img']||imageOf(n,url),offer}];
 });
}
function genericDetail(html:string,url:string,doc:Element):Parsed[]{
 const nodes=structuredProducts(html),out:Parsed[]=[];
 for(const n of nodes){if(!n.name)continue;const offers=Array.isArray(n.offers)?n.offers:n.offers?.offers?Array.isArray(n.offers.offers)?n.offers.offers:[n.offers.offers]:[n.offers||{}];
  const items:Offer[]=[];
  for(const o of offers){let detail:string;try{detail=safeUrl(new URL(o.url||n.url||url,url).href).href;}catch{continue;}if(isDetailUrl(url)&&listingKey(detail)!==listingKey(url))continue;
   const raw=o.price??o.priceSpecification?.price,price=(o.priceCurrency||o.priceSpecification?.priceCurrency)==='JPY'&&/^\d+(?:\.0+)?$/.test(String(raw))?Number(raw):null;
   const offer=makeOffer(detail,String(n.name)+' '+String(n.description||''),price,'detail');if(/InStock|LimitedAvailability/.test(o.availability||'')){offer.availability='available';offer.verifiedAt=offer.observedAt;}if(/OutOfStock|SoldOut|Discontinued/.test(o.availability||'')){offer.availability='sold';offer.verifiedAt=offer.observedAt;}
   if(new URL(url).hostname==='www.suruga-ya.jp'){const cart=attr(doc,'id','cart')||cls(doc,'panel_buy');const buttons=cart?all(cart,e=>e.tag==='button'&&e.attrs.disabled===undefined).map(text).join(' '):'';if(/カートに入れる/.test(buttons)){offer.availability='available';offer.verifiedAt=offer.observedAt;}const visiblePrice=text(cls(doc,'price_group'));if(yen(visiblePrice)!==null){offer.price=yen(visiblePrice);offer.priceBasis=/税込/.test(visiblePrice)?'tax_included':'unspecified';}}
   offer.shop=typeof o.seller==='string'?o.seller:o.seller?.name;offer.condition=String(o.itemCondition||'未提取').replace(/^https?:\/\/schema.org\//,'');items.push(offer);
  }
  if(items.length){const suruga=new URL(url).hostname==='www.suruga-ya.jp',header=suruga?text(tag(doc,'h1')):'',media=/^アニメ(?:Blu-ray|DVD)/i.test(header)?'映像ソフト':/^アニメCD/i.test(header)?'音楽CD':'',rawHeader=suruga?html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'':'',categoryLabel=media||strip(rawHeader.split('　')[0]);
   const images=Array.isArray(n.image)?n.image.filter((x:unknown)=>typeof x==='string'):typeof n.image==='string'?[n.image]:[],hero=suruga?imageOf(cls(doc,'main-pro-img')||attr(doc,'id','image_default')||{tag:'root',attrs:{},children:[]},url):'';
   const sourceLabel=suruga&&rawHeader.includes('　')?categoryLabel:new URL(url).hostname==='auctions.yahoo.co.jp'?yahooCategory(doc):typeof n.category==='string'?n.category:'';
   out.push({title:media?header:strip(String(n.name)),description:strip(String(n.description||'')).slice(0,16000),image:hero||images[0]||'',images:hero?[hero,...images.filter((x:string)=>x!==hero)].slice(0,10):images.slice(0,10),...(sourceLabel?{categoryLabel:sourceLabel}:{}),offer:items[0],extraOffers:items.slice(1),facts:{...extractMetadata(suruga?html:'<script type="application/ld+json">'+JSON.stringify(n)+'</script>'),...(media?{category:media}:suruga&&rawHeader.includes('　')?{category:categoryLabel}:{})}});}
 }
 if(out.length)return out;
 if(!isDetailUrl(url))return [];
 const main=tag(doc,'main')||doc,title=text(tag(main,'h1'));if(!title)return [];
 const host=new URL(url).hostname;
 let panel:Element=main,priceText='',description='',condition='未提取',stockText:string|undefined,facts:Metadata={},categoryLabel='';
 if(host==='jp.mercari.com'){
  const detail=attr(main,'id','item-info')||attr(main,'data-testid','item-detail-container')||attr(main,'data-testid','item-info');
  if(!detail)return [];
  panel=detail;priceText=text(attr(detail,'data-testid','price'))||text(attr(detail,'data-testid','item-price'))||text(attr(detail,'data-testid','converted-currency-section'));
  stockText=text(attr(detail,'data-testid','checkout-button-container')||attr(detail,'data-testid','checkout-button'));
  const section=(heading:string)=>{let n=first(detail,x=>/^h[23]$/.test(x.tag)&&text(x)===heading);while(n?.parent&&text(n)===heading)n=n.parent;return text(n).replace(new RegExp('^'+heading),'').trim();};
  description=text(attr(detail,'data-testid','description'))||text(attr(detail,'data-testid','item-description'))||section('商品の説明');
  condition=section('商品の状態').slice(0,150)||condition;
  const cat=section('カテゴリー');categoryLabel=cat;if(/本・雑誌|^本\b/.test(cat))facts.category='書籍';
  const msrp=description.match(/定価\s*[:：]\s*[¥￥]?\s*([\d,]+)/);if(msrp)facts.msrp=Number(msrp[1].replaceAll(',',''));
 }else if(host==='www.suruga-ya.jp'){
  panel=attr(doc,'id','cart')||cls(doc,'panel_buy')||main;priceText=text(cls(doc,'price_group'));description=text(cls(doc,'product_description'))||text(cls(doc,'item-explain'));
  const buttons=all(panel,e=>e.tag==='button'&&e.attrs.disabled===undefined).map(text).join(' ');stockText=/カートに入れる/.test(buttons)?'カートに入れる':/品切れ|売り切れ/.test(buttons)?'品切れ':'';
 }else if(host==='auctions.yahoo.co.jp'){
  categoryLabel=yahooCategory(doc);
  panel=cls(main,'ProductDetail')||cls(main,'ProductMain')||main;priceText=text(cls(panel,'Price__value'))||text(cls(panel,'Price'));
  description=text(cls(main,'ProductExplanation'))||text(cls(main,'ProductDescription'));
 }else {panel=cls(main,'product_detail')||cls(main,'product-main')||main;priceText=text(cls(panel,'price'))||text(cls(panel,'product-price'));description=text(cls(main,'description'))||text(cls(main,'product_description'));}
 const fields=tableFields(panel);condition=fields['商品の状態']||fields['商品状態']||condition;
 const body=text(panel),offer=makeOffer(url,title+' '+(stockText??body),yen(priceText),'detail');offer.condition=condition;if(host==='www.suruga-ya.jp'){offer.productKey=new URL(url).pathname.split('/').pop();offer.shop=fields['販売店舗']||fields['販売店']||(new URL(url).searchParams.get('tenpo_cd')?'店铺 '+new URL(url).searchParams.get('tenpo_cd'):'骏河屋本店');}
 // Unknown layouts remain records for review; prices are never guessed from footer or shipping text.
 if(host==='auctions.yahoo.co.jp'){offer.price=yen(body.match(/現在\s*([\d,]+円)/)?.[1]||priceText);offer.buyout=yen(body.match(/即決\s*([\d,]+円)/)?.[1]||'');if(/このオークションは終了/.test(body)){offer.availability='sold';offer.priceKind='closed';}}
 const image=attr(doc,'property','og:image')?.attrs.content||'';
 return [{title,description:description.slice(0,16000),image,images:[image].filter(Boolean),...(categoryLabel?{categoryLabel}:{}),offer,facts:{...extractMetadata(html),...facts},tags:host==='jp.mercari.com'?all(panel,n=>n.tag==='a'&&text(n).startsWith('#')).map(n=>text(n).slice(1)).filter(t=>t.length<=60):[]}];
}
function yahooShopping(html:string,url:string,doc:Element):Parsed[]{
 const structured=genericDetail(html,url,doc);if(structured.length||isDetailUrl(url))return structured;
 const out:Parsed[]=[];
 for(const a of all(doc,n=>n.tag==='a'&&/https:\/\/store\.shopping\.yahoo\.co\.jp\//.test(n.attrs.href||''))){
  const title=a.attrs.title||tag(a,'img')?.attrs.alt||text(a);if(!title||title.length<4)continue;
  let box=a;for(let depth=0;depth<5&&box.parent&&!['li','article'].includes(box.tag);depth++)box=box.parent;
  const body=text(box);if(body.length>5000)continue;const detail=linkOf(a,url);if(!detail)continue;
  out.push({title:title.slice(0,300),description:body.slice(0,2500),image:imageOf(box,url),offer:makeOffer(detail,body,yen(body))});
 }return out;
}
// Only follow narrower filters actually linked by the source. Preserve every search constraint.
function searchPartitions(doc:Element,url:string):string[]{
 const parent=new URL(url);if(parent.hostname!=='www.suruga-ya.jp'||parent.pathname!=='/search')return [];
 const yearFacet=cls(doc,'facet-number3'),years=!parent.searchParams.has('release_year')&&text(tag(yearFacet||doc,'h2'))==='発売年'?yearFacet:undefined;
 const facet=years||cls(doc,'facet-category');if(!facet)return [];
 return [...new Set(all(facet,n=>n.tag==='a'&&!!n.attrs.href).flatMap(a=>{
  try{const child=safeUrl(new URL(a.attrs.href,url).href);if(child.hostname!==parent.hostname||child.pathname!==parent.pathname)return [];
   const changed=years?'release_year':'category';
   for(const [key,value] of parent.searchParams)if(!['page','p','pageNumber',changed].includes(key)&&child.searchParams.get(key)!==value)return [];
   if(years){if(!/^\[(?:\d{1,4}|\*),(?:\d{1,4}|\*)\]$/.test(child.searchParams.get('release_year')||''))return [];}
   else{const from=parent.searchParams.get('category')||'',to=child.searchParams.get('category')||'';if(!/^\d+$/.test(to)||to.length<=from.length||!to.startsWith(from))return [];}
   child.searchParams.delete('page');return child.href===parent.href?[]:[child.href];
  }catch{return [];}
 }))];
}
function aniplexList(doc:Element,url:string):Parsed[]{
 const u=new URL(url),group=u.searchParams.get('cgid')||u.pathname.split('/')[1],event=ANIPLEX_EVENTS[group]||'';
 const scope=attr(doc,'id','product-search-results')||doc;
 return all(scope,n=>n.tag==='article'&&hasClass(n,'c-mid-tile')).flatMap(n=>{
  const name=text(cls(n,'c-mid-tile__title')),a=cls(n,'c-mid-tile__link');if(!name||!a?.attrs.href)return [];
  const detail=safeUrl(new URL(a.attrs.href,url).href).href,title=(event?event+' ':'')+name,body=text(n),offer=makeOffer(detail,body,null,'list');
  const price=text(cls(n,'c-product-mid-tile__price'));offer.price=/\d[\s,\d]*\s*[-〜～]\s*[¥￥]?\s*\d/.test(price)?null:yen(price);offer.priceBasis='tax_included';
  // The product-specific sale-ended flag sits immediately before the article in the tile wrapper.
  if(n.parent&&all(n.parent,x=>x.tag==='article').length===1&&/販売終了/.test(text(n.parent)))offer.availability='sold';
  const work=text(cls(n,'c-product-mid-tile__shoulder')),media=u.searchParams.get('prefn1')==='productMediaCode'?u.searchParams.get('prefv1')||'':'';
  return [{title,description:body.slice(0,2500),image:imageOf(n,url),offer,facts:{event,...sourceProductFacts(name,work,media,event),origin:'commercial' as const},tags:['官方目录',...(event?[event]:[])]}];
 });
}
function aniplexDetail(html:string,doc:Element,url:string):Parsed[]{
 const name=text(cls(doc,'product-name'));if(!name)return [];
 const panel=cls(doc,'product-details')||doc,priceText=text(cls(panel,'price')),price=/\d[\s,\d]*\s*[-〜～]\s*[¥￥]?\s*\d/.test(priceText)?null:yen(priceText);
 const sections=all(doc,n=>hasClass(n,'description-and-detail'));
 const description=sections.filter(n=>!/購入特典|注意事項|注文受付期間/.test(text(cls(n,'footer-item__title')))).map(text).join('\n').slice(0,16000);
 const offer=makeOffer(url,'',price,'list');offer.priceBasis='tax_included';offer.availability=/販売終了/.test(text(panel))?'sold':'unknown';
 // Selectable variants carry their own name and image in the product-scoped variation list.
 const variants=all(cls(panel,'variation__list')||panel,n=>n.tag==='li'&&!!n.attrs['data-attr-value']);
 const detailFacts=extractMetadata(html),work=detailFacts.series||text(cls(panel,'product-series'))||text(cls(panel,'product-title'));
 const shipping=/お届け|発送|出荷/.test(detailFacts.releaseDate||'')?detailFacts.releaseDate:'';if(shipping){offer.stockNote='発送予定：'+shipping;offer.releaseDate=shipping;delete detailFacts.releaseDate;delete detailFacts.year;}
 const structured=structuredProducts(html)[0],cover=Array.isArray(structured?.image)?structured.image[0]:structured?.image;
 const gallery=cls(doc,'product__images')||cls(doc,'image-gallery')||cls(doc,'primary-images');
 const galleryImages=gallery?all(gallery,n=>n.tag==='img').map(n=>imageOf(n,url)).filter(u=>u&&!/\/r_(?:comp|\d+)\.jpg|\/temple?tes\//.test(u)).slice(0,10):[];
 const mainImage=galleryImages[0]||cover||(gallery?imageOf(gallery,url):'')||attr(doc,'property','og:image')?.attrs.content||'';
 if(variants.length)return variants.map(v=>{const product=new URL(url);product.search='';const title=v.attrs['data-attr-value']||name,variant=v.attrs['data-attr-id'],preview=imageOf(v,url);return {title,description,image:/\/temple?tes\/|\/r_(?:comp|\d+)\.jpg/.test(preview)?mainImage:preview||mainImage,images:[...new Set([mainImage,...galleryImages])].filter(Boolean).slice(0,10),offer:{...offer,url:product.href,id:listingKey(product.href)+':'+variant,variant,listingTitle:title,stockNote:'款式编号 '+variant+'；进入原站后选择对应款式。'+(shipping?' 発送予定：'+shipping:'')},facts:{...sourceProductFacts(title,work),...detailFacts,origin:'commercial' as const},tags:['官方目录']};});
 return [{title:name,description,image:cover||imageOf(cls(doc,'image-gallery')||cls(doc,'primary-images')||panel,url)||attr(doc,'property','og:image')?.attrs.content||'',offer,facts:{...sourceProductFacts(name,work),...detailFacts,origin:'commercial'},tags:['官方目录']}];
}
function sourceProductFacts(title:string,work='',media='',event=''):Metadata{
 const t=(title+' '+work+' '+event).normalize('NFKC');
 const series=/Grand\s*Order|\bFGO\b/i.test(t)?'Fate/Grand Order':/Fate\s*\/\s*Zero/i.test(t)?'Fate/Zero':/strange\s*Fake/i.test(t)?'Fate/strange Fake':/Apocrypha/i.test(t)?'Fate/Apocrypha':/EXTRA|EXTELLA/i.test(t)?'Fate/EXTRA':/stay\s*night|Heaven[’'s ]*Feel|Unlimited Blade Works/i.test(t)?'Fate/stay night':work||'';
 const category=/書籍|パンフレット|画集|material|Anniversary Book|advertising works/i.test(media+' '+title)?'書籍':/フィギュア|1\/\d+.*スケール|きゃらふぉるむ/i.test(media+' '+title)?'フィギュア':/CD|Original Soundtrack|サウンドトラック|\bOST\b/i.test(media+' '+title)?'音楽CD':/Blu[- ]?ray|DVD|\bBD\b/i.test(media+' '+title)?'映像ソフト':/Fate\s*\/\s*(?:EXTRA Record|stay night REMASTERED|hollow ataraxia REMASTERED)|ゲームソフト/i.test(title)?'ゲームソフト':'グッズ';
 return {...(series?{series}:{}),category};
}
function amiami(html:string,doc:Element,url:string):Parsed[]{
 const scope=attr(doc,'id','maincontents');if(!scope)return [];
 if(!isDetailUrl(url))return all(attr(scope,'id','search_table')||scope,n=>hasClass(n,'product_box')).flatMap(n=>{
  const title=text(cls(n,'product_name_inner')||cls(n,'product_name')),detail=linkOf(n,url);if(!title||!detail)return [];
  const raw=text(cls(n,'product_price')),price=/^[\d,]+$/.test(raw)?Number(raw.replaceAll(',','')):yen(raw),offer=makeOffer(detail,text(n),price,'list');
  return [{title,description:title,image:imageOf(cls(n,'product_img')||n,url),offer,facts:{...sourceProductFacts(title),origin:'commercial' as const},tags:['零售目录']}];
 });
 const title=text(cls(scope,'heading_10'));if(!title)return [];
 const panel=cls(scope,'sales_overview')||scope,spec=attr(scope,'id','detail_detail__item_spec'),detail=attr(scope,'id','detail_detail__item_detail'),explain=cls(scope,'explain');
 const lineText=(n:Element|undefined):string=>n?n.children.map(x=>typeof x==='string'?x:x.tag==='br'?'\n':lineText(x)).join('').replace(/[ \t]+/g,' ').trim():'';
 const description=[lineText(spec),lineText(detail)||lineText(explain)].filter(Boolean).join('\n\n').slice(0,16000),category=text(cls(scope,'pankuzu_area')).replace(/^商品カテゴリ\s*[:：]\s*/,'');
 const offer=makeOffer(url,text(cls(panel,'cart'))+' '+text(cls(panel,'stockstatus')),null,'detail');
 if(/取り扱いできません|販売停止|売り切れ|在庫なし/.test(text(cls(panel,'cart'))))offer.availability='sold';
 const priced=cls(panel,'price_area'),raw=attr(scope,'id','detail_detail__item_price')?.attrs['data-item-price']||text(cls(priced||panel,'selling_price')||cls(priced||panel,'price'));offer.price=yen(raw)??(/^\d[\d,]*$/.test(raw)?Number(raw.replaceAll(',','')):null);
 offer.priceBasis=/税込/.test(text(priced))?'tax_included':'unspecified';offer.productKey=new URL(url).searchParams.get('gcode')||new URL(url).searchParams.get('scode')||'';
 const specData=cls(panel,'spec_data'),fields=specData?extractMetadata(metadataMarkup(specData)):{},maker=decode(html.match(/\bmaker_name\s*=\s*'([^'\n]{1,200})'\s*;/)?.[1]||''),facts:Metadata={...sourceProductFacts(title),...(maker?{brand:canonicalBrand(maker),...(/書籍/.test(category)?{publisher:maker}:{manufacturer:maker})}:{}),...fields,...(category?{category}:{}),origin:'commercial'};
 // The publisher is explicit on book listings; a retailer logo is never a maker.
 if(/書籍/.test(category)&&facts.brand&&!facts.publisher)facts.publisher=facts.brand;
 const image=attr(scope,'id','detail_detail__main_image_area')?.attrs['data-main-image']||attr(doc,'property','og:image')?.attrs.content||imageOf(cls(scope,'image_area')||scope,url);
 return [{title,description,image,images:[image].filter(Boolean),...(category?{categoryLabel:category}:{}),offer,facts,tags:['零售目录']}];
}
function boothList(doc:Element,url:string):Parsed[]{
 return all(doc,n=>hasClass(n,'item-card__wrap')).flatMap(n=>{const title=text(cls(n,'item-card__title')),link=first(n,x=>x.tag==='a'&&/\/items\/\d+/.test(x.attrs.href||''));if(!title||!link)return [];let detail:string;try{detail=safeUrl(new URL(link.attrs.href,url).href).href}catch{return [];}const body=text(n),offer=makeOffer(detail,body,yen(body));offer.shop=text(cls(n,'item-card__shop-name'));if(/[¥￥]\s*[\d,]+\s*[~〜～]/.test(body)){offer.price=null;offer.stockNote='包含多款或多种媒介，价格需打开具体版本核对';}const images=all(n,x=>x.tag==='a'&&!!x.attrs['data-original']).map(x=>x.attrs['data-original']).filter(u=>u.startsWith('https://')).slice(0,10),category=text(cls(n,'item-card__category'));return [{title,description:body,image:images[0]||'',images,offer,categoryLabel:category,facts:{origin:'doujin' as const,circle:offer.shop,category},provisional:true}];});
}
export function parseHtml(html:string,url:string){
 safeUrl(url);const doc=readHtml(html),host=new URL(url).hostname;let products:Parsed[];
 if(/(?:^|\.)booth\.pm$/.test(host))products=isDetailUrl(url)?genericDetail(html,url,doc):boothList(doc,url);else if(host.includes('mandarake'))products=mandarake(html,url,doc);else if(host==='www.suruga-ya.jp')products=surugaya(html,url,doc);else if(host==='jp.mercari.com')products=mercari(html,url,doc);else if(host==='auctions.yahoo.co.jp')products=yahooAuctions(html,url,doc);else if(host.includes('shopping.yahoo.co.jp'))products=yahooShopping(html,url,doc);else if(host==='online.aniplex.co.jp')products=isDetailUrl(url)?aniplexDetail(html,doc,url):aniplexList(doc,url);else if(host==='www.amiami.jp'||host==='slist.amiami.jp')products=amiami(html,doc,url);else products=genericDetail(html,url,doc);
 for(const p of products){p.offer.listingTitle=p.title;p.offer.extras=p.offer.extras?.length?p.offer.extras:offerExtras(p.title);}
 const seen=new Set<string>();products=products.filter(p=>{const key=offerKey(p.offer);if(!key)return true;if(seen.has(key))return false;seen.add(key);return true;});
 if(products.length===1&&isDetailUrl(url)){if(!host.includes('amiami')&&host!=='online.aniplex.co.jp')products[0].facts={...products[0].facts,...extractMetadata(html)};products[0].tags=[...new Set([...(products[0].tags||[]),...extractProductKeywords(html)])];}
 const anchors=all(doc,x=>x.tag==='a'),next=anchors.find(x=>!!x.attrs.href&&!/^(#|javascript:)/.test(x.attrs.href)&&(/\bnext\b/i.test(x.attrs.rel||'')||/^(次へ|次のページ|次|Next|下一页|›|»|>)$/i.test(text(x))));let nextUrl:string|null=null;
 if(!isDetailUrl(url)&&next?.attrs.href)try{const n=safeUrl(new URL(next.attrs.href,url).href);if(n.hostname===host&&n.href!==url)nextUrl=n.href;}catch{}
 if(host==='online.aniplex.co.jp'&&!isDetailUrl(url)){const more=first(doc,n=>n.tag==='button'&&!!n.attrs['data-url']&&/Search-UpdateGrid/.test(n.attrs['data-url']));if(more)nextUrl=safeUrl(new URL(more.attrs['data-url'],url).href).href;}
 if(host==='slist.amiami.jp'){const pager=cls(doc,'result_pagenavi'),a=pager&&(tag(cls(pager,'send_next')||{tag:'root',attrs:{},children:[]},'a')||all(pager,n=>n.tag==='a'&&!!n.attrs.href).find(n=>/次|>|›/.test(text(n))));if(a)try{nextUrl=safeUrl(new URL(a.attrs.href,url).href).href;}catch{}}
 const count=(host==='slist.amiami.jp'?text(cls(doc,'result_succeeded')).match(/([\d,]+)\s*件/)?.[1]:undefined)||text(doc).match(/([\d,]+)件中/)?.[1]||text(doc).match(/([\d,]+)\s*件の結果/)?.[1]||text(doc).match(/(?:全|検索結果|results?[:：]?)\s*([\d,]+)(?:\s*(?:件|items?|results?)|\s)/i)?.[1];
 const yahoo=host==='auctions.yahoo.co.jp'?yahooListingState(html,url,{products,next:nextUrl,total:count?Number(count.replaceAll(',','')):null}):null;if(yahoo){products=yahoo.products;nextUrl=yahoo.next;}
 return {products,next:nextUrl,total:yahoo?.total??(count?Number(count.replaceAll(',','')):null),partitions:searchPartitions(doc,url),needsBrowser:new URL(url).pathname.startsWith('/product/other/')||!products.length||host.includes('mandarake')&&isDetailUrl(url)&&!!cls(doc,'other_item')&&!text(cls(doc,'other_item'))};
}
export class SourceInteractionError extends Error {constructor(public code:'age_verification'|'login'|'captcha'|'browser_required',public sourceUrl:string,message:string){super(message);this.name='SourceInteractionError';}}
export function checkInteraction(html:string,url:string){const body=strip(html);
 if(/verify you are human|checking your browser|正在进行安全验证|自動プログラム|Just a moment|automated traffic|CAPTCHA認証|ロボットではないことを確認|アクセスが制限/i.test(body))throw new SourceInteractionError('captcha',url,'网站要求人机验证，已暂停此来源。请在原站完成验证后导入保存的页面。');
 // Mandarake embeds an inactive age-confirmation template on ordinary result pages too.
 // A page with actual product cards is readable; a gate with no products needs interaction.
 const productContent=/data-itemidx=["']\d+["']|["']@type["']\s*:\s*["']Product["']/.test(html);
 if(!productContent&&/18歳以上ですか|あなたは18歳|18歳未満の方は.{0,30}閲覧|年齢認証が必要|年齢確認を行|are you (?:over|at least) 18/i.test(body))throw new SourceInteractionError('age_verification',url,'来源需要确认已满 18 岁。请打开原站完成确认；云端采集会话与个人浏览器不共享，可导入确认后保存的 HTML。');
 const heading=strip(html.match(/<(?:h1|title)[^>]*>([\s\S]*?)<\/(?:h1|title)>/i)?.[1]||'');
 if(/ログイン|sign in|log in/i.test(heading)&&/<input[^>]*type=["']password/i.test(html))throw new SourceInteractionError('login',url,'来源要求登录；已暂停采集。请在原站查看并导入保存的页面。');
}
export async function fetchPublic(url:string){
 const original=safeUrl(url);let current=original;let response:Response|undefined;
 // Isolated anonymous cookie jar: never imports browser credentials or invents age-consent cookies.
 const jar:{name:string;value:string;domain:string;path:string}[]=[];
 async function request(target:URL){
  const cookie=jar.filter(c=>(target.hostname===c.domain||target.hostname.endsWith('.'+c.domain))&&target.pathname.startsWith(c.path)).map(c=>`${c.name}=${c.value}`).join('; ');
  const r=await fetch(target.href,{redirect:'manual',signal:AbortSignal.timeout(18000),headers:{'User-Agent':'CollectorRadar/0.4 (personal catalogue; low-rate metadata fetch)','Accept':'text/html,application/json','Accept-Language':'ja',...(cookie?{Cookie:cookie}:{})}});
  const cookies=typeof r.headers.getSetCookie==='function'?r.headers.getSetCookie():(r.headers.get('set-cookie')||'').split(/,(?=\s*[^;,=]+=[^;,]*)/);
  for(const raw of cookies){const segments=raw.split(';');const pair=segments[0].match(/^\s*([^=\s]+)=(.*)$/);if(!pair)continue;const domain=(segments.find(x=>/^\s*domain=/i.test(x))?.split('=')[1]?.trim().replace(/^\./,'')||target.hostname).toLowerCase();if(target.hostname!==domain&&!target.hostname.endsWith('.'+domain))continue;const path=segments.find(x=>/^\s*path=/i.test(x))?.split('=')[1]?.trim()||'/';const at=jar.findIndex(c=>c.name===pair[1]&&c.domain===domain&&c.path===path);if(at>=0)jar.splice(at,1);jar.push({name:pair[1],value:pair[2],domain,path});}
  return r;
 }
 let restarted=false;
 for(let n=0;n<6;n++){
  response=await request(current);
  if(response.status>=300&&response.status<400){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw new Error('来源返回空重定向');current=safeUrl(new URL(location,current).href);continue;}
  // Mandarake first visits set a visitor cookie on the homepage then expect the original URL again.
  if(!restarted&&original.hostname==='order.mandarake.co.jp'&&current.hostname==='www.mandarake.co.jp'&&current.pathname==='/'&&jar.length){const home=await response.text();checkInteraction(home,current.href);restarted=true;current=original;continue;}
  break;
 }
 if(!response)throw new Error('来源没有返回响应');
 if(Number(response.headers.get('content-length')||0)>4000000)throw new Error('页面过大');
 const reader=response.body?.getReader();if(!reader)throw new Error('来源返回空正文');let size=0;const chunks:Uint8Array[]=[];while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>4000000){await reader.cancel();throw new Error('页面超过 4 MB');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const raw=new TextDecoder().decode(bytes);const charset=response.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1]||raw.match(/charset=["']?([\w-]+)/i)?.[1]||'utf-8';const text=new TextDecoder(charset).decode(bytes);
 checkInteraction(text,current.href);if(!response.ok)throw new Error(`来源暂不可读取（HTTP ${response.status}）`);
 return{text,url:current.href};
}
