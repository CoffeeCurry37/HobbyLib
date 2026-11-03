// Read-only projection of the completed V6 snapshot. Never executes a migration.
import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir='research/series-evidence-20261103',priv='work/series-evidence-20261103';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});
const raw=fs.readFileSync('work/v6/research-queue.json','utf8'),queue=JSON.parse(raw);
const snapshot=JSON.parse(fs.readFileSync('work/v6/production-after.json','utf8'));
const items=new Map(snapshot.items.map(x=>[x.id,x]));
const groups=queue.map(g=>{
 const key=[g.kind,g.series,g.label,g.batch||''].join('|'),id='series-'+hash(key).slice(0,16);
 const active=g.ids.map(id=>items.get(id)).filter(Boolean);
 const accepted=active.filter(x=>x.editorial),manual=active.filter(x=>x.manualFields?.length||x.locked);
 const {ids,...facts}=g;
 return {id,key,...facts,originalCount:ids.length,activeSnapshotCount:active.length,protectedEditorialCount:accepted.length,manualOrLockedCount:manual.length,missingFromActiveCount:ids.length-active.length,status:'pending-evidence',sourceStatus:'not-assessed',productVerified:0,productionApplied:0};
});
groups.sort((a,b)=>b.activeSnapshotCount-a.activeSnapshotCount||a.key.localeCompare(b.key));
const compact=queue.flatMap(g=>{
 const key=[g.kind,g.series,g.label,g.batch||''].join('|'),groupId='series-'+hash(key).slice(0,16);
 return g.ids.map(id=>items.get(id)).filter(Boolean).map(i=>({groupId,id:i.id,title:i.title,description:i.description,series:i.series,event:i.event,productLine:i.productLine,wave:i.wave,member:i.member,kind:i.kind,origin:i.origin,productType:i.productType,manufacturer:i.manufacturer,jan:i.jan,isbn:i.isbn,image:i.image,images:i.images,summary:i.summary,tags:i.tags,characters:i.characters,evidence:i.evidence,editorial:i.editorial,manualFields:i.manualFields,locked:i.locked,sourceUrls:[...new Set((i.offers||[]).map(o=>o.url).filter(Boolean))]}));
});
fs.writeFileSync(priv+'/targets-projection.json',JSON.stringify(compact));
const summary={at:new Date().toISOString(),baselineCommit:'e99ee38d963f7869798dca13cc4a0ce0e8ff8d60',snapshotKind:'completed-V6-local-snapshot-not-live',queueSha256:hash(raw),groups:groups.length,originalUniqueIds:new Set(queue.flatMap(g=>g.ids)).size,activeSnapshotIds:new Set(compact.map(i=>i.id)).size,protectedEditorialCount:new Set(compact.filter(i=>i.editorial).map(i=>i.id)).size,productionApplied:0,fullyVerifiedGroups:0};
fs.writeFileSync(dir+'/queue-index.json',JSON.stringify({summary,groups},null,2)+'\n');
console.log(JSON.stringify(summary));
for(const g of groups.slice(0,15))console.log(JSON.stringify({...g,samples:compact.filter(x=>x.groupId===g.id).slice(0,5).map(i=>({title:i.title,line:i.productLine,member:i.member,evidence:i.evidence?.filter(e=>/aniplex|fate-go|typemoon/.test(e.url)).slice(0,2)}))}));

