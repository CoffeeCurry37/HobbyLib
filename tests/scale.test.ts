import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createItem,scoreItem,scoreCatalogue} from '../lib/radar/engine';
import {compareRelease,sortByRelease} from '../lib/radar/catalog';
import {buildCatalogue,catalogueEntries,catalogueSummary} from '../lib/radar/taxonomy';
import {DEFAULT_PREFS,Item,Relation,State} from '../lib/radar/types';
import {openDatabase} from '../standalone/sqlite';
import {withDatabase,stateFor,saveItems,savePrefs} from '../lib/radar/store';
import {postAction,getStateResponse} from '../lib/radar/service';
import {transferBackup} from '../lib/radar/backup-transfer';
import {ACTION_BYTES} from '../lib/radar/import-limits';
import {automaticRelations,relationKey} from '../lib/radar/relations';

// Synthetic catalogue: 2,000 sets, four independent members each, mixed brands,
// series, waves, ownership and stock. These are test records, not scraped products.
const stamp='2026-10-01T12:00:00.000Z',template=createItem('Fate/stay night トレーディングフィギュア','',undefined,DEFAULT_PREFS);
const items:Item[]=[],relations:Relation[]=[];
for(let n=0;n<10000;n++){
 const set=Math.floor(n/5),position=n%5,franchise=['Fate/stay night','月姫 Remake','空の境界','ガンダム'][set%4];
 const title=`${franchise} トレーディングフィギュア ${position?'単品 '+position:'全4種セット'} ${set}`;
 items.push({...template,id:'scale-'+n,title,member:title,aliases:[title+' ランクB'],description:'Synthetic scale test',
  series:franchise,category:'トレーディングフィギュア',manufacturer:set%4===3?'BANDAI':'',publisher:'',brand:'',
  productLine:'テストシリーズ '+set%400,wave:String(Math.floor(set/400)+1),kind:position?'component':'set',
  releaseDate:n%11?'2020/'+String(n%12+1).padStart(2,'0')+'/01':'',year:'',ownership:position===1?'owned':position===2?'missing':'unknown',quantity:position===1?1:0,
  notes:'備考 '+n,rating:n%17===0?4:null,tags:[franchise,'トレーディングフィギュア'],schemaVersion:7,createdAt:stamp,image:n%7===0?'https://example.test/cover-'+n+'.jpg':'',
  offers:[{id:'offer-'+n,source:'骏河屋',url:'https://www.suruga-ya.jp/product/detail/'+(900000000+n),listingTitle:title+' ランクB',currency:'JPY',price:500+n%3000,condition:'ランクB',bonus:'unknown',availability:n%3===0?'sold':n%3===1?'available':'unknown',observation:'list',observedAt:stamp,history:[{price:3500,at:'2026-09-01T12:00:00.000Z'}]}]});
 if(position)relations.push({id:'relation-'+n,fromId:'scale-'+set*5,toId:'scale-'+n,kind:'contains',quantity:1});
}
const state:State={items,relations,prefs:{...DEFAULT_PREFS,catalogueNodes:[{id:'fate-general-figures',parentId:'fate-general',name:'我的 Fate 手办',order:0},{id:'custom-owned',parentId:'fate',name:'已整理收藏',order:100}]},notices:[],scans:[]};
items[9999].catalogNodeId='custom-owned';
const metrics:Record<string,number>={};
function time<T>(name:string,fn:()=>T):T{const at=performance.now(),value=fn();metrics[name]=Math.round(performance.now()-at);return value;}
async function timeAsync<T>(name:string,fn:()=>Promise<T>):Promise<T>{const at=performance.now(),value=await fn();metrics[name]=Math.round(performance.now()-at);return value;}
const tree=time('buildCatalogueMs',()=>buildCatalogue(items,state.prefs));
assert.ok(tree.nodes.length>2000);assert.equal(tree.itemNodes.size,10000);
assert.ok(tree.ancestors(tree.itemNodes.get(items[0].id)!).some(n=>n.name==='我的 Fate 手办'));
assert.equal(tree.itemNodes.get(items[9999].id),'custom-owned');
const entries=time('setEntriesMs',()=>catalogueEntries(items,relations));
assert.equal(entries.length,2000);assert.ok(entries.every(i=>i.kind==='set'));
assert.equal(catalogueEntries([items[1]],relations)[0].id,items[1].id);
const scores=time('scoreCatalogueMs',()=>scoreCatalogue(state));
assert.equal(scores[0].owned,1);assert.equal(scores[0].missing,1);assert.equal(scores[0].unknown,2);
for(const at of [0,1,1230,9995,9999]){const {item,...score}=scores[at];assert.deepEqual(score,scoreItem(item,state));}
const summary=time('boardSummaryMs',()=>catalogueSummary(tree,items));assert.equal(summary.counts.get('fate'),2501);assert.equal(summary.counts.get('custom-owned'),1);
assert.equal(summary.covers.get('fate')!.length,3);assert.deepEqual(summary.covers.get('fate')!.map(i=>i.id),['scale-0','scale-21','scale-42']);
const sorted=time('releaseSortMs',()=>sortByRelease(items,i=>i));assert.equal(sorted[0].releaseDate,'2020/01/01');assert.equal(sorted.at(-1)!.releaseDate,'');
for(const descending of [false,true])assert.deepEqual(sortByRelease(items.slice(0,100),i=>i,descending).map(i=>i.id),items.slice(0,100).sort((a,b)=>compareRelease(a,b,descending)).map(i=>i.id));
const books=items.map((i,n)=>({...i,kind:(n%5===4?'bonus':'base') as Item['kind'],title:'Fate/Grand Order material テスト '+(n%5===4?n-4:n)+(n%5===4?' 店舗特典のみ':''),circle:'',series:'Fate/Grand Order'}));
const bookState={items:books,relations:[],prefs:DEFAULT_PREFS},links=time('automaticBonusLinksMs',()=>automaticRelations(bookState));assert.equal(links.length,2000);assert.ok(links.some(r=>r.fromId==='scale-0'&&r.toId==='scale-4'));
assert.equal(automaticRelations({...bookState,items:[...books,{...books[0],id:'duplicate-parent'}]}).length,1999);
assert.equal(automaticRelations({...bookState,relations:[links[0]],prefs:{...DEFAULT_PREFS,dismissedRelations:[relationKey(links[1])]}}).length,1998);
const dir=mkdtempSync(join(tmpdir(),'radar-scale-'));let database=openDatabase(join(dir,'scale.sqlite'));
try{
 await withDatabase(database,async()=>{
  await timeAsync('persistMs',()=>saveItems('scale',items));await savePrefs('scale',state.prefs);
  for(let n=0;n<relations.length;n+=75)await database.batch(relations.slice(n,n+75).map(r=>database.prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) VALUES(?,?,?,?,?,?)').bind('scale',r.id,r.fromId,r.toId,r.kind,r.quantity)));
 });
 database.close();database=openDatabase(join(dir,'scale.sqlite'));
 await withDatabase(database,async()=>{
  const loaded=await timeAsync('readAfterRestartMs',()=>stateFor('scale'));assert.equal(loaded.items.length,10000);assert.equal(loaded.relations.length,8000);
  assert.equal(loaded.items.find(i=>i.id==='scale-1')!.ownership,'owned');assert.equal(loaded.items.find(i=>i.id==='scale-9999')!.notes,'備考 9999');
  database.raw.prepare("UPDATE items SET data=json_set(data,'$.schemaVersion',6) WHERE user_id=?").run('scale');let migrationQueries=0;const countedMigration={prepare:(sql:string)=>{migrationQueries++;return database.prepare(sql);},batch:database.batch};const migrated=await timeAsync('legacyMigrationMs',()=>withDatabase(countedMigration,()=>stateFor('scale')));assert.equal(migrated.items.length,10000);assert.ok(migrated.items.every(i=>i.schemaVersion===9));assert.equal(migrated.items.find(i=>i.id==='scale-1')!.quantity,1);assert.equal(migrated.items.find(i=>i.id==='scale-9999')!.catalogNodeId,'custom-owned');assert.ok(migrationQueries<=100);metrics.migrationQueries=migrationQueries;
  const exported=await timeAsync('exportMs',async()=>await (await getStateResponse(new Request('http://localhost/api/radar?export'),'scale','standalone')).text());
  metrics.backupBytes=Buffer.byteLength(exported);const backup=JSON.parse(exported);
  const send=async(body:unknown,user='restored-scale')=>{const raw=JSON.stringify(body);metrics.maxRestoreRequestBytes=Math.max(metrics.maxRestoreRequestBytes||0,Buffer.byteLength(raw));let queries=0;const counted={prepare:(sql:string)=>{queries++;return database.prepare(sql);},batch:database.batch};const response=await withDatabase(counted,()=>postAction(new Request('http://localhost/api/radar',{method:'POST',body:raw}),user,'sites'));metrics.maxQueriesPerRestoreRequest=Math.max(metrics.maxQueriesPerRestoreRequest||0,queries);assert.ok(queries<=50,`restore used ${queries} SQL statements in one request`);const data:any=await response.json();if(!response.ok)throw new Error(data.error);return data;};
  const result:any=await timeAsync('restoreMs',()=>transferBackup(backup,send));assert.equal(result.state.items.length,10000);assert.equal(result.state.relations.length,8000);
  assert.ok(metrics.maxRestoreRequestBytes<ACTION_BYTES);assert.equal(database.raw.prepare("SELECT COUNT(*) AS n FROM preferences WHERE json_extract(data,'$.restoreOwner') IS NOT NULL").get()!.n,0);
  assert.equal(result.state.items.find((i:Item)=>i.id==='scale-9999').catalogNodeId,'custom-owned');assert.equal(result.state.items.find((i:Item)=>i.id==='scale-1').offers[0].availability,'available');
  const again=await postAction(new Request('http://localhost/api/radar',{method:'POST',body:JSON.stringify({action:'restore-backup',backup})}),'restored-scale','standalone');assert.equal(again.ok,false);assert.equal((await stateFor('restored-scale')).items.length,10000);
  const partial={...backup,items:backup.items.filter((i:Item)=>['scale-0','scale-1','scale-2','scale-3','scale-4'].includes(i.id)),relations:backup.relations.filter((r:Relation)=>r.fromId==='scale-0')},invalid={...partial,relations:[...partial.relations,{id:'bad',fromId:'scale-0',toId:'missing',kind:'contains',quantity:1}]};
  await assert.rejects(()=>transferBackup(invalid,body=>send(body,'failed-restore')),/关联关系无效/);assert.equal((await stateFor('failed-restore')).items.length,0);
  let calls=0;await assert.rejects(()=>transferBackup(partial,body=>{if(++calls===3)throw new Error('simulated interruption');return send(body,'interrupted-restore');}),/simulated interruption/);assert.equal((await stateFor('interrupted-restore')).items.length,0);
  await transferBackup(partial,body=>send(body,'interrupted-restore'));assert.equal((await stateFor('interrupted-restore')).items.length,5);
  await assert.rejects(()=>transferBackup(partial,async(body:any)=>{if(body.action==='backup-finish')await saveItems('concurrent-restore',[{...items[9999],id:'new-item'}]);return send(body,'concurrent-restore');}),/仅允许导入空数据库/);const concurrent=await stateFor('concurrent-restore');assert.equal(concurrent.items.length,1);assert.equal(concurrent.items[0].id,'new-item');
  assert.equal(database.raw.prepare("SELECT COUNT(*) AS n FROM preferences WHERE json_extract(data,'$.restoreOwner') IS NOT NULL").get()!.n,0);
 });
 metrics.heapUsedMiB=Math.round(process.memoryUsage().heapUsed/1048576);metrics.rssMiB=Math.round(process.memoryUsage().rss/1048576);
 console.log('PASS scale: 10,000 synthetic products, 2,000 sets / 8,000 members, persistent placement and stock, restart, export / restore, overwrite rejection',JSON.stringify(metrics));
}finally{console.log('SCALE metrics (ms / bytes):',JSON.stringify(metrics));database.close();rmSync(dir,{recursive:true,force:true});}
