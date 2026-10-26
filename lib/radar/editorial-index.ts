import {db} from './store';
import manifest from './editorial-manifest.json';
import {EDITORIAL_FIELDS} from './editorial';
// Research projection only: omit notes, ownership, price history and merge snapshots.
export const INDEX_FIELDS=[...new Set(['id',...EDITORIAL_FIELDS,'image','images','imageRole','isbn','jan','publisher','manufacturer','brand','releaseDate','year','member','catalogueGroup','catalogueGroupType','catalogueKey','kuji','archivedInto','editorial','aliases','locked','inferredMember'])];
export function editorialIndex(user:string){
 const database=db(),encoder=new TextEncoder(),offerFields=['source','url','variant','productKey','listingTitle','jan','isbn','releaseDate'];
 const offers="COALESCE((SELECT json_group_array(json_object("+offerFields.map(k=>`'${k}',json_extract(value,'$.${k}')`).join(',')+")) FROM json_each(items.data,'$.offers')),'[]')";
 const relevant="(json_extract(value,'$.field') IN ('category','来源分类','来源关键词') OR json_extract(value,'$.field') LIKE '%人工整理%' OR json_extract(value,'$.field') LIKE '%批量整理%')";
 const evidence="COALESCE((SELECT json_group_array(json_object('field',json_extract(value,'$.field'),'url',json_extract(value,'$.url'),'value',CASE WHEN "+relevant+" THEN json_extract(value,'$.value') ELSE '' END,'method',CASE WHEN "+relevant+" THEN json_extract(value,'$.method') ELSE '' END,'at',CASE WHEN "+relevant+" THEN json_extract(value,'$.at') ELSE '' END)) FROM json_each(items.data,'$.evidence')),'[]')";
 const booleans=new Set(['catalogueGroup','locked','inferredMember']);
 const projection='json_object('+INDEX_FIELDS.map(k=>`'${k}',`+(booleans.has(k)?`json(CASE json_type(data,'$.${k}') WHEN 'true' THEN 'true' WHEN 'false' THEN 'false' ELSE 'null' END)`:`json_extract(data,'$.${k}')`)).join(',')+",'offers',json("+offers+"),'evidence',json("+evidence+'))';
 async function* document(){
  yield JSON.stringify({format:'editorial-index-v1',campaign:manifest.id,exportedAt:new Date().toISOString()}).slice(0,-1)+',"items":[';
  let after='',first=true;
  for(;;){const page=await database.prepare(`SELECT id,${projection} AS data FROM items WHERE user_id=? AND id>? AND (id IN (SELECT value FROM json_each(?)) OR (COALESCE(json_extract(data,'$.demo'),0)=0 AND json_extract(data,'$.archivedInto') IS NULL AND COALESCE(json_extract(data,'$.origin'),'unknown')<>'doujin')) ORDER BY id LIMIT 200`).bind(user,after,JSON.stringify(manifest.ids)).all();if(!page.results.length)break;for(const row of page.results){yield (first?'':',')+row.data;first=false;after=row.id;}}
  yield '],"relations":[';after='';first=true;
  for(;;){const page=await database.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? AND id>? ORDER BY id LIMIT 500').bind(user,after).all();if(!page.results.length)break;for(const row of page.results){yield(first?'':',')+JSON.stringify(row);first=false;after=row.id;}}yield ']}';
 }
 const iterator=document();return new Response(new ReadableStream({async pull(controller){try{const next=await iterator.next();if(next.done)controller.close();else controller.enqueue(encoder.encode(next.value));}catch(e){controller.error(e);}},async cancel(){await iterator.return(undefined);}}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
