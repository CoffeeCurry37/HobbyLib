// Copy the user's disabled historical queues and advance only observed continuations.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const [destination,baseline,report]=process.argv.slice(2);
if(!report)throw Error('Usage: seed-v12-crawl-jobs.mjs data.sqlite previous.sqlite report.json');
const db=new DatabaseSync(resolve(destination)),old=new DatabaseSync(resolve(baseline),{readOnly:true});
try{
 const jobs=old.prepare('SELECT * FROM monitor_jobs').all(),row=db.prepare("SELECT data FROM preferences WHERE user_id='owner'").get();
 if(!jobs.length||!row)throw Error('Populated destination and previous queues required');
 const prefs=JSON.parse(row.data),at=new Date().toISOString();
 prefs.monitor.urls=[...new Set([...prefs.monitor.urls,...jobs.map(j=>j.url)])];
 const upsert=db.prepare('INSERT INTO monitor_jobs(url,next_at,cursor,visited,pending,failures,paused,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(url) DO UPDATE SET next_at=excluded.next_at,cursor=excluded.cursor,visited=excluded.visited,pending=excluded.pending,failures=excluded.failures,paused=excluded.paused,updated_at=excluded.updated_at');
 const key=raw=>{const u=new URL(raw);for(const p of ['page','pagecnt','getcnt','b','page_token','release_year'])u.searchParams.delete(p);u.searchParams.sort();return u.toString();};
 db.exec('BEGIN IMMEDIATE');
 for(const j of jobs)upsert.run(j.url,j.next_at,j.cursor,j.visited,j.pending,j.failures,j.paused,j.updated_at);
 for(const id of ['suruga-main','suruga-doujin','amiami-figures','aniplex-current','yahoo-fate','mercari-fate','suruga-pc','amiami-used']){
  const c=JSON.parse(readFileSync('public/fate-crawl/v12/'+id+'-checkpoint.json','utf8'));
  const previous=jobs.find(j=>key(j.url)===key(c.url)),u=new URL(c.url);for(const p of ['page','pagecnt','getcnt','b','page_token','release_year'])u.searchParams.delete(p);
  const url=previous?.url||u.toString(),visited=[...new Set([...(previous?JSON.parse(previous.visited):[]),...c.pages.map(p=>p.url)])];
  // A verified old pause remains paused. Public first pages cannot clear an age wall.
  upsert.run(url,0,c.next||null,JSON.stringify(visited),previous?.pending||'[]',previous?.failures||0,previous?.paused||'',at);
  prefs.monitor.urls=[...new Set([...prefs.monitor.urls,url])];
 }
 if(prefs.monitor.urls.length>20)throw Error('Monitor entrance limit exceeded');
 prefs.monitor.enabled=false;db.prepare("UPDATE preferences SET data=? WHERE user_id='owner'").run(JSON.stringify(prefs));
 const result={enabled:false,jobs:db.prepare('SELECT url,cursor,pending,paused,visited FROM monitor_jobs').all().map(j=>({...j,pending:JSON.parse(j.pending),visited:JSON.parse(j.visited).length}))};
 const priorPause=jobs.find(j=>j.paused==='age_verification');if(priorPause&&!result.jobs.some(j=>j.url===priorPause.url&&j.cursor===priorPause.cursor&&j.paused===priorPause.paused))throw Error('Historical age-confirmation pause changed');
 db.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE)');writeFileSync(resolve(report),JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify({jobs:result.jobs.length,enabled:false,doujinPending:result.jobs.find(j=>j.url.includes('category=1100&')&&j.url.includes('subgenre=Fate'))?.pending.length,mandarakePaused:!!priorPause}));
}catch(e){try{db.exec('ROLLBACK');}catch{}throw e;}finally{db.close();old.close();}
