import {researchSignal} from './catalogue-v6';
import {db,saveItems,savePrefs} from './store';
import {DEFAULT_PREFS,Item,Relation,State} from './types';
import {createHash} from 'node:crypto';
import {relationCycle,relationKey} from './engine';
export const recordVersion=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function selectedState(user:string,ids:string[]):Promise<State>{
 const rows=await db().batch([db().prepare('SELECT data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))').bind(user,JSON.stringify(ids)),db().prepare('SELECT data FROM preferences WHERE user_id=?').bind(user),db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=?').bind(user)]);
 return {items:rows[0].results.map(r=>JSON.parse(r.data)),prefs:{...DEFAULT_PREFS,...JSON.parse(rows[1].results[0]?.data||'{}')},relations:rows[2].results as Relation[],notices:[],scans:[]};
}
export async function itemRecord(user:string,id:string){
 const rows=await db().batch([db().prepare('SELECT data FROM items WHERE user_id=? AND id=?').bind(user,id),db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? AND (from_id=? OR to_id=?)').bind(user,id,id)]);
 if(!rows[0].results.length)throw new Error('找不到商品');
 const item=JSON.parse(rows[0].results[0].data) as Item,relations=rows[1].results as Relation[],ids=[...new Set(relations.flatMap(r=>[r.fromId,r.toId]).filter(key=>key!==id))];
 const related:Item[]=[];for(let start=0;start<ids.length;start+=40){const batch=await db().prepare("SELECT json_remove(data,'$.description','$.mergeSnapshot','$.aliases','$.images','$.evidence') AS data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))").bind(user,JSON.stringify(ids.slice(start,start+40))).all();related.push(...batch.results.map(r=>({description:'',evidence:[],...JSON.parse(r.data)})));}
 return {item,version:recordVersion(item),relations,related,seriesResearch:researchSignal(item)};
}
export async function searchRecords(user:string,query:string){
 const escaped=query.trim().replace(/[\\%_]/g,c=>'\\'+c);if(!escaped)return {items:[]};
 const rows=await db().prepare("SELECT json_object('id',id,'title',json_extract(data,'$.title'),'image',json_extract(data,'$.image')) AS data FROM items WHERE user_id=? AND json_extract(data,'$.archivedInto') IS NULL AND json_extract(data,'$.title') LIKE ? ESCAPE '\\' ORDER BY id LIMIT 30").bind(user,'%'+escaped+'%').all();return {items:rows.results.map(r=>JSON.parse(r.data))};
}
export async function changeRelation(user:string,body:any){
 const state=await selectedState(user,body.action==='relation'?[body.relation.fromId,body.relation.toId]:[]);
 if(body.action==='unlink'){const existing=state.relations.find(r=>r.id===body.id);if(existing){await db().prepare('DELETE FROM relations WHERE user_id=? AND id=?').bind(user,existing.id).run();state.prefs.dismissedRelations=[...new Set([...state.prefs.dismissedRelations,relationKey(existing)])];await savePrefs(user,state.prefs);state.relations=state.relations.filter(r=>r.id!==existing.id);}}
 else {const rel=body.relation as Relation;if(rel.fromId===rel.toId||![rel.fromId,rel.toId].every(id=>state.items.some(i=>i.id===id&&!i.archivedInto)))throw Error('请选择两个不同的现有商品');if(rel.kind!=='related'&&relationCycle(rel.fromId,rel.toId,state.relations.filter(r=>r.kind!=='related').map(r=>({...r,kind:'contains'}))))throw Error('商品不能形成循环包含关系');const existing=state.relations.find(r=>r.fromId===rel.fromId&&r.toId===rel.toId&&r.kind===rel.kind),next={...rel,id:existing?.id||crypto.randomUUID()};await db().prepare('INSERT INTO relations(user_id,id,from_id,to_id,kind,quantity) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET quantity=excluded.quantity').bind(user,next.id,next.fromId,next.toId,next.kind,next.quantity).run();state.relations=[...state.relations.filter(r=>r.id!==next.id),next];}
 return {ok:true,relations:state.relations,message:'关联已保存'};
}
