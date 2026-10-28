import type {Item,Offer,Relation,State} from './types';
import {bookHierarchy,bookMedium,canonicalBrand,cleanProductTitle,numberedProduct,numberToken,sortByNumber} from './catalog';
import {repairClassification} from './classification';
import {createItem} from './engine';
import {availableOffers,stockSummary} from './identity';
import {relationKey} from './relations';
import {saleForm} from './product-features';
import {gamePackage} from './game-packages';
import {findProduct,productIndex} from './identity';

const normal=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}]+/gu,'');
const publisher=(i:Item)=>canonicalBrand(i.publisher||i.brand).replace(/ BOOKS$/i,'');
const edition=(i:Item)=>i.title.normalize('NFKC').match(/新装版|改訂版|復刻版|電子書籍|特装版/)?.[0]||'';
const book=(i:Item)=>!!bookMedium(i)||/書籍|本|コミック|ムック|material|文庫|巻セット/i.test(i.category+' '+i.title);
export function setVolumes(item:Item):{line:string;volumes:number[]}|null{
 if(item.kind!=='set')return null;const title=cleanProductTitle(item.title).split(/\s+\/\s+/)[0];
 const range=title.match(/^(.*?)\s*(?:第|vol\.?\s*)?([IVX]+|\d{1,3})\s*[~〜～−-]\s*([IVX]+|\d{1,3})\s*(?:巻|冊|号)?\s*(?:全\d+巻\s*)?セット/i);
 if(range){const from=numberToken(range[2]),to=numberToken(range[3]);if(from===null||to===null||to<from||from<1||to-from>=100)return null;return {line:range[1].trim(),volumes:Array.from({length:to-from+1},(_,n)=>n+from)};}
 const list=title.match(/^(.*?)\s*([IVX]+|\d{1,3})(?:\s*[・、,]\s*(?:[IVX]+|\d{1,3}))+\s*(?:巻)?セット/i);
 if(list){const numbers=list[0].slice(list[1].length).match(/[IVX]+|\d{1,3}/gi)||[],volumes=numbers.map(numberToken).filter((n):n is number=>n!==null&&n>0);return volumes.length>1?{line:list[1].trim(),volumes:[...new Set(volumes)].sort((a,b)=>a-b)}:null;}
 const all=title.match(/^(.*?)\s*全(\d{1,2})巻(?:セット)?/);return all&&Number(all[2])>0?{line:all[1].trim(),volumes:Array.from({length:Number(all[2])},(_,n)=>n+1)}:null;
}
// Only verified finished editions, or an explicit source statement of completion, qualify.
// Sources: typemoon.com/book/typemoonbooks; typemoon.com/event/c73/;
// kodansha.co.jp/book/products/0000025585. Fake 1–9 is not confirmed complete.
export function setPolicy(item:Item):{mode:'permanent'|'lot';reason:string}{
 if(item.catalogueGroup)return {mode:'permanent',reason:'系列档案；成员的拥有状态分别记录'};
 if(item.kuji?.catalogueGroup)return {mode:'permanent',reason:'已核验赏级目录；已知单款分别记录，未确认款式保留空位'};
 if(item.setMode)return {mode:item.setMode,reason:'人工指定套装展示方式'};
 if(saleForm(item)==='complete_goods')return {mode:'permanent',reason:'商品名称明确标示全部款式的完整套装'};
 if(saleForm(item)==='game_bundle')return {mode:'permanent',reason:'游戏限定版原始捆绑发行'};
 const range=setVolumes(item),medium=bookMedium(item),pub=publisher(item),t=item.title+' '+item.description;
 if(/\d+冊セット仕様|\d+冊組|セットで(?:発行|頒布|販売)/.test(t))return {mode:'permanent',reason:'来源明确标示原始捆绑发行规格'};
 if(/限定セット/.test(item.title)&&/同梱内容/.test(item.description))return {mode:'permanent',reason:'官方明确列出限定套装的原始捆绑内容'};
 if(range&&medium!=='manga'){
  const line=normal(range.line),last=range.volumes.at(-1),complete=range.volumes[0]===1&&range.volumes.length===last;
  if(complete&&(line===normal('ロード・エルメロイII世の事件簿')&&last===10||line===normal('Fate/Apocrypha')&&last===5||line===normal('ファイヤーガール')&&last===7||line===normal('Fate/Zero')&&(pub==='TYPE-MOON'&&last===4||/星海社|講談社/.test(pub)&&last===6)))return {mode:'permanent',reason:'已核实完结版本的全卷套装'};
 }
 if(book(item))return /完結|完结|最終巻.*(?:全巻|セット)/.test(t)?{mode:'permanent',reason:'来源明确标示已完结全集'}:{mode:'lot',reason:'完结范围尚未核实；按在售拼套展示'};
 if(/同梱|限定セット|特装セット|BOX|全\d+種|コンプリート|フルコンプ|complete set|メーカー.*セット|セット商品|セットで(?:発行|頒布|販売)/i.test(t))return {mode:'permanent',reason:'来源明确标示原本捆绑销售的套装'};
 return {mode:'lot',reason:'未确认原始捆绑规格；按在售拼套展示'};
}
export function visibleSet(item:Item){return item.kind!=='set'||setPolicy(item).mode==='permanent';}
export function stockedLot(item:Item){return item.kind==='set'&&setPolicy(item).mode==='lot'&&stockSummary(item).listed>0;}

