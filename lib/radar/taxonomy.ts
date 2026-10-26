import {canonicalEvent} from './event-name';
import {currentEditorial} from './editorial';
import {catalogueLabel} from './event-name';
import type {CatalogNode,Item,Prefs,Relation} from './types';
import {catalogueBrand,cleanProductTitle,titleCatalogue,bookMedium} from './catalog';
import {fateRelated} from './recognition';
import {visibleSet,setPolicy} from './sets';
import {activityName,goodsType,saleForm,primaryMedium} from './product-features';
import {sourceCategory} from './source-category';
import {productClass,productSubtype} from './product-class';
import {resolvedSeries} from './work-identity';

const seed:CatalogNode[]=[];
function board(id:string,parentId:string|null,name:string,description=''){seed.push({id,parentId,name,description,order:seed.filter(n=>n.parentId===parentId).length});}
board('type-moon',null,'TYPE-MOON','Fate、FGO、月姬、空之境界与其他相关作品');
board('fate','type-moon','Fate','作品系列、设定集、影像与周边');
board('tsukihime','type-moon','月姬','月姬、TV、MELTY BLOOD 与 Remake');
board('kara','type-moon','空之境界','小说、漫画与剧场版');
board('typemoon','type-moon','其他 TYPE-MOON','魔法使之夜、综合资料与活动');
board('transformers',null,'变形金刚','按品牌、产品线与批次归档');
board('robots',null,'机器人 / 模型','万代、寿屋与其他品牌');
board('other',null,'其他收藏','为新的作品与收藏建立目录');
board('unfiled',null,'待归档','缺少作品信息的条目');
board('doujin',null,'同人','独立整理同人作品；受众和R18依据商品原始标签');
for(const [id,name] of [['male','男性向'],['female','女性向'],['male-r18','男性向 R18'],['female-r18','女性向 R18'],['pending','受众 / 分级待确认']])board('doujin-'+id,'doujin',name);
for(const [id,name] of [['stay','Fate/stay night'],['extra','Fate/EXTRA'],['zero','Fate/Zero'],['hollow','Fate/hollow ataraxia'],['apocrypha','Fate/Apocrypha'],['prototype','Fate/Prototype'],['strange','Fate/strange Fake'],['prisma','Fate/kaleid liner'],['samurai','Fate/Samurai Remnant'],['requiem','Fate/Requiem'],['codes','Fate/unlimited codes'],['tiger','Fate/tiger colosseum'],['events','展会与活动'],['general','Fate 综合']] as const)board('fate-'+id,'fate',name);
board('fate-general-figures','fate-general','玩具','Fate / FGO 全系列手办、景品、可动与模型');
board('fate-grand','type-moon','FGO','游戏、街机、影像、卡片与周边');
for(const [id,name] of [['game','FGO 游戏'],['arcade','FGO Arcade'],['anime','FGO 动画'],['events','展会与活动'],['general','FGO 综合']])board('fgo-'+id,'fate-grand',name);
for(const root of ['fate-general','fgo-general']){for(const [id,name] of [['static','静态手办'],['action','可动手办'],['kuji','一番赏'],['cards','集换式卡牌']])board(root+'-'+id,['static','action'].includes(id)&&root==='fate-general'?'fate-general-figures':root,name);for(const [id,name] of [['wafer','威化卡片'],['arcade','FGO Arcade 卡片'],['weiss','Weiß Schwarz'],['lycee','Lycee'],['other','其他卡片系列']])board(root+'-cards-'+id,root+'-cards',name);for(const type of ['static','action'])for(const name of ['万代 BANDAI','寿屋 KOTOBUKIYA','Good Smile Company','Max Factory','ALTER','ANIPLEX','GK','其他厂商'])board(root+'-'+type+'-'+name.toLowerCase().replace(/[^a-z]/g,''),root+'-'+type,name);}
for(const [id,name] of [['original','月姬'],['tv','月姬 TV'],['melty','MELTY BLOOD'],['remake','月姬 Remake'],['events','展会与活动'],['general','月姬 综合']] as const)board('tsuki-'+id,'tsukihime',name);
for(const [id,name] of [['novel','小说'],['manga','漫画'],['movie','剧场版'],['events','展会与活动'],['general','综合资料']] as const)board('kara-'+id,'kara',name);
for(const [id,name] of [['mahoyo','魔法使之夜'],['general','TYPE-MOON 综合'],['events','展会与活动']] as const)board('tm-'+id,'typemoon',name);
board('robot-bandai','robots','万代 BANDAI');board('robot-koto','robots','寿屋 KOTOBUKIYA');board('robot-other','robots','其他品牌');
board('tf-takara','transformers','TAKARA TOMY');board('tf-hasbro','transformers','Hasbro');board('tf-other','transformers','其他品牌');
export const DEFAULT_CATALOG_NODES:CatalogNode[]=seed;
export function catalogueNodes(prefs:Pick<Prefs,'catalogueNodes'>){const overrides=new Map((prefs.catalogueNodes||[]).map(n=>[n.id,n])),defaults=new Set(DEFAULT_CATALOG_NODES.map(n=>n.id));return [...DEFAULT_CATALOG_NODES.map(n=>({...n,...overrides.get(n.id),...(['fate','fate-grand','tsukihime','kara','typemoon'].includes(n.id)?{parentId:'type-moon',name:n.name}:{})})),...(prefs.catalogueNodes||[]).filter(n=>!defaults.has(n.id))];}
export const eventName=activityName;
export function productType(item:Item){if(item.kuji||/一番くじ|一番賞|一番赏|Ichiban Kuji/i.test(item.title))return '一番赏';if(item.kind==='bonus'||/(?:入場|来場|購入|店舗)特典/.test(item.title))return /(?:入場|来場)/.test(item.title)?'入场特典':'特典';return productClass(item);}
export function inferredPath(item:Item):string[]{
 const series=currentEditorial(item)?item.series:resolvedSeries(item),t=item.title+' '+series,type=productType(item),major=productClass(item),sub=productSubtype(item),event=currentEditorial(item)?canonicalEvent(item.event||''):eventName(item);let path:string[];
 if(major==='同人'){const group=(item.audience==='male'?'男性向':item.audience==='female'?'女性向':'受众 / 分级待确认')+(item.ageRating==='r18'?' R18':'');return ['同人',group,series||'作品待确认',item.circle||'社团待确认',item.kind==='set'?'同人套装':/CD|音楽/.test(item.category)?'同人音乐':'同人誌'];}
 if(item.catalogueGroupType==='kuji')return ['TYPE-MOON','Fate','Fate 综合','一番赏',item.productLine||item.title];
 if(item.kuji||type==='一番赏')return ['TYPE-MOON','Fate','Fate 综合','一番赏',item.kuji?.campaign||(item.imageRole==='lot_photo'?'跨活动卖家拼套':'活动待核对'),...(item.kuji?.catalogueGroup?['赏级档案']:[major,sub])];
 if(currentEditorial(item)?fateRelated(series):fateRelated(item.title)||fateRelated(series)){
  if(major==='玩具')path=['TYPE-MOON','Fate','Fate 综合','玩具'];
  else if(series==='Fate/Grand Order')path=['TYPE-MOON','FGO',event?'展会与活动':'FGO 综合'];
  else path=['TYPE-MOON','Fate',event?'展会与活动':/^Fate\//.test(series)?series:'Fate 综合'];
 }else if(/月姫|月姬|MELTY BLOOD/i.test(series))path=['TYPE-MOON','月姬',series==='MELTY BLOOD'?'MELTY BLOOD':/真月譚|月姬\s*TV|月姫\s*TV/i.test(t)?'月姬 TV':/piece of blue glass moon|remake|リメイク|月姫想本/i.test(t)?'月姬 Remake':'月姬'];
 else if(series==='空の境界')path=['TYPE-MOON','空之境界'];
 else if(['CANAAN','Carnival Phantasm'].includes(series))path=['TYPE-MOON','其他 TYPE-MOON',series];
 else if(series==='魔法使いの夜'||/TYPE[ -]?MOON|奈須きのこ|武内崇|エルメロイ|ファイヤーガール|コハエース/.test(t+' '+item.publisher))path=['TYPE-MOON','其他 TYPE-MOON',series==='魔法使いの夜'?'魔法使之夜':'TYPE-MOON 综合'];
 else if(/トランスフォーマー|transformers|变形金刚/i.test(t))path=['变形金刚',catalogueBrand(item)];
 else if(/ガンダム|Gundam|ガンプラ|機動戦士|ロボット|フレームアームズ|ヘキサギア|マクロス/i.test(t))path=['机器人 / 模型',catalogueBrand(item)];
 else path=[series?'其他收藏':'待归档',...(series?[series]:[])];
 if(event&&major!=='玩具')path.push(event);
 if(path.at(-1)!==type)path.push(type);
 if(type==='特典'||type==='入场特典')path.push(major);
 if(sub!==type&&sub!==major)path.push(sub);
 if(major==='玩具'){path.push(/ガレージキット|garage kit|\bGK\b/i.test(t)?'GK':catalogueBrand(item));}
 const line=item.productLine||'',knownLine=titleCatalogue(item.title).productLine;
 if(line&&(currentEditorial(item)||line===knownLine||major==='玩具'||major==='卡片')&&!event&&!/ウエハース|ウェハース/.test(line))path.push(line);
 if(item.wave&&['玩具','卡片'].includes(major))path.push(/^\d+$/.test(item.wave)?'第 '+item.wave+' 弹':item.wave);return path;
}
const hash=(s:string)=>{let n=2166136261;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(36);};
export function buildCatalogue(items:Item[],prefs:Pick<Prefs,'catalogueNodes'>,relations:Relation[]=[]) {const nodes=catalogueNodes(prefs),itemNodes=new Map<string,string>();
 const pathKey=(parentId:string|null,name:string)=>(parentId||'root')+'\0'+catalogueLabel(name);
 const byId=new Map(nodes.map(n=>[n.id,n])),byPath=new Map<string,CatalogNode>(),siblingCounts=new Map<string|null,number>();
 for(const n of nodes){const key=pathKey(n.parentId,n.name);if(!byPath.has(key))byPath.set(key,n);siblingCounts.set(n.parentId,(siblingCounts.get(n.parentId)||0)+1);}
 const defaultPaths=new Map(DEFAULT_CATALOG_NODES.map(n=>[pathKey(n.parentId,n.name),n.id]));
 const ensure=(parentId:string|null,name:string)=>{const key=pathKey(parentId,name),defaultId=defaultPaths.get(key);let node=(defaultId?byId.get(defaultId):undefined)||byPath.get(key);if(!node){node={id:'catalog-'+hash(key),parentId,name,order:siblingCounts.get(parentId)||0};nodes.push(node);byId.set(node.id,node);byPath.set(key,node);siblingCounts.set(parentId,node.order+1);}return node;};
 // Infer every original path before applying manual placement, so imported generated node IDs remain resolvable.
 const byItem=new Map(items.map(i=>[i.id,i])),groupParents=new Map(relations.filter(r=>r.kind==='contains'&&(byItem.get(r.fromId)?.catalogueGroup||byItem.get(r.fromId)?.kuji?.catalogueGroup)).map(r=>[r.toId,r.fromId]));
 const anchor=(item:Item)=>{let current=item;const seen=new Set<string>();while(groupParents.has(current.id)&&!seen.has(current.id)){seen.add(current.id);const parent=byItem.get(groupParents.get(current.id)!);if(!parent)break;current=parent;}return current;};
 for(const item of items){let parentId:string|null=null;for(const name of inferredPath(anchor(item)))parentId=ensure(parentId,name).id;itemNodes.set(item.id,parentId!);}
 for(const item of items)if(item.catalogNodeId&&byId.has(item.catalogNodeId))itemNodes.set(item.id,item.catalogNodeId);
 const childGroups=new Map<string|null,CatalogNode[]>(),collator=new Intl.Collator('ja',{numeric:true});
 for(const node of nodes){if(!childGroups.has(node.parentId))childGroups.set(node.parentId,[]);childGroups.get(node.parentId)!.push(node);}
 for(const siblings of childGroups.values())siblings.sort((a,b)=>a.order-b.order||collator.compare(a.name,b.name));
 const children=(id:string|null)=>childGroups.get(id)||[];
 const paths=new Map<string,CatalogNode[]>();
 const ancestors=(id:string)=>{const cached=paths.get(id);if(cached)return cached;const path:CatalogNode[]=[];const seen=new Set<string>();let node=byId.get(id);while(node&&!seen.has(node.id)){path.unshift(node);seen.add(node.id);node=node.parentId?byId.get(node.parentId):undefined;}paths.set(id,path);return path;};
 const includes=(item:Item,id:string|null)=>!id||ancestors(itemNodes.get(item.id)||'unfiled').some(n=>n.id===id);
 return {nodes,byId,itemNodes,children,ancestors,includes};
}
export function catalogueEntries(items:Item[],relations:Relation[]){
 const roots=new Set(items.filter(i=>i.catalogueGroup||i.kind==='set'&&!i.kuji?.catalogueGroup&&setPolicy(i).mode==='permanent').map(i=>i.id)),children=new Map<string,string[]>(),hidden=new Set<string>();
 for(const r of relations)if(r.kind==='contains'){if(!children.has(r.fromId))children.set(r.fromId,[]);children.get(r.fromId)!.push(r.toId);}
 const hide=(id:string,seen=new Set<string>())=>{if(seen.has(id))return;seen.add(id);for(const child of children.get(id)||[]){hidden.add(child);hide(child,seen);}};for(const id of roots)hide(id);
 return items.filter(i=>visibleSet(i)&&!hidden.has(i.id));
}
export function catalogueSummary(tree:ReturnType<typeof buildCatalogue>,items:Item[]){const counts=new Map<string,number>(),covers=new Map<string,Item[]>();for(const item of items)for(const node of tree.ancestors(tree.itemNodes.get(item.id)||'unfiled')){counts.set(node.id,(counts.get(node.id)||0)+1);if(item.image){if(!covers.has(node.id))covers.set(node.id,[]);const preview=covers.get(node.id)!;if(preview.length<3)preview.push(item);}}return {counts,covers};}
export function nodeCycle(id:string,parentId:string|null,nodes:CatalogNode[]){const seen=new Set<string>([id]);while(parentId){if(seen.has(parentId))return true;seen.add(parentId);parentId=nodes.find(n=>n.id===parentId)?.parentId||null;}return false;}
