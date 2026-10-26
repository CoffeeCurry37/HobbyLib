import type {State} from './types';
async function get(url:string,signal?:AbortSignal):Promise<any>{const r=await fetch(url,{cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000)});if(!r.ok){const data:any=await r.json().catch(()=>({}));throw new Error(data.error||'目录读取失败，请重试');}return r.json();}
export async function readCatalogue(scopes:string[]=['main'],progress=(text:string)=>{},partial?:(state:State)=>void,signal?:AbortSignal){
 const state=await get('/api/radar?catalogMeta=1',signal) as State;
 state.catalog!.reading=true;let complete=false;
 const emit=()=>partial?.({...state,items:[...state.items],archived:[...(state.archived||[])],catalog:{...state.catalog!,loaded:[...state.catalog!.loaded]}});
 try{
  for(const scope of [...new Set(scopes.length?scopes:['main'])]){let after='',count=0,lastEmission=0;for(;;){const page=await get('/api/radar?catalogScope='+scope+'&after='+encodeURIComponent(after),signal);if(!page.items.length){if(!count&&state.catalog!.counts[scope as 'main'|'doujin'|'archive']>0)throw new Error('目录暂时未返回商品，请重试。数据库记录仍保留。');break;}if(scope==='archive')state.archived!.push(...page.items);else state.items.push(...page.items);count+=page.items.length;progress(`正在读取${scope==='doujin'?'同人':scope==='archive'?'存档':'商品'}目录：${count} / ${state.catalog!.counts[scope as 'main'|'doujin'|'archive']} 条…`);if(!lastEmission||count-lastEmission>=2000){emit();lastEmission=count;}if(!page.next)break;if(page.next===after)throw new Error('目录分页没有前进，请重试');after=page.next;}state.catalog!.loaded.push(scope);}
  complete=true;return state;
 }finally{state.catalog!.reading=false;if(!signal?.aborted&&(complete||state.items.length||state.archived?.length))emit();}
}
