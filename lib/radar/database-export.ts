import {db} from './store';
import {DEFAULT_PREFS} from './types';
import {JSON_ARGUMENT_BYTES} from './import-limits';
// Stream stored JSON in bounded pages; never materialize all merge archives in Worker memory.
export function exportDatabase(user:string){const database=db(),encoder=new TextEncoder();
 async function* rows(table:'items'|'relations'|'notices'|'scans',where=''){
  let cursor='',first=true;
  for(;;){const select=table==='relations'?"json_object('id',id,'fromId',from_id,'toId',to_id,'kind',kind,'quantity',quantity)":'data';
   const sql=`WITH candidates AS (SELECT id,${select} AS value FROM ${table} WHERE user_id=? ${where} AND id>? ORDER BY id LIMIT 500), bounded AS (SELECT id,value,SUM(length(CAST(value AS BLOB))) OVER (ORDER BY id) AS bytes,ROW_NUMBER() OVER (ORDER BY id) AS position FROM candidates) SELECT id,value FROM bounded WHERE bytes<=${JSON_ARGUMENT_BYTES} OR position=1 ORDER BY id`;
   const page=await database.prepare(sql).bind(user,cursor).all();if(!page.results.length)break;
   for(const row of page.results){yield (first?'':',')+row.value;first=false;cursor=row.id;}
  }
 }
 async function* document(){const p=await database.prepare('SELECT data FROM preferences WHERE user_id=?').bind(user).all(),prefs={...DEFAULT_PREFS,...JSON.parse(p.results[0]?.data||'{}')};
  yield '{"version":9,"exportedAt":'+JSON.stringify(new Date().toISOString())+',"prefs":'+JSON.stringify(prefs)+',"items":[';
  yield* rows('items',"AND json_extract(data,'$.archivedInto') IS NULL AND COALESCE(json_extract(data,'$.demo'),0)=0");
  yield '],"archived":[';yield* rows('items',"AND json_extract(data,'$.archivedInto') IS NOT NULL AND COALESCE(json_extract(data,'$.demo'),0)=0");
  yield '],"relations":[';yield* rows('relations');yield '],"notices":[';yield* rows('notices',"AND rowid IN (SELECT rowid FROM notices n WHERE n.user_id=notices.user_id ORDER BY rowid DESC LIMIT 300)");yield '],"scans":[';yield* rows('scans',"AND id NOT LIKE 'operation:%' AND rowid IN (SELECT rowid FROM scans s WHERE s.user_id=scans.user_id AND s.id NOT LIKE 'operation:%' ORDER BY rowid DESC LIMIT 100)");yield ']}';
 }
 const iterator=document();return new Response(new ReadableStream({async pull(controller){try{const next=await iterator.next();if(next.done)controller.close();else controller.enqueue(encoder.encode(next.value));}catch(e){controller.error(e);}},async cancel(){await iterator.return(undefined);}}),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="collector-radar-backup.json"','Cache-Control':'no-store'}});
}
