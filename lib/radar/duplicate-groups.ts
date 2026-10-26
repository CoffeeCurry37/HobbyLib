import type {Item} from './types';
import {canonicalItem,productIndex,sameProduct,strongestProductMatches} from './identity';
// Indexed exact groups only. A pre-existing pair must not create a third record.
export function exactMergePlan(items:Item[]){
 const sorted=[...items].sort((a,b)=>a.id===b.id?0:canonicalItem([a,b])===a?-1:1),targets:Item[]=[],groups=new Map<string,Item[]>(),index=productIndex(targets),plan:{fromId:string;toId:string}[]=[];
 for(const item of sorted){const matches=strongestProductMatches(item,index.lookup(item).filter(target=>sameProduct(target,item)&&groups.get(target.id)!.every(member=>sameProduct(member,item))));const match=matches.length&&matches.every(target=>target.id===matches[0].id||sameProduct(target,matches[0]))?canonicalItem(matches):undefined;if(match){plan.push({fromId:item.id,toId:match.id});groups.get(match.id)!.push(item);}else {targets.push(item);groups.set(item.id,[item]);index.add(item);}}
 return plan;
}
