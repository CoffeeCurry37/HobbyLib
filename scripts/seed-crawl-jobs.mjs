// Populate the release's durable local monitor queue from actually observed public links.
import ts from 'typescript';import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {createRequire} from 'node:module';
const [filename,checkpoints,facetHtml,previousCheckpoints,expanded]=process.argv.slice(2);if(!facetHtml)throw new Error('Usage: seed-crawl-jobs.mjs database.sqlite checkpoint-directory observed-facet.html [previous-checkpoints] [expanded-catalogues]');
const temp=mkdtempSync(join(tmpdir(),'radar-seed-')),require=createRequire(import.meta.url),database=new DatabaseSync(resolve(filename));
try{
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(temp,f.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(temp,f),readFileSync('lib/radar/'+f));
 const {parseHtml}=require(join(temp,'collector.cjs')),{FATE_SEARCHES}=require(join(temp,'source-presets.cjs'));
 const previous=JSON.parse(readFileSync('lib/radar/fate-crawl-audit.json','utf8')),mand=JSON.parse(readFileSync(join(previousCheckpoints||checkpoints,'mandarake/checkpoint.json'),'utf8'));
 const doujin=JSON.parse(readFileSync(join(checkpoints,'suruga-doujin/checkpoint.json'),'utf8')),partitions=parseHtml(readFileSync(facetHtml,'utf8'),FATE_SEARCHES[4].url).partitions;if(partitions.length!==8)throw new Error('Expected eight observed release-year partition links');
 const prefsRow=database.prepare("SELECT data FROM preferences WHERE user_id='owner'").get();if(!prefsRow)throw new Error('No populated local owner database');const prefs=JSON.parse(prefsRow.data);
 prefs.monitor={...prefs.monitor,enabled:false,urls:[...new Set([...prefs.monitor.urls,...FATE_SEARCHES.map(s=>s.url)])].slice(0,20)};
 database.exec('BEGIN IMMEDIATE');database.prepare("UPDATE preferences SET data=? WHERE user_id='owner'").run(JSON.stringify(prefs));
 for(let n=0;n<FATE_SEARCHES.length;n++){
  const source=FATE_SEARCHES[n];let cursor=source.url,visited=[],pending=[],paused='';
  if(n<3){cursor=previous.sources[n].next;visited=previous.sources[n].pages.map(p=>p.url);}
  if(n===3){cursor=mand.next;visited=[...previous.sources[3].pages,...mand.pages].map(p=>p.url);paused=mand.status==='paused'?'age_verification':'';}
  if(n===4){cursor=doujin.next||partitions[0];pending=doujin.pending||partitions.slice(1);const oldPath=previousCheckpoints&&join(previousCheckpoints,'suruga-doujin/checkpoint.json');visited=[...(oldPath&&existsSync(oldPath)?JSON.parse(readFileSync(oldPath,'utf8')).pages:[]),...doujin.pages].map(p=>p.url);}
  if(n>=7&&expanded){const id=['aniplex-fateproject','amiami-figures','amiami-books','amiami-music'][n-7],path=join(expanded,id+'.json');if(existsSync(path)){const capture=JSON.parse(readFileSync(path,'utf8'));cursor=capture.next||null;visited=capture.pages.map(p=>p.url);}}
  database.prepare('INSERT OR IGNORE INTO monitor_jobs(url,cursor,visited,pending,paused,updated_at) VALUES(?,?,?,?,?,?)').run(source.url,cursor,JSON.stringify(visited),JSON.stringify(pending),paused,new Date().toISOString());
 }
 database.exec('COMMIT; PRAGMA wal_checkpoint(TRUNCATE);');
 console.log(JSON.stringify({jobs:database.prepare('SELECT COUNT(*) AS n FROM monitor_jobs').get().n,yearPartitions:partitions.length,enabled:false,mandarakePaused:true}));
}catch(error){try{database.exec('ROLLBACK');}catch{}throw error;}finally{database.close();rmSync(temp,{recursive:true,force:true});}
