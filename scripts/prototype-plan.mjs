import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {parseArgs} from 'node:util';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadRadar} from './load-radar.mjs';
const {values:o}=parseArgs({options:{snapshot:{type:'string'},out:{type:'string'},validate:{type:'boolean',default:false}}});
if(!o.snapshot||!o.out)throw Error('Required: --snapshot isolated-copy.sqlite --out DIR [--validate]');
const db=new DatabaseSync(resolve(o.snapshot),{readOnly:!o.validate}),r=loadRadar(),at=performance.now();
try{
 const meta=JSON.parse(db.prepare("SELECT value FROM local_meta WHERE key='snapshot'").get().value),manifest=JSON.parse(readFileSync('lib/radar/editorial-manifest.json')),decisions=JSON.parse(readFileSync('research/editorial-20261021/batch-004/decisions.json')).groups.flatMap(g=>g.members),get=id=>JSON.parse(db.prepare('SELECT data FROM items WHERE user_id=? AND id=?').get('local-audit',id).data),byOrdinal=n=>get(manifest.ids[n-1]),links=()=>db.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? ORDER BY id').all('local-audit'),{validateRevision,relationsVersion,validateRelations}=r.get('revision-plan'),{recordVersion}=r.get('item-record'),rulesVersion=r.get('identity').IDENTITY_RULE_VERSION;
 const parent=byOrdinal(484),wrong=byOrdinal(485),members=[486,487,488,489,490].map(byOrdinal),before=links();
 assert.ok(parent.catalogueGroup&&parent.category==='小説'&&wrong.catalogueGroup&&wrong.category==='コミック');
 const evidence=members.map((i,n)=>{const ordinal=n+486,d=decisions.find(d=>d.ordinal===ordinal);assert.equal(d.match.by,'isbn');assert.equal(d.match.value,i.isbn);assert.equal(d.fields.category,i.category);assert.equal(i.category,'小説');assert.equal(i.productLine,parent.productLine);assert.ok(i.evidence.some(e=>e.field==='isbn'&&e.value===i.isbn&&e.url===d.match.url));return {ordinal,itemId:i.id,isbn:i.isbn,url:d.match.url};});
 const remove=before.filter(x=>x.fromId===wrong.id&&members.some(i=>i.id===x.toId));assert.equal(remove.length,5);assert.ok(remove.every(x=>x.kind==='contains'));
 const plan={format:'local-revision-v1',environment:'isolated-local-copy',inputHash:meta.inputSha256,rulesVersion,items:[parent,wrong,...members].map(i=>({id:i.id,expectedVersion:recordVersion(i)})),relationsBefore:relationsVersion(before),remove,add:remove.map(x=>({...x,fromId:parent.id})),preserve:['all Item bytes, including personal/manual fields, offers/history, merge archives and editorial status','all 15,811 original ordinals','all relations outside these five edges','paperback parent #501 and all manga members'],evidence,fieldChanges:[],relationshipMeaning:'Legacy contains from catalogueGroup means logical membership, never physical composition',rollback:'Validate the after graph and all seven item versions; reverse only these five edges. Any later item/relationship edit rejects undo. Production requires a fresh plan and separate authorization.'};
 let report={validated:false};
 if(o.validate){
  const activeIds=new Set(db.prepare("SELECT id FROM items WHERE user_id=? AND json_extract(data,'$.archivedInto') IS NULL").all('local-audit').map(x=>x.id));
  const records=()=>[...activeIds].map(id=>plan.items.some(i=>i.id===id)?get(id):({id}));
  const allItemHash=()=>{const h=createHash('sha256');for(const row of db.prepare('SELECT id,data FROM items WHERE user_id=? ORDER BY id').iterate('local-audit'))h.update(row.id+'\0'+row.data+'\0');return h.digest('hex');};
  const hashBefore=allItemHash(),idsBefore=db.prepare('SELECT count(*) n FROM items').get().n,queueBefore=manifest.ids.filter(id=>db.prepare('SELECT 1 FROM items WHERE id=?').get(id)).length;
  const next=validateRevision(plan,records(),before,meta.inputSha256,rulesVersion);db.exec('SAVEPOINT simulation');
  try{
   // Check stale user edit and relationship race before any write.
   const changed=structuredClone(records());changed.find(x=>x.id===members[0].id).notes='later local edit';assert.throws(()=>validateRevision(plan,changed,before,meta.inputSha256,rulesVersion),/Stale item/);
   assert.throws(()=>validateRevision(plan,records(),[...before,{id:'concurrent',fromId:parent.id,toId:wrong.id,kind:'related',quantity:1}],meta.inputSha256,rulesVersion),/Stale relations/);
   assert.throws(()=>validateRevision({...plan,rulesVersion:rulesVersion-1},records(),before,meta.inputSha256,rulesVersion),/Stale/);
   for(const x of plan.add)db.prepare('UPDATE relations SET from_id=? WHERE user_id=? AND id=?').run(x.fromId,'local-audit',x.id);
   validateRelations(activeIds,links());assert.equal(relationsVersion(links()),relationsVersion(next));assert.equal(allItemHash(),hashBefore);assert.equal(db.prepare('SELECT count(*) n FROM items').get().n,idsBefore);
   const undo={...plan,relationsBefore:relationsVersion(next),remove:plan.add,add:plan.remove};assert.throws(()=>validateRevision(undo,changed,links(),meta.inputSha256,rulesVersion),/Stale item/);assert.throws(()=>validateRevision(undo,records(),[...links(),{id:'later',fromId:wrong.id,toId:parent.id,kind:'related',quantity:1}],meta.inputSha256,rulesVersion),/Stale relations/);
   const reversed=validateRevision(undo,records(),links(),meta.inputSha256,rulesVersion);assert.equal(relationsVersion(reversed),relationsVersion(before));
   for(const x of undo.add)db.prepare('UPDATE relations SET from_id=? WHERE user_id=? AND id=?').run(x.fromId,'local-audit',x.id);
   assert.equal(relationsVersion(links()),relationsVersion(before));assert.equal(allItemHash(),hashBefore);
   report={validated:true,items:idsBefore,active:activeIds.size,relations:before.length,queuePreserved:queueBefore,changedItems:0,movedRelations:5,allItemBytesPreserved:true,personalManualOffersArchivesPreserved:true,staleItemRejected:true,staleRelationsRejected:true,staleRulesRejected:true,undoAfterEditRejected:true,rollbackExact:true};
  }finally{db.exec('ROLLBACK TO simulation; RELEASE simulation');}
 }
 mkdirSync(o.out,{recursive:true});writeFileSync(join(o.out,'prototype-plan.json'),JSON.stringify(plan,null,2)+'\n');const summary={...report,inputHash:meta.inputSha256,rulesVersion,elapsedMs:performance.now()-at,maxRssKiB:process.resourceUsage().maxRSS,sourceRequests:0,cacheReceiptsReused:5,verifiedAdded:0,productionApplied:false};writeFileSync(join(o.out,'prototype-validation.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
}finally{db.close();r.close();}
