import {withDatabase,stateFor} from '../lib/radar/store';
import {postAction} from '../lib/radar/service';
import {safeUrl} from '../lib/radar/collector';
import {advanceCrawl} from '../lib/radar/crawl-queue';
import type {openDatabase} from './sqlite';
type DB=ReturnType<typeof openDatabase>;
// One durable page job at a time. Cursor survives process restarts; verification pauses a source.
export function createScheduler(database:DB,origin:string,exclusive:<T>(fn:()=>Promise<T>)=>Promise<T>){
 let busy=false,stopped=false;
 async function tick(now=Date.now()){
  if(busy||stopped)return;busy=true;
  try{await exclusive(async()=>withDatabase(database,async()=>{
   const state=await stateFor('owner',{lean:true});const cfg=state.prefs.monitor;if(!cfg.enabled)return;
   const urls=[...new Set(cfg.urls.length?cfg.urls:[state.prefs.searchUrl])];
   for(const url of urls){safeUrl(url);database.raw.prepare('INSERT OR IGNORE INTO monitor_jobs(url) VALUES(?)').run(url);}
   const job=database.raw.prepare('SELECT * FROM monitor_jobs WHERE next_at<=? AND paused=\'\' ORDER BY next_at').all(now).find((x:any)=>urls.includes(x.url as string)&&(!state.prefs.sourcePauses?.[new URL(x.url as string).hostname]||state.prefs.sourcePauses[new URL(x.url as string).hostname].scope==='details')) as any;if(!job){await postAction(new Request(origin+'/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'detail-next'})}),'owner','standalone');return;}
   const target=job.cursor||job.url;const visited=JSON.parse(job.visited) as string[];
   const res=await postAction(new Request(origin+'/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'scan',url:target,compact:true})}),'owner','standalone');const data=await res.json() as any;
   if(data.busy){database.raw.prepare('UPDATE monitor_jobs SET next_at=? WHERE url=?').run(now+15000,job.url);return;}
   if(!res.ok){const count=job.failures+1;const delay=Math.min(24*60,Math.max(15,cfg.intervalMinutes)*2**Math.min(count-1,5))*60000;database.raw.prepare('UPDATE monitor_jobs SET failures=?,next_at=?,paused=?,updated_at=? WHERE url=?').run(count,now+delay,data.interaction||'',new Date(now).toISOString(),job.url);return;}
   const progress=advanceCrawl(target,data,visited,JSON.parse(job.pending));
   database.raw.prepare('UPDATE monitor_jobs SET cursor=?,visited=?,pending=?,next_at=?,failures=0,paused=?,updated_at=? WHERE url=?').run(progress.next,JSON.stringify(progress.visited),JSON.stringify(progress.pending),now+(progress.next?15000:cfg.intervalMinutes*60000),progress.incomplete&&!progress.next?'result_window':'',new Date(now).toISOString(),job.url);
  }));}finally{busy=false;}
 }
 const timer=setInterval(()=>{void tick().catch(e=>console.error('Monitor task failed:',e instanceof Error?e.message:'unknown error'));},15000);
 return {tick,stop(){stopped=true;clearInterval(timer);},status(){return database.raw.prepare('SELECT url,next_at,cursor,failures,paused,updated_at FROM monitor_jobs').all();},resume(url:string){safeUrl(url);database.raw.prepare('UPDATE monitor_jobs SET paused=\'\',failures=0,next_at=0 WHERE url=?').run(url);}};
}
