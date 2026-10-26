// Private local data only; source repository contains no user database.
import {readFileSync,writeFileSync,openSync,writeSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';import {loadRadar} from './load-radar.mjs';
const [filename,rowsFile,output]=process.argv.slice(2);if(!output)throw new Error('Usage: apply-catalogue-enrichment.mjs data.sqlite verified-rows.json backup.json [--sync-kuji]');
const radar=loadRadar(),database=radar.get('sqlite').openDatabase(resolve(filename)),{withDatabase,stateFor}=radar.get('store'),{postAction,getStateResponse}=radar.get('service');
try{await withDatabase(database,async()=>{
 const before=(await stateFor('owner',{lean:true})).items.filter(i=>i.ownership==='owned').map(i=>({id:i.id,quantity:i.quantity,notes:i.notes}));
 if(process.argv[5]==='--sync-kuji'){const r=await postAction(new Request('http://localhost/api/radar',{method:'POST',body:JSON.stringify({action:'repair-kuji-catalogue',compact:true})}),'owner','standalone');if(!r.ok)throw new Error(await r.text());}
 const rows=JSON.parse(readFileSync(rowsFile,'utf8'));let updated=0,skipped=0;
 for(let n=0;n<rows.length;n+=100){const r=await postAction(new Request('http://localhost/api/radar',{method:'POST',body:JSON.stringify({action:'catalogue-enrichment',rows:rows.slice(n,n+100),compact:true})}),'owner','standalone'),d=await r.json();if(!r.ok)throw new Error(d.error);updated+=d.updated;skipped+=d.skipped;}
 const state=await stateFor('owner',{lean:true});for(const old of before){const next=state.items.find(i=>i.id===old.id);if(!next||next.ownership!=='owned'||next.quantity!==old.quantity||next.notes!==old.notes)throw new Error('Owned data changed');}
 const response=await getStateResponse(new Request('http://localhost/api/radar?export'),'owner','standalone'),fd=openSync(resolve(output),'w',0o600);try{for await(const c of response.body)writeSync(fd,c);}finally{closeSync(fd);}
 const result={updated,skipped,active:state.items.length,archives:state.archived.length,ownedPreserved:before.length,withImages:state.items.filter(i=>i.image).length,missingImages:state.items.filter(i=>!i.image).length};writeFileSync(resolve(output)+'.enrichment-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 });database.raw.exec('PRAGMA wal_checkpoint(TRUNCATE)');}finally{database.close();radar.close();}
