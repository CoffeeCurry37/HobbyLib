import type {Item,Relation} from './types';
import {decisionHash} from './match-decision';
import {recordVersion} from './item-record';
export type RevisionPlan={format:'local-revision-v1';environment:'isolated-local-copy';inputHash:string;rulesVersion:number;items:{id:string;expectedVersion:string}[];relationsBefore:string;remove:Relation[];add:Relation[];preserve:string[];evidence:{ordinal:number;itemId:string;isbn:string;url:string}[]};
export const relationsVersion=(relations:Relation[])=>decisionHash([...relations].sort((a,b)=>a.id.localeCompare(b.id)));
export function validateRelations(ids:Set<string>,relations:Relation[]){
 const keys=new Set<string>(),relationIds=new Set<string>(),graph=new Map<string,string[]>();
 for(const r of relations){if(!ids.has(r.fromId)||!ids.has(r.toId)||r.fromId===r.toId)throw Error('Dangling/self relation: '+r.id);const key=[r.kind,r.fromId,r.toId].join(':');if(keys.has(key)||relationIds.has(r.id))throw Error('Duplicate relation: '+r.id);keys.add(key);relationIds.add(r.id);if(r.kind!=='related'){if(!graph.has(r.fromId))graph.set(r.fromId,[]);graph.get(r.fromId)!.push(r.toId);}}
 const done=new Set<string>(),path=new Set<string>();const visit=(id:string)=>{if(path.has(id))throw Error('Relation cycle: '+id);if(done.has(id))return;path.add(id);for(const child of graph.get(id)||[])visit(child);path.delete(id);done.add(id);};for(const id of graph.keys())visit(id);
}
export function validateRevision(plan:RevisionPlan,items:Item[],relations:Relation[],inputHash:string,rulesVersion:number){
 if(plan.environment!=='isolated-local-copy'||plan.inputHash!==inputHash||plan.rulesVersion!==rulesVersion)throw Error('Stale input/environment/rules');
 const guarded=new Set(plan.items.map(i=>i.id));if([...plan.remove,...plan.add].some(r=>!guarded.has(r.fromId)||!guarded.has(r.toId)))throw Error('Missing endpoint version guard');
 const byId=new Map(items.map(i=>[i.id,i]));for(const guard of plan.items){const i=byId.get(guard.id);if(!i||recordVersion(i)!==guard.expectedVersion)throw Error('Stale item: '+guard.id);}
 if(relationsVersion(relations)!==plan.relationsBefore)throw Error('Stale relations');
 const remove=new Map(plan.remove.map(r=>[r.id,r]));for(const r of remove.values())if(!relations.some(x=>decisionHash(x)===decisionHash(r)))throw Error('Stale relation: '+r.id);
 const next=[...relations.filter(r=>!remove.has(r.id)),...plan.add];validateRelations(new Set(items.filter(i=>!i.archivedInto).map(i=>i.id)),next);return next;
}
