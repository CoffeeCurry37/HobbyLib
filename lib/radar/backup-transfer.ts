import {jsonChunks} from './import-limits';
// The browser retains the selected file; each server request receives at most
// 200 records. Staged records become visible only after the final atomic copy.
export async function transferBackup(backup:any,post:(body:unknown)=>Promise<any>,progress:(message:string)=>void=()=>{}){
 const kinds=['items','archived','relations','notices','scans'] as const,counts:Record<string,number>={};
 for(const kind of kinds){if(backup[kind]===undefined&&['archived','notices','scans'].includes(kind))backup[kind]=[];if(!Array.isArray(backup[kind]))throw new Error('备份格式不正确');counts[kind]=backup[kind].length;}
 const start=await post({action:'backup-start',metadata:{version:backup.version,prefs:backup.prefs,counts}});let completed=0,total=Object.values(counts).reduce((a,b)=>a+b,0);
 try{
  for(const kind of kinds){let offset=0;for(const chunk of jsonChunks(backup[kind],3_500_000,200)){const rows=JSON.parse(chunk);progress(`正在恢复 ${completed} / ${total} 条记录…`);await post({action:'backup-chunk',restoreId:start.restoreId,kind,offset,rows});offset+=rows.length;completed+=rows.length;}}
  progress('正在检查关联与完成恢复…');return await post({action:'backup-finish',restoreId:start.restoreId});
 }catch(error){try{await post({action:'backup-cancel',restoreId:start.restoreId});}catch{/* An interrupted cleanup is retried by the next import after expiry. */}throw error;}
}
