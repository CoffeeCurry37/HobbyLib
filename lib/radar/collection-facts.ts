import type {Item} from './types';
import data from './collection-catalogue.json';
export type CollectionMember={number:string;name:string;characters?:string[];urls?:string[];image?:string;evidence?:string};
export type CollectionFamily={key:string;title:string;productLine:string;wave:string;releaseDate:string;image:string;images?:string[];url:string;count:number;event?:string;aniplexId?:string;variants?:Record<string,string>;numbering?:string;members:CollectionMember[];description?:string};
export const collectionFamilies=data.families as CollectionFamily[],waferWaves=data.waferWaves as CollectionFamily[],allCollections=[...waferWaves,...collectionFamilies];
const raw=(i:Item)=>[i.title,...i.aliases||[],...i.offers.map(o=>o.listingTitle||'')].join('\n').normalize('NFKC');
export const isWafer=(i:Item)=>/ウエハース|ウェハース|威化|华夫饼/.test(i.title)&&!/ファイル|ホルダー|収納|ケース/.test(i.title);
const lot=(i:Item)=>i.saleForm==='seller_lot'||/まとめ売り|まとめて|セット|全\d+種|BOX|ボックス/.test(i.title)&&!i.catalogueKey;
const productionWaves:Record<string,string>={'2402670':'1','2422264':'2','2435058':'3','2439037':'4','2452765':'5','2468675':'6','2477821':'7','2527205':'8','2570066':'10','2616365':'11','2671918':'12','2729010':'13','2821300':'14','2460362':'復刻スペシャル 1','2692939':'特別弾 2024','2753157':'特別弾 2025','2501867':'バビロニア 1'};
export function waferFacts(i:Item):Partial<Item>{
 if(i.catalogueGroup||!isWafer(i)||lot(i))return {};
 const text=raw(i),code=Object.keys(productionWaves).find(c=>text.includes(c));let wave=code?productionWaves[code]:'';
 if(!wave){if(/にふぉるめーしょん|シールウエハース/.test(text))wave='にふぉるめーしょん';else if(/復刻/.test(text))wave='復刻スペシャル '+(/復刻[^\n]{0,25}(?:2|第2弾)/.test(text)?'2':'1');else if(/特別弾/.test(text))wave=/2025/.test(text)?'特別弾 2025':/2024/.test(text)?'特別弾 2024':'';else if(/バビロニア/.test(text))wave='バビロニア '+(/ウエハース\s*2|第2弾/.test(text)?'2':'1');else wave=text.match(/第?\s*(\d{1,2})\s*弾|ウ[ェエ]ハース\s*(\d{1,2})(?=\s|[「(【]|$)/)?.slice(1).find(Boolean)||'';}
 const f=waferWaves.find(f=>f.wave===wave),facts:Partial<Item>={productLine:f?.productLine||'Fate/Grand Order ウエハース',wave,category:'トレーディングカード',majorClass:'卡片',origin:'commercial'};if(!f)return facts;
 Object.assign(facts,{releaseDate:f.releaseDate,year:f.releaseDate.slice(0,4)});
 const explicit=text.match(/(?:\bNo[.．]?\s*|カード番号\s*[:：]?\s*)(\d{1,3})(?!\d)/i)?.[1],retailer=code&&i.offers.some(o=>o.source==='Mandarake')?text.split('\n').map(t=>t.match(/\s(\d{1,2})\s*$/)?.[1]).find(Boolean):undefined,number=explicit||retailer||i.cardNumber;
 if(number&&Number(number)>0&&Number(number)<=f.count){const n=String(Number(number)).padStart(2,'0'),m=f.members.find(m=>m.number===n);Object.assign(facts,{cardNumber:n,catalogueKey:f.key+':card:'+n});if(m&&!/シークレット|待核对/.test(m.name))Object.assign(facts,{member:'No.'+n+' '+m.name,...(m.characters?.length?{characters:m.characters}:{})});}return facts;
}
const path=(url:string)=>{try{const u=new URL(url);return u.hostname+u.pathname.replace('/product/other/','/product/detail/');}catch{return '';}};
export function collectionFacts(i:Item):Partial<Item>{
 if(i.catalogueGroup)return {};
 for(const f of collectionFamilies){const official=i.offers.find(o=>path(o.url)===path(f.url)),variant=official?.variant||(()=>{try{return [...new URL(official?.url||'').searchParams].find(([k])=>/^dwvar_/.test(k))?.[1];}catch{return '';}})();
 const m=f.members.find(m=>i.catalogueKey===f.key+':card:'+m.number||m.urls?.some(u=>i.offers.some(o=>path(o.url)===path(u))))||(official&&variant?f.members.find(m=>m.number===variant):undefined),pack=official&&variant?f.variants?.[variant]:undefined;if(!m&&!pack||!pack&&lot(i))continue;
 const facts:Partial<Item>={catalogueKey:f.key+':'+(pack?'spec:'+pack:'card:'+m!.number),productLine:f.productLine,wave:f.wave,event:f.event,releaseDate:f.releaseDate,year:f.releaseDate.slice(0,4),category:'トレーディングカード',majorClass:'卡片',origin:'commercial'};
 if(pack)Object.assign(facts,{image:f.image,images:f.images,member:pack==='box'?'完整盒装（14 款）':'随机单包',saleForm:pack==='box'?'complete_goods':'variant_group',kind:pack==='box'?'set':'base'});
 if(m)Object.assign(facts,{member:m.name,...(f.numbering==='official'?{cardNumber:m.number}:{}),...(m.characters?.length?{characters:m.characters}:{}),...(m.image?{image:m.image,images:[m.image]}:{})});return facts;
 }return {};
}
export const collectionIdentity=(i:Item)=>i.catalogueKey||collectionFacts(i).catalogueKey||waferFacts(i).catalogueKey||'';
export function collectionFor(i:Item){const key=collectionIdentity(i);return allCollections.find(f=>key.startsWith(f.key+':'))||(isWafer(i)?waferWaves.find(f=>f.wave===waferFacts(i).wave):undefined);}
export const assortmentCard=(i:Item)=>isWafer(i)||!!collectionFor(i)||/トレーディングカード|トレカ|ランダム.*カード/.test(i.title);
