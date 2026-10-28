// Compare complete old and new rule modules in isolated module directories.
// Reads labelled/sanitized observations only. Never calls either ingest writer.
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {parseArgs} from 'node:util';
import {loadRadar} from './load-radar.mjs';
const {values:o}=parseArgs({options:{baseline:{type:'string'},cases:{type:'string',default:'tests/fixtures/identity/cases.jsonl'},out:{type:'string'}}});
if(!o.baseline||!o.out)throw Error('--baseline OLD_CHECKOUT --out REPORT.json required');
const baseline=resolve(o.baseline);let gitDir=join(baseline,'.git');if(statSync(gitDir).isFile())gitDir=resolve(baseline,readFileSync(gitDir,'utf8').trim().replace(/^gitdir: /,''));const baselineCommit=readFileSync(join(gitDir,'HEAD'),'utf8').trim();if(!/^[a-f0-9]{40}$/.test(baselineCommit))throw Error('Use an isolated detached baseline worktree');
const old=loadRadar(baseline),current=loadRadar(),at=performance.now();
try{
 const defaults={...current.get('types').EMPTY_FACTS,title:'',description:'',image:'',brand:'',series:'',year:'',category:'グッズ',kind:'base',tags:[],isbn:'',msrp:null,ownership:'unknown',quantity:0,priority:50,rating:null,review:true,bucket:'normal',notes:'',evidence:[],offers:[],createdAt:'2026-10-26T00:00:00.000Z'};
 const cases=readFileSync(o.cases,'utf8').trim().split('\n').map(JSON.parse),rows=cases.map(c=>{const items=c.candidates.map(i=>({...defaults,...i})),input={...defaults,...c.input},before=old.get('identity').findProduct(items,input,old.get('identity').productIndex(items)),after=current.get('match-decision').matchDecision(items,input,current.get('identity').productIndex(items));return {id:c.id,source:c.source,category:c.category,legacyTargetId:before?.item.id||null,newTargetId:after.targetItemId||null,status:after.status,decisionId:after.decisionId,reasonCodes:after.reasonCodes,changed:(before?.item.id||null)!==(after.targetItemId||null)};});
 const report={format:'identity-shadow-v1',baselineCommit,baselineIdentityHash:current.get('match-decision').decisionHash(readFileSync(join(baseline,'lib/radar/identity.ts'),'utf8')),baselineRule:old.get('identity').IDENTITY_RULE_VERSION,rulesVersion:current.get('identity').IDENTITY_RULE_VERSION,inputHash:current.get('match-decision').decisionHash(cases),samples:rows.length,changed:rows.filter(r=>r.changed).length,writes:0,sourceRequests:0,elapsedMs:performance.now()-at,maxRssKiB:process.resourceUsage().maxRSS,rows};mkdirSync(dirname(o.out),{recursive:true});writeFileSync(o.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
}finally{old.close();current.close();}
