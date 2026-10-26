import {db,Database} from './store';
import {DEFAULT_PREFS,EMPTY_FACTS,Item} from './types';
import {leanItem} from './lean';

// The list is independent of full descriptions, merge snapshots and offer histories.
const offersSQL=`(SELECT COALESCE(json_group_array(json_object('id',json_extract(value,'$.id'),'source',json_extract(value,'$.source'),'url',json_extract(value,'$.url'),'price',json_extract(value,'$.price'),'currency','JPY','priceBasis',json_extract(value,'$.priceBasis'),'availability',json_extract(value,'$.availability'),'bonus',json_extract(value,'$.bonus'),'priceKind',json_extract(value,'$.priceKind'),'verifiedAt',json_extract(value,'$.verifiedAt'),'observedAt',json_extract(value,'$.observedAt'),'condition',json_extract(value,'$.condition'),'history',json('[]'))),json('[]')) FROM json_each(items.data,'$.offers'))`;
const evidenceSQL=`(SELECT COALESCE(json_group_array(json(value)),json('[]')) FROM json_each(items.data,'$.evidence') WHERE json_extract(value,'$.field') IN ('category','来源分类','人工整理','批量整理'))`;
const projected=`json_set(json_remove(data,'$.description','$.aliases','$.images','$.mergeSnapshot'),'$.offers',json(${offersSQL}),'$.evidence',json(${evidenceSQL}))`;
const scopeSQL="CASE WHEN json_extract(data,'$.archivedInto') IS NOT NULL THEN 'archive' WHEN json_extract(data,'$.origin')='doujin' THEN 'doujin' ELSE 'main' END";
const visibleSQL="COALESCE(json_extract(data,'$.demo'),0)";
const indexes=new WeakMap<Database,Promise<unknown>>();
async function prepareIndex(){const database=db();if(!indexes.has(database))indexes.set(database,database.prepare(`CREATE INDEX IF NOT EXISTS radar_items_scope ON items(user_id,${visibleSQL},${scopeSQL},id)`).run());await indexes.get(database);}
export async function catalogueMeta(user:string){
 await prepareIndex();
 const result=await db().batch([
  db().prepare('SELECT data FROM preferences WHERE user_id=?').bind(user),
  db().prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=?').bind(user),
  db().prepare('SELECT data FROM notices WHERE user_id=? ORDER BY rowid DESC LIMIT 100').bind(user),
  db().prepare("SELECT data FROM scans WHERE user_id=? AND id NOT LIKE 'operation:%' ORDER BY rowid DESC LIMIT 50").bind(user),
  db().prepare(`SELECT ${scopeSQL} AS scope,COUNT(*) AS n FROM items WHERE user_id=? AND ${visibleSQL}=0 GROUP BY scope`).bind(user)
 ]);
 const counts={main:0,doujin:0,archive:0};for(const row of result[4].results)counts[row.scope as keyof typeof counts]=row.n;
 return {items:[],archived:[],prefs:{...DEFAULT_PREFS,...JSON.parse(result[0].results[0]?.data||'{}')},relations:result[1].results,notices:result[2].results.map(r=>JSON.parse(r.data)),scans:result[3].results.map(r=>JSON.parse(r.data)),catalog:{counts,loaded:[]}};
}
export async function cataloguePage(user:string,scope:string,after:string){
 if(!['main','doujin','archive'].includes(scope))throw new Error('无效目录范围');
 await prepareIndex();
 const projection=scope==='archive'?"json_object('id',id,'title',json_extract(data,'$.title'),'archivedInto',json_extract(data,'$.archivedInto'))":projected;
 const rows=await db().prepare(`WITH page AS (SELECT id,${projection} AS data FROM items WHERE user_id=? AND ${visibleSQL}=0 AND ${scopeSQL}=? AND id>? ORDER BY id LIMIT 600), bounded AS (SELECT id,data,SUM(length(CAST(data AS BLOB))) OVER (ORDER BY id) AS bytes,ROW_NUMBER() OVER (ORDER BY id) AS position FROM page) SELECT id,data FROM bounded WHERE bytes<=1500000 OR position=1 ORDER BY id`).bind(user,scope,after).all();
 const items=rows.results.map(r=>{const data=JSON.parse(r.data);return scope==='archive'?data:leanItem({...EMPTY_FACTS,description:'',evidence:[],offers:[],...data} as Item);});
 return {items,next:rows.results.length?rows.results.at(-1).id:null};
}