export function inferSetMembers(state:State):{items:Item[];relations:Relation[];ambiguous:number}{
 const created:Item[]=[],links:Relation[]=[],index=new Map<string,Item[]>(),existing=new Set(state.relations.map(relationKey)),dismissed=new Set(state.prefs.dismissedRelations);let ambiguous=0;
 const add=(i:Item)=>{if(i.kind==='set'||i.kind==='bonus'||i.demo||i.archivedInto)return;const facts=book(i)?bookHierarchy(i):{},volume=numberToken(facts.wave||'');const n=numberedProduct(i.title)||(facts.productLine&&volume!==null?{line:facts.productLine,number:volume,known:true}:null);if(!n||!n.known&&!book(i))return;const key=normal(n.line)+':'+n.number;if(!index.has(key))index.set(key,[]);index.get(key)!.push(i);};state.items.forEach(add);
 const allIds=new Set([...state.items,...(state.archived||[])].map(i=>i.id));
 const indexProducts=productIndex(state.items);
 for(const set of state.items){const spec=gamePackage(set);if(!spec||set.kind!=='set')continue;
  for(const member of spec.names){const candidate={...createItem(member.title,'官方游戏限定版的独立组件；单件库存、价格与拥有状态待核对。',undefined,state.prefs),kind:'base' as const,category:member.category,series:'Fate/EXTRA',origin:'commercial' as const};
   let item=findProduct(state.items,candidate,indexProducts)?.item;
   if(!item){item=repairClassification({...candidate,id:'game-member-'+stableId(member.title),inferredMember:true,evidence:[{field:'套装成员',value:member.title,url:spec.url,at:new Date().toISOString(),method:'发行商官网明确同梱内容'}]});if(allIds.has(item.id)){ambiguous++;continue;}created.push(item);indexProducts.add(item);allIds.add(item.id);}
   const r:Relation={id:'set-member-'+stableId(set.id+':'+item.id),fromId:set.id,toId:item.id,kind:'contains',quantity:1},key=relationKey(r);if(existing.has(key)||dismissed.has(key))continue;links.push(r);existing.add(key);
  }
 }
 for(const set of state.items){if(set.provisional||set.kind!=='set'||set.demo)continue;const range=setVolumes(set);if(!range||!range.line||!book(set))continue;const medium=bookMedium(set),pub=publisher(set);
  for(const volume of range.volumes){const key=normal(range.line)+':'+volume;const options=(index.get(key)||[]).filter(i=>(!pub||!publisher(i)||pub===publisher(i))&&(!medium||!bookMedium(i)||medium===bookMedium(i))&&edition(set)===edition(i));
   if(options.length>1){ambiguous++;continue;}let item=options[0];
   if(!item){const itemId='member-'+stableId([normal(range.line),pub,medium,edition(set),volume].join(':'));if(allIds.has(itemId)){ambiguous++;continue;}
    item={...createItem(range.line+' '+volume,'根据套装明确刊载的卷号建立；单卷资料与报价待来源核对。',undefined,state.prefs),id:itemId,schemaVersion:9,inferredMember:true,kind:'base',category:medium==='novel'?'ライトノベル':medium==='manga'?'コミック':/CD|サウンドトラック/i.test(range.line)?'音楽CD':/Blu-ray|DVD|BD|映像/i.test(range.line)?'映像ソフト':'書籍',brand:set.brand,publisher:set.publisher,series:set.series,origin:set.origin,productLine:range.line,wave:String(volume),member:range.line+' '+volume,offers:[],ownership:'unknown',quantity:0,review:true,evidence:[{field:'套装成员',value:set.title,url:set.offers[0]?.url||'',at:new Date().toISOString(),method:'原标题明确列出卷号；不推定单卷价格、发售日期或拥有状态'}]};
    item=repairClassification(item);created.push(item);add(item);allIds.add(item.id);
   }
   const r:Relation={id:'set-member-'+stableId(set.id+':'+item.id),fromId:set.id,toId:item.id,kind:'contains',quantity:1},rk=relationKey(r);if(existing.has(rk)||dismissed.has(rk))continue;links.push(r);existing.add(rk);
  }
 }
 return {items:created,relations:links,ambiguous};
}
function stableId(s:string){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
export function setMembers(set:Item,state:Pick<State,'items'|'relations'>){const byId=new Map(state.items.map(i=>[i.id,i]));return sortByNumber(state.relations.filter(r=>r.kind==='contains'&&r.fromId===set.id).flatMap(r=>byId.has(r.toId)?[{item:byId.get(r.toId)!,quantity:r.quantity}]:[]),r=>r.item);}
export function ownershipSummary(set:Item,state:Pick<State,'items'|'relations'>){const members=setMembers(set,state);let owned=0,total=0,unmarked=0;for(const r of members){total+=r.quantity;owned+=r.item.ownership==='owned'?Math.min(r.quantity,Math.max(1,r.item.quantity)):0;if(r.item.ownership==='unknown')unmarked+=r.quantity;}const missing=total-owned-unmarked;return {members,total,owned,missing,unmarked,status:total?owned===total?'owned':owned>0?'partial':unmarked===total?'unknown':'missing':set.ownership,label:total?owned===total?'全部拥有':owned>0?`部分拥有 ${owned}/${total}`:`明确缺少 ${missing} 件；${unmarked} 件拥有状态未知`:'成员待核对'};}
export function memberLots(item:Item,state:Pick<State,'items'|'relations'>){const parents=new Set(state.relations.filter(r=>r.kind==='contains'&&r.toId===item.id).map(r=>r.fromId));return state.items.filter(i=>parents.has(i.id)&&stockedLot(i));}
export type PurchaseComparison={complete:boolean;individualTotal:number|null;bundlePrice:number|null;overlap:number;bundle:Offer|null;missing:{item:Item;needed:number;offer:Offer|null;price:number|null}[];scope:string};
export function compareSet(set:Item,state:Pick<State,'items'|'relations'>):PurchaseComparison{
 const summary=ownershipSummary(set,state),missing=summary.members.filter(r=>r.item.ownership!=='owned'||Math.max(1,r.item.quantity)<r.quantity).map(r=>{const needed=r.quantity-(r.item.ownership==='owned'?Math.max(1,r.item.quantity):0),offer=availableOffers(r.item).filter(o=>o.priceKind==='ask'&&o.bonus!=='only').sort((a,b)=>a.price!-b.price!)[0]||null;return {item:r.item,needed,offer,price:offer?offer.price!*needed:null};});
 const complete=summary.total>0&&summary.unmarked===0&&missing.every(r=>r.offer),bundle=availableOffers(set).filter(o=>o.priceKind==='ask').sort((a,b)=>a.price!-b.price!)[0]||null;
 return {complete,individualTotal:complete?missing.reduce((sum,r)=>sum+r.price!,0):null,bundlePrice:bundle?.price??null,overlap:summary.owned,bundle,missing,scope:'仅比较 24 小时内详情复核的即时售价；运费、跨店费用及成色差异另计'};
}
