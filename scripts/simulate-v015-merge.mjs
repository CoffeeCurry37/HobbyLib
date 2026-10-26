// Validate exact production actions against a disposable SQLite copy.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const [database,prefix='../v14']=process.argv.slice(2),r=loadRadar(),d=r.get('sqlite').openDatabase(database),{withDatabase}=r.get('store'),{postAction}=r.get('service'),outcomes=[];
try{
 for(const stage of ['reviewed-merge']){
  const actions=JSON.parse(readFileSync(prefix+'-'+stage+'-actions.json'));
  for(let index=0;index<actions.length;index++){
   const at=Date.now(),response=await withDatabase(d,()=>postAction(new Request('https://radar.example/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...actions[index],compact:true})}),'owner','sites')),body=await response.json();
   assert.equal(response.status,200,JSON.stringify({stage,index,body}));assert.ok(body.ok&&!body.busy,JSON.stringify({stage,index,body}));
   const outcome={stage,index,ms:Date.now()-at,...Object.fromEntries(['created','updated','linked','merged','added','matched','already'].filter(k=>body[k]!==undefined).map(k=>[k,body[k]]))};outcomes.push(outcome);console.log(JSON.stringify(outcome));
  }
 }
 const items=d.raw.prepare('SELECT data FROM items').all().map(row=>JSON.parse(row.data)),relations=d.raw.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations').all(),prefs=JSON.parse(d.raw.prepare('SELECT data FROM preferences LIMIT 1').get().data);
 writeFileSync(prefix+'-simulation-after.json',JSON.stringify({items:items.filter(i=>!i.archivedInto),archived:items.filter(i=>i.archivedInto),relations,prefs}),{mode:0o600});
 writeFileSync(prefix+'-simulation-results.json',JSON.stringify(outcomes,null,2));
 console.log(JSON.stringify({pass:true,actions:outcomes.length,active:items.filter(i=>!i.archivedInto).length,archived:items.filter(i=>i.archivedInto).length,relations:relations.length,snapshot:prefs.fateSnapshot}));
}finally{d.close();r.close();}
