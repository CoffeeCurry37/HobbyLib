import {relationGuard} from './relation-guard';
import {recordVersion} from './item-record';
import {VersionConflictError} from './version-conflict';
import {db} from './store';
import {mergeProducts} from './maintenance';
import {jsonChunks} from './import-limits';
import {DEFAULT_PREFS,EMPTY_FACTS,Item,Relation,State} from './types';
// Bounded read and atomic write: never load the whole catalogue for a reviewed plan.
export async function applyMergePlan(user:string,pairs:{fromId:string;toId:string;fromVersion?:string;toVersion?:string}[]){
 const ids=[...new Set(pairs.flatMap(p=>[p.fromId,p.toId]))];
 const result=await db().batch([
  db().prepare('SELECT id,data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))').bind(user,JSON.stringify(ids)),
  db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? ORDER BY id').bind(user)
 ]);
 const originalRelations=result[1].results as Relation[];
 const rows=result[0].results,byId=new Map<string,Item>(rows.map(r=>[r.id,{...EMPTY_FACTS,...JSON.parse(r.data)}]));
 const state:State={items:[...byId.values()].filter(i=>!i.archivedInto),relations:result[1].results as Relation[],prefs:DEFAULT_PREFS,notices:[],scans:[]},changed=new Map<string,Item>();let merged=0,already=0;
 for(const pair of pairs){
  const from=byId.get(pair.fromId),to=byId.get(pair.toId);
  if(!from||!to)throw new Error('商品已变化，请重新检查重复记录');
  if(from.archivedInto===to.id){already++;continue;}
  if(pair.fromVersion&&recordVersion(JSON.parse(rows.find(r=>r.id===from.id)!.data))!==pair.fromVersion||pair.toVersion&&recordVersion(JSON.parse(rows.find(r=>r.id===to.id)!.data))!==pair.toVersion)throw new VersionConflictError();
  if(from.archivedInto||to.archivedInto)throw new Error('归并目标已变化，请重新检查');
  const next=mergeProducts(state,from.id,to.id);changed.set(from.id,next.archived);changed.set(to.id,next.merged);byId.set(from.id,next.archived);byId.set(to.id,next.merged);
  state.items=state.items.filter(i=>i.id!==from.id).map(i=>i.id===to.id?next.merged:i);state.relations=next.relations;merged++;
 }
 if(!merged)return {merged,already};
 const guard='operation:merge:'+crypto.randomUUID(),at=new Date().toISOString();
 await db().batch([
 relationGuard(user,guard+'-relations',originalRelations),
  db().prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,(SELECT 'verified' WHERE (SELECT COUNT(*) FROM json_each(?) AS expected CROSS JOIN items ON items.id=json_extract(expected.value,'$.id') WHERE items.user_id=? AND items.data=json_extract(expected.value,'$.data'))=?))").bind(user,guard,JSON.stringify(rows),user,rows.length),
  ...jsonChunks([...changed.values()]).map(chunk=>db().prepare("INSERT INTO items(user_id,id,data,updated_at) SELECT ?,json_extract(value,'$.id'),value,? FROM json_each(?) WHERE true ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(user,at,chunk)),
  db().prepare('DELETE FROM relations WHERE user_id=?').bind(user),
  ...jsonChunks(state.relations).map(chunk=>db().prepare("INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)").bind(user,chunk)),
  db().prepare('DELETE FROM scans WHERE user_id=? AND id IN (?,?)').bind(user,guard,guard+'-relations')
 ]);
 return {merged,already};
}
