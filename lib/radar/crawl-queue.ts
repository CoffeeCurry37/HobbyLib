// One parent monitor job owns its facet queue, so its cursor and queue survive a restart together.
export function advanceCrawl(target:string,data:{next?:string|null;total?:number|null;partitions?:string[];incomplete?:boolean},visited:string[],pending:string[]){
 const seen=new Set([...visited,target]);let queue=[...new Set(pending)].filter(u=>!seen.has(u));
 const partitions=(data.total??0)>10000?(data.partitions||[]).filter(u=>!seen.has(u)&&!queue.includes(u)):[];
 queue.push(...partitions);
 const nextPage=data.next&&!seen.has(data.next)?data.next:null;
 const next=partitions.length?queue.shift()!:nextPage||queue.shift()||null;
 return {next,visited:next?[...seen]:[],pending:next?queue:[],incomplete:!!data.incomplete};
}
