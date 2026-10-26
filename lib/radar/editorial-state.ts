import {db} from './store';
import seed from './editorial-manifest.json';
import workflow from './editorial-workflow-summary.json';
import {EDITORIAL_FIELDS,editorialStatus,REVIEW_LABELS} from './editorial';
import type {Item} from './types';
export async function editorialProgress(user:string,filter='all',offset=0){
 const counts:Record<string,number>=Object.fromEntries(Object.keys(REVIEW_LABELS).map(k=>[k,0])),rows:any[]=[];let matching=0,nextUnstarted:any=null;
 const fields=[...new Set(['id','image','archivedInto','editorial',...EDITORIAL_FIELDS])],projection='json_object('+fields.map(k=>`'${k}',json_extract(data,'$.${k}')`).join(',')+') AS data';
 for(let start=0;start<seed.ids.length;start+=400){const ids=seed.ids.slice(start,start+400),r=await db().prepare(`SELECT ${projection} FROM items WHERE user_id=? AND id IN (SELECT value FROM json_each(?))`).bind(user,JSON.stringify(ids)).all(),found=new Map<string,Item>(r.results.map(r=>{const i=JSON.parse(r.data);return[i.id,i]}));
  for(let n=0;n<ids.length;n++){const i=found.get(ids[n]),status=editorialStatus(i,seed.id),ordinal=start+n+1;counts[status]++;if(status==='pending'&&!nextUnstarted)nextUnstarted={ordinal,id:ids[n],title:i?.title};if(filter==='all'||status===filter){if(matching>=offset&&rows.length<50)rows.push({ordinal,id:ids[n],title:i?.title||ids[n],status,summary:i?.summary,productType:i?.productType,majorClass:i?.majorClass,editorial:i?.editorial,archivedInto:i?.archivedInto});matching++;}}
 }
 const added=await db().prepare("SELECT COUNT(*) AS n FROM items WHERE user_id=? AND json_extract(data,'$.archivedInto') IS NULL AND COALESCE(json_extract(data,'$.demo'),0)=0 AND COALESCE(json_extract(data,'$.origin'),'unknown')<>'doujin' AND id NOT IN (SELECT value FROM json_each(?))").bind(user,JSON.stringify(seed.ids)).all();
 return {workflow,campaign:seed.id,startedAt:seed.createdAt,total:seed.ids.length,counts,matching,rows,nextUnstarted,newOutsideQueue:added.results[0].n,nextOffset:offset+rows.length<matching?offset+rows.length:null};
}
