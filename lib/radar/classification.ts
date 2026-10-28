import {currentEditorial} from './editorial';
import type {Item} from './types';
import doujinCatalogue from './doujin-catalogue.json';
import {cleanProductTitle,manualField,bookMedium,applyTitleCatalogue} from './catalog';
import {collectionFacts,waferFacts} from './collection-facts';
import {goodsType,saleForm,primaryMedium} from './product-features';
import {keywordFacts} from './keywords';
import {resolvedSeries} from './work-identity';
import {productClass,PRODUCT_CLASSES} from './product-class';
import {standaloneExtra,gameHardware} from './product-object';
import {gamePackage} from './game-packages';
import {sourceCategory,normalizedCategories} from './source-category';
import {gamePlatforms} from './game-platform';
import {kujiFacts,resolveKuji} from './kuji-key';

export function doujinFacts(item:Pick<Item,'title'|'category'|'image'|'offers'|'origin'|'publisher'|'circle'|'evidence'>):Partial<Item>{
 const sourceCategories=sourceCategory(item).value;
 const scoped=(item.title+' '+item.category+' '+sourceCategories+' '+item.evidence.filter(e=>e.field==='ageRating').map(e=>e.value==='r18'?'R18':e.value).join(' ')).normalize('NFKC');
 const source=item.offers.find(o=>o.source==='Mandarake');
 const categoryCode=source?new URL(source.url).searchParams.get('categoryCode')||'':'';
 const credit=item.title.normalize('NFKC').match(/^(.{1,80}?)\s+\(([^)]{1,100})\)\s*(.+)/);
 // TYPE-MOON publishes its own books through doujin shops, but they belong to its official product catalogue.
 const publisher=item.publisher.normalize('NFKC').replace(/[‐‑–—−]/g,'-');
 const official=/^TYPE[ -]?MOON(?: BOOKS)?$/i.test(publisher)&&(!item.circle||/^(?:TYPE[ -]?MOON|タイプムーン)$/i.test(item.circle))&&!credit;
 const knownCircle=/^タマラン\s+/.test(item.title)&&/アビビビ|アビー研究|C97.*セット/.test(item.title);
 const isDoujin=!official&&(knownCircle||/同人誌|同人音楽|同人ソフト|doujin/i.test(scoped)||/^030[13]/.test(categoryCode)||!!source&&!!credit&&/\/webshopimg\/04\//.test(item.image));
 if(official)return {origin:'commercial' as const,...(/同人誌/.test(item.category)?{category:'書籍'}:{})};
 if(!isDoujin)return {};
 const audience:Item['audience']=/女性向|女性同人/.test(scoped)||/^0303/.test(categoryCode)?'female':/男性向|男性同人/.test(scoped)||/^0301/.test(categoryCode)?'male':'unknown';
 // User policy: an adult warning must be explicit; otherwise default to all ages.
 const ageRating:Item['ageRating']=/18禁|18歳|R[ -]?18|成人向|アダルト/i.test(scoped)?'r18':'all';
 return {origin:'doujin' as const,audience,ageRating,category:/音楽|CD/.test(item.category)?item.category:'同人誌',...(credit?{circle:credit[1].trim(),artists:credit[2].split(/[、,・]/).map(x=>x.trim()).filter(Boolean)}:knownCircle?{circle:'タマラン',artists:['タマラン']}:{})};
}

// These work names are deliberately scoped to product data, not search URL words.
export function workFacts(item:Item){const series=resolvedSeries(item);return series?{series}:{};}

