import {env} from 'cloudflare:workers';
import {withDatabase,Database} from '@/lib/radar/store';
import {getStateResponse,postAction} from '@/lib/radar/service';
export const dynamic='force-dynamic';
async function handle(request:Request,post:boolean){
 const e=env as unknown as Record<string,any>,until=Number(e.RADAR_MAINTENANCE_UNTIL||0);
 if(!e.RADAR_MAINTENANCE_TOKEN||!e.RADAR_MAINTENANCE_OWNER_ID||Date.now()>until||request.headers.get('authorization')!=='Bearer '+e.RADAR_MAINTENANCE_TOKEN)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 if(!e.DB)return Response.json({error:'Unavailable'},{status:503});
 const owner=String(e.RADAR_MAINTENANCE_OWNER_ID).trim(),database=e.DB as Database;
 const ownerRow=await database.prepare('SELECT COUNT(*) AS count FROM items WHERE user_id=?').bind(owner).all();
 const ownerItems=Number(ownerRow.results[0]?.count||0);
 if(new URL(request.url).searchParams.has('maintenanceStatus')){
  const rows=await database.prepare('SELECT COUNT(*) AS count FROM items').all();
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner));
  return Response.json({ownerItems,totalItems:Number(rows.results[0]?.count||0),ownerDigest:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')},{headers:{'Cache-Control':'no-store'}});
 }
 if(!ownerItems)return Response.json({error:'Maintenance catalogue owner not found'},{status:409});
 if(post){const body=await request.clone().json() as any;if(!['catalogue-curation','apply-merge-plan','repair-duplicates','repair-kuji-catalogue','parsed-source-import','catalogue-enrichment','import-fate-snapshot'].includes(body.action))return Response.json({error:'Unsupported action'},{status:403});}
 return withDatabase(database,()=>post?postAction(request,owner):getStateResponse(request,owner));
}
export const GET=(request:Request)=>handle(request,false);
export const POST=(request:Request)=>handle(request,true);
