// Preserve observed continuation queues; do not restart historical partitions.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const [filename,previousFilename,reportPath]=process.argv.slice(2);
if(!reportPath)throw new Error('Usage: seed-v11-crawl-jobs.mjs data.sqlite previous.sqlite report.json');
const database=new DatabaseSync(resolve(filename)),previous=new DatabaseSync(resolve(previousFilename),{readOnly:true});
try{
 const jobs=previous.prepare('SELECT * FROM monitor_jobs').all();
 if(!jobs.length)throw new Error('Previous observed queues required');
 const row=database.prepare("SELECT data FROM preferences WHERE user_id='owner'").get();
 if(!row)throw new Error('Populated destination required');
 const prefs=JSON.parse(row.data),at=new Date().toISOString();
 const upsert=database.prepare('INSERT INTO monitor_jobs(url,cursor,visited,pending,paused,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(url) DO UPDATE SET cursor=excluded.cursor,visited=excluded.visited,pending=excluded.pending,paused=excluded.paused,updated_at=excluded.updated_at');
 database.exec('BEGIN IMMEDIATE');
 for(const job of jobs)upsert.run(job.url,job.cursor,job.visited,job.pending,job.paused,at);
 for(const id of ['suruga-doujin','suruga-kuji','yahoo-kuji','amiami-stock']){
  const capture=JSON.parse(readFileSync('public/fate-crawl/'+id+'-v11-checkpoint.json','utf8'));
  const old=id==='suruga-doujin'?jobs.find(j=>j.url.includes('category=1100&')&&j.url.includes('subgenre=Fate')):jobs.find(j=>j.url===capture.url);
  if(id==='suruga-doujin'&&!old)throw new Error('Existing Fate doujin root required');
  const url=old?.url||capture.url,visited=[...new Set([...(old?JSON.parse(old.visited):[]),...capture.pages.map(p=>p.url)])];
  const pending=old?JSON.parse(old.pending):[];
  upsert.run(url,capture.next||null,JSON.stringify(visited),JSON.stringify(pending),old?.paused||'',at);
  prefs.monitor.urls=[...new Set([...prefs.monitor.urls,url])].slice(0,20);
 }
 prefs.monitor.enabled=false;
 database.prepare("UPDATE preferences SET data=? WHERE user_id='owner'").run(JSON.stringify(prefs));
 database.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE)');
 const result={enabled:false,jobs:database.prepare('SELECT url,cursor,pending,paused,visited FROM monitor_jobs').all().map(j=>({...j,pending:JSON.parse(j.pending),visited:JSON.parse(j.visited).length}))};
 writeFileSync(resolve(reportPath),JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify({jobs:result.jobs.length,enabled:false,doujinNext:result.jobs.find(j=>j.url.includes('category=1100&')&&j.url.includes('subgenre=Fate'))?.cursor,mandarakePaused:result.jobs.some(j=>j.paused==='age_verification')}));
}catch(e){try{database.exec('ROLLBACK');}catch{}throw e;}finally{previous.close();database.close();}
