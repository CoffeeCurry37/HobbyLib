import {relationsVersion} from './revision-plan';
import {VersionConflictError} from './version-conflict';
import {relationGuard} from './relation-guard';
import {editorialBasis} from './editorial';
import {db} from './store';
import {Item,Relation} from './types';
import {recordVersion} from './item-record';
import {manualField} from './catalog';
import {relationCycle,relationKey} from './engine';
import {jsonChunks} from './import-limits';
const personal=['ownership','quantity','notes','rating','priority','watchlisted','manualOrder','catalogNodeId','createdAt'] as const;
export async function curate(user:string,changes:{item:Item;expectedVersion?:string}[],relations:Relation[],revision?:{remove:Relation[];expectedVersion:string}){
 if(new Set(changes.map(c=>c.item.id)).size!==changes.length)throw Error('整理请求包含重复商品');
 const ids=[...new Set([...changes.map(c=>c.item.id),...[...relations,...revision?.remove||[]].flatMap(r=>[r.fromId,r.toId])])];
 const result=await db().batch([db().prepare('SELECT id,data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))').bind(user,JSON.stringify(ids)),db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=?').bind(user),db().prepare('SELECT data FROM preferences WHERE user_id=?').bind(user)]);
 const originalRelations=result[1].results as Relation[];
 if(revision){
  if(relationsVersion(originalRelations)!==revision.expectedVersion)throw new VersionConflictError();
  const guarded=new Set(changes.filter(c=>c.expectedVersion).map(c=>c.item.id));if([...relations,...revision.remove].some(r=>!guarded.has(r.fromId)||!guarded.has(r.toId)))throw Error('关系修订需要所有端点的商品版本');
  if(new Set(revision.remove.map(r=>r.id)).size!==revision.remove.length||revision.remove.some(r=>!originalRelations.some(x=>relationsVersion([x])===relationsVersion([r]))))throw new VersionConflictError();
 }
 const preferencesData=result[2].results[0]?.data as string|undefined;
 const rows=result[0].results,byId=new Map<string,Item>(rows.map(r=>[r.id,JSON.parse(r.data)])),links=originalRelations.filter(r=>!revision?.remove.some(x=>x.id===r.id)),dismissed=JSON.parse(preferencesData||'{}').dismissedRelations||[];
 let created=0,updated=0;
 for(const change of changes){const previous=byId.get(change.item.id),next=change.item;
  if(next.editorial){const e=next.editorial;if(e.basis!==editorialBasis(next)||e.imageUrl!==next.image)throw Error('复核依据与商品资料不一致');if(e.status==='verified'&&(!Object.values(e.checks).every(Boolean)||!e.sources.length||e.unresolved.length||!next.summary||!next.productType||!next.image||!next.tags.length))throw Error('资料不完整，不能标记已核实');}
  if(previous){if(!change.expectedVersion||recordVersion(previous)!==change.expectedVersion)throw new VersionConflictError();if(previous.archivedInto)throw Error('不能覆盖归并存档');for(const k of personal)if(JSON.stringify(previous[k])!==JSON.stringify(next[k]))throw Error('自动整理不能修改个人字段：'+k);for(const k of Object.keys(previous) as (keyof Item)[])if(manualField(previous,k)&&JSON.stringify(previous[k])!==JSON.stringify(next[k]))throw Error('自动整理不能覆盖人工字段：'+k);updated++;}
  else {if(change.expectedVersion)throw new VersionConflictError();if(next.archivedInto||next.mergeSnapshot||next.ownership!=='unknown'||next.quantity||next.notes||next.rating||next.watchlisted)throw Error('新资料不能伪造个人收藏状态');created++;}
  if((next.images||[]).length>10)next.images=next.images!.slice(0,10);byId.set(next.id,next);
 }
 const added:Relation[]=[];
 for(const r of relations){
  if(![r.fromId,r.toId].every(id=>byId.has(id)&&!byId.get(id)!.archivedInto)||r.fromId===r.toId)throw Error('关联商品无效');
  // A revision must commit its exact proposed graph. Skipping an addition after
  // removing its old edge would silently discard a relationship or quantity.
  if(dismissed.includes(relationKey(r))){if(revision)throw new VersionConflictError('RELATION_DISMISSED','目标关联已被用户取消，请重新读取并复核修订计划');continue;}
  if(links.some(x=>x.id===r.id||x.fromId===r.fromId&&x.toId===r.toId&&x.kind===r.kind)){
   if(revision)throw new VersionConflictError('RELATION_ALREADY_EXISTS','目标关联或关联编号已存在，请明确移除原边后重新制定修订计划');
   continue;
  }
  if(r.kind!=='related'&&relationCycle(r.fromId,r.toId,links.filter(x=>x.kind!=='related').map(x=>({...x,kind:'contains'}))))throw Error('关联不能形成循环');
  links.push(r);added.push(r);
 }
 const guard='operation:curate:'+crypto.randomUUID(),at=new Date().toISOString(),existing=new Set(rows.map(r=>r.id)),updates=changes.filter(c=>existing.has(c.item.id)).map(c=>c.item),inserts=changes.filter(c=>!existing.has(c.item.id)).map(c=>c.item);
 await db().batch([
 relationGuard(user,guard+'-relations',originalRelations),
 db().prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,(SELECT 'verified' WHERE (SELECT COUNT(*) FROM json_each(?) AS expected CROSS JOIN items ON items.id=json_extract(expected.value,'$.id') WHERE items.user_id=? AND items.data=json_extract(expected.value,'$.data'))=? AND COALESCE((SELECT data FROM preferences WHERE user_id=?),'')=?))").bind(user,guard,JSON.stringify(rows),user,rows.length,user,preferencesData||''),
 ...jsonChunks(updates).map(chunk=>db().prepare("WITH edits AS (SELECT json_extract(value,'$.id') AS id,value AS data FROM json_each(?)) UPDATE items SET data=(SELECT data FROM edits WHERE edits.id=items.id),updated_at=? WHERE user_id=? AND id IN (SELECT id FROM edits)").bind(chunk,at,user)),
 ...jsonChunks(inserts).map(chunk=>db().prepare("INSERT INTO items(user_id,id,data,updated_at) SELECT ?,json_extract(value,'$.id'),value,? FROM json_each(?)").bind(user,at,chunk)),
 ...(revision?.remove.length?[db().prepare('DELETE FROM relations WHERE user_id=? AND id IN (SELECT value FROM json_each(?))').bind(user,JSON.stringify(revision.remove.map(r=>r.id)))]:[]),
 ...jsonChunks(added).map(chunk=>db().prepare("INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.fromId'),json_extract(value,'$.toId'),json_extract(value,'$.kind'),json_extract(value,'$.quantity') FROM json_each(?)").bind(user,chunk)),db().prepare('DELETE FROM scans WHERE user_id=? AND id IN (?,?)').bind(user,guard,guard+'-relations')]);
 return {created,updated,linked:added.length,unlinked:revision?.remove.length||0};
}
