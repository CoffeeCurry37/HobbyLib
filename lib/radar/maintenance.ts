import {applyTitleCatalogue,offerExtras,catalogueTitle,manualField,editionVariant,catalogueKeywords} from './catalog';
import {makeOffer} from './collector';
import {metadataTags} from './metadata';
import {Item,State,Relation} from './types';
import {isBook,isSmallGoods,classify,relationCycle} from './engine';
import {offerKey,sameProduct,updateOffer} from './identity';
import {repairClassification} from './classification';
import {currentEditorial,EDITORIAL_FIELDS} from './editorial';
export function repairItem(item:Item):Item{
 if(item.schemaVersion===9)return item;const i=repairClassification(applyTitleCatalogue({...item,offers:item.offers.map(o=>({...o,observation:o.observation||'list' as const,listingTitle:o.listingTitle||item.aliases?.[0]||item.title,variant:o.variant||editionVariant(o.listingTitle||item.aliases?.[0]||item.title),jan:o.jan||item.jan,isbn:o.isbn||item.isbn,releaseDate:o.releaseDate||item.releaseDate}))}));
 if(i.bucket==='junk'&&!isSmallGoods(i.title,i.category))i.bucket='normal';
 if(isBook(i.title,i.category)&&i.kind==='unknown'){i.kind='base';i.category='書籍';}
 // Legacy descriptions were scoped to exactly one search card, so only a single legacy offer can be repaired this way.
 if(i.offers.length===1&&/売り切れ|品切れ|sold\s*out/i.test(i.description)&&!i.offers[0].verifiedAt)i.offers[0].availability='sold';
 const auto=classify(i.title,i.description);if(auto.kind==='bonus'&&!manualField(item,'kind'))i.kind='bonus';i.tags=[...new Set([...i.tags,...auto.tags,...catalogueKeywords(i)])].slice(0,50);
 if(i.offers.length===1){const o=i.offers[0];o.listingTitle=o.listingTitle||item.aliases?.[0]||item.title;const derived=makeOffer(o.url,item.title+' '+item.description,o.price);if(!o.verifiedAt&&o.availability==='unknown')o.availability=derived.availability;o.extras=o.extras?.length?o.extras:offerExtras(item.title);if(o.extras.some(e=>e.status==='absent'))o.bonus='absent';else if(o.extras.some(e=>e.status==='included'))o.bonus='included';}
 for(const o of i.offers){const rank=(o.listingTitle||item.aliases?.[0]||item.title).normalize('NFKC').match(/ランク\s*[A-D](?:[+-])?/i)?.[0];if(rank&&/未提取|待核对|详情|搜索/.test(o.condition))o.condition=rank;o.extras=o.extras?.length?o.extras:offerExtras(o.listingTitle||item.aliases?.[0]||item.title);if(o.extras.some(e=>e.status==='absent'))o.bonus='absent';else if(o.extras.some(e=>e.status==='included'))o.bonus='included';}
 if(!manualField(item,'title')){const title=catalogueTitle(i);if(title!==i.title){i.aliases=[...new Set([...(i.aliases||[]),i.title])].slice(0,100);i.title=title;}}
 if(!manualField(item,'member'))i.member=i.title;
 if(/TYPE[\s-]?MOON展/i.test(i.title)&&!manualField(item,'productLine')){i.productLine='';i.wave='';}
 i.tags=[...new Set([...i.tags,...metadataTags(i)])].slice(0,50);i.schemaVersion=9;i.evidence=[...i.evidence,{field:'v0.9 分类修复',value:'卷号、挂牌差异、独立同人分类；保留未知受众及分级',url:'',at:new Date().toISOString(),method:'规则迁移；保留原刊载标题、拥有状态和人工资料'}].slice(-100);return i;
}
export function mergeProducts(state:State,fromId:string,toId:string){
 const from=state.items.find(i=>i.id===fromId),to=state.items.find(i=>i.id===toId);if(!from||!to||from===to)throw new Error('请选择两个不同商品');
 if(!sameProduct(from,to))throw new Error('卷号、版本、组件或名称有差异，不能直接合并；请先核对并整理标题，可建立关联');
 if(from.ownership!=='unknown'&&to.ownership!=='unknown'&&from.ownership!==to.ownership)throw new Error('拥有状态冲突，请先选择正确状态再合并');
 if(from.rating!==null&&to.rating!==null&&from.rating!==to.rating)throw new Error('评分不同，请先确认评分再合并');
 const offers=[...to.offers];for(const o of from.offers){const n=offers.findIndex(x=>!!offerKey(o)&&offerKey(x)===offerKey(o));if(n<0)offers.push(o);else if(o.observedAt>offers[n].observedAt)offers[n]=updateOffer(offers[n],o);}
 const merged:Item={...to,provisional:!!(to.provisional&&from.provisional),offers,ownership:to.ownership==='unknown'?from.ownership:to.ownership,quantity:Math.max(to.quantity,from.quantity),inferredMember:!!(to.inferredMember&&from.inferredMember),image:to.image||from.image,description:to.inferredMember&&!from.inferredMember?from.description:to.description,priority:Math.max(to.priority,from.priority),rating:to.rating??from.rating,watchlisted:!!(to.watchlisted||from.watchlisted),tags:[...new Set([...to.tags,...from.tags])].slice(0,50),aliases:[...new Set([...(to.aliases||[]),from.title,...(from.aliases||[])])].slice(0,100),notes:[to.notes,from.notes].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join('\n'),evidence:[...to.evidence,...from.evidence,{field:'合并商品',value:from.title,url:'',at:new Date().toISOString(),method:'原条目保留在合并存档，可撤销'}].slice(-100)};
 for(const key of ['catalogNodeId','brand','publisher','manufacturer','circle','series','productLine','wave','member','year','releaseDate','isbn','jan','audience','ageRating'] as const)if(!manualField(to,key)&&(!merged[key]||merged[key]==='unknown')&&from[key])merged[key]=from[key] as any;
 if(!manualField(to,'image'))merged.images=[...new Set([merged.image,...to.images||[],from.image,...from.images||[]].filter(Boolean))].slice(0,10);
 const affected=state.relations.filter(r=>[r.fromId,r.toId].includes(fromId));const relations=state.relations.map(r=>({...r,fromId:r.fromId===fromId?toId:r.fromId,toId:r.toId===fromId?toId:r.toId})).filter(r=>r.fromId!==r.toId);
 const seen=new Set<string>();const deduped=relations.filter(r=>{const key=[r.fromId,r.toId,r.kind].join(':');if(seen.has(key))return false;seen.add(key);return true;});
 for(const r of deduped.filter(r=>r.kind==='contains'))if(relationCycle(r.fromId,r.toId,deduped.filter(x=>x.id!==r.id)))throw new Error('合并会形成循环套装关系，请先核对关联');
 const touches=(r:Relation)=>[r.fromId,r.toId].some(id=>id===fromId||id===toId);
 // A merge can introduce stronger source classifications and obsolete class tags.
 // A merge adds observations and provenance; it must not invalidate an
 // accepted product description merely by appending inferred source tags.
 if(currentEditorial(to)){for(const key of EDITORIAL_FIELDS){if(to[key]===undefined)delete (merged as any)[key];else (merged as any)[key]=to[key];}merged.image=to.image;}
 const finalized=repairClassification(applyTitleCatalogue(merged));
 const archived:Item={...from,archivedInto:toId,mergeSnapshot:JSON.stringify({version:2,target:to,relations:state.relations.filter(touches),afterRelations:deduped.filter(touches),after:JSON.stringify(finalized)})};return{merged:finalized,archived,relations:deduped};
}
export function undoMerge(state:State,archived:Item){
 if(!archived.mergeSnapshot||!archived.archivedInto)throw new Error('没有可撤销的合并');const saved=JSON.parse(archived.mergeSnapshot),target=state.items.find(i=>i.id===archived.archivedInto);
 // Avoid wiping later manual edits or newly fetched offers. Keep an intact historical archive for manual recovery.
 if(!target||!snapshotEqual(target,saved.after))throw new Error('合并后的商品已被更新。为保留新记录，请先导出备份，再从存档手动分拆');
 const touches=(r:Relation)=>[r.fromId,r.toId].some(id=>id===archived.id||id===archived.archivedInto),order=(r:Relation[])=>JSON.stringify([...r].sort((a,b)=>a.id.localeCompare(b.id)));if(saved.afterRelations&&order(saved.version===2?state.relations.filter(touches):state.relations)!==order(saved.afterRelations))throw new Error('关联关系已有后续更新，请从备份手动分拆，避免覆盖新关联');
 const restored={...archived};delete restored.archivedInto;delete restored.mergeSnapshot;return {items:[saved.target,restored] as Item[],relations:(saved.version===2?[...state.relations.filter(r=>!touches(r)),...saved.relations]:saved.relations) as Relation[]};
}
// JSON property order may change when defaults are added during database reads.
export function snapshotEqual(value:unknown,saved:string){try{const order=(v:any):any=>Array.isArray(v)?v.map(order):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,order(v[k])])):v;return JSON.stringify(order(value))===JSON.stringify(order(JSON.parse(saved)));}catch{return false;}}
