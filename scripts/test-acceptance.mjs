import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadRadar} from './load-radar.mjs';
const r=loadRadar(),{EMPTY_FACTS,DEFAULT_PREFS}=r.get('types');
const url='https://www.suruga-ya.jp/product/detail/TEST001';
const offer=(n=0,price=1000)=>({id:'listing',source:'骏河屋',url,price,currency:'JPY',priceKind:'ask',priceBasis:'tax_included',condition:'中古',availability:'available',bonus:'unknown',observedAt:new Date(Date.now()-60000+n*1000).toISOString(),history:[]});
const item=(id='book',extra={})=>({...EMPTY_FACTS,id,title:'Acceptance Chronicle 1巻',description:'original source',image:'',brand:'',series:'Acceptance Chronicle',year:'',category:'小説',productLine:'Acceptance Chronicle',wave:'1',kind:'base',tags:['manual tag'],isbn:'',msrp:null,ownership:'unknown',quantity:0,priority:50,rating:null,review:true,bucket:'normal',notes:'before',evidence:[],offers:[offer()],createdAt:'2026-01-01T00:00:00.000Z',schemaVersion:9,...extra});
const request=body=>new Request('https://example.test/api/radar',{method:'POST',body:JSON.stringify(body)});
test('refresh-item API protects concurrent edits on success, fetch failure and SQL guard failure',async()=>{
 const {withDatabase,saveItems,savePrefs}=r.get('store'),{withSourceReader}=r.get('reader'),{postAction}=r.get('service'),collector=r.get('collector'),originalParse=collector.parseHtml;
 try{for(const mode of ['before-guard','fetch-error','commit-guard','success','plain-error']){
  const db=r.get('sqlite').openDatabase(':memory:'),base=item(),child=item('child',{title:'Independent child',offers:[]});let edited,injected=false;
  const edit=async()=>{edited={...base,notes:'NEW USER NOTE',ownership:'owned',quantity:3,locked:true,tags:['USER ONLY'],summary:'人工简介',offers:[{...offer(20,300),verifiedAt:new Date().toISOString()}],evidence:[{field:'人工整理',value:'tags、summary',url:'',at:new Date().toISOString(),method:'用户修改'}]};await withDatabase(db,()=>saveItems('owner',[edited]));db.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('owner','new-link','book','child','related',1);};
  const racing={prepare:sql=>db.prepare(sql),batch:async statements=>{if(mode==='commit-guard'&&!injected&&statements.some(s=>s.sql.includes('INSERT INTO scans'))){injected=true;await edit();}return db.batch(statements);}};
  try{await withDatabase(db,async()=>{await saveItems('owner',[base,child]);await savePrefs('owner',{...DEFAULT_PREFS,autoEnrich:false,autoLink:false,alertThreshold:100});});
   collector.parseHtml=()=>({products:[{title:base.title,description:'fresh source',image:'',facts:{category:'小説',productLine:base.productLine,wave:'1'},offer:offer(1,500)}],needsBrowser:false});
   const response=await withDatabase(racing,()=>withSourceReader(async()=>{if(['before-guard','fetch-error'].includes(mode))await edit();if(['fetch-error','plain-error'].includes(mode))throw Error('Source unavailable');return {text:'fixture',url};},()=>postAction(request({action:'refresh-item',id:base.id,url}),'owner','standalone')));
   const body=await response.json(),saved=JSON.parse(db.raw.prepare('SELECT data FROM items WHERE user_id=? AND id=?').get('owner','book').data);
   if(edited){assert.deepEqual(saved,edited,mode+' overwrote a concurrent user edit');assert.equal(response.status,409);assert.equal(body.code,'VERSION_CONFLICT');assert.doesNotMatch(body.error,/NOT NULL|scans\.data/);assert.equal(db.raw.prepare('SELECT count(*) n FROM relations').get().n,1);}
   else if(mode==='success'){assert.equal(response.status,200,body.error);assert.equal(saved.offers[0].price,500);assert.ok(saved.detailCheckedAt);assert.equal(saved.notes,'before');}
   else {assert.equal(response.status,400);assert.equal(saved.offers[0].price,1000);assert.equal(saved.notes,'before');assert.match(saved.offers[0].detailError,/Source unavailable/);}
   assert.equal(db.raw.prepare("SELECT count(*) n FROM scans WHERE id LIKE 'operation:%'").get().n,0);
  }finally{db.close();}
 }}finally{collector.parseHtml=originalParse;}
});
test('one listing review case retains observations, resolves with versions and resumes formal prices',async()=>{
 const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs,stateFor}=r.get('store'),{ingest,postAction}=r.get('service'),{recordVersion}=r.get('item-record');
 try{await withDatabase(db,async()=>{
  const base=item();await saveItems('owner',[base]);await savePrefs('owner',{...DEFAULT_PREFS,autoEnrich:false,autoLink:false});
  const product=(volume,n,price)=>({title:`Acceptance Chronicle ${volume}巻`,description:'',image:'',facts:{category:'小説',productLine:base.productLine,wave:String(volume)},offer:offer(n,price)}),wrong=product(2,1,800),restored=product(1,2,500);
  const run=async p=>ingest('owner',await stateFor('owner'),[p],false,true);
  await run(wrong);await run(restored);await run(restored);
  let state=await stateFor('owner');assert.equal(state.items.length,2,'Do not duplicate the original product inside review');
  const review=state.items.find(i=>i.id!==base.id),target=state.items.find(i=>i.id===base.id);assert.equal(target.offers[0].price,1000);assert.equal(review.identityReview.status,'open');assert.equal(review.identityReview.observations.length,2);
  assert.equal(r.get('identity').findProduct(state.items,{...base,offers:[restored.offer]})?.item.id,base.id,'Quarantine evidence is not a catalogue candidate');
  const version=async id=>(await r.get('item-record').itemRecord('owner',id)).version;
  const resolution={action:'resolve-identity-review',id:review.id,expectedVersion:await version(review.id),targetId:base.id,targetExpectedVersion:await version(base.id),reason:'Source reverted to volume 1; volume 2 observation retained',sourceUrl:url};
  assert.equal((await postAction(request({...resolution,expectedVersion:'0'.repeat(64)}),'owner')).status,409);
  let raced=false;const racing={prepare:sql=>db.prepare(sql),batch:async statements=>{if(!raced&&statements.some(s=>s.sql.includes('INSERT INTO scans'))){raced=true;const row=JSON.parse(db.raw.prepare('SELECT data FROM items WHERE id=?').get(base.id).data);row.notes='resolution concurrent note';db.raw.prepare('UPDATE items SET data=? WHERE id=?').run(JSON.stringify(row),base.id);}return db.batch(statements);}};
  assert.equal((await withDatabase(racing,()=>postAction(request(resolution),'owner'))).status,409);assert.equal((await r.get('item-record').itemRecord('owner',review.id)).item.identityReview.status,'open');
  resolution.targetExpectedVersion=await version(base.id);
  const response=await postAction(request(resolution),'owner');assert.equal(response.status,200,await response.clone().text());
  await run(restored);state=await stateFor('owner');assert.equal(state.items.length,2);assert.equal(state.items.find(i=>i.id===base.id).offers[0].price,500);assert.equal(state.items.find(i=>i.id===review.id).identityReview.observations.length,2);
  await run(product(2,3,700));state=await stateFor('owner');assert.equal(state.items.length,2);const reopened=state.items.find(i=>i.id===review.id);assert.equal(reopened.identityReview.status,'open');assert.equal(reopened.identityReview.observations.length,3);assert.equal(reopened.identityReview.resolutions.length,1);
  const rejected=await postAction(request({...resolution,expectedVersion:await version(reopened.id),targetExpectedVersion:await version(base.id)}),'owner');assert.equal(rejected.status,400,'Resolution cannot bypass the latest hard conflict');
  const backup=await (await r.get('service').getStateResponse(new Request('https://example.test/api/radar?export'),'owner','standalone')).json();
  const restore=await postAction(request({action:'restore-backup',backup}),'restored','standalone');assert.equal(restore.status,200,await restore.clone().text());assert.deepEqual((await r.get('item-record').itemRecord('restored',review.id)).item.identityReview,reopened.identityReview);

 });}finally{db.close();}
});
test('full ingest preserves locked manual tag set despite source and classification tags',async()=>{
 const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,saveItems,savePrefs,stateFor}=r.get('store');
 try{await withDatabase(db,async()=>{
  const base=item('book',{locked:true,evidence:[{field:'人工整理',value:'tags',url:'',at:'2026-01-01T00:00:00.000Z',method:'用户修改'}]});await saveItems('owner',[base]);await savePrefs('owner',{...DEFAULT_PREFS,autoEnrich:true,autoLink:false});
  await r.get('service').ingest('owner',await stateFor('owner'),[{title:base.title,description:'',image:'',tags:['SOURCE AUTO TAG'],facts:{publisher:'Test Publisher',category:'小説'},offer:offer(1,500)}],false,true);
  const saved=(await stateFor('owner')).items.find(i=>i.id===base.id);assert.deepEqual(saved.tags,base.tags);assert.equal(saved.offers[0].price,500);
 });}finally{db.close();}
});
