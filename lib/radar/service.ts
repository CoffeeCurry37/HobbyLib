import {editorialProgress} from './editorial-state';
import {editorialIndex} from './editorial-index';
import {currentEditorial} from './editorial';
import {curate} from './curation';
import {catalogueFamily,familyId,familyPlan} from './catalogue-families';
import {itemRecord,selectedState,searchRecords,recordVersion,changeRelation} from './item-record';
import {applyMergePlan} from './merge-plan';
import {z} from 'zod';
import {createHash} from 'node:crypto';
import {exactMergePlan} from './duplicate-groups';
import {diagnostics} from './diagnostics';
import {repairClassification} from './classification';
import {PRODUCT_CLASSES} from './product-class';
import {primaryMedium} from './product-features';
import {frequentKeywords} from './keywords';
import {catalogueMeta,cataloguePage} from './catalog-state';
import {relayImage} from './image-source';
import {leanItem,leanState} from './lean';
import {exportDatabase} from './database-export';
import {importLock} from './operation-lock';
import {listingPageKey,searchScope} from './crawl-progress';
import {db,stateFor,saveItems,savePrefs,saveNotice,saveScan} from '@/lib/radar/store';
import {classify,isSmallGoods,createItem,scoreItem,learnWeights,relationCycle,automaticRelations,relationKey} from '@/lib/radar/engine';
import {fetchPublic,parseHtml,safeUrl,Parsed,SourceInteractionError,strip} from '@/lib/radar/collector';
import {applyMetadata,extractMetadata,metadataTags} from '@/lib/radar/metadata';
import {readSource} from '@/lib/radar/reader';
import {productIndex,findProduct,offerKey,updateOffer,availableOffers,duplicateCandidates,sameProduct,productName,IDENTITY_RULE_VERSION} from '@/lib/radar/identity';
import {mergeProducts,undoMerge,repairItem} from '@/lib/radar/maintenance';
import {accountRowsSchema,previewAccounts,applyAccounts} from '@/lib/radar/accounts';
import {researchItem,verifiedFacts} from '@/lib/radar/research';
import {inferSetMembers,setMembers,ownershipSummary} from './sets';
import {inferKujiMembers} from './kuji-members';
import {recognizeLotPhoto,recognizedLot,lotImageRelations} from './lot-images';
import {titleCatalogue,editionVariant,manualField} from './catalog';
import {buildCatalogue,catalogueNodes,nodeCycle} from './taxonomy';
import {ACTION_BYTES,BACKUP_IMPORT_BYTES,MAX_BACKUP_ITEMS,MAX_BACKUP_RELATIONS,MAX_CATALOGUE_NODES,jsonChunks,readActionText} from './import-limits';
import surugaSnapshot from './suruga-snapshot.json';
import fateManifest from './fate-crawl-manifest.json';
import {Item,State,Scan,Prefs,Relation,EMPTY_FACTS,DEFAULT_PREFS} from '@/lib/radar/types';
const short=z.string().trim().max(300),long=z.string().max(16000),id=z.string().min(1).max(100);
const catalogueNodeSchema=z.object({id,parentId:id.nullable(),name:short.min(1),order:z.number().int().min(0).max(100000),description:short.optional()}).strict();
const kujiSchema=z.object({campaignId:short.min(1),campaign:short.min(1),award:short.min(1),count:z.number().int().min(0).max(200).optional(),catalogueGroup:z.boolean().optional(),slot:z.number().int().min(1).max(200).optional()});
const patchSchema=z.object({summary:z.string().max(500).optional(),productType:short.optional(),catalogueGroupType:z.enum(['editions','collection','book-series','kuji']).optional(),catalogueKey:short.optional(),cardNumber:short.optional(),image:z.string().max(2000).refine(v=>!v||/^https:\/\//.test(v)).optional(),images:z.array(z.string().max(2000).url().startsWith('https://')).max(10).optional(),majorClass:z.enum(['书籍','游戏','影像','周边','大型周边','卡片','玩具','同人']).optional(),event:short.optional(),saleForm:z.enum(['single','media_bundle','game_bundle','complete_goods','variant_group','seller_lot']).optional(),audience:z.enum(['male','female','unknown']).optional(),ageRating:z.enum(['all','r18','unknown']).optional(),manualOrder:z.number().int().min(0).max(1000000).optional(),setMode:z.enum(['permanent','lot']).nullable().optional(),catalogNodeId:z.string().max(100).optional(),productLine:short.optional(),wave:short.optional(),member:short.optional(),title:short.min(1).optional(),description:long.optional(),brand:short.optional(),manufacturer:short.optional(),publisher:short.optional(),circle:short.optional(),characters:z.array(short).max(15).optional(),artists:z.array(short).max(15).optional(),releaseDate:short.optional(),jan:z.string().regex(/^$|^\d{8}$|^\d{13}$/).optional(),origin:z.enum(['commercial','doujin','unknown']).optional(),series:short.optional(),year:z.string().regex(/^$|^(19|20)\d{2}$/).optional(),category:short.optional(),kind:z.enum(['base','bonus','component','set','unknown']).optional(),tags:z.array(z.string().trim().min(1).max(60)).max(50).optional(),isbn:z.string().regex(/^$|^\d{10}$|^\d{13}$/).optional(),msrp:z.number().int().min(0).max(100000000).nullable().optional(),ownership:z.enum(['owned','missing','unknown']).optional(),quantity:z.number().int().min(0).max(999).optional(),priority:z.number().int().min(0).max(100).optional(),rating:z.number().int().min(1).max(5).nullable().optional(),review:z.boolean().optional(),bucket:z.enum(['normal','junk']).optional(),notes:long.optional(),watchlisted:z.boolean().optional()}).strict();
const prefsSchema=z.object({catalogueRepair:z.object({version:z.number().int(),after:z.string().max(300)}).optional(),enabledModules:z.array(z.enum(['review','preferences','alerts','accounts','assistant'])).max(5).optional(),catalogueNodes:z.array(catalogueNodeSchema).max(MAX_CATALOGUE_NODES).optional(),junkThreshold:z.number().int().min(0).max(1000000),alertThreshold:z.number().int().min(0).max(100),tagWeights:z.record(z.string().min(1).max(60),z.number().min(-50).max(50)),rules:z.array(z.object({id,type:z.enum(['allow','block']),keyword:z.string().trim().min(1).max(80),priority:z.number().int().min(0).max(100)})).max(100),glossary:z.record(z.string().min(1).max(80),z.string().max(100)),language:z.enum(['ja','zh']),searchUrl:z.string().max(2000),autoLink:z.boolean().default(true),autoEnrich:z.boolean().default(true),identityMigrated:z.number().int().optional(),fateSnapshot:z.object({id:z.string().max(100),nextBatch:z.number().int().min(0).max(10000)}).optional(),schemaVersion:z.number().int().optional(),sourcePauses:z.record(z.string().max(200),z.object({reason:long,at:z.string().datetime(),scope:z.enum(['details','all']).optional()})).optional(),dismissedRelations:z.array(z.string().max(300)).max(5000).default([]),monitor:z.object({enabled:z.boolean(),intervalMinutes:z.number().int().min(15).max(1440),urls:z.array(z.string().max(2000)).max(20)}).default({enabled:false,intervalMinutes:60,urls:[]})});
  const urlSchema=z.string().max(2000).refine(v=>!v||/^https:\/\//.test(v),'仅支持 HTTPS 来源链接');
  const price=z.number().int().min(0).max(100000000).nullable(),basis=z.enum(['tax_included','unspecified']).optional(),when=z.string().datetime();
  const offerSchema=z.object({variant:short.optional(),jan:short.optional(),isbn:short.optional(),releaseDate:short.optional(),listingTitle:short.optional(),stockEpoch:z.number().int().min(0).optional(),extras:z.array(z.object({name:short,status:z.enum(['included','absent','only'])})).max(30).optional(),id:z.string().min(1).max(2000),source:short,url:urlSchema,price,priceBasis:basis,currency:z.literal('JPY'),condition:short,availability:z.enum(['available','sold','unknown']),bonus:z.enum(['included','absent','only','unknown']),shop:short.optional(),productKey:short.optional(),observation:z.enum(['list','detail']).optional(),verifiedAt:when.optional(),stockNote:short.optional(),priceKind:z.enum(['ask','bid','closed']).optional(),buyout:price.optional(),detailError:long.optional(),lastAttempt:when.optional(),observedAt:when,history:z.array(z.object({price,at:when,priceBasis:basis})).max(100)});
  const fullItem=patchSchema.extend({editorial:z.object({campaign:short,status:z.enum(['verified','partial','blocked']),at:when,sources:z.array(z.string().url().startsWith('https://').max(2000)).max(10),unresolved:z.array(short).max(10),checks:z.object({classification:z.boolean(),context:z.boolean(),image:z.boolean(),tags:z.boolean(),summary:z.boolean()}),basis:z.string().max(16000),imageUrl:z.string().max(2000)}).optional(),catalogueGroup:z.boolean().optional(),imageRole:z.enum(['product','award_reference','catalogue_reference','lot_photo']).optional(),kuji:kujiSchema.optional(),images:z.array(urlSchema).max(12).optional(),inferredMember:z.boolean().optional(),provisional:z.boolean().optional(),id,title:short.min(1),image:urlSchema,createdAt:when,evidence:z.array(z.object({field:short,value:z.string().max(16000),url:urlSchema,at:when,method:short})).max(150),offers:z.array(offerSchema).max(100),demo:z.boolean().optional(),locked:z.boolean().optional(),aliases:z.array(short).max(100).optional(),watchlisted:z.boolean().optional(),schemaVersion:z.number().int().optional(),archivedInto:id.optional(),mergeSnapshot:z.string().max(1000000).optional(),detailCheckedAt:when.optional(),detailStatus:long.optional()});
function parseProducts(input:unknown){
  const factsSchema=patchSchema.pick({catalogueKey:true,cardNumber:true,event:true,saleForm:true,audience:true,ageRating:true,brand:true,publisher:true,manufacturer:true,characters:true,circle:true,artists:true,releaseDate:true,jan:true,origin:true,series:true,year:true,isbn:true,msrp:true,category:true,productLine:true,wave:true,member:true}).extend({kuji:kujiSchema.optional()});
  return z.array(z.object({provisional:z.boolean().optional(),title:short.min(1),description:long,image:urlSchema,images:z.array(urlSchema).max(12).optional(),categoryLabel:short.optional(),offer:offerSchema,extraOffers:z.array(offerSchema).max(100).optional(),facts:factsSchema.optional(),tags:z.array(z.string().max(60)).max(50).optional()})).min(1).max(500).parse(input);
}
function response(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
function error(e:unknown){const message=e instanceof Error?e.message:'操作失败';return response({error:e instanceof z.ZodError?'输入格式有误，请检查字段范围':message,...(e instanceof z.ZodError?{fields:e.issues.slice(0,10).map(i=>({path:i.path.join('.'),message:i.message}))}:{}),...(e instanceof SourceInteractionError?{interaction:e.code,sourceUrl:e.sourceUrl}:{})},message==='UNAUTHENTICATED'?401:400);}
const runtime=(mode:'sites'|'standalone')=>({mode,background:mode==='standalone',ai:false as const});
function relationStatements(user:string,relations:Relation[]){return jsonChunks(relations).map(chunk=>db().prepare("INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)").bind(user,chunk));}
export async function getStateResponse(request:Request,user:string,mode:'sites'|'standalone'='sites'){try{const params=new URL(request.url).searchParams;
 if(params.has('image'))return relayImage(params.get('image')!);
 if(params.has('editorialAudit'))return response(await editorialProgress(user,params.get('filter')||'all',Math.max(0,Number(params.get('offset'))||0)));
 if(params.has('editorialIndex'))return editorialIndex(user);
 if(params.has('editorialItems')){const ids=z.array(id).min(1).max(100).parse((params.get('editorialItems')||'').split(','));const state=await selectedState(user,ids);return response({items:state.items,relations:state.relations});}
 if(params.has('catalogMeta'))return response({...await catalogueMeta(user),runtime:runtime(mode)});
 if(params.has('catalogScope'))return response(await cataloguePage(user,params.get('catalogScope')!,params.get('after')||''));
 if(params.has('export'))return exportDatabase(user);
 if(params.has('diagnostics'))return new Response(JSON.stringify(await diagnostics(user),null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="collector-radar-diagnostics.json"','Cache-Control':'no-store'}});
 if(params.has('find'))return response(await searchRecords(user,(params.get('find')||'').slice(0,300)));
 if(params.has('item'))return response(await itemRecord(user,params.get('item')!));
 const state=await stateFor(user,{lean:params.has('lean')});return response({...state,runtime:runtime(mode)});
}catch(e){return error(e);}}

async function autoLink(user:string,state:State,includeKuji=false){
 const kuji=inferKujiMembers(state,includeKuji);await saveItems(user,kuji.items);const kujiById=new Map(kuji.items.map(i=>[i.id,i]));state.items=state.items.map(i=>kujiById.get(i.id)||i);const existingIds=new Set(state.items.map(i=>i.id));state.items.push(...kuji.items.filter(i=>!existingIds.has(i.id)));
 const inferred=inferSetMembers(state);await saveItems(user,inferred.items);state.items.push(...inferred.items);
 const links=[...kuji.relations,...inferred.relations,...lotImageRelations(state),...automaticRelations(state)];if(!links.length)return 0;
 await db().batch(jsonChunks(links).map(chunk=>db().prepare("INSERT OR IGNORE INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)").bind(user,chunk)));state.relations.push(...links);return links.length;
}
async function setAlerts(user:string,state:State,changed:Item[]){
 const learned=learnWeights(state.items),notices=[];
 for(const set of changed.filter(i=>i.kind==='set'))for(const member of setMembers(set,state)){
  if(member.item.ownership==='owned'&&member.item.quantity>=member.quantity)continue;
  const score=scoreItem(member.item,state,learned);if(member.item.provisional||score.blocked||score.score<state.prefs.alertThreshold)continue;
  for(const o of availableOffers(set)){const nid='lot:'+member.item.id+':'+o.id+':'+o.price+':'+(o.stockEpoch||0);if(state.notices.some(n=>n.id===nid))continue;
   const notice={id:nid,itemId:member.item.id,title:member.item.title,score:score.score,reason:`需要的商品出现在套装：${set.title} · ${o.source} ¥${o.price} · 已拥有 ${ownershipSummary(set,state).owned} 件；整套价格，非单件价`,at:o.observedAt,read:false};notices.push(notice);state.notices.push(notice);
  }
 }
 if(notices.length)await db().batch(jsonChunks(notices).map(chunk=>db().prepare("INSERT OR IGNORE INTO notices(user_id,id,data) SELECT ?,json_extract(value,'$.id'),value FROM json_each(?)").bind(user,chunk)));
}
async function syncNamedExtras(user:string,state:State){const changed:Item[]=[];const links:Relation[]=[];
 for(const parent of [...state.items].filter(i=>i.kind==='base'))for(const name of new Set(parent.offers.flatMap(o=>(o.extras||[]).map(e=>e.name)).filter(n=>/エア[・\s]?カリバーン/.test(n)))){
  const componentId='extra-'+parent.id+'-aircaliburn',expected=createItem((parent.productLine||parent.title)+' 付録 '+name+'（特典単品）','',undefined,state.prefs);let bonus=state.items.find(i=>i.id===componentId)||findProduct(state.items.filter(i=>i.kind==='bonus'),expected)?.item;if(!bonus){bonus={...createItem((parent.productLine||parent.title)+' 付録 '+name+'（特典単品）','',undefined,state.prefs),id:componentId,kind:'bonus',bucket:'normal',brand:parent.brand,publisher:parent.publisher,series:parent.series,productLine:parent.productLine,wave:parent.wave,member:name,review:true,evidence:[{field:'附属组件',value:name,url:parent.offers[0]?.url||'',at:new Date().toISOString(),method:'挂牌标题明确列出附件；拥有状态独立，默认未标记'}]};state.items.push(bonus);changed.push(bonus);}
  const link={id:'extra-link-'+parent.id,fromId:parent.id,toId:bonus.id,kind:'bonus' as const,quantity:1};if(!state.relations.some(r=>r.fromId===link.fromId&&r.toId===link.toId)&&!state.prefs.dismissedRelations.includes(relationKey(link))){state.relations.push(link);links.push(link);}
 }
 await saveItems(user,changed);if(links.length)await db().batch(links.map(r=>db().prepare('INSERT OR IGNORE INTO relations(user_id,id,from_id,to_id,kind,quantity) VALUES(?,?,?,?,?,?)').bind(user,r.id,r.fromId,r.toId,r.kind,r.quantity)));return changed.length;
}
async function prepareProduct(p:Parsed,state:State){
  let candidate=createItem(p.title,p.description,p.offer,state.prefs,p.image);candidate.schemaVersion=9;candidate.id='source-'+createHash('sha256').update(offerKey(p.offer)).digest('hex').slice(0,32);candidate.images=p.images?.slice(0,10);
  const categoryEvidence=p.categoryLabel?{field:'来源分类',value:p.categoryLabel,url:p.offer.url,at:p.offer.observedAt,method:'商品页局部分类标签；优先于标题关键词和旧推断'}:null;if(categoryEvidence)candidate.evidence=[...candidate.evidence,categoryEvidence];
  candidate.offers=[p.offer,...(p.extraOffers||[])].map(o=>({...o,listingTitle:o.listingTitle||p.title,variant:o.variant||editionVariant(o.listingTitle||p.title),jan:o.jan||p.facts?.jan,isbn:o.isbn||p.facts?.isbn,releaseDate:o.releaseDate||p.facts?.releaseDate}));if(p.facts)candidate=applyMetadata(candidate,p.facts,p.offer.url);
  if(candidate.category==='書籍'&&candidate.kind==='unknown')candidate.kind='base';
  if(candidate.category==='書籍')candidate.bucket='normal';if(state.prefs.autoEnrich!==false)candidate=verifiedFacts(candidate,state);candidate.tags=[...new Set([...candidate.tags,...(p.tags||[])])].filter(t=>t.length<=60).slice(0,50);candidate=repairClassification(candidate);
  const photo=await recognizeLotPhoto(p);if(photo)candidate=recognizedLot(candidate,photo);
  return {candidate,categoryEvidence,photo};
}
export async function ingest(user:string,state:State,products:Parsed[],generateAlerts=true,scoped=false,prepared?:Awaited<ReturnType<typeof prepareProduct>>[]){
 const changed=new Map<string,Item>();const learned=learnWeights(state.items);let added=0,matched=0;const index=productIndex(state.items);
 for(const [position,p] of products.slice(0,500).entries()){
  const {candidate,categoryEvidence,photo}=prepared?.[position]||await prepareProduct(p,state);
  const match=findProduct(state.items,candidate,index);let item:Item;
  if(match){matched++;const placeholder=/\/(?:blank\.(?:gif|png)|noimage|items\/temple?tes\/)/i.test(match.item.image),scopedImage=!!p.image&&(/\/skus\//.test(p.image)||!!p.categoryLabel&&!!p.images?.length);item={...match.item,image:(!manualField(match.item,'image')&&(placeholder||scopedImage)?candidate.image:match.item.image)||candidate.image,images:!manualField(match.item,'image')&&p.images?.length?p.images.slice(0,10):match.item.images,offers:[...match.item.offers],aliases:[...new Set([...(match.item.aliases||[]),p.title])].filter(t=>t!==match.item.title).slice(0,100)};
   if(categoryEvidence&&!item.evidence.some(e=>e.field===categoryEvidence.field&&e.value===categoryEvidence.value&&e.url===categoryEvidence.url))item.evidence=[...item.evidence,categoryEvidence].slice(-150);
   if(item.inferredMember){item.inferredMember=false;item.image=item.image||candidate.image;if(!manualField(item,'title'))item.title=candidate.title;if(!manualField(item,'description'))item.description=candidate.description;}
   for(const incoming of candidate.offers){const n=item.offers.findIndex(o=>offerKey(o)===offerKey(incoming));if(n<0)item.offers.push(incoming);else item.offers[n]=updateOffer(item.offers[n],incoming);}
   if(p.facts&&state.prefs.autoEnrich!==false)item=applyMetadata(item,p.facts,p.offer.url);
   if(photo&&!currentEditorial(item)&&!manualField(item,'kind'))item=recognizedLot(item,photo);
   if(state.prefs.autoEnrich!==false&&!currentEditorial(item))item=repairClassification({...item,tags:[...new Set([...item.tags,...candidate.tags])].slice(0,50)});
   state.items[state.items.findIndex(i=>i.id===item.id)]=item;
  }else {item={...candidate,provisional:p.provisional??(['Mercari','Yahoo 拍卖','Yahoo 购物'].includes(p.offer.source)&&candidate.bucket!=='junk')};added++;state.items.push(item);}
  if(p.tags?.length&&!item.evidence.some(e=>e.field==='来源关键词'&&e.url===p.offer.url&&e.value===p.tags!.join('、')))item.evidence=[...item.evidence,{field:'来源关键词',value:p.tags.join('、'),url:p.offer.url,at:p.offer.observedAt,method:'商品结构化数据或商品区域；不采纳整站导航词'}].slice(-100);
  index.add(item);changed.set(item.id,item);const score=scoreItem(item,state,learned);
  for(const o of item.offers.filter(o=>candidate.offers.some(c=>offerKey(c)===offerKey(o)))){
   if(generateAlerts&&!item.provisional&&!score.blocked&&score.score>=state.prefs.alertThreshold&&availableOffers(item).includes(o)){
    const baseId=`${item.id}:${o.id}:${o.price}:${o.availability}`,nid=baseId+':'+(o.stockEpoch||0);
    if(!state.notices.some(n=>n.id===nid||!(o.stockEpoch||0)&&n.id===baseId)){const notice={id:nid,itemId:item.id,title:item.title,score:score.score,reason:[...score.reasons,`${o.source} ${o.shop||''} ¥${o.price}${o.priceKind==='bid'?'（当前出价，非一口价）':''}`,o.stockNote||''].filter(Boolean).join(' · '),at:o.observedAt,read:false};await saveNotice(user,notice);state.notices.push(notice);}
   }
  }
 }
 await saveItems(user,[...changed.values()]);
 const parentIds=[...new Set([...changed.values()].map(i=>catalogueFamily(i)).filter((s):s is NonNullable<typeof s>=>!!s).map(s=>familyId(s.key)))].filter(id=>!state.items.some(i=>i.id===id));
 if(parentIds.length){const parents=await selectedState(user,parentIds);state.items.push(...parents.items);}
 const grouped=familyPlan(state.items,state.relations,state.prefs,new Set(changed.keys()));if(grouped.parents.length){await saveItems(user,grouped.parents);state.items.push(...grouped.parents);}if(grouped.relations.length){await db().batch(relationStatements(user,grouped.relations));state.relations.push(...grouped.relations);}
 state.prefs.identityMigrated=0;delete state.prefs.catalogueRepair;await savePrefs(user,state.prefs);if(!scoped)await syncNamedExtras(user,state);const linked=grouped.relations.length+(scoped?0:await autoLink(user,state));if(generateAlerts)await setAlerts(user,state,[...changed.values()]);return{added,matched,linked};
}

// Only keep records whose identity keys intersect this batch. Full records are read in bounded pages.
// Catalogue-wide set inference is separate: partial context must never fabricate duplicate members.
async function prepareScopedImport(user:string,products:Parsed[]){
 const state=await selectedState(user,[]),prepared=[] as Awaited<ReturnType<typeof prepareProduct>>[];
 for(const p of products)prepared.push(await prepareProduct(p,state));
 const incoming=productIndex(prepared.map(p=>p.candidate));let after='',retainedBytes=0;
 for(;;){
  const page=await db().prepare("WITH candidates AS (SELECT id,data FROM items WHERE user_id=? AND id>? AND json_extract(data,'$.archivedInto') IS NULL ORDER BY id LIMIT 400), bounded AS (SELECT id,data,SUM(length(CAST(data AS BLOB))) OVER (ORDER BY id) AS bytes,ROW_NUMBER() OVER (ORDER BY id) AS position FROM candidates) SELECT id,data FROM bounded WHERE bytes<=1000000 OR position=1 ORDER BY id").bind(user,after).all();
  if(!page.results.length)break;
  for(const row of page.results){const item=repairItem({...EMPTY_FACTS,description:'',evidence:[],offers:[],...JSON.parse(row.data)}) as Item;if(!item.demo&&incoming.lookup(item).length){retainedBytes+=row.data.length;if(retainedBytes>16000000)throw Error('本批匹配范围过大，请减少一次导入的商品数量');state.items.push(item);}}
  after=page.results.at(-1).id;
 }
 return {state,prepared};
}
async function importScoped(user:string,body:any,mode:'sites'|'standalone'){
 const products=parseProducts(body.products),snapshotId=body.snapshotId?z.string().min(1).max(100).parse(body.snapshotId):'',batch=z.number().int().min(0).max(10000).parse(body.batch??0),initial=await selectedState(user,[]),previous=(fateManifest as any).previousSnapshot;
 const inherit=snapshotId===fateManifest.id&&previous?.id===initial.prefs.fateSnapshot?.id&&initial.prefs.fateSnapshot?.nextBatch===previous.batches,expected=initial.prefs.fateSnapshot?.id===snapshotId?initial.prefs.fateSnapshot.nextBatch:inherit?previous.batches:0;
 if(snapshotId&&batch<expected)return response({ok:true,already:true,added:0,matched:0,snapshot:initial.prefs.fateSnapshot,runtime:runtime(mode)});
 if(snapshotId&&batch!==expected)throw Error('采集导入进度已变化，请刷新后继续');
 for(const p of products)for(const o of [p.offer,...p.extraOffers||[]]){safeUrl(o.url);o.verifiedAt=undefined;o.observation='list';o.stockNote=[o.stockNote,'已保存的采集记录；需在线复核后提醒'].filter(Boolean).join('；');}
 const {state,prepared}=await prepareScopedImport(user,products),result=await ingest(user,state,products,false,true,prepared);
 if(snapshotId){state.prefs.fateSnapshot={id:snapshotId,nextBatch:batch+1};await savePrefs(user,state.prefs);}
 if(snapshotId===fateManifest.id&&batch+1===fateManifest.files.length){const scans=fateManifest.sources.map(source=>({id:'fate-audit-'+fateManifest.id+'-'+source.name,url:source.url,at:fateManifest.capturedAt,count:source.count,status:source.status==='failed'?'failed':'success',message:`实际采集 ${source.pages} 页、${source.count} 条来源记录。${source.status==='failed'?'来源受限，保留断点。':source.next?'尚有后续页，这是部分采集。':'当前入口分页已结束。'}`,next:source.next}));await db().batch(jsonChunks(scans).map(chunk=>db().prepare("INSERT INTO scans(user_id,id,data) SELECT ?,json_extract(value,'$.id'),value FROM json_each(?) WHERE true ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data").bind(user,chunk)));}
 return response({ok:true,...result,count:products.length,deferredRelations:true,snapshot:state.prefs.fateSnapshot,runtime:runtime(mode)});
}
async function pauseSource(user:string,state:State,url:string,reason?:string,scope:'details'|'all'='all'){
 const host=new URL(url).hostname;state.prefs.sourcePauses={...state.prefs.sourcePauses};if(reason)state.prefs.sourcePauses[host]={reason,at:new Date().toISOString(),scope};else delete state.prefs.sourcePauses[host];await savePrefs(user,state.prefs);
}
function validateNodes(nodes:NonNullable<Prefs['catalogueNodes']>){if(new Set(nodes.map(n=>n.id)).size!==nodes.length)throw new Error('板块编号重复');const all=catalogueNodes({catalogueNodes:nodes}),byId=new Map(all.map(n=>[n.id,n])),done=new Set<string>();for(const n of all){let current:typeof n|undefined=n;const path=new Set<string>();while(current&&!done.has(current.id)){if(path.has(current.id))throw new Error('板块不能循环嵌套');path.add(current.id);if(current.parentId&&!byId.has(current.parentId))throw new Error('上级板块不存在');current=current.parentId?byId.get(current.parentId):undefined;}for(const id of path)done.add(id);}}
function validateBackupRelations(items:Pick<Item,'id'>[],relations:Relation[]){const ids=new Set(items.map(i=>i.id)),incoming=new Map<string,number>(),children=new Map<string,string[]>();for(const r of relations){if(r.fromId===r.toId||!ids.has(r.fromId)||!ids.has(r.toId))throw new Error('备份中的关联关系无效');if(r.kind==='contains'){incoming.set(r.toId,(incoming.get(r.toId)||0)+1);if(!children.has(r.fromId))children.set(r.fromId,[]);children.get(r.fromId)!.push(r.toId);}}
 const pending=[...ids].filter(id=>!incoming.has(id));let seen=0;for(let at=0;at<pending.length;at++){const id=pending[at];seen++;for(const child of children.get(id)||[]){const count=incoming.get(child)!-1;incoming.set(child,count);if(count===0)pending.push(child);}}if(seen!==ids.size)throw new Error('备份中的关联关系无效');
}
const backupKinds=['items','archived','relations','notices','scans'] as const;
const backupCountsSchema=z.object({items:z.number().int().min(0).max(MAX_BACKUP_ITEMS),archived:z.number().int().min(0).max(MAX_BACKUP_ITEMS),relations:z.number().int().min(0).max(MAX_BACKUP_RELATIONS),notices:z.number().int().min(0).max(300),scans:z.number().int().min(0).max(100)}).strict();
const backupMetadataSchema=z.object({version:z.number().int().min(2).max(9),prefs:prefsSchema,counts:backupCountsSchema}).strict();
const backupRelationSchema=z.object({id,fromId:id,toId:id,kind:z.enum(['bonus','contains','related']),quantity:z.number().int().min(1).max(999)});
const backupNoticeSchema=z.object({id:z.string().max(2200),itemId:id,title:short,score:z.number().min(0).max(100),reason:long,at:z.string().datetime(),read:z.boolean()});
const backupScanSchema=z.object({id,url:urlSchema,at:z.string().datetime(),count:z.number().int().min(0),status:z.enum(['success','failed']),message:long,next:urlSchema.nullable(),scope:urlSchema.optional(),pageKey:z.string().max(64).optional(),partitions:z.array(urlSchema).max(100).optional(),incomplete:z.boolean().optional()});
type BackupJob={restoreOwner:string;createdAt:string;metadata:z.infer<typeof backupMetadataSchema>;received:z.infer<typeof backupCountsSchema>;bytes:number};
const stagingUser=(user:string,restoreId:string)=>user+'\0restore:'+restoreId;
const emptyRestoreError='为保护现有整理结果，整库迁移仅允许导入空数据库。请先导出当前库备份，或使用新的独立数据目录。';
function requireEmpty(state:State){if(state.items.length||state.archived?.length||state.relations.length)throw new Error(emptyRestoreError);}
function clearStaging(stage:string){return ['items','relations','notices','scans','preferences'].map(table=>db().prepare('DELETE FROM '+table+' WHERE user_id=?').bind(stage));}
async function backupTransferAction(body:any,user:string,state:State,bytes:number){
 if(body.action==='backup-start'){
  requireEmpty(state);const metadata=backupMetadataSchema.parse(body.metadata);validateNodes(metadata.prefs.catalogueNodes||[]);safeUrl(metadata.prefs.searchUrl);for(const url of metadata.prefs.monitor.urls)safeUrl(url);
  const expired="SELECT user_id FROM preferences WHERE json_extract(data,'$.restoreOwner')=? AND json_extract(data,'$.createdAt')<?",before=new Date(Date.now()-86400000).toISOString();
  await db().batch(['items','relations','notices','scans','preferences'].map(table=>db().prepare('DELETE FROM '+table+' WHERE user_id IN ('+expired+')').bind(user,before)));
  const restoreId=crypto.randomUUID(),job:BackupJob={restoreOwner:user,createdAt:new Date().toISOString(),metadata,received:{items:0,archived:0,relations:0,notices:0,scans:0},bytes};
  await db().prepare('INSERT INTO preferences(user_id,data) VALUES(?,?)').bind(stagingUser(user,restoreId),JSON.stringify(job)).run();return {restoreId,received:job.received};
 }
 const restoreId=z.string().uuid().parse(body.restoreId),stage=stagingUser(user,restoreId);
 if(body.action==='backup-cancel'){await db().batch(clearStaging(stage));return {cancelled:true};}
 const saved=(await db().prepare('SELECT data FROM preferences WHERE user_id=?').bind(stage).all()).results[0]?.data;
 if(!saved)throw new Error('备份恢复会话已结束，请重新选择文件');const job=JSON.parse(saved) as BackupJob;if(job.restoreOwner!==user)throw new Error('备份恢复会话不匹配');
 if(body.action==='backup-chunk'){
  const kind=z.enum(backupKinds).parse(body.kind),offset=z.number().int().min(0).parse(body.offset);if(offset!==job.received[kind])throw new Error('备份分块顺序不匹配，请重新导入');
  const schema=kind==='items'||kind==='archived'?fullItem:kind==='relations'?backupRelationSchema:kind==='notices'?backupNoticeSchema:backupScanSchema;
  const rows=z.array(schema).min(1).max(250).parse(body.rows);if(offset+rows.length>job.metadata.counts[kind])throw new Error('备份条目数量与文件不符');
  if((job.bytes+=bytes)>BACKUP_IMPORT_BYTES)throw new Error('备份内容超过 32 MB');
  const now=new Date().toISOString(),table=kind==='archived'?'items':kind;
  const normalized=kind==='items'||kind==='archived'?rows.map((raw:any)=>{if((kind==='archived')!==!!raw.archivedInto)throw new Error('备份中的合并存档类型不符');return {...createItem(raw.title,raw.description||'',undefined,DEFAULT_PREFS),...EMPTY_FACTS,...raw};}):rows;
  const query=table==='items'?"INSERT INTO items(user_id,id,data,updated_at) SELECT ?,json_extract(value,'$.id'),value,? FROM json_each(?)":table==='relations'?"INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)":'INSERT INTO '+table+"(user_id,id,data) SELECT ?,json_extract(value,'$.id'),value FROM json_each(?)";
  job.received[kind]+=rows.length;
  await db().batch([
   // Fail rather than committing rows against a stale concurrent chunk.
   db().prepare('INSERT INTO preferences(user_id,data) SELECT user_id,data FROM preferences WHERE user_id=? AND data<>?').bind(stage,saved),
   ...jsonChunks(normalized).map(chunk=>table==='items'?db().prepare(query).bind(stage,now,chunk):db().prepare(query).bind(stage,chunk)),
   db().prepare('UPDATE preferences SET data=? WHERE user_id=?').bind(JSON.stringify(job),stage)]);
  return {restoreId,received:job.received};
 }
 if(body.action!=='backup-finish')throw new Error('未知的备份恢复操作');requireEmpty(state);
 if(backupKinds.some(kind=>job.received[kind]!==job.metadata.counts[kind]))throw new Error('备份尚未上传完整，请重新导入');
 const counts=await db().batch(['items','relations','notices','scans'].map(table=>db().prepare('SELECT COUNT(*) AS count FROM '+table+' WHERE user_id=?').bind(stage)));
 if(counts.some((c,n)=>Number(c.results[0].count)!==(n===0?job.received.items+job.received.archived:job.received[(['relations','notices','scans'] as const)[n-1]])))throw new Error('备份条目数量与文件不符');
 const links=await db().batch([db().prepare('SELECT id FROM items WHERE user_id=?').bind(stage),db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=?').bind(stage)]);validateBackupRelations(links[0].results,links[1].results as Relation[]);
 const prefs={...job.metadata.prefs,monitor:{...job.metadata.prefs.monitor,enabled:false}};
 const guard=stage+'\0finalizing';
 await db().batch([
  // A cancelled or changed staging session makes this NOT NULL insert fail.
  db().prepare('INSERT INTO preferences(user_id,data) VALUES(?,(SELECT data FROM preferences WHERE user_id=? AND data=?))').bind(guard,stage,saved),
  db().prepare('INSERT INTO items(user_id,id,data,updated_at) SELECT user_id,id,data,updated_at FROM items WHERE user_id=?').bind(user),
  db().prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT user_id,id,from_id,to_id,kind,quantity FROM relations WHERE user_id=?').bind(user),
  db().prepare('INSERT INTO items(user_id,id,data,updated_at) SELECT ?,id,data,updated_at FROM items WHERE user_id=?').bind(user,stage),
  db().prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,id,from_id,to_id,kind,quantity FROM relations WHERE user_id=?').bind(user,stage),
  db().prepare('INSERT INTO notices(user_id,id,data) SELECT ?,id,data FROM notices WHERE user_id=?').bind(user,stage),
  db().prepare('INSERT INTO scans(user_id,id,data) SELECT ?,id,data FROM scans WHERE user_id=?').bind(user,stage),
  db().prepare('INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').bind(user,JSON.stringify(prefs)),...clearStaging(stage),db().prepare('DELETE FROM preferences WHERE user_id=?').bind(guard)]);
 return {count:job.received.items+job.received.archived,message:'整库迁移完成，后台监控默认关闭，请确认配置后再启用',state:await stateFor(user)};
}
async function validatePlacement(user:string,state:State,nodeId:string|undefined){if(!nodeId)return;const tree=buildCatalogue(state.items,state.prefs);if(!tree.byId.has(nodeId))throw new Error('板块不存在，请刷新后选择');const retained=new Map((state.prefs.catalogueNodes||[]).map(n=>[n.id,n]));for(const n of tree.ancestors(nodeId))retained.set(n.id,n);state.prefs.catalogueNodes=[...retained.values()];await savePrefs(user,state.prefs);}
async function refreshItem(user:string,state:State,item:Item,url?:string){
 const offer=url?item.offers.find(o=>offerKey(o)===offerKey({url} as any)):item.offers.filter(o=>Date.now()-Date.parse(o.lastAttempt||'2000-01-01')>86400000).sort((a,b)=>Number(!!a.verifiedAt)-Number(!!b.verifiedAt))[0];
 if(!offer)throw new Error('没有待检查的挂牌，或今天已检查；可在具体挂牌点击复核');
 try{const page=await readSource(offer.url);const parsed=parseHtml(page.text,page.url);const product=parsed.products.find(p=>offerKey(p.offer)===offerKey(offer));if(!product)throw new Error('详情页没有返回目标挂牌，可能重定向或需要浏览器加载');
  await ingest(user,state,[product],true);const updated=state.items.find(i=>i.id===item.id)!;
  updated.detailCheckedAt=new Date().toISOString();updated.detailStatus=parsed.needsBrowser?'部分内容需浏览器：各店列表或库存尚未完整加载':'已读取详情；未知字段仍保留待核对';
  updated.offers=updated.offers.map(o=>offerKey(o)===offerKey(offer)?{...o,lastAttempt:updated.detailCheckedAt,detailError:parsed.needsBrowser?'需要浏览器完整加载':''}:o);await saveItems(user,[updated]);await pauseSource(user,state,offer.url,parsed.needsBrowser?updated.detailStatus:undefined,'details');return updated.detailStatus;
 }catch(e){const message=e instanceof Error?e.message:'读取失败';item.offers=item.offers.map(o=>offerKey(o)===offerKey(offer)?{...o,lastAttempt:new Date().toISOString(),detailError:message}:o);item.detailStatus=message;await saveItems(user,[item]);if(e instanceof SourceInteractionError)await pauseSource(user,state,offer.url,message);else await saveScan(user,{id:crypto.randomUUID(),url:offer.url,at:new Date().toISOString(),count:0,status:'failed',message,next:null});throw e;}
}
export async function postAction(request:Request,user:string,mode:'sites'|'standalone'='sites'){let unlock:(()=>Promise<any>)|undefined;try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new Error('请求来源不匹配');
 const raw=await readActionText(request),body=JSON.parse(raw.text);if(['update-item','catalogue-curation','apply-merge-plan','relation','unlink','merge-items','undo-merge','parsed-source-import','repair-duplicates','repair-kuji-catalogue','catalogue-enrichment','scan','json-import','html-import','capture-import'].includes(body.action)){const locked=await importLock(user,'catalogue-import');if(!locked)return response({ok:true,busy:true,retryAfter:2});unlock=locked;}if(body.action!=='restore-backup'&&raw.bytes>ACTION_BYTES)throw new Error('导入内容超过 4 MB');if(mode==='sites'&&body.action==='restore-backup'&&raw.bytes>ACTION_BYTES)throw new Error('较大备份请从页面导入文件，系统会自动分块恢复');if(body.action==='apply-merge-plan'){
 const pairs=z.array(z.object({fromId:id,toId:id}).strict()).min(1).max(20).parse(body.pairs);
 return response({ok:true,...await applyMergePlan(user,pairs),runtime:runtime(mode)});
 }if(body.action==='catalogue-curation'){const input=z.object({changes:z.array(z.object({item:fullItem,expectedVersion:z.string().length(64).optional()})).max(20),relations:z.array(backupRelationSchema).max(100)}).parse(body);return response({ok:true,...await curate(user,input.changes as any,input.relations)});}
 if(body.action==='update-item'&&!body.patch?.catalogNodeId){const state=await selectedState(user,[id.parse(body.id)]);  const item=state.items.find(i=>i.id===id.parse(body.id));if(!item)throw new Error('找不到商品');const patch=patchSchema.parse(body.patch);if(body.expectedVersion&&body.expectedVersion!==recordVersion(item))throw Error('商品已在其他页面修改，请重新读取后再保存');if(patch.review===false)item.provisional=false;if(patch.bucket==='junk'&&!isSmallGoods(patch.title||item.title,patch.category??item.category))throw new Error('小垃圾只接受徽章、丝带、挂件等周边小物；书籍和未知类别请保留正常收藏');
  if(patch.ownership==='owned'&&patch.quantity===undefined)patch.quantity=Math.max(1,item.quantity);if(patch.ownership==='missing')patch.quantity=0;
  const ownership=patch.ownership??item.ownership;patch.quantity=ownership==='owned'?Math.max(1,patch.quantity??item.quantity):0;
  let tags=[...new Set([...(patch.tags||item.tags).filter(t=>!metadataTags(item).includes(t)),...metadataTags({...item,...patch})])].slice(0,50);
  if(patch.majorClass)tags=[patch.majorClass,...tags.filter(t=>!PRODUCT_CLASSES.includes(t as any))].slice(0,50);
  const next:Item={...item,...patch,tags,locked:item.locked||Object.keys(patch).some(k=>!['ownership','quantity','priority','rating','watchlisted','manualOrder'].includes(k)),evidence:[...item.evidence,{field:'人工整理',value:Object.keys(patch).join('、'),url:'',at:new Date().toISOString(),method:'用户修改'}].slice(-50)};if(patch.image!==undefined||patch.images!==undefined){next.images=[...new Set([next.image,...(next.images||[])])].filter(Boolean).slice(0,10);next.image=next.images[0]||'';}await saveItems(user,[next]);return response({ok:true,item:next,version:recordVersion(next),message:'资料已保存'});

 }if(body.action==='relation'||body.action==='unlink'){if(body.action==='relation')body.relation=z.object({fromId:id,toId:id,kind:z.enum(['bonus','contains','related']),quantity:z.number().int().min(1).max(999)}).parse(body.relation);else id.parse(body.id);return response(await changeRelation(user,body));}
 if(body.action==='parsed-source-import'&&body.compact===true&&mode==='sites')return await importScoped(user,body,mode);
 const state=await stateFor(user,{archiveSummary:true});let result:Record<string,unknown>={};
 if(['backup-start','backup-chunk','backup-finish','backup-cancel'].includes(body.action))return response({...await backupTransferAction(body,user,state,raw.bytes),runtime:runtime(mode)});
 if(body.action==='catalogue-node'){
  const tree=buildCatalogue(state.items,state.prefs),node=catalogueNodeSchema.parse(body.node);if(node.parentId&&!tree.byId.has(node.parentId))throw new Error('上级板块不存在');
  if(nodeCycle(node.id,node.parentId,tree.nodes))throw new Error('板块不能循环嵌套');if(tree.nodes.some(n=>n.id!==node.id&&n.parentId===node.parentId&&n.name===node.name))throw new Error('同一层已有这个名称的板块');
  const retained=new Map((state.prefs.catalogueNodes||[]).map(n=>[n.id,n]));if(node.parentId)for(const n of tree.ancestors(node.parentId))retained.set(n.id,n);retained.set(node.id,node);
  if(retained.size>MAX_CATALOGUE_NODES)throw new Error('自定义板块过多，请先整理现有目录');state.prefs.catalogueNodes=[...retained.values()];await savePrefs(user,state.prefs);result={nodeId:node.id,message:'板块目录已保存'};
 }else if(body.action==='reorder-items'){
  const ids=z.array(id).min(1).max(MAX_BACKUP_ITEMS).parse(body.ids);if(new Set(ids).size!==ids.length)throw new Error('排序列表包含重复商品');
  const byId=new Map(state.items.map(i=>[i.id,i]));if(ids.some(id=>!byId.has(id)))throw new Error('商品已变化，请刷新后重试');
  await saveItems(user,ids.map((id,n)=>({...byId.get(id)!,manualOrder:n})));result={message:'手动顺序已保存'};
 }else if(body.action==='update-item'){
  const item=state.items.find(i=>i.id===id.parse(body.id));if(!item)throw new Error('找不到商品');const patch=patchSchema.parse(body.patch);await validatePlacement(user,state,patch.catalogNodeId);if(patch.review===false)item.provisional=false;if(patch.bucket==='junk'&&!isSmallGoods(patch.title||item.title,patch.category??item.category))throw new Error('小垃圾只接受徽章、丝带、挂件等周边小物；书籍和未知类别请保留正常收藏');
  if(patch.ownership==='owned'&&patch.quantity===undefined)patch.quantity=Math.max(1,item.quantity);if(patch.ownership==='missing')patch.quantity=0;
  const ownership=patch.ownership??item.ownership;patch.quantity=ownership==='owned'?Math.max(1,patch.quantity??item.quantity):0;
  let tags=[...new Set([...(patch.tags||item.tags).filter(t=>!metadataTags(item).includes(t)),...metadataTags({...item,...patch})])].slice(0,50);
  if(patch.majorClass)tags=[patch.majorClass,...tags.filter(t=>!PRODUCT_CLASSES.includes(t as any))].slice(0,50);
  await saveItems(user,[{...item,...patch,tags,locked:item.locked||Object.keys(patch).some(k=>!['ownership','quantity','priority','rating','watchlisted','manualOrder'].includes(k)),evidence:[...item.evidence,{field:'人工整理',value:Object.keys(patch).join('、'),url:'',at:new Date().toISOString(),method:'用户修改'}].slice(-50)}]);
 }else if(body.action==='bulk-update'){
  const ids=[...new Set(z.array(id).min(1).max(500).parse(body.ids))];
  const patch=patchSchema.pick({catalogNodeId:true,brand:true,productLine:true,wave:true,member:true,series:true,characters:true,tags:true,ownership:true,watchlisted:true}).strict().parse(body.patch);
  await validatePlacement(user,state,patch.catalogNodeId);if(!Object.keys(patch).length)throw new Error('请选择要修改的字段');
  const selected=ids.map(key=>state.items.find(item=>item.id===key));if(selected.some(item=>!item))throw new Error('部分商品已不存在，请刷新后重试');
  const changed=selected.map(entry=>{const item=entry!;const updated={...item,...patch};if(patch.ownership)updated.quantity=patch.ownership==='owned'?Math.max(1,item.quantity):0;
   updated.tags=[...new Set([...(patch.tags||item.tags).filter(t=>!metadataTags(item).includes(t)),...metadataTags(updated)])].slice(0,50);
   updated.locked=item.locked||!!(patch.catalogNodeId!==undefined||patch.brand!==undefined||patch.productLine!==undefined||patch.wave!==undefined||patch.member!==undefined||patch.series!==undefined||patch.characters!==undefined||patch.tags!==undefined);
   updated.evidence=[...item.evidence,{field:'批量整理',value:Object.keys(patch).join('、'),url:'',at:new Date().toISOString(),method:'用户修改所选商品'}].slice(-50);return updated;});
  await saveItems(user,changed);result={message:`已更新 ${changed.length} 件商品，关联条目未连带修改`};
 }else if(body.action==='create-item'){
  const patch=patchSchema.parse(body.item);await validatePlacement(user,state,patch.catalogNodeId);if(!patch.title)throw new Error('请输入商品名称');const item={...createItem(patch.title,patch.description||'',undefined,state.prefs),...patch};item.tags=[...new Set([...item.tags,...metadataTags(item)])].slice(0,50);if(item.ownership==='owned')item.quantity=Math.max(1,item.quantity);else item.quantity=0;await saveItems(user,[item]);state.items.push(item);if(item.kind==='set')await autoLink(user,state);result={id:item.id};
 }else if(body.action==='preferences'){
  const prefs=prefsSchema.parse(body.prefs) as Prefs;validateNodes(prefs.catalogueNodes||[]);safeUrl(prefs.searchUrl);for(const url of prefs.monitor.urls)safeUrl(url);if(prefs.monitor.enabled&&mode!=='standalone')throw new Error('全天监控需要独立运行版本；当前在线试用版支持手动采集');if(Object.keys(prefs.tagWeights).length>1000||Object.keys(prefs.glossary).length>1000)throw new Error('标签或词典过大');await savePrefs(user,prefs);
 }else if(body.action==='relation'){
  const rel=z.object({fromId:id,toId:id,kind:z.enum(['bonus','contains','related']),quantity:z.number().int().min(1).max(999)}).parse(body.relation);
  if(rel.fromId===rel.toId||![rel.fromId,rel.toId].every(v=>state.items.some(i=>i.id===v)))throw new Error('请选择两个不同的现有商品');
  if(rel.kind==='contains'&&relationCycle(rel.fromId,rel.toId,state.relations))throw new Error('套装不能形成循环包含关系');
  const existing=state.relations.find(r=>r.fromId===rel.fromId&&r.toId===rel.toId&&r.kind===rel.kind);await db().prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET quantity=excluded.quantity').bind(user,existing?.id||crypto.randomUUID(),rel.fromId,rel.toId,rel.kind,rel.quantity).run();
 }else if(body.action==='unlink'){
  const existing=state.relations.find(r=>r.id===id.parse(body.id));if(existing){await db().prepare('DELETE FROM relations WHERE user_id=? AND id=?').bind(user,existing.id).run();state.prefs.dismissedRelations=[...new Set([...state.prefs.dismissedRelations,relationKey(existing)])];await savePrefs(user,state.prefs);}
 }else if(body.action==='auto-link'){
  result={linked:await autoLink(user,state)};
 }else if(body.action==='account-preview'||body.action==='account-apply'){
  const rows=accountRowsSchema.parse(body.rows),kind=z.enum(['purchases','wishlist']).parse(body.kind);
  if(body.action==='account-preview')result={rows:await previewAccounts(rows,state)};
  else {const selections=z.array(z.object({index:z.number().int().min(0).max(499),itemId:id.optional(),confirmedPurchase:z.boolean().optional()})).max(500).parse(body.selections);const applied=await applyAccounts(rows,selections,kind,state);await saveItems(user,applied.items);result={added:applied.added,matched:applied.matched,skipped:applied.skipped};}
 }else if(body.action==='research-item'){
  const item=state.items.find(i=>i.id===id.parse(body.id));if(!item)throw new Error('找不到商品');const found=await researchItem(item,state);await saveItems(user,[found.item]);result={message:found.message};
 }else if(body.action==='repair-kuji-catalogue'){
  const before=state.items.length,linked=await autoLink(user,state,true);result={added:state.items.length-before,linked};
 }else if(body.action==='repair-duplicates'){
  const ordered=[...state.items].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),cursor=state.prefs.catalogueRepair?.version===IDENTITY_RULE_VERSION?state.prefs.catalogueRepair.after:'';
  const classify=body.duplicatesOnly!==true&&(body.reclassify===true||state.prefs.identityMigrated!==IDENTITY_RULE_VERSION||!!cursor);
  const frequent=classify?frequentKeywords(state.items):undefined;
  const start=cursor?ordered.findIndex(i=>i.id>cursor):0,offset=start<0?ordered.length:start,page=classify?ordered.slice(offset,offset+(body.classificationBatchSize===2000?2000:1000)):[],classificationRemaining=classify?Math.max(0,ordered.length-offset-page.length):0,reclassified:Item[]=[],fixed=new Map<string,Item>();
  const byParentId=new Map(state.items.map(i=>[i.id,i])),inheritedMedia=new Map<string,string>();for(const r of state.relations.filter(r=>r.kind==='contains')){const parent=byParentId.get(r.fromId);if(parent){const medium=primaryMedium(parent);if(medium==='video'||medium==='music')inheritedMedia.set(r.toId,medium==='video'?'映像ソフト':'音楽CD');}}
  for(const i of page){const inherited=i.inferredMember&&!i.offers.length&&!manualField(i,'category')?inheritedMedia.get(i.id):undefined;const next=verifiedFacts(repairClassification(inherited?{...i,category:inherited}:i,frequent),state);if(JSON.stringify(next)!==JSON.stringify(i)){reclassified.push(next);fixed.set(i.id,next);}}state.items=state.items.map(i=>fixed.get(i.id)||i);await saveItems(user,reclassified);
  if(classificationRemaining){state.prefs.catalogueRepair={version:IDENTITY_RULE_VERSION,after:page.at(-1)!.id};await savePrefs(user,state.prefs);result={merged:0,conflicts:0,reclassified:reclassified.length,linked:0,remaining:true,remainingCount:classificationRemaining};}
  else{delete state.prefs.catalogueRepair;
  const plan=exactMergePlan(state.items),byId=new Map(state.items.map(i=>[i.id,i])),changed=new Map<string,Item>();let mergedCount=0,conflicts=0;const beforeRelations=JSON.stringify(state.relations);
  for(const c of plan.slice(0,40)){try{const from=byId.get(c.fromId),to=byId.get(c.toId);if(!from||!to)continue;const m=mergeProducts({...state,items:[from,to]},from.id,to.id);byId.delete(from.id);byId.set(to.id,m.merged);changed.set(to.id,m.merged);changed.set(from.id,m.archived);(state.archived??=[]).push({id:m.archived.id,title:m.archived.title,archivedInto:m.archived.archivedInto} as Item);state.relations=m.relations;mergedCount++;}catch{conflicts++;}}
  await saveItems(user,[...changed.values()]);state.items=[...byId.values()];changed.clear();if(beforeRelations!==JSON.stringify(state.relations))await db().batch([db().prepare('DELETE FROM relations WHERE user_id=?').bind(user),...relationStatements(user,state.relations)]);
  // Duplicate-only passes must not rebuild the whole keyword and relation catalogues.
  // Merged relations are already redirected above; explicit auto-link remains available.
  let linked=0;if(body.duplicatesOnly!==true){await syncNamedExtras(user,state);linked=await autoLink(user,state);}const unresolved=Math.max(0,plan.length-mergedCount),remaining=unresolved>conflicts||mergedCount>0;if(remaining)state.prefs.catalogueRepair={version:IDENTITY_RULE_VERSION,after:ordered.at(-1)?.id||''};state.prefs.identityMigrated=remaining?0:IDENTITY_RULE_VERSION;state.prefs.schemaVersion=9;await savePrefs(user,state.prefs);result={merged:mergedCount,conflicts,reclassified:reclassified.length,linked,remaining,remainingCount:unresolved};}
 }else if(body.action==='import-suruga-sample'){
  const counts=await ingest(user,state,surugaSnapshot.products as Parsed[],false);result={...counts,count:surugaSnapshot.products.length,message:`已整理导入 ${surugaSnapshot.products.length} 条骏河屋书籍挂牌；采集时间 ${surugaSnapshot.capturedAt}，历史快照不触发提醒`};
 }else if(body.action==='duplicate-preview'){
  result={candidates:duplicateCandidates(state.items)};
 }else if(body.action==='merge-items'){
  const merged=mergeProducts(state,id.parse(body.fromId),id.parse(body.toId));
  const stmts=[merged.merged,merged.archived].map(item=>db().prepare('UPDATE items SET data=?,updated_at=? WHERE user_id=? AND id=?').bind(JSON.stringify(item),new Date().toISOString(),user,item.id));
  stmts.push(db().prepare('DELETE FROM relations WHERE user_id=?').bind(user),...relationStatements(user,merged.relations));await db().batch(stmts);
 }else if(body.action==='undo-merge'){
  const row=await db().prepare("SELECT data FROM items WHERE user_id=? AND id=? AND json_extract(data,'$.archivedInto') IS NOT NULL").bind(user,id.parse(body.id)).all();if(!row.results.length)throw new Error('找不到合并存档');const archived={...EMPTY_FACTS,...JSON.parse(row.results[0].data)} as Item,restored=undoMerge(state,archived);
  const stmts=restored.items.map(i=>db().prepare('UPDATE items SET data=?,updated_at=? WHERE user_id=? AND id=?').bind(JSON.stringify(i),new Date().toISOString(),user,i.id));stmts.push(db().prepare('DELETE FROM relations WHERE user_id=?').bind(user),...relationStatements(user,restored.relations));await db().batch(stmts);
 }else if(body.action==='refresh-item'){
  const item=state.items.find(i=>i.id===id.parse(body.id));if(!item)throw new Error('找不到商品');const url=body.url?safeUrl(z.string().max(2000).parse(body.url)).href:undefined;result={message:await refreshItem(user,state,item,url)};
 }else if(body.action==='detail-next'){
  const blocked=new Set<string>(Object.keys(state.prefs.sourcePauses||{}));for(const host of state.scans.filter(s=>s.status==='failed'&&Date.now()-Date.parse(s.at)<3600000).map(s=>new URL(s.url).hostname))blocked.add(host);
  const pending=state.items.filter(i=>!i.demo).flatMap(item=>item.offers.map(offer=>({item,offer}))).filter(({offer})=>!blocked.has(new URL(offer.url).hostname)&&Date.now()-Date.parse(offer.lastAttempt||'2000-01-01')>86400000);
  const next=pending.sort((a,b)=>Number(a.offer.availability==='sold')-Number(b.offer.availability==='sold'))[0];
  if(next){try{result={message:await refreshItem(user,state,next.item,next.offer.url),remaining:pending.length-1,...(state.prefs.sourcePauses?.[new URL(next.offer.url).hostname]?{interaction:'browser_required'}:{})};}catch(e){result={message:e instanceof Error?e.message:'失败',remaining:pending.length-1,failed:true,...(e instanceof SourceInteractionError?{interaction:e.code}:{})};}}else result={remaining:0,message:blocked.size?`本轮已结束；${blocked.size} 个来源暂缓检查。完成原站验证后手动重新采集或复核成功可解除暂停。`:'本轮详情检查结束；失败与验证要求见挂牌状态'};
 }else if(body.action==='source-preview'||body.action==='apply-source'){
  const item=state.items.find(i=>i.id===id.parse(body.id));if(!item)throw new Error('找不到商品');
  const url=safeUrl(z.string().max(2000).parse(body.url)).href;const page=await readSource(url);const facts=extractMetadata(page.text);
  if(!Object.keys(facts).length)throw new Error('页面没有识别出明确资料字段，可能需要浏览器加载。保留原文供手动整理，不猜测厂家或定价。');
  const title=strip(page.text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||page.text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
  const fingerprint=JSON.stringify({title,facts,url:page.url});
  if(body.action==='apply-source'){if(body.fingerprint!==fingerprint)throw new Error('来源内容已变化，请重新预览后确认');await saveItems(user,[applyMetadata(item,facts,page.url,'confirmed')]);}
  else result={candidate:{title,facts,url:page.url,fingerprint}};
 }else if(body.action==='read-notices'){
  for(const n of state.notices.filter(n=>!n.read))await saveNotice(user,{...n,read:true});
 }else if(body.action==='scan'||body.action==='html-import'||body.action==='capture-import'){
  const input=body.action==='capture-import'?body.capture:body;
  if(body.action==='capture-import'&&(input.format!=='radar-capture-1'||input.kind!=='catalog'))throw new Error('此文件不是商品采集文件，请在账号记录页导入购买/愿望文件');
  const url=safeUrl(z.string().max(2000).parse(input.url)).href;
  if(body.action==='scan'&&state.scans.some(s=>Date.now()-Date.parse(s.at)<3000))throw new Error('请稍后再抓取，保留至少 3 秒间隔');
  const scan:Scan={id:crypto.randomUUID(),url,at:new Date().toISOString(),count:0,status:'failed',message:'正在读取；若页面中断可重试',next:null};await saveScan(user,scan);
  try{const page=body.action==='scan'?await readSource(url):{text:z.string().max(4000000).parse(input.html),url};const parsed=parseHtml(page.text,page.url);
   if(!parsed.products.length)throw new Error(page.url!==url?'来源重定向到了非商品页。请提供能打开的完整搜索地址，或导入保存的 HTML。':'未识别到商品；可能是网页结构变化或动态加载。请导入含商品内容的 HTML，不能将此结果当作 0 件商品。');
   if(body.action!=='scan'){const at=input.capturedAt?z.string().datetime().parse(input.capturedAt):new Date().toISOString();for(const p of parsed.products)for(const o of [p.offer,...(p.extraOffers||[])]){o.observedAt=at;o.verifiedAt=undefined;o.stockNote=[o.stockNote,'手动导入；需在线复核后提醒'].filter(Boolean).join('；');}}
   const scope=searchScope(page.url),pageKey=listingPageKey(parsed.products),repeated=body.action==='scan'&&state.scans.some(s=>s.status==='success'&&s.scope===scope&&s.pageKey===pageKey&&s.url!==url);
   const counts=repeated?{added:0,matched:0}:await ingest(user,state,parsed.products,body.action==='scan');const next=repeated?null:parsed.next;
   Object.assign(scan,{scope,pageKey,partitions:parsed.partitions,incomplete:repeated,count:repeated?0:parsed.products.length,status:'success',message:repeated?'来源反复返回已读取商品；此分段未完成，按原站年份/分类入口继续':`新增 ${counts.added}，匹配 ${counts.matched}${parsed.total!==null?`；页面标示总数 ${parsed.total}`:''}`,next});result={...counts,next,total:parsed.total,partitions:parsed.partitions,incomplete:repeated,count:scan.count};
  }catch(e){scan.message=e instanceof Error?e.message:'抓取失败';if(e instanceof SourceInteractionError)await pauseSource(user,state,url,scan.message);await saveScan(user,scan);throw e;}await saveScan(user,scan);if(body.action==='scan'&&state.prefs.sourcePauses?.[new URL(url).hostname]?.scope!=='details')await pauseSource(user,state,url);
 }else if(body.action==='enrich'){
  const item=state.items.find(x=>x.id===id.parse(body.id));if(!item)throw new Error('找不到商品');if(!/^97[89]\d{10}$/.test(item.isbn))throw new Error('请先填写有效的 13 位 ISBN；无 ISBN 的同人志请使用来源页核对');
  const url=`https://api.openbd.jp/v1/get?isbn=${item.isbn}`;const data=JSON.parse((await readSource(url)).text)?.[0];if(!data?.summary)throw new Error('openBD 暂未收录该 ISBN，保留人工待确认');
  const s=data.summary;const at=new Date().toISOString();const evidence=[...item.evidence,{field:'书目交叉核对',value:JSON.stringify(s).slice(0,5000),url,at,method:'openBD / ISBN 精确查找；不自动覆盖人工字段'}];
  const year=String(s.pubdate||'').match(/^(19|20)\d{2}/)?.[0];await saveItems(user,[{...item,year:item.year||year||'',evidence}]);result={message:'书目信息已保存在来源证据中，原标题及人工分类保留'};
 }else if(body.action==='restore-backup'){
  if(state.items.length||state.archived?.length||state.relations.length)throw new Error('为保护现有整理结果，整库迁移仅允许导入空数据库。请先导出当前库备份，或使用新的独立数据目录。');
  const backup=z.object({version:z.number().int().min(2).max(9),items:z.array(fullItem).max(MAX_BACKUP_ITEMS),archived:z.array(fullItem).max(MAX_BACKUP_ITEMS).default([]),relations:z.array(z.object({id,fromId:id,toId:id,kind:z.enum(['bonus','contains','related']),quantity:z.number().int().min(1).max(999)})).max(MAX_BACKUP_RELATIONS),prefs:prefsSchema,notices:z.array(z.object({id:z.string().max(2200),itemId:id,title:short,score:z.number().min(0).max(100),reason:long,at:when,read:z.boolean()})).max(300).default([]),scans:z.array(backupScanSchema).max(100).default([])}).parse(body.backup);
  const items=[...backup.items,...backup.archived].map(raw=>({...createItem(raw.title,raw.description||'',undefined,DEFAULT_PREFS),...EMPTY_FACTS,...raw})) as Item[];
  if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('备份包含重复商品编号');
  const relations:Relation[]=backup.relations;validateBackupRelations(items,relations);
  const prefs={...backup.prefs,monitor:{...backup.prefs.monitor,enabled:false}} as Prefs;validateNodes(prefs.catalogueNodes||[]);safeUrl(prefs.searchUrl);for(const u of prefs.monitor.urls)safeUrl(u);
  const at=new Date().toISOString(),statements=[
   // Re-inserting an existing row deliberately fails: a concurrent addition
   // between validation and this atomic batch must not be overwritten.
   db().prepare('INSERT INTO items(user_id,id,data,updated_at) SELECT user_id,id,data,updated_at FROM items WHERE user_id=?').bind(user),
   db().prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT user_id,id,from_id,to_id,kind,quantity FROM relations WHERE user_id=?').bind(user),
   ...jsonChunks(items).map(chunk=>db().prepare("INSERT INTO items(user_id,id,data,updated_at) SELECT ?,json_extract(value,'$.id'),value,? FROM json_each(?)").bind(user,at,chunk)),
   ...jsonChunks(relations).map(chunk=>db().prepare("INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)").bind(user,chunk)),
   ...jsonChunks(backup.notices).map(chunk=>db().prepare("INSERT INTO notices(user_id,id,data) SELECT ?,json_extract(value,'$.id'),value FROM json_each(?)").bind(user,chunk)),
   ...jsonChunks(backup.scans).map(chunk=>db().prepare("INSERT INTO scans(user_id,id,data) SELECT ?,json_extract(value,'$.id'),value FROM json_each(?)").bind(user,chunk)),
   db().prepare('INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').bind(user,JSON.stringify(prefs))];
  // D1/SQLite batch is atomic: an invalid duplicate or failed insert leaves the target untouched.
  await db().batch(statements);result={count:items.length,message:'整库迁移完成，后台监控默认关闭，请确认配置后再启用'};
 }else if(body.action==='catalogue-enrichment'){
  const factsSchema=patchSchema.pick({audience:true,ageRating:true,brand:true,publisher:true,manufacturer:true,characters:true,circle:true,artists:true,releaseDate:true,jan:true,origin:true,series:true,year:true,isbn:true,msrp:true,category:true,productLine:true,wave:true}).extend({kuji:kujiSchema.optional()});
  const rows=z.array(z.object({id,expectedTitle:short.min(1),sourceUrl:urlSchema,confirmed:z.boolean().optional(),facts:factsSchema.optional(),image:urlSchema.optional(),images:z.array(urlSchema).max(12).optional(),description:long.optional(),method:short.min(1)})).min(1).max(200).parse(body.rows),changed:Item[]=[];let skipped=0;
  for(const row of rows){safeUrl(row.sourceUrl);const old=state.items.find(i=>i.id===row.id);if(!old||old.title!==row.expectedTitle){skipped++;continue;}const facts=row.confirmed?Object.fromEntries(Object.entries(row.facts||{}).filter(([k])=>!manualField(old,k))):row.facts||{};let next=applyMetadata(old,facts,row.sourceUrl,row.confirmed?'confirmed':'empty');
   if(row.image&&!manualField(old,'image'))next.image=row.image;if(row.images?.length&&!manualField(old,'image'))next.images=row.images.slice(0,10);
   if(row.description&&!old.description&&!manualField(old,'description'))next.description=row.description;
   next.evidence=[...next.evidence,{field:'资料补查',value:JSON.stringify({facts:row.facts,image:row.image}).slice(0,16000),url:row.sourceUrl,at:new Date().toISOString(),method:row.method}].slice(-150);changed.push(next);state.items[state.items.findIndex(i=>i.id===old.id)]=next;
  }await saveItems(user,changed);result={updated:changed.length,skipped};
 }else if(body.action==='parsed-source-import'){
  const products=parseProducts(body.products);
  const snapshotId=body.snapshotId?z.string().min(1).max(100).parse(body.snapshotId):'',batch=z.number().int().min(0).max(10000).parse(body.batch??0);
  const previous=(fateManifest as any).previousSnapshot,inherit=snapshotId===fateManifest.id&&previous?.id===state.prefs.fateSnapshot?.id&&state.prefs.fateSnapshot?.nextBatch===previous.batches;
  const expected=state.prefs.fateSnapshot?.id===snapshotId?state.prefs.fateSnapshot.nextBatch:inherit?previous.batches:0;
  if(snapshotId&&batch<expected)result={already:true,added:0,matched:0};
  else {
   if(snapshotId&&batch!==expected)throw new Error('采集导入进度已变化，请刷新后继续');
   for(const p of products)for(const o of [p.offer,...(p.extraOffers||[])]){safeUrl(o.url);o.verifiedAt=undefined;o.observation='list';o.stockNote=[o.stockNote,'已保存的采集记录；需在线复核后提醒'].filter(Boolean).join('；');}
   result={...await ingest(user,state,products,false),count:products.length};if(snapshotId){state.prefs.fateSnapshot={id:snapshotId,nextBatch:batch+1};await savePrefs(user,state.prefs);}
   if(snapshotId===fateManifest.id&&batch+1===fateManifest.files.length)for(const source of fateManifest.sources)await saveScan(user,{id:'fate-audit-'+fateManifest.id+'-'+source.name,url:source.url,at:fateManifest.capturedAt,count:source.count,status:source.status==='failed'?'failed':'success',message:`本轮实际采集 ${source.pages} 页、${source.count} 条来源记录；页面标示总数 ${source.total??'未知'}。${source.next?'尚有后续页；这是部分采集。':'分页已结束。'}`,next:source.next});
  }
  if(body.compact===true)return response({ok:true,...result,snapshot:state.prefs.fateSnapshot,runtime:runtime(mode)});
  return response({ok:true,...result,state:{...(body.lean?leanState(state):state),runtime:runtime(mode)}});
 }else if(body.action==='json-import'){
  const rows=z.array(z.object({title:short.min(1),description:long.optional(),url:z.string().max(2000).optional(),price:z.number().int().min(0).max(100000000).nullable().optional(),tags:z.array(short).max(50).optional()})).max(500).parse(body.rows);const manual=new Map<string,Item>();let added=0,matched=0;
  for(const row of rows){const u=row.url?safeUrl(row.url).href:undefined;const offer=u?{id:u,source:new URL(u).hostname,url:u,price:row.price??null,currency:'JPY' as const,condition:'导入，未核对',availability:'unknown' as const,bonus:'unknown' as const,observation:'list' as const,observedAt:new Date().toISOString(),history:[]}:undefined;const candidate=createItem(row.title,row.description||'',offer,state.prefs);const found=findProduct(state.items,candidate);let item:Item;
   if(found){matched++;item={...found.item,offers:[...found.item.offers],aliases:[...new Set([...(found.item.aliases||[]),row.title])].filter(t=>t!==found.item.title).slice(0,100)};if(offer){const n=item.offers.findIndex(o=>offerKey(o)===offerKey(offer));if(n<0)item.offers.push(offer);else item.offers[n]=updateOffer(item.offers[n],offer);}state.items[state.items.findIndex(i=>i.id===item.id)]=item;}
   else{added++;item=candidate;state.items.push(item);}item.tags=[...new Set([...item.tags,...(row.tags||[])])].filter(t=>t.length<=60).slice(0,50);manual.set(item.id,item);
  }await saveItems(user,[...manual.values()]);result={count:rows.length,added,matched};
 }else throw new Error('不支持的操作');
 if(body.compact===true)return response({ok:true,...result,runtime:runtime(mode)});
 const latest=await stateFor(user,{lean:!!body.lean});return response({ok:true,...result,state:{...latest,runtime:runtime(mode)}});
 }catch(e){return error(e);}finally{if(unlock)try{await unlock();}catch{console.error('Import lock release failed; the lease expires automatically.');}}}
