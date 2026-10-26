// Explicit local SQLite snapshot, fixed queue range, read-only and resumable.
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {join,resolve} from 'node:path';
import {loadRadar} from './load-radar.mjs';
import {itemFingerprint,sourceUrl} from './editorial-flow-lib.mjs';
const {values:o}=parseArgs({options:{snapshot:{type:'string'},from:{type:'string'},to:{type:'string'},out:{type:'string'},resume:{type:'boolean',default:false}}});
if(!o.snapshot||!o.from||!o.to||!o.out)throw Error('Required: --snapshot local-copy.sqlite --from N --to N --out DIR [--resume]');
const manifest=JSON.parse(readFileSync('lib/radar/editorial-manifest.json')),from=Number(o.from),to=Number(o.to);if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to>manifest.ids.length)throw Error('Invalid fixed queue range');
const r=loadRadar(),db=new DatabaseSync(resolve(o.snapshot),{readOnly:true}),at=performance.now();
try{
 db.exec('BEGIN');
 const metadata=JSON.parse(db.prepare("SELECT value FROM local_meta WHERE key='snapshot'").get().value),{matchDecision,identityInput,decisionHash}=r.get('match-decision'),{productIndex,IDENTITY_RULE_VERSION:rulesVersion}=r.get('identity'),{EMPTY_FACTS}=r.get('types');
 const codeHash=createHash('sha256'),codeFiles=[...readdirSync('lib/radar').filter(f=>/\.(ts|json)$/.test(f)).map(f=>join('lib/radar',f)),'scripts/identity-audit.mjs','scripts/editorial-flow-lib.mjs','scripts/load-radar.mjs'];for(const f of codeFiles.sort())codeHash.update(f).update(readFileSync(f,'utf8').replace(/\r\n/g,'\n'));
 const inputHash=metadata.inputSha256,config={inputHash,rulesVersion,rulesHash:codeHash.digest('hex'),from,to},folder=resolve(o.out),checkpoint=join(folder,'checkpoint.json');mkdirSync(folder,{recursive:true});
 const atomic=(path,value)=>{writeFileSync(path+'.tmp',typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');renameSync(path+'.tmp',path);};
 let cursor=from,saved;if(existsSync(checkpoint)){if(!o.resume)throw Error('Output exists; use --resume');saved=JSON.parse(readFileSync(checkpoint));cursor=saved.next;}
 // Reuse compact editorial field definitions while retaining ALL identity evidence.
 const fields=[...new Set([...r.get('editorial-index').INDEX_FIELDS,'tags','createdAt','ageRating','saleForm','cardNumber'])];
 const rowHash=createHash('sha256'),items=[],byId=new Map();let after='',pages=0;
 for(;;){const page=db.prepare('SELECT id,data FROM items WHERE user_id=? AND id>? ORDER BY id LIMIT 200').all('local-audit',after);if(!page.length)break;pages++;for(const row of page){rowHash.update(row.id+'\0'+row.data+'\0');const full=JSON.parse(row.data),i={...EMPTY_FACTS,description:'',tags:[],evidence:[],offers:[],...Object.fromEntries(fields.filter(k=>full[k]!==undefined).map(k=>[k,full[k]])),...identityInput(full),evidence:full.evidence||[],id:full.id};items.push(i);byId.set(i.id,i);after=row.id;}}
 const active=items.filter(i=>!i.archivedInto),index=productIndex(active),relations=db.prepare('SELECT id,from_id AS fromId,to_id AS toId,kind,quantity FROM relations WHERE user_id=? ORDER BY id').all('local-audit');
 rowHash.update(JSON.stringify(relations));rowHash.update(db.prepare('SELECT data FROM preferences WHERE user_id=?').get('local-audit')?.data||'');config.snapshotRowsHash=rowHash.digest('hex');if(saved&&decisionHash(saved.config)!==decisionHash(config))throw Error('Stale checkpoint/input/rules');
 const receipts=new Map(),cache='research/editorial-20261021/workflow/source-cache';for(const f of readdirSync(cache).filter(f=>f.endsWith('.json'))){const receipt=JSON.parse(readFileSync(join(cache,f)));if(receipt.url)receipts.set(sourceUrl(receipt.url),{status:receipt.status,at:receipt.at});}
 let reused=cursor-from,written=0,cacheHits=0,sourceReferences=0;const counts={matched:0,ambiguous:0,unmatched:0,conflict:0,archived:0,missing:0};
 for(let start=cursor;start<=to;start+=100){const rows=[];for(let ordinal=start;ordinal<=Math.min(to,start+99);ordinal++){
  const id=manifest.ids[ordinal-1],i=byId.get(id);if(!i||i.archivedInto){const status=i?'archived':'missing';counts[status]++;rows.push({ordinal,itemId:id,status});continue;}
  index.remove(id);const decision=matchDecision(active,i,index);index.add(i);counts[decision.status]++;
  const sources=[...new Set(i.offers.map(o=>sourceUrl(o.url)).filter(Boolean))],cached=sources.map(url=>({url,receipt:receipts.get(url)||null}));sourceReferences+=sources.length;cacheHits+=cached.filter(x=>x.receipt).length;
  const full=JSON.parse(db.prepare('SELECT data FROM items WHERE user_id=? AND id=?').get('local-audit',id).data),family=r.get('catalogue-families').catalogueFamily(i);
  const affected=relations.filter(x=>x.fromId===id||x.toId===id);
  rows.push({ordinal,itemId:id,status:decision.status,decision,inputHash,rulesVersion,fingerprint:itemFingerprint(i,relations),expectedVersion:r.get('item-record').recordVersion(full),relationsFingerprint:r.get('revision-plan').relationsVersion(affected),catalogue:{suggestedFamily:family?{key:family.key,title:family.title,type:family.type}:null,path:r.get('taxonomy').inferredPath(i),productLine:i.productLine||null,version:i.wave||null,member:i.member||null},tags:r.get('tag-provenance').tagSuggestions(i),relationChanges:[],relationshipSemantics:affected.map(x=>({id:x.id,meaning:byId.get(x.fromId)?.catalogueGroup?'logical-membership':x.kind})),sources:cached,questions:[...(decision.status==='matched'?[]:decision.reasonCodes),...(i.editorial?.unresolved||[]),'Suggestions do not verify identity, artwork or completeness'],environment:'isolated-local-copy',dryRun:true});
 }
 atomic(join(folder,'page-'+String(start).padStart(5,'0')+'.jsonl'),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');written+=rows.length;atomic(checkpoint,{config,next:Math.min(to+1,start+100)});
 }
 const report={...config,queueTotal:manifest.ids.length,next:to+1,countsThisRun:counts,written,reused,sourceReferences,cacheHits,sourceRequests:0,cacheNote:'Static receipt reuse only; no inventory/price verification',readPages:pages,index:index.stats(),active:active.length,archived:items.length-active.length,relations:relations.length,elapsedMs:performance.now()-at,maxRssKiB:process.resourceUsage().maxRSS,verifiedAdded:0,dryRun:true};
 atomic(join(folder,'summary.json'),report);atomic(join(folder,'README.md'),`# Identity audit (dry run)\n\nQueue #${from}–${to}; original ${manifest.ids.length} IDs preserved.\n\n${JSON.stringify(report,null,2)}\n\nEach page records individual decisions, evidence, proposed hierarchy/tags and unresolved questions. No changes applied; cached sources are historical evidence, not current stock.\n`);console.log(JSON.stringify(report));
}finally{db.close();r.close();}
