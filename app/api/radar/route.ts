import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {withDatabase,Database} from '@/lib/radar/store';
import {getStateResponse,postAction} from '@/lib/radar/service';
export const dynamic='force-dynamic';
async function handle(request:Request,post:boolean){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 if(!env.DB)return Response.json({error:'数据库尚未连接'},{status:503});
 return withDatabase(env.DB as unknown as Database,()=>post?postAction(request,user.userId):getStateResponse(request,user.userId));
}
export const GET=(request:Request)=>handle(request,false);
export const POST=(request:Request)=>handle(request,true);
