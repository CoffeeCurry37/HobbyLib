import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadRadar} from './load-radar.mjs';
const r=loadRadar(), identity=r.get('identity'), {EMPTY_FACTS}=r.get('types');
const offer=(url='https://order.mandarake.co.jp/order/detailPage/item?itemCode=123',extra={})=>({id:url,source:'Mandarake',url,price:1000,currency:'JPY',condition:'中古',availability:'available',bonus:'unknown',observedAt:'2026-10-26T00:00:00.000Z',history:[],...extra});
const item=(id,extra={})=>({...EMPTY_FACTS,id,title:'Synthetic Chronicle 1',description:'',image:'',brand:'',series:'Synthetic Chronicle',year:'',category:'小説',kind:'base',tags:[],isbn:'',msrp:null,ownership:'unknown',quantity:0,priority:50,rating:null,review:true,bucket:'normal',notes:'',evidence:[],offers:[],createdAt:'2026-10-01T00:00:00.000Z',...extra});
test('same listing never bypasses known medium, platform or component conflicts',()=>{
 for(const [a,b] of [[{category:'小説'},{category:'コミック'}],[{category:'ゲームソフト',title:'Synthetic Adventure Nintendo Switch'},{category:'ゲームソフト',title:'Synthetic Adventure PS4'}],[{kind:'base'},{kind:'bonus',title:'Synthetic Chronicle 特典単品'}]]){
  const old=item('old',{...a,offers:[offer()]}),next=item('next',{...b,offers:[offer()]});
  assert.equal(identity.findProduct([old],next),null);
 }
});
test('same listing does not collapse volumes',()=>assert.equal(identity.findProduct([item('old',{title:'Synthetic Chronicle 1巻',wave:'1',productLine:'Synthetic Chronicle',offers:[offer()]})],item('next',{title:'Synthetic Chronicle 2巻',wave:'2',productLine:'Synthetic Chronicle',offers:[offer()]})),null));
test('missing or empty source identifiers are not shared keys',()=>{
 for(const url of ['https://order.mandarake.co.jp/order/detailPage/item','https://order.mandarake.co.jp/order/detailPage/item?itemCode=','not a URL'])assert.equal(identity.listingKey(url),'');
});
test('index replacement removes previous keys, including when archived',()=>{
 const old=item('old'),index=identity.productIndex([old]);
 index.add({...old,title:'Entirely Different Product'});
 assert.equal(index.lookup(item('query')).length,0);
 index.add({...old,title:'Entirely Different Product',archivedInto:'target'});
 assert.equal(index.lookup(item('query',{title:'Entirely Different Product'})).length,0);
});
test('multiple items on the same listing require review',()=>{
 const a=item('a',{offers:[offer()]}),b=item('b',{offers:[offer()]});
 assert.equal(identity.findProduct([a,b],item('next',{offers:[offer()]})),null);
});
test('conflicting observations are retained once, original and other users survive; shadow writes nothing',async()=>{
 const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,stateFor}=r.get('store'),{ingest,postAction}=r.get('service');
 try{await withDatabase(db,async()=>{
  const old=item('old',{title:'Synthetic Chronicle 1巻',category:'小説',wave:'1',productLine:'Synthetic Chronicle',schemaVersion:9,notes:'PRIVATE',ownership:'owned',quantity:2,offers:[offer()]});
  await saveItems('owner',[old]);await saveItems('other',[{...old,notes:'OTHER'}]);
  const next={title:'Synthetic Chronicle 2巻',description:'',image:'',facts:{category:'小説',productLine:'Synthetic Chronicle',wave:'2'},offer:offer()};
  const before=db.raw.prepare('SELECT data FROM items WHERE user_id=? AND id=?').get('owner','old').data;
  const state=await stateFor('owner');await ingest('owner',state,[next],false,true);await ingest('owner',await stateFor('owner'),[next],false,true);
  assert.equal(db.raw.prepare('SELECT data FROM items WHERE user_id=? AND id=?').get('owner','old').data,before);
  const rows=db.raw.prepare('SELECT data FROM items WHERE user_id=?').all('owner').map(x=>JSON.parse(x.data));assert.equal(rows.length,2);assert.equal(rows.find(x=>x.id!=='old').matchDecision.status,'conflict');assert.equal(rows.find(x=>x.id!=='old').provisional,true);
  assert.equal(JSON.parse(db.raw.prepare('SELECT data FROM items WHERE user_id=?').get('other').data).notes,'OTHER');
  const dump=()=>JSON.stringify(['items','relations','notices','preferences','scans'].map(t=>db.raw.prepare('SELECT * FROM '+t+' ORDER BY rowid').all()));const snapshot=dump();
  const result=await postAction(new Request('https://example.test/api/radar',{method:'POST',body:JSON.stringify({action:'identity-shadow',products:[next]})}),'owner');assert.equal(result.status,200,await result.clone().text());assert.equal(dump(),snapshot);assert.equal((await result.json()).results[0].decision.status,'conflict');
 });}finally{db.close();}
});
test('events survive truncation, repeat drops/restock, replay and stale concurrent writers',async()=>{
 const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs,stateFor}=r.get('store'),{ingest}=r.get('service'),{DEFAULT_PREFS}=r.get('types');
 try{await withDatabase(db,async()=>{
  await savePrefs('owner',{...DEFAULT_PREFS,alertThreshold:0,autoEnrich:false,autoLink:false});
  const now=Date.now()-60000,product=(n,price=1000,availability='available')=>({title:'Synthetic Event Test Book',description:'',image:'',offer:offer(undefined,{observedAt:new Date(now+n*1000).toISOString(),verifiedAt:new Date(now+n*1000).toISOString(),price,priceBasis:'tax_included',priceKind:'ask',availability})});
  const run=async p=>ingest('owner',await stateFor('owner'),[p],true,true);
  await run(product(1));assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,1);
  db.raw.exec("UPDATE notices SET data=json_set(data,'$.read',json('true'))");await run(product(1));assert.equal(JSON.parse(db.raw.prepare('SELECT data FROM notices').get().data).read,true);
  db.raw.exec('DELETE FROM notices');await run(product(1));await run(product(2));assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,0);
  await run(product(3,800));await run(product(4,1000));await run(product(5,800));assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,2);
  await run(product(6,800,'sold'));await run(product(7,800));assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,3);
  await run(product(2,200,'sold'));const current=(await stateFor('owner')).items.find(i=>!i.catalogueGroup);assert.equal(current.offers[0].availability,'available');assert.equal(current.offers[0].price,800);
  const left=await stateFor('owner'),right=await stateFor('owner');const simultaneous=await Promise.allSettled([ingest('owner',left,[product(8,700)],true,true),ingest('owner',right,[product(8,700)],true,true)]);assert.equal(simultaneous.filter(x=>x.status==='fulfilled').length,1);assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,4);
  const stale=await stateFor('owner'),original=stale.items.find(i=>!i.catalogueGroup);await saveItems('owner',[{...original,notes:'USER EDIT',quantity:3,ownership:'owned'}]);await assert.rejects(ingest('owner',stale,[product(9,600)],true,true),/并发/);assert.equal(JSON.parse(db.raw.prepare('SELECT data FROM items WHERE id=?').get(original.id).data).notes,'USER EDIT');assert.equal(db.raw.prepare('SELECT count(*) n FROM notices').get().n,4);
 });}finally{db.close();}
});
test('unknown ownership and incomparable prices cannot imply a bargain or a missing item',()=>{
 const a=item('a',{ownership:'unknown',offers:[offer(undefined,{priceKind:'bid',priceBasis:'unspecified',verifiedAt:new Date().toISOString(),observedAt:new Date().toISOString()})]}),set=item('set',{kind:'set'}),state={items:[a,set],relations:[{id:'r',fromId:'set',toId:'a',kind:'contains',quantity:1}]};
 assert.equal(r.get('sets').ownershipSummary(set,state).missing,0);assert.equal(r.get('sets').ownershipSummary(set,state).status,'unknown');assert.equal(r.get('sets').compareSet(set,state).complete,false);
 const quote=r.get('price-comparison').quoteComparison(a);assert.equal(quote.groups[0].lowestAsk,null);assert.equal(quote.groups[0].comparable,false);assert.equal(quote.landedCost,null);assert.equal(quote.unknownFees.length,4);
});
test('relation races abort curation and merge atomically; merge undo protects later edits',async()=>{
 const database=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems}=r.get('store'),{recordVersion}=r.get('item-record'),{DEFAULT_PREFS}=r.get('types');
 try{
  const a=item('a',{schemaVersion:9,offers:[offer()]}),b={...a,id:'b'},c=item('c',{schemaVersion:9,title:'Unrelated component'});
  await withDatabase(database,()=>saveItems('owner',[a,b,c]));
  for(const operation of ['curate','merge']){
   database.raw.exec('DELETE FROM relations');let injected=false;
   const racing={prepare:sql=>database.prepare(sql),batch:async statements=>{
    if(!injected&&statements.some(s=>s.sql.includes('INSERT INTO scans'))){injected=true;database.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('owner','later','a','c','contains',1);}
    return database.batch(statements);
   }};
   const before=database.raw.prepare('SELECT data FROM items WHERE id=?').get('a').data;
   await assert.rejects(withDatabase(racing,()=>operation==='curate'?r.get('curation').curate('owner',[{item:{...a,summary:'proposal'},expectedVersion:recordVersion(a)}],[]):r.get('merge-plan').applyMergePlan('owner',[{fromId:'b',toId:'a'}])));
   assert.equal(database.raw.prepare('SELECT data FROM items WHERE id=?').get('a').data,before);assert.equal(database.raw.prepare('SELECT count(*) n FROM relations').get().n,1);assert.equal(database.raw.prepare('SELECT count(*) n FROM scans').get().n,0);
  }
  const state={items:[a,b,c],relations:[],prefs:DEFAULT_PREFS,notices:[],scans:[]},merged=r.get('maintenance').mergeProducts(state,'b','a'),after={...state,items:[merged.merged,c],relations:merged.relations};
  assert.equal(r.get('maintenance').undoMerge(after,merged.archived).items.length,2);
  assert.throws(()=>r.get('maintenance').undoMerge({...after,items:[{...merged.merged,notes:'later edit'},c]},merged.archived),/更新/);
  assert.throws(()=>r.get('maintenance').undoMerge({...after,relations:[{id:'later',fromId:'a',toId:'c',kind:'contains',quantity:1}]},merged.archived),/关联/);
 }finally{database.close();}
});
test('physical lot alerts require known missing ownership and never re-emit old offer events',async()=>{
 const database=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs,stateFor}=r.get('store'),{ingest}=r.get('service'),{DEFAULT_PREFS}=r.get('types');
 try{await withDatabase(database,async()=>{
  await savePrefs('owner',{...DEFAULT_PREFS,autoLink:false,autoEnrich:false,alertThreshold:70});
  const at=Date.now()-60000,member=item('member',{schemaVersion:9,ownership:'missing',priority:90}),unknown=item('unknown',{schemaVersion:9,priority:99}),lot=item('lot',{schemaVersion:9,title:'Synthetic Goods セット',category:'グッズ',kind:'set',saleForm:'seller_lot',priority:0,offers:[offer(undefined,{availability:'sold',observedAt:new Date(at).toISOString()})]});
  await saveItems('owner',[member,unknown,lot]);for(const id of ['member','unknown'])database.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('owner','r-'+id,'lot',id,'contains',1);
  const product={title:lot.title,description:'',image:'',facts:{category:'グッズ',saleForm:'seller_lot'},offer:offer(undefined,{availability:'available',observedAt:new Date(at+1000).toISOString(),verifiedAt:new Date(at+1000).toISOString(),priceKind:'ask'})};
  await ingest('owner',await stateFor('owner'),[product],true,true);const notices=database.raw.prepare('SELECT data FROM notices').all().map(x=>JSON.parse(x.data));assert.equal(notices.length,1);assert.equal(notices[0].itemId,'member');assert.match(notices[0].reason,/整套价格/);
  database.raw.exec('DELETE FROM notices');await ingest('owner',await stateFor('owner'),[product],true,true);assert.equal(database.raw.prepare('SELECT count(*) n FROM notices').get().n,0);
 });}finally{database.close();}
});
test('manual and unattributed tags survive; preference tags are not source facts',()=>{
 const manual=item('manual',{schemaVersion:9,locked:true,tags:['my manual tag'],evidence:[{field:'人工整理',value:'tags',url:'',at:'2026-01-01T00:00:00Z',method:'用户修改'}]});
 assert.deepEqual(r.get('metadata').applyMetadata(manual,{publisher:'KADOKAWA'},'https://example.test/book').tags,manual.tags);
 assert.deepEqual(r.get('tag-provenance').tagSuggestions(manual).add,[]);assert.deepEqual(r.get('tag-provenance').tagSuggestions(manual).remove,[]);
 assert.equal(r.get('source-category').sourceCategory(item('tags',{category:'グッズ',tags:['book','comic']})).type,'goods');
});
