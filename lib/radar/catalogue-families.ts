import {createHash} from 'node:crypto';
import type {Item,Relation,Prefs} from './types';
import {createItem,relationKey} from './engine';
import {bookHierarchy,bookMedium,canonicalBrand,cleanProductTitle} from './catalog';
import {primaryMedium} from './product-features';
import {gamePlatforms} from './game-platform';
import {collectionFor} from './collection-facts';
export type FamilySpec={key:string;title:string;type:NonNullable<Item['catalogueGroupType']>;category:string;major:Item['majorClass'];productLine:string;wave?:string;releaseDate?:string;image?:string;images?:string[];url?:string;event?:string;description:string};
const normal=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
export const familyId=(key:string)=>'family-'+createHash('sha256').update(key).digest('hex').slice(0,32);
export function catalogueFamily(i:Item):FamilySpec|undefined{
 if(i.demo||i.archivedInto||i.catalogueGroup||i.kind==='bonus')return;
 const c=collectionFor(i);if(c)return {key:c.key,title:c.title,type:'collection',category:'トレーディングカード',major:'卡片',productLine:c.productLine,wave:c.wave,releaseDate:c.releaseDate,image:c.image,images:c.images,url:c.url,event:c.event,description:c.description||'按发行系列整理已知款式；单卡分别记录，待核对席位不表示已经找到销售挂牌。'};
 if(i.kuji)return {key:'kuji:'+i.kuji.campaignId,title:i.kuji.campaign,type:'kuji',category:'一番くじ',major:'周边',productLine:i.kuji.campaign,releaseDate:i.releaseDate,description:'同一期一番赏的赏级与已知款式；各成员分别记录收藏状态。'};
 if(i.origin==='doujin')return;
 const medium=primaryMedium(i),t=cleanProductTitle(i.title);
 if(medium==='game'){
  if(/タイガーころしあむ/i.test(t)){const upper=/アッパー/.test(t),title='フェイト/タイガーころしあむ'+(upper?' アッパー':'');return {key:'game:tiger:'+(upper?'1':'0')+':psp',title,type:'editions',category:'ゲームソフト',major:'游戏',productLine:title,releaseDate:upper?'2008-08-28':'2007-09-13',description:'PSP 游戏版本档案。通常版、限定捆绑与廉价再版保留各自发行日期、包装、内容和报价。'};}
  if(i.saleForm==='seller_lot')return;
  const platform=gamePlatforms(i);if(platform.length!==1)return;
  const line=t.replace(/\s*\[?(?:初回限定版|通常版|限定版|特装版|廉価版|Best Price!?|TREASURE BOX|REGALIA BOX|VELBER BOX)\]?/gi,'').trim();if(line.length<5)return;
  return {key:'game:'+normal(line)+':'+platform[0],title:line+'（'+platform[0]+'）',type:'editions',category:'ゲームソフト',major:'游戏',productLine:line,description:'同平台版本目录；发行批次和捆绑内容保留在各版本资料内。'};
 }
 if(medium==='book'&&i.kind!=='set'&&i.saleForm!=='seller_lot'){
  const h=bookHierarchy(i),line=h.productLine,format=bookMedium(i)||(/material|読本|設定|Fantasm|Compilation/i.test(t)?'reference':/エース/.test(t)?'magazine':''),publisher=canonicalBrand(i.publisher||i.brand);if(!line||!h.wave||!format||!publisher)return;
  const edition=t.match(/新装版|改訂版|電子書籍|復刻版/)?.[0]||'';
  return {key:'books:'+normal(publisher)+':'+format+':'+normal(line)+':'+edition,title:line+(edition?' · '+edition:''),type:'book-series',category:format==='manga'?'コミック':format==='novel'?'小説':'書籍',major:'书籍',productLine:line,description:'同出版社、同媒介版本的系列目录。持续更新单卷；目录本身不表示已经完结或拥有整套。'};
 }
}
export function createFamily(spec:FamilySpec,member:Item,prefs:Prefs):Item{
 const base=createItem(spec.title,spec.description,undefined,prefs),image=spec.image||member.image;
 return {...base,id:familyId(spec.key),catalogueGroup:true,catalogueGroupType:spec.type,catalogueKey:spec.key,title:spec.title,description:spec.description,member:spec.title,productLine:spec.productLine,wave:spec.wave||'',category:spec.category,majorClass:spec.major,kind:'set',setMode:'permanent',series:member.series,origin:member.origin,brand:member.brand,publisher:member.publisher,manufacturer:member.manufacturer,image,images:spec.images||[image].filter(Boolean),imageRole:'catalogue_reference',releaseDate:spec.releaseDate||'',year:spec.releaseDate?.slice(0,4)||'',event:spec.event||'',offers:[],isbn:'',jan:'',msrp:null,ownership:'unknown',quantity:0,priority:0,rating:null,notes:'',review:false,watchlisted:false,bucket:'normal',tags:['系列档案'],evidence:[{field:'系列整理',value:spec.description,url:spec.url||'',at:new Date().toISOString(),method:'逻辑父级；成员保持独立商品及个人状态'}]};
}
export function familyPlan(items:Item[],relations:Relation[],prefs:Prefs,only?:Set<string>){
 const groups=new Map<string,{spec:FamilySpec;members:Item[]}>(),byId=new Map(items.map(i=>[i.id,i])),parents:Item[]=[],links:Relation[]=[],existing=new Set(relations.map(relationKey)),dismissed=new Set(prefs.dismissedRelations||[]);
 for(const i of items){const spec=catalogueFamily(i);if(!spec)continue;if(!groups.has(spec.key))groups.set(spec.key,{spec,members:[]});groups.get(spec.key)!.members.push(i);}
 for(const {spec,members} of groups.values()){
  if(only&&!members.some(i=>only.has(i.id)))continue;const id=familyId(spec.key),current=byId.get(id);if(!current&&members.length<2&&!['collection','kuji'].includes(spec.type))continue;
  if(!current)parents.push(createFamily(spec,members.find(m=>m.image&&!/no_photo|noimage/.test(m.image))||members[0],prefs));
  for(const member of members){if(only&&!only.has(member.id))continue;if(spec.type==='kuji'&&relations.some(r=>r.kind==='contains'&&r.toId===member.id&&byId.get(r.fromId)?.kuji?.catalogueGroup))continue;
   const r:Relation={id:'family-link-'+createHash('sha256').update(id+':'+member.id).digest('hex').slice(0,24),fromId:id,toId:member.id,kind:'contains',quantity:1},key=relationKey(r);if(!existing.has(key)&&!dismissed.has(key)){links.push(r);existing.add(key);}
  }
 }return {parents,relations:links};
}
