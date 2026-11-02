// Credentials arrive only through hidden stdin. Every batch is read, guarded,
// written atomically, read back, and durably checkpointed before continuing.
import fs from 'node:fs';import crypto from 'node:crypto';import {createInterface} from 'node:readline';
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const input=createInterface({input:process.stdin,terminal:false});console.log('Ready for private migration session input.');
for await(const line of input){try{
 const auth=JSON.parse(line),base=new URL(auth.url);if(base.origin!=='https://collector-radar.martainjonn.chatgpt.site')throw Error('Unexpected site');
 const headers={'OAI-Sites-Authorization':'Bearer '+auth.dispatch,Authorization:'Bearer '+auth.token,'Content-Type':'application/json'};
 const batches=JSON.parse(fs.readFileSync('work/v6/batches.json')),simulation=JSON.parse(fs.readFileSync('research/production-v6-20261102/simulation.json'));
 if(!simulation.passed||simulation.batches!==batches.length)throw Error('Missing successful full simulation');
 const receiptFile='work/v6/apply-receipts.jsonl';fs.mkdirSync('work/v6/readback',{recursive:true});
 const prior=fs.existsSync(receiptFile)?fs.readFileSync(receiptFile,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
 const record=data=>{const fd=fs.openSync(receiptFile,'a');try{fs.writeSync(fd,JSON.stringify({...data,at:new Date().toISOString()})+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
 async function request(path,body){const res=await fetch(new URL(path,base),{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(180000)});const txt=await res.text();let data;try{data=JSON.parse(txt);}catch{throw Error('Non-JSON HTTP '+res.status);}if(!res.ok)throw Error('HTTP '+res.status+': '+JSON.stringify(data));return data;}
 const read=b=>request('/api/maintenance?editorialItems='+b.changes.map(c=>encodeURIComponent(c.item.id)).join(','));
 function state(b,data){const items=new Map(data.items.map(i=>[i.id,i]));let after=0,before=0;for(const c of b.changes){const now=items.get(c.item.id);if(now&&stable(now)===stable(c.item))after++;else if(c.expectedVersion?now&&hash(now)===c.expectedVersion:!now)before++;else throw Error('Concurrent or unexpected item: '+c.item.id);}return after===b.changes.length?'after':before===b.changes.length?'before':'mixed';}
 for(const [index,b]of batches.entries()){
  const digest=hash(b),old=prior.find(r=>r.batch===index&&r.status==='verified');if(old&&old.digest!==digest)throw Error('Plan changed after checkpoint '+index);
  let current=await read(b),phase=state(b,current);
  if(old&&phase!=='after')throw Error('Previously verified batch changed '+index);
  if(phase==='mixed')throw Error('Non-atomic or partially changed batch '+index);
  if(phase==='before'){
   record({batch:index,digest,status:'intent',ids:b.changes.map(c=>c.item.id)});
   let response;
   try{response=await request('/api/maintenance',b);}catch(e){current=await read(b);if(state(b,current)!=='after')throw e;response={reconciled:true};}
   if(response.busy){console.log(JSON.stringify({busy:index}));throw Error('Catalogue busy; safe to resume from checkpoint');}
   current=await read(b);if(state(b,current)!=='after')throw Error('Readback mismatch '+index);
  }
  if(!old){fs.writeFileSync('work/v6/readback/'+String(index).padStart(4,'0')+'.json',JSON.stringify(current.items));record({batch:index,digest,status:'verified',items:b.changes.length,afterHash:hash(current.items)});}
  if(index%10===0||index===batches.length-1)console.log(JSON.stringify({verified:index+1,total:batches.length}));
 }
 console.log(JSON.stringify({completed:true,batches:batches.length}));input.close();break;
}catch(e){console.log(JSON.stringify({stopped:true,error:e.message}));input.close();process.exitCode=1;break;}}