export function repairClassification(item:Item,frequent?:Set<string>):Item{
 if(item.catalogueGroup||currentEditorial(item))return item;
 const next={...item},source=sourceCategory(item);
 if(!source.explicit&&bookMedium(item)&&!manualField(item,'category'))next.category=bookMedium(item)==='manga'?'コミック':'小説';if(source.explicit&&source.type&&!manualField(item,'category'))next.category=normalizedCategories[source.type];
 const kuji=kujiFacts(next);if(kuji){next.kuji=kuji.kuji;if(!next.releaseDate&&!manualField(item,'releaseDate'))next.releaseDate=kuji.releaseDate;if(!next.year&&!manualField(item,'year'))next.year=kuji.year;}
 const prize=resolveKuji(next);if(prize&&!prize.full&&prize.prize.packPieces>1&&prize.slot&&!manualField(item,'kind'))next.kind='base';
 for(const [key,value] of Object.entries({...doujinFacts(next),...workFacts(next)}))if(!manualField(item,key)&&value!=='unknown'&&(key==='series'||!(next as any)[key]||(next as any)[key]==='unknown'||['origin','category'].includes(key))) (next as any)[key]=value;
 if(!manualField(item,'title')){const cleaned=cleanProductTitle(next.title);if(cleaned!==next.title){next.aliases=[...new Set([...(next.aliases||[]),next.title])].slice(0,100);next.title=cleaned;if(!manualField(item,'member'))next.member=cleaned;}}
 if(next.origin==='doujin'){
  if(!manualField(item,'kind')&&next.kind==='unknown')next.kind='base';next.bucket='normal';next.tags=[...new Set([...next.tags,'同人誌',...(next.audience&&next.audience!=='unknown'?[next.audience==='male'?'男性向':'女性向']:[]),...(next.ageRating==='r18'?['R18']:[])])].slice(0,50);
  const credit=next.title.normalize('NFKC').match(/^(.{1,80}?)\s+\(([^)]{1,100})\)\s*(.+)/),slash=next.title.split(/\s+\/\s+/);
  const master=credit&&next.circle?credit[3]:next.circle&&slash.length>1?slash[0]:next.title;
  if(master&&master!==next.title&&!manualField(item,'title')){next.aliases=[...new Set([...(next.aliases||[]),next.title])].slice(0,100);next.title=cleanProductTitle(master)||master;if(!manualField(item,'member'))next.member=next.title;}
  if(next.circle&&!manualField(item,'title')){const cleaned=next.title.replace(/^(?:[「『<]{0,2}(?:Fate\s*\/\s*(?:Grand\s*Order|GO|stay\s*night|Zero|EXTRA|Apocrypha)|FGO|月姫|空の境界)[」』>]{0,2})\s+(?=\S)/i,'');if(cleaned!==next.title){next.aliases=[...new Set([...(next.aliases||[]),next.title])].slice(0,100);next.title=cleaned;if(!manualField(item,'member'))next.member=cleaned;}}
 }
 if(!manualField(item,'publisher')&&!/書籍|同人誌|material|読本|文庫|小説|コミック|画集|設定|エース/i.test(next.category+' '+next.title)&&next.publisher==='TYPE-MOON')next.publisher='';
 if(next.origin==='doujin'&&!manualField(item,'ageRating'))next.ageRating=doujinFacts(next).ageRating||'all';
 if(next.origin==='doujin'&&next.ageRating!=='r18'&&!manualField(item,'tags'))next.tags=next.tags.filter(t=>!/^R[ -]?18$/i.test(t));
 if(!manualField(item,'category')&&/^アニメ(?:DVD|Blu-ray)/i.test(item.title)&&!/material|書籍|設定|画集/i.test(item.title+' '+item.category))next.category='映像ソフト';
 if(standaloneExtra(next)&&!manualField(item,'category'))next.category='グッズ';
 if(gameHardware(next)&&!manualField(item,'category'))next.category='ゲーム機本体';
 const rawTitle=[item.title,...item.aliases||[]].join(' ').normalize('NFKC');
 const verified=doujinCatalogue.items.find(row=>{const circle=row.match.circle,exact=next.circle===circle||rawTitle.includes(circle);return exact&&(row.match.title==='FGO FAB Vol.3'?/FGO (?:FAB|VAB)\s*vol\.?\s*3/i.test(rawTitle):row.match.title==='collected vol.2'?/collected\s*(?:vol\.?\s*)?2(?:\D|$)/i.test(rawTitle):row.match.title==='collected vol.4'?/collected\s*(?:vol\.?\s*)?4(?:\D|$)/i.test(rawTitle):false);});
 if(verified){for(const [key,value] of Object.entries(verified.facts))if(!['size','pages'].includes(key)&&!manualField(item,key))(next as any)[key]=value;if(!manualField(item,'member'))next.member=next.title;if(item.title!==next.title)next.aliases=[...new Set([...(next.aliases||[]),item.title])].slice(0,100);if(!next.evidence.some(e=>e.field==='原售资料'&&e.url===verified.url))next.evidence=[...next.evidence,{field:'原售资料',value:JSON.stringify(verified.facts),url:verified.url,at:new Date().toISOString(),method:'原商品书目核对；价格与库存另行观察'}].slice(-150);}
 const knownCollection=collectionFacts(next);
 for(const [key,value] of Object.entries({...waferFacts(next),...knownCollection}))if(!manualField(item,key))(next as any)[key]=value;
 const form=saleForm(next),type=goodsType(next),medium=primaryMedium(next);
 if(next.origin!=='doujin'){
  if(form==='media_bundle'&&!manualField(item,'kind')){next.kind='base';if(!manualField(item,'category'))next.category=medium==='music'?'音楽CD':'映像ソフト';}
  if(form==='game_bundle'){if(!manualField(item,'kind'))next.kind='set';if(!manualField(item,'category'))next.category='ゲーム';}
  const spec=gamePackage(next);if(spec&&!manualField(item,'description')&&!next.description.includes(spec.description))next.description=(next.description+'\n'+spec.description+'\n资料来源：'+spec.url).trim();
  if(form==='complete_goods'){if(!manualField(item,'kind'))next.kind='set';if(!manualField(item,'category'))next.category='グッズ';if(!manualField(item,'bucket'))next.bucket='normal';}
  if(form==='variant_group'&&!manualField(item,'kind'))next.kind='base';
  if(!medium&&['静态手办','可动手办','盒蛋 / 食玩','模型'].includes(type)&&!manualField(item,'category')){next.category=type==='模型'?'プラモデル':type==='盒蛋 / 食玩'?'トレーディングフィギュア':'フィギュア';if(!manualField(item,'bucket'))next.bucket='normal';}
 if(medium==='book'&&!manualField(item,'category')&&!/書籍|コミック|漫画|小説|ライトノベル|文庫|ムック|雑誌|画集/.test(next.category))next.category='書籍';
  if(medium==='music'&&!manualField(item,'category'))next.category='音楽CD';
  if(medium==='video'&&!manualField(item,'category'))next.category='映像ソフト';
  if(medium==='game'&&!manualField(item,'category'))next.category='ゲームソフト';
  if(/(?:REGALIA|VELBER)\s*BOX/i.test(next.title)&&/マウスパッド|収納(?:BOX|ボックス)|プロダクトコード/i.test(next.title)&&!manualField(item,'category'))next.category=/プロダクトコード/.test(next.title)?'デジタル特典':'グッズ';
 }
 Object.assign(next,keywordFacts(next,frequent));
 // Verified official variants take precedence over broad title heuristics.
 for(const [key,value] of Object.entries(knownCollection))if(!manualField(item,key))(next as any)[key]=value;
 next.majorClass=productClass(next);
 if(!manualField(item,'tags'))next.tags=[next.majorClass,...(next.majorClass==='游戏'?gamePlatforms(next).map(p=>'平台:'+p):[]),...next.tags.filter(t=>!PRODUCT_CLASSES.includes(t as any)&&!t.startsWith('平台:'))].slice(0,50);
 if(manualField(item,'tags'))next.tags=item.tags;
 return applyTitleCatalogue(next);
}
