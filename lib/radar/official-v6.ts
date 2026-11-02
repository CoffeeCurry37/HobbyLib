import releases from './official-releases-v6.json';
import type {Item} from './types';
import {manualField} from './catalog';
export const officialReleases=releases;
export function mediaFormat(item:Item):'DVD'|'Blu-ray'|'' {
 const text=[item.title,item.category,...item.evidence.filter(e=>['category','来源分类'].includes(e.field)).map(e=>e.value)].join(' ');
 const bd=/Blu[- ]?ray|ブルーレイ|\bBD\b/i.test(text),dvd=/DVD/i.test(text)&&!/DVD-ROM/i.test(text);
 return bd===dvd?'':bd?'Blu-ray':'DVD';
}
export function babyloniaVolume(item:Item){
 const t=item.title.normalize('NFKC');if(!/絶対魔獣戦線バビロニア/.test(t)||/セット|全\d+巻|ソロモン|収納|BOX|特典単品|CD|ブックレット/i.test(t))return null;
 const m=t.match(/絶対魔獣戦線バビロニア[-ー\s]*\s*(?:(?:DVD|Blu-ray)\s*)?(?:第|vol\.?\s*)?([1-5])(?:巻)?(?=\s|$|\[)/i);return m?Number(m[1]):null;
}
export function officialRelease(item:Item){
 if(/WINX.*SAGA/i.test(item.title)&&/Q\s*posket/i.test(item.title)&&/TERRA/i.test(item.title))return releases.find(v=>v.key==='winx:terra:qposket');
 const n=babyloniaVolume(item),format=mediaFormat(item);return n&&format?releases.find(v=>v.family==='babylonia-tv'&&v.volume===n&&v.format===format):undefined;
}
export function applyOfficialRelease(item:Item,release=officialRelease(item)):Item {
 if(!release)return item;const out={...item};
 const patch={title:release.title,summary:release.summary,series:release.series,productLine:release.productLine,manufacturer:release.manufacturer,productType:release.productType,majorClass:release.majorClass,category:release.category,image:release.image,images:[...new Set([release.image,...item.images||[],item.image].filter(Boolean))].slice(0,10),...(release.releaseDate?{releaseDate:release.releaseDate,year:release.releaseDate.slice(0,4)}:{}),...(release.volume?{wave:String(release.volume)}:{})};
 for(const [k,v]of Object.entries(patch))if(!manualField(item,k))(out as any)[k]=v;
 if(out.title!==item.title)out.aliases=[...new Set([...(item.aliases||[]),item.title])].slice(0,100);
 if(!manualField(item,'tags'))out.tags=[...new Set([...item.tags,release.series,release.productLine,release.productType])].slice(0,50);
 if(!out.evidence.some(e=>e.field==='官方系列目录V6'&&e.url===release.sourceUrl))out.evidence=[...out.evidence,{field:'官方系列目录V6',value:JSON.stringify({key:release.key,code:release.officialSku||null,sourceHash:release.sourceHash,imageHash:release.imageHash,imageSource:release.imageSourceUrl||release.sourceUrl}),url:release.sourceUrl,at:new Date().toISOString(),method:'官方卷目/商品规格；图片独立留源，不改挂牌、个人状态或核实标记'}];
 return out;
}
