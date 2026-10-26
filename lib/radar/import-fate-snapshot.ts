import type {State} from './types';
type Manifest={batchSize?:number;offsets?:number[];previousSnapshot?:{id:string;batches:number};id:string;count:number;files:string[];capturedAt:string;sources:{name:string;pages:number;total:number|null;status:string;next:string|null}[]};
// Resume is saved on the authenticated user's database; repeat batches are idempotent.
export async function importFateSnapshot(state:State,post:(body:unknown)=>Promise<any>,progress:(s:string)=>void,reload?:()=>Promise<State>){
 const response=await fetch('/fate-crawl/manifest.json',{cache:'no-store'});if(!response.ok)return state;const manifest=await response.json() as Manifest;
 const inherit=manifest.previousSnapshot?.id===state.prefs.fateSnapshot?.id&&state.prefs.fateSnapshot?.nextBatch===manifest.previousSnapshot?.batches;
 const start=state.prefs.fateSnapshot?.id===manifest.id?state.prefs.fateSnapshot.nextBatch:inherit?manifest.previousSnapshot!.batches:0;let current=state;
 for(let batch=start;batch<manifest.files.length;batch++){progress(`正在整理本轮 Fate 采集：${Math.min(manifest.offsets?.[batch]??batch*(manifest.batchSize||200),manifest.count)} / ${manifest.count} 条`);const file=await fetch(manifest.files[batch]);if(!file.ok)throw new Error('采集批次暂时无法读取，下次打开会继续。');const products=await file.json();let result;do{result=await post({action:'parsed-source-import',products,snapshotId:manifest.id,batch,compact:true});if(result.busy)await new Promise(r=>setTimeout(r,2000));}while(result.busy);if(result.state)current=result.state;}
 if(start<manifest.files.length&&reload)return reload();
 if(start<manifest.files.length){const latest=await fetch('/api/radar?lean=1',{cache:'no-store'});if(!latest.ok)throw new Error('采集记录已保存，请刷新读取最新目录。');current=await latest.json() as State;}
 return current;
}
