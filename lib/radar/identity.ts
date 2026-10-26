import {stripOfferDecorations,cleanProductTitle,extraMaterialMaster,sequenceKey,numberToken,canonicalBrand,bookMedium,manualField} from './catalog';
import {Item,Offer} from './types';
import {primaryMedium} from './product-features';
import {sourceCategory} from './source-category';
import {gamePlatforms} from './game-platform';
import {canonicalEvent} from './event-name';
import {kujiKey,kujiIdentity,resolveKuji} from './kuji-key';
import {literalProductName,physicalBookCode,sameCircle,explicitAgeRating,bookPublisher} from './identity-facts';
import {collectionIdentity,assortmentCard} from './collection-facts';
export const IDENTITY_RULE_VERSION=21;
export function listingKey(raw:string){
 try{const u=new URL(raw);let id=u.pathname.replace(/^\/(?:en|zh-TW|zh-CN)(?=\/)/,'');
  if(u.hostname.includes('mandarake'))return 'mandarake:'+u.searchParams.get('itemCode');
  if(u.hostname==='www.suruga-ya.jp')return 'surugaya:'+id+':'+(u.searchParams.get('tenpo_cd')||'main');
  if(u.hostname==='jp.mercari.com')return 'mercari:'+id;
  if(u.hostname==='auctions.yahoo.co.jp')return 'yahoo-auction:'+id;
  if(u.hostname==='store.shopping.yahoo.co.jp')return 'yahoo-shopping:'+id;
  if(u.hostname==='online.aniplex.co.jp'){const variants=[...u.searchParams].filter(([k])=>/^dwvar_/.test(k)).sort();return u.hostname+id+(variants.length?'?'+new URLSearchParams(variants):'');}
  if(u.hostname==='www.amiami.jp'||u.hostname==='www.amiami.com')return 'amiami:'+(u.searchParams.get('gcode')||u.searchParams.get('scode')||id);
  return u.hostname+id+(u.pathname.includes('/search/')?'?'+u.searchParams:'');
 }catch{return raw;}
}
export const offerKey=(o:Offer)=>{try{const u=new URL(o.url);if(u.hostname==='online.aniplex.co.jp'&&o.variant&&/^\d{3}$/.test(o.variant)){const pid=u.pathname.slice(1,-5);u.search='';u.searchParams.set('dwvar_'+pid+'_variationNo',o.variant);return listingKey(u.href);}}catch{}return listingKey(o.url)||o.source+':'+o.id;};
const roman:Record<string,string>={i:'1',ii:'2',iii:'3',iv:'4',v:'5',vi:'6',vii:'7',viii:'8',ix:'9',x:'10',xi:'11',xii:'12',xiii:'13',xiv:'14',xv:'15',xvi:'16',xvii:'17',xviii:'18',xix:'19',xx:'20'};
export function productName(title:string){
 let s=(extraMaterialMaster(title)||cleanProductTitle(title)).normalize('NFKC').toLowerCase().replace(/type[\s\-―ー–]+moon|タイプムーン/g,'type-moon');
 // Condition, obi and included/missing extras are offer properties. Editions/volumes stay in the key.
 s=s.replace(/<<[^>]*>>/g,'').replace(/(?:^|[【[(\s])ランク\s*[a-d]\)?/gi,' ').replace(/\b(?:新品未開封|新品未読品|未開封|美品|中古|お値下げ)\b/g,'');
 s=s.replace(/[（(【\[]?(?:帯[付付き有欠無なし]+|特典[付付き有欠無なし]+|付録欠|完品)[）)】\]]?/g,'').replace(/!!\)/g,'');
 for(let n=0;n<6;n++){const old=s;s=s.replace(/^(?:アニメムック|パンフレット|ライトノベル(?:\(文庫\))?|漫画|コミック|攻略本|type-moon(?=\s)|kadokawa|aniplex|delight\s*works|角川書店|エンターブレイン|宙出版|fox出版|講談社|スタジオdna|学習研究社|パンフレット)\s*/i,'').trim();if(s===old)break;}
 s=s.replace(/\b([ivx]+)\b/g,x=>String(numberToken(x)??x)).replace(/(\d+)\s+(\d+)(?=\s|$|[()])/g,(whole,left,right)=>Number(left)===Number(right)?left:whole);
 return s.replace(/\s*([,、]?\s*(?:送料無料|送料込み|即購入可|即購入OK))\s*$/gi,'').replace(/[\s\p{P}\p{S}]+/gu,'');
}
function part(i:Item){if(i.catalogueGroup)return 'catalogue';const k=resolveKuji(i);if(k&&k.prize.packPieces>1&&k.slot&&!k.full&&!i.kuji?.catalogueGroup)return 'base';if(/特典のみ|特典単品|特典単体|付録のみ|アレ本のみ|(?:購入|店舗|入場|入場者|来場者|連動)特典(?!付)/i.test(i.title)||i.kind==='bonus')return 'bonus';if(/セット|まとめ売り|全\d+巻|全\d+種/i.test(i.title)||i.kind==='set')return 'set';if(i.kind==='component')return 'component';return 'base';}
function edition(title:string){return [...title.normalize('NFKC').matchAll(/初版|改訂版|新装版|限定版|通常版|特装版|電子書籍|全年齢版|一般向け版|成人向け版|STANDARD\s+EDITIO(?:N)?|LIMITED\s+EDITION|上巻|下巻|前編|後編/gi)].map(m=>m[0].toUpperCase()).sort().join('|');}
const sourceMedium=(item:Item)=>{const medium=primaryMedium(item);if(medium==='book'||!sourceCategory(item).explicit&&bookMedium(item))return 'book';if(medium==='music')return 'cd';if(medium==='game')return 'game';if(!medium&&sourceCategory(item).explicit)return '';const raw=[item.title,...(item.aliases||[]),...item.offers.map(o=>o.listingTitle||''),item.category].join(' ');return /DVD-ROM|ゲーム/i.test(raw)?'game':/Blu[- ]?ray|ブルーレイ|\bBD\b/i.test(raw)?'bd':/DVD/i.test(raw)?'dvd':'';};
export function sameProduct(a:Item,b:Item):string|null{
 if(a.demo||b.demo||part(a)!==part(b))return null;
 const acatalogue=collectionIdentity(a),bcatalogue=collectionIdentity(b);if(acatalogue&&bcatalogue&&acatalogue!==bcatalogue)return null;if(a.catalogueGroup||b.catalogueGroup)return a.catalogueGroup&&b.catalogueGroup&&!!acatalogue&&acatalogue===bcatalogue?'同一系列档案':null;
 const ka=kujiKey(a),kb=kujiKey(b);
 if(ka&&kb&&(ka.campaign!==kb.campaign||ka.award!==kb.award||ka.group!==kb.group))return null;
 const amedium=sourceMedium(a),bmedium=sourceMedium(b);if(amedium&&bmedium&&amedium!==bmedium)return null;
 if(amedium==='book'&&bmedium==='book'){const am=bookMedium(a),bm=bookMedium(b);if(am&&bm&&am!==bm)return null;}
 if(amedium==='game'&&bmedium==='game'){const ap=gamePlatforms(a),bp=gamePlatforms(b);if(ap.length&&bp.length&&!ap.some(p=>bp.includes(p)))return null;}
 const scopedVariants=(i:Item)=>i.offers.filter(o=>o.url.startsWith('https://online.aniplex.co.jp/')&&o.variant&&/^\d{3}$/.test(o.variant!));const av=scopedVariants(a),bv=scopedVariants(b);if(av.some(o=>bv.some(p=>new URL(o.url).pathname===new URL(p.url).pathname))&&!av.some(o=>bv.some(p=>offerKey(o)===offerKey(p))))return null;
 if(a.event&&b.event&&canonicalEvent(a.event)!==canonicalEvent(b.event))return null;
 if(a.saleForm&&b.saleForm&&a.saleForm!==b.saleForm&&[a.saleForm,b.saleForm].some(f=>f==='variant_group'||f==='complete_goods'))return null;
 if(acatalogue&&acatalogue===bcatalogue)return '已核对的发行系列与款式编号一致';
 const family=extraMaterialMaster(a.title)&&extraMaterialMaster(b.title);
 if(!family&&(a.isbn&&b.isbn&&a.isbn!==b.isbn||a.jan&&b.jan&&a.jan!==b.jan))return null;
 if(!family&&edition(a.title)!==edition(b.title)&&!(amedium==='game'&&bmedium==='game'&&a.jan==='4976219026338'&&a.jan===b.jan&&[a,b].every(i=>/MEGAMORI BOX/i.test(i.title)&&!/通常版/.test(i.title))))return null;
 if(a.circle&&b.circle&&!sameCircle(a,b))return null;
 if(a.origin==='doujin'&&b.origin==='doujin'&&a.series&&b.series&&a.series!==b.series&&!['Fate','Fate 综合','Fateシリーズ','TYPE-MOON','その他 TYPE-MOON'].includes(a.series)&&!['Fate','Fate 综合','Fateシリーズ','TYPE-MOON','その他 TYPE-MOON'].includes(b.series))return null;
 if(ka?.known&&kb?.known&&ka.campaign===kb.campaign&&ka.award===kb.award&&ka.group===kb.group&&(ka.group||ka.count===1||ka.variant&&ka.variant===kb.variant))return '来源目录确认同一期同赏同款（JAN 不作为一番赏身份）';
 if(a.offers.some(o=>b.offers.some(p=>offerKey(o)===offerKey(p))))return '相同挂牌编号且组件、版本无冲突';
 const left=productName(a.title),right=productName(b.title),ak=sequenceKey(a),bk=sequenceKey(b);
 if(a.origin==='doujin'&&b.origin==='doujin'&&sameCircle(a,b)&&left.length>=2&&(left===right||literalProductName(a.title)===literalProductName(b.title))){
  const aa=explicitAgeRating(a),ba=explicitAgeRating(b);if(aa&&ba&&aa!==ba)return null;
  return '同人社团、作者与作品名一致；默认分级不作为版本差异';
 }
 const ac=amedium==='book'?physicalBookCode(a):'',bc=bmedium==='book'?physicalBookCode(b):'';
 if(ac&&bc){if(ac!==bc)return null;return '同一实体书 ISBN（兼容 ISBN 存入 JAN 字段）';}
 if(amedium==='book'||bmedium==='book'){const ap=bookPublisher(a),bp=bookPublisher(b);if(ap&&bp&&ap!==bp)return null;}
 if(amedium==='book'&&bmedium==='book'&&left.length>=8&&left===right&&!(['productLine','wave'] as const).some(k=>(manualField(a,k)||manualField(b,k))&&a[k]!==b[k])){
  const ap=bookPublisher(a),bp=bookPublisher(b);if(ap&&bp&&ap===bp)return '完整书名及出版社一致；忽略旧自动产品线差异';
 }
 if(ak&&ak===bk){const ap=bookPublisher(a),bp=bookPublisher(b);if(ap&&bp&&ap!==bp)return null;const am=bookMedium(a),bm=bookMedium(b);if(am&&bm&&am!==bm)return null;return '产品线与卷号一致（罗马数字/阿拉伯数字统一；版本、出版社、媒介无冲突）';}
 if(a.isbn&&a.isbn===b.isbn&&/^97[89]\d{10}$/.test(a.isbn))return 'ISBN 一致且组件、版本无冲突';
 // Kuji cartons can share one JAN across every prize/design. It is never a prize identity.
 if(!ka&&!kb&&!assortmentCard(a)&&!assortmentCard(b)&&a.jan&&a.jan===b.jan)return 'JAN 一致且组件、版本无冲突';
 // A franchise plus a generic product type does not identify the illustration.
 const genericGoods=(title:string)=>/^(?:fategrandorder|fgo)(?:[ab][0-9])?(?:タペストリー|クリアファイル|アクリルスタンド|ポストカード|缶バッジ|ステッカー)$/.test(productName(title));
 if(genericGoods(a.title)&&genericGoods(b.title))return null;
 if(a.productLine&&b.productLine&&productName(a.productLine)!==productName(b.productLine)||a.wave&&b.wave&&a.wave!==b.wave)return null;
 if(left.length>=8&&(left===right||(a.aliases||[]).some(x=>productName(x)===right)||(b.aliases||[]).some(x=>productName(x)===left)))return '完整名称一致（保留卷号、版本和组件区别）';
 // Catalog identifiers are scoped to the source, not assumed to be globally unique.
 const common=a.offers.some(o=>o.productKey&&b.offers.some(p=>o.source===p.source&&o.productKey===p.productKey));
 if(common&&similarity(left,right)>.85)return '来源商品编号一致且名称、版本相符';
 return null;
}
export function productIndex(items:Item[]){const keys=new Map<string,Map<string,Item>>();const itemKeys=(i:Item)=>[...(collectionIdentity(i)?['collection:'+collectionIdentity(i)]:[]),...i.offers.map(o=>'listing:'+offerKey(o)),...[i.title,...(i.aliases||[])].map(t=>'title:'+productName(t)),...(i.isbn?['isbn:'+i.isbn]:[]),...(i.jan?['jan:'+i.jan]:[]),...(sequenceKey(i)?['sequence:'+sequenceKey(i)]:[]),...kujiIdentity(i),...(i.origin==='doujin'?['literal:'+literalProductName(i.title)]:[]),...(physicalBookCode(i)?['book-code:'+physicalBookCode(i)]:[])];
 const add=(i:Item)=>{if(i.archivedInto||i.demo)return;for(const key of itemKeys(i)){if(!keys.has(key))keys.set(key,new Map());keys.get(key)!.set(i.id,i);}};for(const item of items)add(item);return {add,lookup:(i:Item)=>[...new Map(itemKeys(i).flatMap(key=>[...(keys.get(key)?.values()||[])]).map(i=>[i.id,i])).values()]};
}
export function findProduct(items:Item[],candidate:Item,index?:ReturnType<typeof productIndex>){
 const active=(index?index.lookup(candidate):items).filter(i=>!i.archivedInto&&!i.demo);
 const byListing=active.filter(i=>candidate.offers.some(o=>i.offers.some(x=>offerKey(x)===offerKey(o))));
 if(byListing.length)return {item:canonicalItem(byListing),reason:'相同挂牌编号'};
 const matches=strongestProductMatches(candidate,active.filter(i=>sameProduct(i,candidate)));return matches.length&&matches.every(i=>sameProduct(i,matches[0])||i.id===matches[0].id)?{item:canonicalItem(matches),reason:sameProduct(matches[0],candidate)!}:null;
}
// Broad aliases may match several incompatible targets. A verified identifier
// must still select its own edition; every candidate has already passed the
// platform, edition, medium, component and Kuji conflict checks in sameProduct.
export function strongestProductMatches(candidate:Item,matches:Item[]){
 const priority=(i:Item)=>candidate.offers.some(o=>i.offers.some(p=>offerKey(o)===offerKey(p)))?3:candidate.isbn&&candidate.isbn===i.isbn&&/^97[89]\d{10}$/.test(candidate.isbn)?2:candidate.jan&&candidate.jan===i.jan&&!kujiKey(candidate)&&!kujiKey(i)?1:0;
 const ranked=matches.map(i=>({i,rank:priority(i)})),best=Math.max(0,...ranked.map(x=>x.rank));return ranked.filter(x=>x.rank===best).map(x=>x.i);
}
export function canonicalItem(items:Item[]){return [...items].sort((a,b)=>Number(b.ownership==='owned')-Number(a.ownership==='owned')||Number(!!b.locked)-Number(!!a.locked)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))[0];}
export function similarity(a:string,b:string){const grams=(s:string)=>new Set(Array.from({length:Math.max(0,s.length-1)},(_,i)=>s.slice(i,i+2)));const aa=grams(a),bb=grams(b);return 2*[...aa].filter(x=>bb.has(x)).length/Math.max(1,aa.size+bb.size);}
export function duplicateCandidates(items:Item[],excluded=new Set<string>()){const active=items.filter(i=>!i.archivedInto&&!i.demo),out:{fromId:string;toId:string;reason:string;exact:boolean}[]=[],seen=new Set<string>();
 const buckets=new Map<string,Item[]>();for(const i of active){const name=productName(i.title);for(const key of new Set([...(collectionIdentity(i)?['collection:'+collectionIdentity(i)]:[]),part(i)+':title:'+name,...(i.isbn?['isbn:'+i.isbn]:[]),...(i.jan?['jan:'+i.jan]:[]),...(sequenceKey(i)?['sequence:'+sequenceKey(i)]:[]),part(i)+':near:'+(i.productLine||name.slice(0,10))])){if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(i);}}
 // Exact identities get the full result budget before broad, capped suggestions.
 // Otherwise an early popular series can fill the list and hide later duplicates.
 for(const near of [false,true])for(const [key,bucket] of buckets){if(key.includes(':near:')!==near)continue;const list=near?bucket.slice(0,100):bucket;for(let a=0;a<list.length;a++)for(let b=a+1;b<list.length;b++){
 const x=list[a],y=list[b],pair=[x.id,y.id].sort().join(':');if(seen.has(pair)||part(x)!==part(y)||excluded.has(x.id+':'+y.id)||excluded.has(y.id+':'+x.id))continue;const reason=sameProduct(x,y);if(!near&&!reason)continue;seen.add(pair);const close=reason?1:similarity(productName(x.title),productName(y.title));if(reason||close>.88)out.push({fromId:x.id,toId:y.id,reason:reason||'名称相近；请核对卷号、版本和特典，不能自动合并',exact:!!reason});if(out.length>=100)return out;
 }}return out;
}
export const availableOffers=(i:Item,now=Date.now())=>i.offers.filter(o=>o.availability==='available'&&!!o.verifiedAt&&now-Date.parse(o.verifiedAt)>=0&&now-Date.parse(o.verifiedAt)<86400000&&o.price!==null&&o.priceKind!=='closed');
export function updateOffer(old:Offer|undefined,next:Offer):Offer{
 if(!old)return next;if(Date.parse(next.observedAt)<Date.parse(old.observedAt))return old;
 // A partial/list fetch cannot erase better detail facts, but a new sold observation takes effect immediately.
 const weaker=next.observation==='list'&&!!old.verifiedAt;
 const history=[...old.history];if(old.price!==next.price&&old.price!==null)history.push({price:old.price,at:old.observedAt,priceBasis:old.priceBasis});
 const different=old.price!==next.price||next.availability!==old.availability;
 return {...old,...next,stockEpoch:(old.stockEpoch||0)+(old.availability==='sold'&&next.availability==='available'?1:0),...(next.availability==='unknown'&&old.availability==='sold'?{availability:'sold' as const}:{}),...(weaker?{condition:old.condition,shop:next.shop||old.shop,verifiedAt:different?undefined:old.verifiedAt,observation:different?'list':old.observation}:{}),history:history.slice(-100)};
}

export function stockSummary(item:Item){const confirmed=availableOffers(item),listed=item.offers.filter(o=>o.availability==='available'),sold=item.offers.filter(o=>o.availability==='sold');
 const status=confirmed.length?'confirmed':listed.length?'listed':item.offers.length&&sold.length===item.offers.length?'sold':'unknown';
 return {status,label:status==='confirmed'?'已复核在售':status==='listed'?'有货记录 · 待复核':status==='sold'?'售罄（最近记录）':'库存待核对',confirmed:confirmed.length,listed:listed.length,sold:sold.length,unknown:item.offers.length-listed.length-sold.length};
}
