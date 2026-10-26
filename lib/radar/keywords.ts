import type {Item} from './types';
import {cleanProductTitle,manualField} from './catalog';
import {activityName,goodsType,saleForm,primaryMedium,SALE_FORM_NAMES} from './product-features';

const phrases=['アクリルスタンド','アクリルキーホルダー','クリアファイル','ポストカード','トレーディングカード','霊基召喚缶バッジ','缶バッジ','ポートレイトコレクション','キャラバッジコレクション','ブロマイド','タペストリー','メインビジュアル','描き下ろし','最終再臨','通常版','初回限定版','完全生産限定版','限定版','セイバー','アーチャー','ランサー','ライダー','キャスター','アサシン','バーサーカー','アルトリア','ギルガメッシュ','マシュ','ジャンヌ','遠坂凛','間桐桜','衛宮士郎','Fate/EXTELLA','Fate/EXTRA','Fate/Grand Order','Fate/stay night'];
const stop=new Set(['Fate','Grand','Order','night','stay','TYPE','MOON','セット','商品','のみ','あり','なし','中古','状態','全','種','通常','限定','年','巻','作者','本','付','版','の','に','は','を','と','で','が','も','へ','A','B','C','D','II','III','IV','VI','VII','VIII','IX']);
const segmenter=new Intl.Segmenter('ja',{granularity:'word'});
const tokenCache=new Map<string,string[]>();
export function titleTokens(title:string){const cached=tokenCache.get(title);if(cached)return cached;const t=cleanProductTitle(title),tokens=[...new Set([...phrases.filter(p=>t.toLowerCase().includes(p.toLowerCase())),...[...segmenter.segment(t)].filter(s=>s.isWordLike).map(s=>s.segment).filter(s=>s.length>=2&&s.length<=30&&!stop.has(s)&&!/^\d+$/.test(s))])];if(tokenCache.size>=40000)tokenCache.clear();tokenCache.set(title,tokens);return tokens;}
// Document frequency counts distinct product masters, never repeated shop listings.
export function frequentKeywords(items:Item[],minimum=3){const counts=new Map<string,number>();for(const item of items)for(const token of titleTokens(item.title))counts.set(token,(counts.get(token)||0)+1);return new Set([...counts].filter(([,n])=>n>=minimum).map(([t])=>t));}
export function keywordFacts(item:Item,frequent?:Set<string>){const event=activityName(item),medium=primaryMedium(item),type=medium?'':goodsType(item),form=saleForm(item),tokens=titleTokens(item.title).filter(t=>phrases.includes(t)||frequent?.has(t));
 const retained=item.tags.filter(t=>(!t.startsWith('类别:')||t==='类别:'+item.category)&&(!t.startsWith('作品:')||t==='作品:'+item.series)&&(!Object.values(SALE_FORM_NAMES).includes(t)||t===SALE_FORM_NAMES[form])&&(!medium||!['静态手办','可动手办','盒蛋 / 食玩','模型'].includes(t)));
 const tags=[...new Set([...(event?[event]:[]),...(type?[type]:[]),...(form!=='single'?[SALE_FORM_NAMES[form]]:[]),...tokens,...retained])].filter(t=>t.length<=60).slice(0,50);
 let display=cleanProductTitle(item.title);
 if(event){display=display.replace(/^[【「『]?(?:Fate\s*\/\s*Grand\s*Order|FGO)\s*Fes\.?\s*\d{4}\s*(?:\(\d+周年\)|[~〜～].*?(?:Anniversary|カルデアパーク)[~〜～]|[~〜～]?\d+(?:st|nd|rd|th)\s*Anniversary[~〜～]?)?[】」』]?\s*/i,'').replace(/^Fate\s*\/\s*Grand\s*Order\s*Servant Art Chronicle\s*[-ー]?最終再臨展[-ー]?\s*/i,'');}
 // Only display fields are shortened. Full titles, aliases and original offer titles retain identity/edition evidence.
 return {event,saleForm:manualField(item,'saleForm')?item.saleForm||form:form,...(!manualField(item,'tags')?{tags}:{}),...(!manualField(item,'member')?{member:display||item.title}:{})};
}
