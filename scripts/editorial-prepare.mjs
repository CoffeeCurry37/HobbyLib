// Prepare a reviewed, explicit batch against a fresh export. Never generate factual claims here.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
const [exportPath,decisionsPath,prefix]=process.argv.slice(2),backup=JSON.parse(readFileSync(exportPath)),decisions=JSON.parse(readFileSync(decisionsPath));
const r=loadRadar(),manifest=JSON.parse(readFileSync('lib/radar/editorial-manifest.json')),{manualField}=r.get('catalog'),{recordVersion}=r.get('item-record'),{editorialBasis}=r.get('editorial'),{createFamily}=r.get('catalogue-families');
const byId=new Map(backup.items.map(i=>[i.id,i])),changes=[],relations=[],merges=[],images=[],at=new Date().toISOString();
function link(fromId,toId,kind){assert.ok(byId.has(fromId));assert.ok(byId.has(toId));relations.push({id:'review-link-'+createHash('sha256').update(fromId+':'+toId+':'+kind).digest('hex').slice(0,24),fromId,toId,kind,quantity:1});}
function stamp(i,d){i.editorial={campaign:manifest.id,status:d.unresolved?.length?'partial':'verified',at,sources:d.sources,unresolved:d.unresolved||[],checks:{classification:true,context:!d.unresolved?.length,image:!!i.image,tags:!!i.tags.length,summary:!!i.summary},basis:editorialBasis(i),imageUrl:i.image};}
for(const d of decisions){
 const id=manifest.ids[d.ordinal-1],old=byId.get(id);assert.ok(old&&!old.archivedInto,'Missing active queue record '+d.ordinal);assert.ok(!old.editorial,'Already reviewed; resume using online progress, not by replaying a batch');
 const next=structuredClone(old),facts={productType:d.type,category:d.type,majorClass:d.major||'书籍',origin:'commercial',series:d.series,productLine:d.line||'',wave:d.wave||'',event:d.event||'',kind:d.kind||'base',saleForm:d.saleForm||'single',summary:d.summary,tags:d.tags,characters:d.characters||[],circle:'',imageRole:d.imageRole||'product'};
 for(const k of ['title','releaseDate','isbn','jan','publisher'])if(k in d)facts[k]=d[k];
 if(d.releaseDate)facts.year=d.releaseDate.slice(0,4);
 facts.image=d.image==='old'?old.image:d.image;
 if(!facts.image)throw Error('No matching image for #'+d.ordinal);
 for(const [key,value] of Object.entries(facts)){if(manualField(old,key)){assert.deepEqual(old[key],value,'Review conflicts with manual field '+id+' '+key);}else next[key]=value;}
 if(next.title!==old.title)next.aliases=[...new Set([...(old.aliases||[]),old.title])].slice(0,100);
 if(!manualField(old,'image'))next.images=[...new Set([next.image,...(old.images||[]).filter(u=>!(/\/skus\//.test(u)&&d.ordinal===79))])].filter(Boolean).slice(0,10);
 stamp(next,d);next.evidence=[...old.evidence,{field:'逐件资料复核',value:JSON.stringify({summary:next.summary,type:next.productType,series:next.series,decision:d.decision||'',unresolved:d.unresolved||[]}),url:d.sources[0],at,method:'逐件阅读来源与实物封面；保留个人字段及原挂牌'}];
 changes.push({item:next,expectedVersion:recordVersion(old)});byId.set(id,next);images.push({ordinal:d.ordinal,id,url:next.image});
 if(d.parent)link(d.parent,id,d.relation||'contains');
 if(d.mergeIntoOrdinal)merges.push({fromId:id,toId:manifest.ids[d.mergeIntoOrdinal-1]});
}
// A directory is not a purchasable complete set and does not assert that a series is finished.
const member=byId.get(manifest.ids[55]),sources=decisions.find(d=>d.ordinal===56).sources;
const spec={key:'books:delightworks:reference:fgo-game-artbook:',title:'Fate/Grand Order Game Artbook',type:'book-series',category:'書籍',major:'书籍',productLine:'Fate/Grand Order Game Artbook',image:member.image,url:sources[0],description:'FGO 活动美术集系列目录；按官方发售弹次与收录时间段整理，初回、再版及店铺附属物保留在各商品资料内。'};
const parent=createFamily(spec,member,backup.prefs);assert.ok(!byId.has(parent.id),'Existing series parent must be reused');Object.assign(parent,{productType:'书籍系列目录',summary:spec.description,saleForm:'single',tags:['Fate/Grand Order','Game Artbook','游戏美术集','系列目录'],event:''});stamp(parent,{sources});changes.push({item:parent});byId.set(parent.id,parent);
for(const i of backup.items)if(/Game\s*Art\s*Book/i.test(i.title)&&/Event\s*Collections?/i.test(i.title))link(parent.id,i.id,'contains');
const actions=[];for(let n=0;n<changes.length;n+=20)actions.push({action:'catalogue-curation',changes:changes.slice(n,n+20),relations:[]});actions.at(-1).relations=relations;
writeFileSync(prefix+'-curation-actions.json',JSON.stringify(actions),{mode:0o600});writeFileSync(prefix+'-merge-actions.json',JSON.stringify(merges.length?[{action:'apply-merge-plan',pairs:merges}]:[]));writeFileSync(prefix+'-import-actions.json','[]');writeFileSync(prefix+'-images.json',JSON.stringify(images,null,2));
writeFileSync(prefix+'-public-records.json',JSON.stringify(changes.map(({item:i})=>Object.fromEntries(['id','title','category','majorClass','series','productType','productLine','wave','event','summary','kind','saleForm','releaseDate','isbn','jan','tags','characters','image','imageRole','editorial'].map(k=>[k,i[k]]))),null,2));
console.log(JSON.stringify({reviewed:decisions.length,newParents:1,relations:relations.length,merges:merges.length,partial:decisions.filter(d=>d.unresolved?.length).map(d=>d.ordinal)}));r.close();
