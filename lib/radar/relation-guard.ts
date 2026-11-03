import {db} from './store';
import type {Relation} from './types';
// Fail the surrounding atomic batch on ANY concurrent relation edit, including
// additions which would invalidate a previously checked acyclic graph.
export function relationGuard(user:string,guard:string,relations:Relation[]){
 // Fix join order so SQLite looks up (user_id,id) for each expected edge.
 // An ordinary JOIN can scan the complete JSON array for every saved edge.
 return db().prepare("INSERT INTO scans(user_id,id,data) VALUES(?,?,(SELECT 'verified' WHERE (SELECT COUNT(*) FROM relations WHERE user_id=?)=? AND (SELECT COUNT(*) FROM json_each(?) e CROSS JOIN relations r ON r.user_id=? AND r.id=json_extract(e.value,'$.id') AND r.from_id=json_extract(e.value,'$.fromId') AND r.to_id=json_extract(e.value,'$.toId') AND r.kind=json_extract(e.value,'$.kind') AND r.quantity=json_extract(e.value,'$.quantity'))=?))").bind(user,guard,user,relations.length,JSON.stringify(relations),user,relations.length);
}
