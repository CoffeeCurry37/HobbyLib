import {db,withDatabase,type Database,type Statement} from './store';
import {decisionHash} from './match-decision';
import {DEFAULT_PREFS,EMPTY_FACTS,type State} from './types';
import {jsonChunks} from './import-limits';
import {relationGuard} from './relation-guard';

// Source parsing is outside the transaction. Stage all mutations, then atomically
// compare the records/graph/preferences that were read and commit offers + events.
export async function atomicIngest<T>(user:string,state:State,action:(draft:State)=>Promise<T>):Promise<T>{
 const database=db(),before=new Map(state.items.map(i=>[i.id,i])),links=[...state.relations],prefs=decisionHash(state.prefs),writes:Statement[]=[];
 const remember=(results:{results:any[]}[])=>{for(const result of results)for(const row of result.results)if(typeof row.data==='string'){try{const i=JSON.parse(row.data);if(i.id&&i.offers&&!before.has(i.id))before.set(i.id,{...EMPTY_FACTS,description:'',evidence:[],offers:[],...i});}catch{}}return results;};
 const draft={...state,items:[...state.items],relations:[...state.relations],prefs:structuredClone(state.prefs),notices:[...state.notices],scans:[...state.scans]};
 class Staged implements Statement{
  constructor(readonly sql:string,readonly values:unknown[]=[]){ }
  bind(...values:unknown[]){return new Staged(this.sql,values);}
  real(){return database.prepare(this.sql).bind(...this.values);}
  async all(){const result=await this.real().all();remember([result]);return result;}
  async run(){writes.push(this.real());return {results:[]};}
 }
 const staged:Database={prepare:sql=>new Staged(sql),async batch(statements){
  if(statements.every(s=>/^\s*(SELECT|WITH)\b/i.test((s as Staged).sql)&&!/(?:INSERT|UPDATE|DELETE)\s/i.test((s as Staged).sql)))return remember(await database.batch(statements.map(s=>(s as Staged).real())));
  if(statements.some(s=>/^\s*SELECT\b/i.test((s as Staged).sql)))throw Error('Mixed read/write batch in staged ingest');
  writes.push(...statements.map(s=>(s as Staged).real()));return statements.map(()=>({results:[]}));
 }};
 const result=await withDatabase(staged,()=>action(draft));
 const changed=draft.items.filter(i=>before.get(i.id)!==i&&(!before.has(i.id)||decisionHash(before.get(i.id))!==decisionHash(i))),ids=changed.map(i=>i.id),rows:{id:string;data:string}[]=[];
 for(let start=0;start<ids.length;start+=100){const page=await database.prepare('SELECT id,data FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))').bind(user,JSON.stringify(ids.slice(start,start+100))).all();rows.push(...page.results);}
 const existing=new Map(rows.map(r=>[r.id,r]));
 for(const i of changed){const row=existing.get(i.id),expected=before.get(i.id);if(row?(!expected||decisionHash({...EMPTY_FACTS,description:'',evidence:[],offers:[],...JSON.parse(row.data)})!==decisionHash(expected)):!!expected)throw Error('摄取目标已有并发修改，请重新读取后重试');}
 const prefRow=await database.prepare('SELECT data FROM preferences WHERE user_id=?').bind(user).all();if(decisionHash({...DEFAULT_PREFS,...JSON.parse(prefRow.results[0]?.data||'{}')})!==prefs)throw Error('偏好已有并发修改，请重新读取后重试');
 const guard='operation:ingest:'+crypto.randomUUID(),guards:Statement[]=[];
 for(const [n,chunk] of jsonChunks(rows).entries()){const expected=JSON.parse(chunk).length;guards.push(database.prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,(SELECT 'verified' WHERE (SELECT COUNT(*) FROM json_each(?) e JOIN items i ON i.user_id=? AND i.id=json_extract(e.value,'$.id') AND i.data=json_extract(e.value,'$.data'))=?))").bind(user,guard+':'+n,chunk,user,expected));}
 const absent=ids.filter(id=>!existing.has(id));guards.push(database.prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,(SELECT 'verified' WHERE NOT EXISTS(SELECT 1 FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))) AND COALESCE((SELECT data FROM preferences WHERE user_id=?),'')=?))").bind(user,guard+':new',user,JSON.stringify(absent),user,prefRow.results[0]?.data||''));
 guards.push(relationGuard(user,guard+':relations',links));
 await database.batch([...guards,...writes,database.prepare('DELETE FROM scans WHERE user_id=? AND id LIKE ?').bind(user,guard+':%')]);
 Object.assign(state,draft);return result;
}
