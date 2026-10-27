import assert from 'node:assert/strict';
import {after, test} from 'node:test';
import {loadRadar} from './load-radar.mjs';

const radar=loadRadar(), {withDatabase}=radar.get('store'), {postAction}=radar.get('service');
const {createItem,relationKey}=radar.get('engine'), {DEFAULT_PREFS}=radar.get('types');
const {recordVersion}=radar.get('item-record'), {relationsVersion}=radar.get('revision-plan');
after(()=>radar.close());

async function fixture(run){
 const db=radar.get('sqlite').openDatabase(':memory:');
 const old={id:'move-edge',fromId:'manga',toId:'volume',kind:'contains',quantity:1}, next={...old,fromId:'novel'};
 const prefs={...DEFAULT_PREFS,dismissedRelations:[]};
 const read=()=>db.raw.prepare('SELECT data FROM items ORDER BY id').all().map(r=>JSON.parse(r.data));
 const links=()=>db.raw.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations ORDER BY id').all().map(r=>({...r}));
 const savePrefs=p=>db.raw.prepare('INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run('owner',JSON.stringify(p));
 const snapshot=()=>({items:db.raw.prepare('SELECT * FROM items ORDER BY id').all().map(r=>({...r})),links:links(),prefs:db.raw.prepare('SELECT * FROM preferences').all().map(r=>({...r}))});
 for(const id of ['manga','novel','volume']){
  const item={...createItem(id,'original source',undefined,DEFAULT_PREFS),id,notes:'keep '+id,ownership:'owned',quantity:2,offers:[]};
  db.raw.prepare('INSERT INTO items VALUES(?,?,?,?)').run('owner',id,JSON.stringify(item),'original');
 }
 db.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('owner',old.id,old.fromId,old.toId,old.kind,old.quantity);
 const api=async body=>{const response=await withDatabase(db,()=>postAction(new Request('https://test.local/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),'owner'));return {status:response.status,body:await response.json()};};
 const action=()=>({action:'catalogue-curation',changes:read().map(item=>({item:{...item,summary:'已核对 '+item.id},expectedVersion:recordVersion(item)})),relations:[next],revision:{remove:[old],expectedVersion:relationsVersion(links())}});
 const conflict=(r,code='VERSION_CONFLICT')=>{assert.equal(r.status,409,JSON.stringify(r));assert.equal(r.body.code,code);assert.doesNotMatch(r.body.error,/NOT NULL|scans\.data/);};
 try{await run({db,old,next,prefs,read,links,savePrefs,snapshot,api,action,conflict});assert.equal(db.raw.prepare("SELECT COUNT(*) n FROM scans WHERE id LIKE 'operation:%'").get().n,0);}finally{db.close();}
}

test('previously dismissed replacement rejects the whole revision, preserving metadata and old edge',()=>fixture(async f=>{
 f.savePrefs({...f.prefs,dismissedRelations:[relationKey(f.next)]});const before=f.snapshot();
 f.conflict(await f.api(f.action()),'RELATION_DISMISSED');assert.deepEqual(f.snapshot(),before);
}));

for(const existing of [false,true])test(`dismissal racing final transaction rejects atomically (preferences ${existing?'updated':'inserted'})`,()=>fixture(async f=>{
 if(existing)f.savePrefs(f.prefs);const before=f.snapshot(),batch=f.db.batch;let raced=false;
 const concurrent={...f.prefs,dismissedRelations:[relationKey(f.next)],language:'zh'};
 f.db.batch=async statements=>{
  if(!raced&&statements.some(s=>/operation:curate:/.test(JSON.stringify(s.values)))){raced=true;f.savePrefs(concurrent);}
  return batch(statements);
 };
 f.conflict(await f.api(f.action()));assert.equal(raced,true);const after=f.snapshot();
 assert.deepEqual(after.items,before.items);assert.deepEqual(after.links,before.links);
 assert.deepEqual(JSON.parse(after.prefs[0].data),concurrent);
}));

for(const quantity of [1,3])test(`existing target with quantity ${quantity} rejects instead of silently skipping`,()=>fixture(async f=>{
 const target={...f.next,id:'existing-target',quantity};
 f.db.raw.prepare('INSERT INTO relations VALUES(?,?,?,?,?,?)').run('owner',target.id,target.fromId,target.toId,target.kind,target.quantity);
 const before=f.snapshot();f.conflict(await f.api(f.action()),'RELATION_ALREADY_EXISTS');assert.deepEqual(f.snapshot(),before);
}));

test('duplicate additions and conflicting edge IDs reject without partial writes',()=>fixture(async f=>{
 const before=f.snapshot(),duplicate=f.action();duplicate.relations.push({...f.next,id:'other-id'});
 f.conflict(await f.api(duplicate),'RELATION_ALREADY_EXISTS');assert.deepEqual(f.snapshot(),before);
 const duplicateId=f.action();duplicateId.relations.push({...f.next,toId:'manga'});
 f.conflict(await f.api(duplicateId),'RELATION_ALREADY_EXISTS');assert.deepEqual(f.snapshot(),before);
}));

test('stale Item version returns a clear conflict, not a generic bad request',()=>fixture(async f=>{
 const action=f.action();action.changes[0].expectedVersion='0'.repeat(64);const before=f.snapshot();
 f.conflict(await f.api(action));assert.deepEqual(f.snapshot(),before);
}));

test('exact replacement, replay rejection, explicit quantity replacement, and guarded undo',()=>fixture(async f=>{
 f.savePrefs(f.prefs);const before=f.read(),action=f.action();
 assert.equal((await f.api(action)).status,200);assert.deepEqual(f.links(),[f.next]);
 const applied=f.snapshot();f.conflict(await f.api(action));assert.deepEqual(f.snapshot(),applied);
 const replace={action:'catalogue-curation',changes:f.read().map(item=>({item,expectedVersion:recordVersion(item)})),relations:[{...f.next,quantity:4}],revision:{remove:[f.next],expectedVersion:relationsVersion(f.links())}};
 assert.equal((await f.api(replace)).status,200);assert.deepEqual(f.links(),[{...f.next,quantity:4}]);
 const undo={action:'catalogue-curation',changes:f.read().map(item=>({item:before.find(x=>x.id===item.id),expectedVersion:recordVersion(item)})),relations:[f.old],revision:{remove:f.links(),expectedVersion:relationsVersion(f.links())}};
 assert.equal((await f.api(undo)).status,200);assert.deepEqual(f.read(),before);assert.deepEqual(f.links(),[f.old]);
}));
