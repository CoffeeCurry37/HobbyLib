import {quoteComparison} from './price-comparison';
import {applyTitleCatalogue,catalogueKeywords,catalogueTitle,editionVariant} from './catalog';
import {availableOffers} from './identity';
import {Item,Offer,Prefs,Relation,State,EMPTY_FACTS} from './types';
import {FATE_TITLE_RE} from './recognition';
import {repairClassification} from './classification';
export const normalize=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[\s\u3000]+/g,' ').trim();
export const isBook=(title:string,category='')=>!(/^(?:グッズ|雑貨|キャラカード|缶バッジ|リボン|ストラップ|キーホルダー)/.test(category))&&/書籍|ライトノベル|小説|コミック|漫画|文庫|本・雑誌|同人誌|画集|book|ブック|material|設定資料|読本|図録|パンフレット|小冊子|雑誌|新書|ムック|エース|月姫想本|型月稿本/i.test(title+' '+category);
export const isSmallGoods=(title:string,category='')=>!isBook(title,category)&&/ポストカード|postcard|缶バッジ|バッジ|キーホルダー|しおり|ステッカー|リボン|ラバーストラップ|徽章|丝带|アクリルスタンド/i.test(title+' '+category);
export function classify(title:string,description='',price:number|null=null,threshold=1000){
 const t=title+' '+description, tags:string[]=[];
 const known: [RegExp,string][]=[[/type[-\s]?moon|タイプムーン/i,'TYPE-MOON'],[/fate\/grand order|fgo/i,'Fate/Grand Order'],[/fate\/stay night/i,'Fate/stay night'],[FATE_TITLE_RE,'Fate'],[/月姫/,'月姫'],[/空の境界/,'空の境界'],[/魔法使いの夜/,'魔法使いの夜'],[/ロード[・\s-]*エルメロイ|ファイヤーガール|月の珊瑚|鋼の大地|まほうつかいの箱|コハエース/,'TYPE-MOON'],[/武内崇/,'武内崇'],[/奈須きのこ/,'奈須きのこ'],[/同人誌|doujin/i,'同人誌'],[/画集|illustration|art ?book/i,'画集'],[/設定資料|material/i,'設定資料集'],[/特典|bonus/i,'特典'],[/限定|limited/i,'限定'],[/ポストカード|postcard/i,'ポストカード'],[/アクリル|acrylic/i,'アクリル'],[/コミケ|コミックマーケット|\bC\d{2,3}\b/i,'コミケ']];
 for(const [re,tag] of known)if(re.test(t))tags.push(tag);
 const bonusOnly=/特典のみ|特典単品|特典単体|bonus\s+only|(?:購入|入場|入場者|来場者|連動|店舗|予約)特典(?!付)|付録のみ|アレ本のみ/i.test(title)||/書籍.{1,100}の同梱冊子/.test(description)||/Fate\s*\/\s*EXTRA\s+material\s+WADARCO\s+Illustrations/i.test(title);
 const set=/全\d+種|セット|\bbox\b|complete set/i.test(title);
 const book=isBook(title)&&!(bonusOnly&&/缶バッジ|キーホルダー|リボン|ポストカード|しおり|アクリルスタンド/.test(title));
 const small=isSmallGoods(title)||(!book&&/缶バッジ|キーホルダー|リボン|ポストカード|しおり|アクリルスタンド/.test(title));
 const kind:Item['kind']=bonusOnly?'bonus':book&&!/セット|全\d+巻/.test(title)?'base':set?'set':book?'base':'unknown';
 const series=tags.find(x=>['Fate/Grand Order','Fate/stay night','月姫','空の境界','魔法使いの夜','Fate'].includes(x))||'';
 const year=t.match(/(?:発行|発売|刊行|出版|release|published|発行日)[^0-9]{0,8}((?:19|20)\d{2})/i)?.[1]||'';
 const isbn=t.match(/(?:ISBN[：:\s-]*)?(97[89](?:[-\s]?\d){10})/i)?.[1].replace(/[-\s]/g,'')||'';
 const category=book?'書籍':small?'グッズ':bonusOnly?'特典':set?'セット':'';
 return {brand:tags.includes('TYPE-MOON')?'TYPE-MOON':'',series,year,isbn,kind,category,tags,review:true,bucket:(small&&price!==null&&price<=threshold?'junk':'normal') as Item['bucket']};
}
export function createItem(title:string,description:string,offer:Offer|undefined,prefs:Prefs,image=''):Item{
 const inferred=classify(title,description,offer?.price??null,prefs.junkThreshold), now=new Date().toISOString();
 const whitelisted=prefs.rules.some(r=>r.type==='allow'&&normalize(title+' '+inferred.tags.join(' ')).includes(normalize(r.keyword)));
 const item=repairClassification(applyTitleCatalogue({...EMPTY_FACTS,schemaVersion:9,id:crypto.randomUUID(),title,description,image,...inferred,...(whitelisted?{bucket:'normal' as const}:{}),origin:/同人誌|doujin/i.test(title+' '+description)?'doujin':'unknown',msrp:null,ownership:'unknown',quantity:0,priority:50,rating:null,notes:'',evidence:[{field:'自动标签/分类',value:inferred.tags.join('、')||'缺少可识别关键词',url:offer?.url||'',at:now,method:'标题与简介规则，待人工确认'}],offers:offer?[{...offer,listingTitle:offer.listingTitle||title,variant:offer.variant||editionVariant(title)}]:[],createdAt:now}));item.tags=[...new Set([...item.tags,...catalogueKeywords(item)])].slice(0,50);const canonical=catalogueTitle(item);if(canonical!==title){item.aliases=[title];item.title=canonical;}return item;
}
export function learnWeights(items:Item[]):Record<string,number>{
 const rated=items.filter(i=>i.rating!==null&&!i.demo&&!i.archivedInto);const out:Record<string,number>={};
 const tags=[...new Set(rated.flatMap(x=>x.tags))];
 // Regularized additive model; neutral=3. Small datasets shrink towards zero.
 for(const tag of tags)out[tag]=0;
 for(let epoch=0;epoch<180;epoch++)for(const i of rated){
  const scale=Math.sqrt(Math.max(1,i.tags.length));
  const prediction=i.tags.reduce((s,t)=>s+(out[t]||0)/scale,0);
  const error=((i.rating as number)-3)*8-prediction;
  for(const t of i.tags)out[t]+=.018*(error/scale-.18*out[t]);
 }
 return out;
}
function scoringIndex(state:Pick<State,'items'|'relations'>){const items=new Map(state.items.map(i=>[i.id,i])),parts=new Map<string,Relation[]>();for(const r of state.relations)if(r.kind==='contains'){if(!parts.has(r.fromId))parts.set(r.fromId,[]);parts.get(r.fromId)!.push(r);}return {items,parts};}
export function scoreCatalogue(state:Pick<State,'items'|'relations'|'prefs'>,learned:Record<string,number>={}){const index=scoringIndex(state);return state.items.map(item=>({item,...scoreItem(item,state,learned,index)}));}
export function scoreItem(item:Item,state:Pick<State,'items'|'relations'|'prefs'>,learned:Record<string,number>={},index?:ReturnType<typeof scoringIndex>){
 const {prefs,items,relations}=state;const reasons:string[]=[];
 if(item.catalogueGroup)return {score:0,reasons:['逻辑系列档案，不是可购买商品'],blocked:false,missing:0,owned:0,unknown:0};
 const text=normalize(item.title+' '+item.tags.join(' '));
 const blocked=prefs.rules.some(r=>r.type==='block'&&text.includes(normalize(r.keyword)));
 if(blocked)return{score:0,reasons:['命中屏蔽规则'],blocked:true,missing:0,owned:0,unknown:0};
 let score=item.priority;reasons.push(`手动优先度 ${item.priority}`);
 let tagScore=0;
 for(const tag of item.tags)tagScore+=(prefs.tagWeights[tag]??learned[tag]??0)/Math.sqrt(Math.max(1,item.tags.length));
 if(tagScore){score+=tagScore;reasons.push(`标签偏好 ${tagScore>=0?'+':''}${Math.round(tagScore)}`);}
 const allow=prefs.rules.filter(r=>r.type==='allow'&&text.includes(normalize(r.keyword)));
 if(item.watchlisted){score=Math.max(score,85);reasons.push('愿望清单：商品白名单');}
 if(allow.length){score=Math.max(score,...allow.map(r=>r.priority));reasons.push('命中白名单');}
 const parts=(index?index.parts.get(item.id)||[]:relations.filter(r=>r.fromId===item.id&&r.kind==='contains')).map(r=>({r,item:index?index.items.get(r.toId):items.find(i=>i.id===r.toId)}));
 let missing=0,owned=0,unknown=0;
 for(const p of parts){if(!p.item||p.item.ownership==='unknown')unknown+=p.r.quantity;else {const have=p.item.ownership==='owned'?Math.min(p.r.quantity,p.item.quantity):0;owned+=have;missing+=p.r.quantity-have;}}
 if(item.ownership==='owned'){score-=65;reasons.push('此条目已拥有 −65');}
 else if(parts.length){
  const total=missing+owned+unknown;
  if(owned){const penalty=35*owned/total;score-=penalty;reasons.push(`套装重复 ${owned}/${total}，−${Math.round(penalty)}`);}
  if(missing){score+=15*missing/total;reasons.push(`可补齐 ${missing} 件`);}
  if(unknown)reasons.push(`${unknown} 件拥有状态未标记`);
  if(owned===total){score=0;reasons.push('套装组件已全部拥有');}
 }else if(item.ownership==='missing'){score+=10;reasons.push('明确未购买 +10');}
 if(item.kind==='set'&&!parts.length)reasons.push('套装组件未整理，尚不能计算重复比例');
 if(item.review)reasons.push('分类待确认');
 if(item.bucket==='junk'){score-=20;reasons.push('小垃圾/凑单 −20');}
 const current=availableOffers(item).filter(o=>o.priceKind==='ask'&&o.priceBasis==='tax_included'&&!item.provisional).sort((a,b)=>(a.price??Infinity)-(b.price??Infinity))[0];
 if(availableOffers(item).length)reasons.push('JPY 挂价；成色、附件与税费口径需逐项比较，国内/国际运费、服务费及适用税费未计，不代表成交价或最低到手价');
 if(current){const past=current.history.filter(h=>(h.priceBasis||'unspecified')===(current.priceBasis||'unspecified')).map(x=>x.price).filter((x):x is number=>x!==null);const max=Math.max(0,...past);if(max>0&&current.price!==null&&current.price<max){const n=Math.min(15,15*(max-current.price)/max);score+=n;reasons.push(`该挂牌较同税费口径历史高价下降 ${Math.round((max-current.price)/max*100)}%`);}}
 return{priceComparison:quoteComparison(item),identityReliable:!item.provisional&&(!item.matchDecision||item.matchDecision.status==='matched'),score:Math.max(0,Math.min(100,Math.round(score))),reasons,blocked:false,missing,owned,unknown};
}
export {suggestMatches,automaticRelations,relationKey} from './relations';
export function translate(title:string,prefs:Prefs){if(prefs.language==='ja')return title;let out=title;for(const [ja,zh] of Object.entries(prefs.glossary).sort((a,b)=>b[0].length-a[0].length))out=out.replaceAll(ja,zh);return out;}
export function relationCycle(from:string,to:string,relations:Relation[]){const seen=new Set<string>();function visit(id:string):boolean{if(id===from)return true;if(seen.has(id))return false;seen.add(id);return relations.filter(x=>x.kind==='contains'&&x.fromId===id).some(x=>visit(x.toId));}return visit(to);}
