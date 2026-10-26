import {db} from './store';import {IDENTITY_RULE_VERSION} from './identity';
export async function diagnostics(user:string){const results=await db().batch([
 db().prepare("SELECT COUNT(*) AS count,SUM(json_extract(data,'$.archivedInto') IS NULL) AS active,SUM(json_extract(data,'$.ownership')='owned' AND json_extract(data,'$.archivedInto') IS NULL) AS owned,SUM(json_extract(data,'$.origin')='doujin' AND json_extract(data,'$.archivedInto') IS NULL) AS doujin FROM items WHERE user_id=?").bind(user),
 db().prepare('SELECT COUNT(*) AS count FROM relations WHERE user_id=?').bind(user),db().prepare('SELECT data FROM preferences WHERE user_id=?').bind(user),
 db().prepare("SELECT data FROM scans WHERE user_id=? AND id NOT LIKE 'operation:%' ORDER BY rowid DESC LIMIT 10").bind(user)]);
 const prefs=JSON.parse(results[2].results[0]?.data||'{}');return {version:'0.9.0',at:new Date().toISOString(),identityRules:IDENTITY_RULE_VERSION,counts:{...results[0].results[0],relations:results[1].results[0]?.count||0},schemaVersion:prefs.schemaVersion,import:prefs.fateSnapshot,sourcePauses:prefs.sourcePauses,recentScans:results[3].results.map(r=>{const s=JSON.parse(r.data);return {url:s.url,status:s.status,count:s.count,message:s.message,next:s.next,at:s.at};})};
}
