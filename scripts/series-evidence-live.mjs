// Auth arrives through hidden stdin, stays in memory, and is sent only to the
// existing Site. Every mutation has a fresh version, before/after and receipt.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createInterface} from 'node:readline';
import {work as priv, output as pub} from './series-evidence-paths.mjs';
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),safeHash=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
for(const d of ['before','requests','after'])fs.mkdirSync(priv+'/'+d,{recursive:true});
const receiptPath=priv+'/apply-receipts.jsonl',record=r=>{const fd=fs.openSync(receiptPath,'a');try{fs.writeSync(fd,JSON.stringify({...r,at:new Date().toISOString()})+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
if(process.stdin.isTTY)process.stdin.setRawMode(true);const input=createInterface({input:process.stdin,terminal:false});console.log('Ready for private series evidence session input.');
for await(const line of input){try{
 const config=JSON.parse(line),auth=config.auth;if(auth.url!=='https://collector-radar.martainjonn.chatgpt.site')throw Error('Unexpected destination');
 const headers={'OAI-Sites-Authorization':'Bearer '+auth.dispatch,Authorization:'Bearer '+auth.token,'Content-Type':'application/json'};
 async function request(path,body){const url=new URL(path,auth.url);if(url.origin!==auth.url||url.pathname!=='/api/maintenance')throw Error('Unexpected destination');const res=await fetch(url,{method:body?'POST':'GET',headers,body:body?JSON.stringify({...body,compact:true}):undefined,redirect:'error',signal:AbortSignal.timeout(180000)});if(!res.ok)throw Error('HTTP '+res.status);const raw=await res.text();return JSON.parse(raw);}
 const owner=await request('/api/maintenance?maintenanceStatus=1'),expected=JSON.parse(fs.readFileSync('work/v6/owner-before.json'));assert.equal(owner.ownerDigest,expected.ownerDigest,'Unexpected catalogue owner');fs.writeFileSync(priv+'/owner-current.json',JSON.stringify(owner));
 if(config.mode==='probe'){console.log(JSON.stringify({authenticated:true,ownerItems:owner.ownerItems,ownerMatched:true}));input.close();break;}
 assert.equal(config.mode,'apply');const simulation=JSON.parse(fs.readFileSync(pub+'/simulation.json')),batches=JSON.parse(fs.readFileSync(priv+'/batches.json'));assert.ok(simulation.passed&&simulation.batches===batches.length&&simulation.changes===batches.flatMap(b=>b.changes).length);
 const finalReportPath = pub + '/production.json';
 if (fs.existsSync(finalReportPath) && JSON.parse(fs.readFileSync(finalReportPath)).maintenanceClosed) throw Error('Completed and closed round; do not replay');
 assert.equal(simulation.planSha256, safeHash(batches.flatMap(b => b.changes.map(c => ({id:c.item.id, summary:c.item.summary, evidence:c.item.evidence.slice(-2)})))), 'Frozen evidence plan differs from simulation');
 const prior=fs.existsSync(receiptPath)?fs.readFileSync(receiptPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[],oldSuccess=new Map(prior.filter(r=>r.status==='verified').map(r=>[r.batch,r]));
 const meta=await request('/api/maintenance?catalogMeta=1');if(!fs.existsSync(priv+'/metadata-before.json'))fs.writeFileSync(priv+'/metadata-before.json',JSON.stringify(meta));
 const read=ids=>request('/api/maintenance?editorialItems='+ids.map(encodeURIComponent).join(','));let verified=0;const skipped=[];
 for(const [index,batch]of batches.entries()){
  const key=String(index).padStart(4,'0'),digest=safeHash(batch),old=oldSuccess.get(index);if(old){assert.equal(old.digest,digest,'Plan changed after successful application');verified+=old.items;continue;}
  const ids=batch.changes.map(c=>c.item.id),current=await read(ids),byId=new Map(current.items.map(i=>[i.id,i]));
  const changes=[];
  for(const c of batch.changes){const now=byId.get(c.item.id);if(!now){skipped.push({id:c.item.id,reason:'missing-fresh-target'});continue;}if(stable(now)===stable(c.item)){changes.push(c);continue;}if(hash(now)!==c.expectedVersion){skipped.push({id:c.item.id,reason:'changed-since-reviewed-plan'});continue;}assert.ok(!now.editorial&&!now.locked&&!now.summary&&!now.archivedInto);for(const k of Object.keys(now))if(!['summary','evidence'].includes(k))assert.deepEqual(c.item[k],now[k]);changes.push(c);}
  const afterCount=changes.filter(c=>stable(byId.get(c.item.id))===stable(c.item)).length;
  if(afterCount&&afterCount!==changes.length)throw Error('Mixed before/after state; review atomic batch '+index);
  if(!changes.length){record({batch:index,digest,status:'skipped',items:0});continue;}
  const action={action:'catalogue-curation',changes,relations:[]};
  if(!afterCount){fs.writeFileSync(priv+'/before/'+key+'.json',JSON.stringify(current));fs.writeFileSync(priv+'/requests/'+key+'.json',JSON.stringify(action));record({batch:index,digest,status:'intent',ids:changes.map(c=>c.item.id)});try{const result=await request('/api/maintenance',action);if(!result.ok||result.busy)throw Error('Write rejected or busy');}catch(e){const fresh=await read(changes.map(c=>c.item.id)),m=new Map(fresh.items.map(i=>[i.id,i]));if(!changes.every(c=>stable(m.get(c.item.id))===stable(c.item)))throw e;}}
  const after=await read(changes.map(c=>c.item.id)),m=new Map(after.items.map(i=>[i.id,i]));for(const c of changes)assert.equal(stable(m.get(c.item.id)),stable(c.item),'Complete readback mismatch');
  assert.equal(safeHash([...after.relations].sort((a,b)=>a.id.localeCompare(b.id))),safeHash([...current.relations].sort((a,b)=>a.id.localeCompare(b.id))),'Relations changed during batch');
  fs.writeFileSync(priv+'/after/'+key+'.json',JSON.stringify(after));record({batch:index,digest,status:'verified',items:changes.length,ids:changes.map(c=>c.item.id),afterHash:safeHash(after.items)});verified+=changes.length;
  if(index%10===0||index===batches.length-1)console.log(JSON.stringify({verifiedBatches:index+1,totalBatches:batches.length,verifiedItems:verified,skipped:skipped.length}));
 }
 const receipts=fs.readFileSync(receiptPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),done=new Map(receipts.filter(r=>r.status==='verified').map(r=>[r.batch,r])),expectedItems=new Map();for(const [index,r]of done){for(const i of JSON.parse(fs.readFileSync(priv+'/after/'+String(index).padStart(4,'0')+'.json')).items)expectedItems.set(i.id,i);}
 const ids=[...expectedItems.keys()];for(let n=0;n<ids.length;n+=100){const data=await read(ids.slice(n,n+100));assert.equal(data.items.length,ids.slice(n,n+100).length);for(const i of data.items)assert.equal(stable(i),stable(expectedItems.get(i.id)),'Final readback changed');}
 const afterMeta=await request('/api/maintenance?catalogMeta=1'),beforeMeta=JSON.parse(fs.readFileSync(priv+'/metadata-before.json'));fs.writeFileSync(priv+'/metadata-after.json',JSON.stringify(afterMeta));assert.deepEqual(afterMeta.catalog.counts,beforeMeta.catalog.counts);assert.equal(safeHash(afterMeta.prefs),safeHash(beforeMeta.prefs));assert.equal(safeHash([...afterMeta.relations].sort((a,b)=>a.id.localeCompare(b.id))),safeHash([...beforeMeta.relations].sort((a,b)=>a.id.localeCompare(b.id))));
 const report={at:new Date().toISOString(),stage:'data-applied-window-needs-close',passed:true,verifiedBatches:done.size,productionApplied:expectedItems.size,skipped:skipped.length,skippedItems:skipped,counts:afterMeta.catalog.counts,relations:afterMeta.relations.length,personalAndOriginalFieldsPreserved:true,offersAndHistoryPreserved:true,prefsPreserved:true,priorEvidencePreserved:true,newFullProductVerified:0,completeSeries:0,finalReadbackPassed:true,maintenanceClosed:false};fs.writeFileSync(pub+'/production.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));input.close();break;
}catch(e){console.log(JSON.stringify({stopped:true,error:e.message}));input.close();process.exitCode=1;break;}}
