// Issue #3: seven real endpoint field revisions AND five moves in one API call.
// Only accepts an already staged, disposable local snapshot; never connects online.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadRadar} from './load-radar.mjs';
const [path,reportPath]=process.argv.slice(2);
assert.ok(path&&reportPath,'usage: node scripts/test-prototype-atomic.mjs work/issue-3/prototype.sqlite report.json');
assert.ok(resolve(path).startsWith(resolve('work/issue-3')+'/'),'must use a disposable Issue #3 copy');
const r=loadRadar(),db=r.get('sqlite').openDatabase(path),user='local-audit';
const {withDatabase}=r.get('store'),{postAction}=r.get('service'),{recordVersion}=r.get('item-record'),{relationsVersion,validateRelations}=r.get('revision-plan'),{relationKey}=r.get('engine');
const read=p=>JSON.parse(readFileSync(p));
const plan=read('research/editorial-20261021/batch-005/relation-plan.json');
const ids=new Set([...plan.remove,...plan.add].flatMap(x=>[x.fromId,x.toId]));assert.equal(ids.size,7);assert.equal(plan.add.length,5);
const desired=new Map(read('work/editorial-005/actions.json').flatMap(a=>a.changes).filter(c=>ids.has(c.item.id)).map(c=>[c.item.id,c.item]));assert.equal(desired.size,7);
const rows=()=>db.raw.prepare('SELECT id,data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?)) ORDER BY id').all(user,JSON.stringify([...ids]));
const items=()=>rows().map(x=>JSON.parse(x.data));
const links=()=>db.raw.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? ORDER BY id').all(user).map(x=>({...x}));
const rawPrefs=()=>db.raw.prepare('SELECT data FROM preferences WHERE user_id=?').get(user)?.data;
const savePrefs=data=>db.raw.prepare('UPDATE preferences SET data=? WHERE user_id=?').run(data,user);
const digest=onlyUntouched=>{const h=createHash('sha256');for(const row of db.raw.prepare('SELECT id,data FROM items WHERE user_id=? ORDER BY id').iterate(user))if(!onlyUntouched||!ids.has(row.id))h.update(JSON.stringify([row.id,row.data]));return h.digest('hex');};
const api=async body=>{const res=await withDatabase(db,()=>postAction(new Request('https://isolated.test/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),user));return {status:res.status,body:await res.json()};};
const action=()=>({action:'catalogue-curation',changes:items().map(item=>({item:desired.get(item.id),expectedVersion:recordVersion(item)})),relations:plan.add,revision:{remove:plan.remove,expectedVersion:relationsVersion(links())}});
const beforeItems=items(),beforeRows=rows(),beforeLinks=links(),beforePrefs=rawPrefs(),beforeHash=digest(false),untouched=digest(true),receipts=[];
const unchanged=()=>{assert.deepEqual(rows(),beforeRows);assert.deepEqual(links(),beforeLinks);assert.equal(digest(true),untouched);};
const conflict=async(label,body,code='VERSION_CONFLICT')=>{const receipt=await api(body);assert.equal(receipt.status,409,JSON.stringify(receipt));assert.equal(receipt.body.code,code);receipts.push({label,...receipt});unchanged();};
try{
 assert.ok(db.raw.prepare("SELECT name FROM sqlite_master WHERE name='local_meta'").get(),'missing isolated snapshot marker');
 for(const edge of plan.remove)assert.ok(beforeLinks.some(x=>JSON.stringify(x)===JSON.stringify(edge)),'source graph must not already be revised');
 const dismissed=JSON.stringify({...JSON.parse(beforePrefs),dismissedRelations:[...JSON.parse(beforePrefs).dismissedRelations||[],relationKey(plan.add[0])]});
 savePrefs(dismissed);await conflict('already dismissed target',action(),'RELATION_DISMISSED');assert.equal(rawPrefs(),dismissed);savePrefs(beforePrefs);
 const batch=db.batch;let raced=false;
 db.batch=async statements=>{if(!raced&&statements.some(s=>/operation:curate:/.test(JSON.stringify(s.values)))){raced=true;savePrefs(dismissed);}return batch(statements);};
 try{await conflict('concurrent dismissal',action());assert.equal(raced,true);assert.equal(rawPrefs(),dismissed);}finally{db.batch=batch;savePrefs(beforePrefs);}
 const stale=action();stale.changes[0].expectedVersion='0'.repeat(64);await conflict('stale Item',stale);
 const request=action(),success=await api(request);assert.equal(success.status,200,JSON.stringify(success));assert.deepEqual(success.body,{ok:true,created:0,updated:7,linked:5,unlinked:5});receipts.push({label:'one request: seven fields + five moves',...success});
 const expectedLinks=[...beforeLinks.filter(x=>!plan.remove.some(y=>y.id===x.id)),...plan.add].sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual([...links()].sort((a,b)=>a.id.localeCompare(b.id)),expectedLinks);
 const allIds=new Set();let archives=0,offers=0;for(const row of db.raw.prepare('SELECT data FROM items WHERE user_id=?').iterate(user)){const i=JSON.parse(row.data);if(i.archivedInto)archives++;else allIds.add(i.id);offers+=i.offers.length;}
 validateRelations(allIds,links());assert.equal(digest(true),untouched);assert.equal(rawPrefs(),beforePrefs);
 const afterItems=items();for(const i of afterItems){assert.deepEqual(i,desired.get(i.id));const before=beforeItems.find(x=>x.id===i.id);for(const key of ['ownership','quantity','notes','rating','priority','watchlisted','manualOrder','catalogNodeId','createdAt','offers','description','title'])assert.deepEqual(i[key],before[key],key);}
 const afterHash=digest(false),replay=await api(request);assert.equal(replay.status,409);assert.equal(digest(false),afterHash);receipts.push({label:'replay rejected',...replay});
 const undo={action:'catalogue-curation',changes:afterItems.map(item=>({item:beforeItems.find(x=>x.id===item.id),expectedVersion:recordVersion(item)})),relations:plan.remove,revision:{remove:plan.add,expectedVersion:relationsVersion(links())}};
 const staleUndo=structuredClone(undo);staleUndo.changes[0].expectedVersion='0'.repeat(64);assert.equal((await api(staleUndo)).status,409);assert.equal(digest(false),afterHash);
 const rollback=await api(undo);assert.equal(rollback.status,200,JSON.stringify(rollback));assert.deepEqual(items(),beforeItems);assert.deepEqual(links(),beforeLinks);assert.equal(rawPrefs(),beforePrefs);assert.equal(digest(true),untouched);
 assert.equal(db.raw.prepare("SELECT COUNT(*) n FROM scans WHERE user_id=? AND id LIKE 'operation:%'").get(user).n,0);
 const report={scope:'isolated complete snapshot; no production writes',pass:true,items:allIds.size+archives,archives,offers,relations:beforeLinks.length,endpoints:[...ids],endpointChangesInSingleRequest:7,relationMovesInSameRequest:5,unchangedRecords:allIds.size+archives-7,unrelatedBytesPreserved:true,personalManualOffersDescriptionsTitlesPreserved:true,staleItemRejected:true,existingDismissalRejected:true,racingDismissalPreserved:true,replayRejected:true,staleRollbackRejected:true,rollback:{itemValuesExact:true,relationsExact:true,preferencesBytesExact:true,itemJSONPropertyOrderMayChange:true},beforeHash,afterHash,untouchedHash:untouched,receipts,productionApplied:0,verifiedDelta:0,quota:'not exposed',quotaReset:'not exposed'};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,items:report.items,endpointChanges:7,moved:5,receipts:receipts.length,rollback:'exact values; JSON property order may change'}));
}finally{db.close();r.close();}
