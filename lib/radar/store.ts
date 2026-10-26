import {repairItem,snapshotEqual} from './maintenance';
import {leanItem} from './lean';
import {AsyncLocalStorage} from 'node:async_hooks';
import {State,Item,Prefs,DEFAULT_PREFS,EMPTY_FACTS,Notice,Scan,Relation} from './types';
import {jsonChunks,JSON_ARGUMENT_BYTES} from './import-limits';
export interface Statement {bind(...values:any[]):Statement;run():Promise<any>;all():Promise<{results:any[]}>;}
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<{results:any[]}[]>;}
const databaseContext=new AsyncLocalStorage<Database>();
export const withDatabase=<T>(database:Database,fn:()=>T):T=>databaseContext.run(database,fn);
export function db(){const database=databaseContext.getStore();if(!database)throw new Error('数据库尚未连接');return database;}
const preparedIndexes=new WeakMap<Database,Promise<unknown>>();
export async function stateFor(user:string,options:{lean?:boolean;archiveSummary?:boolean}={}):Promise<State>{
 const database=db();if(!preparedIndexes.has(database))preparedIndexes.set(database,database.prepare('CREATE INDEX IF NOT EXISTS radar_items_updated ON items(user_id,updated_at DESC,id DESC)').run());await preparedIndexes.get(database);
 const results=await database.batch([
  database.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=?').bind(user),
  database.prepare('SELECT data FROM preferences WHERE user_id=?').bind(user),
  database.prepare('SELECT data FROM notices WHERE user_id=? ORDER BY rowid DESC LIMIT 300').bind(user),
  database.prepare("SELECT data FROM scans WHERE user_id=? AND id NOT LIKE 'operation:%' ORDER BY rowid DESC LIMIT 100").bind(user)]);
 const parse=(n:number)=>results[n].results.map((r:any)=>JSON.parse(r.data)),prefs={...DEFAULT_PREFS,...parse(1)[0]},items:Item[]=[],archived:Item[]=[],demoIds=new Set<string>();
 const originalTargets=new Map<string,Item>(),nextTargets=new Map<string,Item>();
 {const targets=await database.prepare("SELECT data FROM items WHERE user_id=? AND id IN (SELECT json_extract(data,'$.archivedInto') FROM items WHERE user_id=? AND json_extract(data,'$.archivedInto') IS NOT NULL AND json_extract(data,'$.schemaVersion')<>9)").bind(user,user).all();for(const r of targets.results){const i={...EMPTY_FACTS,...JSON.parse(r.data)};originalTargets.set(i.id,i);nextTargets.set(i.id,repairItem(i));}}
 let cursor:{updated_at:string;id:string}|undefined;
 for(;;){
  const summary="json_object('id',id,'title',json_extract(data,'$.title'),'archivedInto',json_extract(data,'$.archivedInto'),'createdAt',json_extract(data,'$.createdAt'),'schemaVersion',9,'kind',json_extract(data,'$.kind'),'ownership',json_extract(data,'$.ownership'),'tags',json('[]'),'aliases',json('[]'),'image','','brand','','series','','year','','category','','isbn','','notes','','rating',NULL,'msrp',NULL,'quantity',0,'priority',0,'review',0,'bucket','normal','evidence',json('[]'),'offers',json('[]'))";
  const projection=options.lean||options.archiveSummary?`CASE WHEN json_extract(data,'$.archivedInto') IS NOT NULL AND json_extract(data,'$.schemaVersion')=9 THEN ${summary} ${options.lean?"WHEN json_extract(data,'$.schemaVersion')=9 THEN json_remove(data,'$.description','$.aliases','$.mergeSnapshot')":''} ELSE data END AS data`:'data';
  const sql=`WITH candidates AS (SELECT id,${projection},updated_at FROM items WHERE user_id=? ${cursor?'AND (updated_at<? OR (updated_at=? AND id<?))':''} ORDER BY updated_at DESC,id DESC LIMIT 1000), bounded AS (SELECT id,data,updated_at,SUM(length(CAST(data AS BLOB))) OVER (ORDER BY updated_at DESC,id DESC) AS bytes,ROW_NUMBER() OVER (ORDER BY updated_at DESC,id DESC) AS position FROM candidates) SELECT id,data,updated_at FROM bounded WHERE bytes<=${JSON_ARGUMENT_BYTES} OR position=1 ORDER BY updated_at DESC,id DESC`;
  const page=await (cursor?database.prepare(sql).bind(user,cursor.updated_at,cursor.updated_at,cursor.id):database.prepare(sql).bind(user)).all();if(!page.results.length)break;
  const patches:{id:string;before:string;next:string}[]=[];
  for(const row of page.results){const original:Item={...EMPTY_FACTS,description:'',evidence:[],offers:[],...JSON.parse(row.data)};if(original.demo){demoIds.add(original.id);continue;}let next=nextTargets.get(original.id)||repairItem(original);
   if(next.archivedInto&&next.mergeSnapshot&&original.schemaVersion!==9){try{const snapshot=JSON.parse(next.mergeSnapshot),target=originalTargets.get(next.archivedInto);if(target&&snapshotEqual(target,snapshot.after))next={...next,mergeSnapshot:JSON.stringify({...snapshot,target:repairItem(snapshot.target),after:JSON.stringify(nextTargets.get(next.archivedInto))})};}catch{}}
   if(next!==original&&original.schemaVersion!==9)patches.push({id:next.id,before:row.data,next:JSON.stringify(next)});
   (next.archivedInto?archived:items).push(options.lean?(next.archivedInto?{...leanItem(next),offers:[],evidence:[],image:''}:leanItem(next)):next);
  }
  if(patches.length){const ordinary:typeof patches=[],large:Statement[]=[],encoder=new TextEncoder();for(const p of patches){if(encoder.encode(JSON.stringify(p)).byteLength>JSON_ARGUMENT_BYTES)large.push(database.prepare('UPDATE items SET data=? WHERE user_id=? AND id=? AND data=?').bind(p.next,user,p.id,p.before));else ordinary.push(p);}await database.batch([...jsonChunks(ordinary).map(chunk=>database.prepare("WITH patch AS MATERIALIZED (SELECT json_extract(value,'$.id') AS id,json_extract(value,'$.before') AS before,json_extract(value,'$.next') AS next FROM json_each(?)) UPDATE items SET data=patch.next FROM patch WHERE items.user_id=? AND items.id=patch.id AND items.data=patch.before").bind(chunk,user)),...large]);}
  const last=page.results.at(-1);cursor={updated_at:last.updated_at,id:last.id};
 }
 if(demoIds.size)await database.batch([
  database.prepare("DELETE FROM relations WHERE user_id=? AND (from_id IN (SELECT id FROM items WHERE user_id=? AND json_extract(data,'$.demo')=1) OR to_id IN (SELECT id FROM items WHERE user_id=? AND json_extract(data,'$.demo')=1))").bind(user,user,user),
  database.prepare("DELETE FROM notices WHERE user_id=? AND json_extract(data,'$.itemId') IN (SELECT id FROM items WHERE user_id=? AND json_extract(data,'$.demo')=1)").bind(user,user),database.prepare("DELETE FROM items WHERE user_id=? AND json_extract(data,'$.demo')=1").bind(user)]);
 return {items,archived,relations:results[0].results.filter((r:Relation)=>!demoIds.has(r.fromId)&&!demoIds.has(r.toId)),prefs,notices:parse(2).filter(n=>!demoIds.has(n.itemId)),scans:parse(3)};
}
export async function saveItems(user:string,items:Item[]){if(!items.length)return;const at=new Date().toISOString();await db().batch(jsonChunks(items).map(chunk=>db().prepare("INSERT INTO items(user_id,id,data,updated_at) SELECT ?,json_extract(value,'$.id'),value,? FROM json_each(?) WHERE true ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(user,at,chunk)));}
export async function savePrefs(user:string,prefs:Prefs){await db().prepare('INSERT INTO preferences(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').bind(user,JSON.stringify(prefs)).run();}
export async function saveNotice(user:string,n:Notice){await db().prepare('INSERT INTO notices(user_id,id,data) VALUES(?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data').bind(user,n.id,JSON.stringify(n)).run();}
export async function saveScan(user:string,s:Scan){await db().prepare('INSERT INTO scans(user_id,id,data) VALUES(?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data').bind(user,s.id,JSON.stringify(s)).run();}
