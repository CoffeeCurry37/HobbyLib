import type {Item} from './types';
import {canonicalWork,canonicalMaker,canonicalLine,lineSignal,toyPolicy,publicationNumber} from './catalogue-policy.mjs';
import {productClass,productSubtype} from './product-class';
import {manualField,cleanProductTitle} from './catalog';
import {resolvedSeries} from './work-identity';
import {activityName} from './product-features';
import {canonicalEvent} from './event-name';
import {currentEditorial} from './editorial';

export function researchSignal(item:Item){
 const major=productClass(item),event=catalogueEvent(item);
 if(item.origin==='doujin'||major==='同人')return null;
 const line=lineSignal({...item,title:cleanProductTitle(item.title)},major,productSubtype(item));
 if(line?.kind==='image-only')return line;
 return event?{kind:'event-catalogue',label:event,seriesExpansion:true}:line;
}
export function catalogueEvent(item:Item){
 const t=[item.title,item.event||''].join(' ');
 if(/星見の回廊|星見回廊|星见回廊/.test(t))return 'FGO展 星見の回廊';
 if(/最終再臨|最终再临|Servant Art Chronicle/i.test(t))return 'Servant Art Chronicle 最終再臨展';
 const fes=t.match(/F(?:GO\s*)?es\.?\s*(20\d{2})/i);if(fes)return 'FGO Fes.'+fes[1];
 return canonicalEvent(currentEditorial(item)?item.event||'':activityName(item));
}
export function catalogueV6Facts(item:Item):Item {
 if(item.origin==='doujin'||productClass(item)==='同人')return item;
 const out={...item},major=productClass(item),work=canonicalWork(resolvedSeries(item),item.title);
 const patch:Partial<Item>={series:work};
 if(item.manufacturer)patch.manufacturer=canonicalMaker(item.manufacturer);
 if(item.productLine&&['书籍','影像'].includes(major))patch.productLine=canonicalLine(item.productLine);
 const sig=lineSignal({...item,title:cleanProductTitle(item.title)},major,productSubtype(item));
 if(sig&&sig.kind!=='image-only'&&sig.kind!=='game-editions'&&sig.label.length<=150){patch.productLine=['书籍','影像'].includes(major)?canonicalLine(sig.label):sig.label;if(sig.batch)patch.wave=sig.batch.replace(/^(?:vol\.|第)\s*/,'').replace(/弹$/,'');}
 const n=publicationNumber(cleanProductTitle(item.title),major);if(n?.number)patch.wave=String(n.number);
 if(major==='玩具'){const p=toyPolicy(item,work);patch.manufacturer=p.at(-2);if(p.at(-1)!=='未标注产品线')patch.productLine=p.at(-1);}
 const event=catalogueEvent(item);if(event)patch.event=event;
 // Accepted editorial facts and explicitly edited fields remain authoritative.
 for(const [key,value]of Object.entries(patch))if(value&&!manualField(item,key)&&(!currentEditorial(item)||!(item as any)[key]))(out as any)[key]=value;
 return out;
}
export function v6Path(item:Item,legacy:string[]):string[] {
 const major=productClass(item);if(major==='同人')return legacy;
 const work=canonicalWork(resolvedSeries(item),item.title),event=catalogueEvent(item),type=productSubtype(item);
 const fate=!/WINX/i.test(work)&&/^Fate|^FGO|エルメロイ/i.test(work);
 if(major==='玩具'&&(fate||/WINX/i.test(work)))return toyPolicy(item,work);
 let path:string[];
 if(fate){path=['TYPE-MOON',work==='Fate/Grand Order'?'FGO':work||'Fate 综合'];if(/EXTELLA|EXTRA (?:CCC|Record)/i.test(work))path.splice(1,0,'Fate/EXTRA');}
 else if(/WINX/i.test(work))path=['其他收藏',work];else return legacy;
 if(event)path.push('展会与活动',event);
 if(item.kuji){path.push('一番赏',item.kuji.campaign);}
 else if(major==='大型周边')path.push('周边','大周边',type);
 else if(major==='游戏')path.push('游戏',item.kind==='bonus'?'特典':'发行版本');
 else path.push(major,type);
 const sig=lineSignal({...item,title:cleanProductTitle(item.title)},major,type);
 if(sig&&sig.kind!=='image-only'&&sig.kind!=='game-editions'&&!item.kuji){path.push(['书籍','影像'].includes(major)?canonicalLine(sig.parent||sig.label):sig.parent||sig.label);if(sig.batch)path.push(sig.batch);}
 else if(item.productLine&&major!=='游戏'&&!item.kuji)path.push(canonicalLine(item.productLine));
 return path.filter((v,i,a)=>v&&!a.slice(0,i).includes(v));
}
