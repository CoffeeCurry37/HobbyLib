import {db} from './store';
export async function importLock(user:string,snapshot:string){
 const id='operation:import:'+snapshot,token=crypto.randomUUID(),at=new Date().toISOString(),expired=new Date(Date.now()-300000).toISOString();
 const data=JSON.stringify({token,at});const results=await db().batch([
 db().prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data WHERE json_extract(scans.data,'$.at')<?").bind(user,id,data,expired),
 db().prepare('SELECT data FROM scans WHERE user_id=? AND id=?').bind(user,id)]);
 if(JSON.parse(results[1].results[0].data).token!==token)return null;
 const database=db();
 return async()=>{for(let attempt=0;;attempt++){try{return await database.prepare("DELETE FROM scans WHERE user_id=? AND id=? AND json_extract(data,'$.token')=?").bind(user,id,token).run();}catch(error){if(attempt>=2)throw error;await new Promise(resolve=>setTimeout(resolve,100*(attempt+1)));}}};
}
