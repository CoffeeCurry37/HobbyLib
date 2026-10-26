import assert from 'node:assert/strict';
import {createItem} from '../lib/radar/engine';
import {makeOffer} from '../lib/radar/collector';
import {DEFAULT_PREFS,Item,State} from '../lib/radar/types';
import {inferSetMembers} from '../lib/radar/sets';
import {mergeProducts} from '../lib/radar/maintenance';
import {exactMergePlan} from '../lib/radar/duplicate-groups';
import {repairClassification} from '../lib/radar/classification';
import {PRODUCT_CLASSES} from '../lib/radar/product-class';
import {openDatabase} from '../standalone/sqlite';
import {withDatabase,saveItems,savePrefs,stateFor} from '../lib/radar/store';
import {postAction,ingest} from '../lib/radar/service';

const line='Fate/Grand Order ‐Epic of Remnant‐ 亜種特異点EX 深海電脳楽土 SE.RA.PH';
const set:Item={...createItem(line+' 1~8巻セット / 西出ケンゴロー','',undefined,DEFAULT_PREFS),id:'set',kind:'set',category:'コミック',publisher:'KADOKAWA',brand:'KADOKAWA'};
const offer={...makeOffer('https://www.kadokawa.co.jp/product/TEST/',line+' (5)',null),source:'KADOKAWA',isbn:'9780000000000',listingTitle:line+' (5)'};
const volume:Item=repairClassification({...createItem(line+'(5) (書籍)[KADOKAWA]《在庫切れ》','',offer,DEFAULT_PREFS),id:'volume5',kind:'base',category:'コミック',publisher:'KADOKAWA',brand:'KADOKAWA',isbn:offer.isbn,aliases:[line+' 5'],productLine:line,wave:'5'});
const state=(items:Item[],archived:Item[]=[]):State=>({items,archived,relations:[],prefs:structuredClone(DEFAULT_PREFS),notices:[],scans:[]});
const initial=state([set,volume]);
const inferred=inferSetMembers(initial);
assert.equal(inferred.items.length,7,'Verified publisher title must identify the existing retail volume');
assert.ok(inferred.relations.some(r=>r.toId===volume.id));
assert.ok(!inferred.items.some(i=>i.wave==='5'));
for(const i of inferred.items){assert.equal(i.majorClass,'书籍');assert.deepEqual(i.tags.filter(t=>PRODUCT_CLASSES.includes(t as any)),['书籍']);}

const placeholder:Item={...createItem(line+' 5','',undefined,DEFAULT_PREFS),id:'old-member',kind:'base',category:'コミック',inferredMember:true,publisher:'KADOKAWA',brand:'KADOKAWA'};
const merged=mergeProducts(state([placeholder,volume]),placeholder.id,volume.id);
const repaired=state([set,merged.merged,...inferred.items],[merged.archived]);repaired.relations=inferred.relations;
for(let pass=0;pass<2;pass++){
 const next=inferSetMembers(repaired);
 assert.equal(next.items.length,0,'Repair must not recreate a merged placeholder');
 assert.equal(next.relations.length,0,'A second pass must be stable');
 assert.equal(exactMergePlan(repaired.items).length,0);
}

const all=inferSetMembers(state([set])),old=all.items.find(i=>i.wave==='5')!;
const archivedState=state([set,...all.items.filter(i=>i.id!==old.id)],[{...old,archivedInto:'external-target'}]);
archivedState.relations=all.relations.filter(r=>r.toId!==old.id);
assert.ok(!inferSetMembers(archivedState).items.some(i=>i.id===old.id),'An archived identity must never be overwritten by inference');
const db=openDatabase(':memory:');
try{await withDatabase(db,async()=>{
 const toy=repairClassification({...createItem('Fate/Grand Order test figure','',undefined,DEFAULT_PREFS),id:'toy',category:'フィギュア',ownership:'owned',quantity:2,notes:'保留'});
 const local=state([toy]);await saveItems('owner',[toy]);await savePrefs('owner',DEFAULT_PREFS);
 await ingest('owner',local,[{title:toy.title,description:'',image:'',offer:makeOffer('https://www.amiami.jp/top/detail/detail?gcode=TEST','',1000),facts:{category:'グッズ'}}],false);
 const saved=(await stateFor('owner')).items.find(i=>i.id===toy.id)!;
 assert.deepEqual(saved.tags.filter(t=>PRODUCT_CLASSES.includes(t as any)),[saved.majorClass]);assert.equal(saved.quantity,2);assert.equal(saved.notes,'保留');
 await saveItems('repair-owner',[set,volume,placeholder]);await savePrefs('repair-owner',DEFAULT_PREFS);
 const repair=async()=>{const response=await postAction(new Request('http://localhost/api/radar',{method:'POST',body:JSON.stringify({action:'repair-duplicates',duplicatesOnly:true,compact:true})}),'repair-owner','standalone');assert.ok(response.ok);return await response.json() as any;};
 assert.equal((await repair()).merged,1);const again=await repair();assert.equal(again.merged,0);assert.equal(again.remaining,false);
 const repairedState=await stateFor('repair-owner');assert.equal(repairedState.items.length,2);assert.equal(repairedState.archived?.length,1);
 });}finally{db.close();}
console.log('PASS v121 publisher-backed set members, stable repeated repair, archive protection and member classification');
