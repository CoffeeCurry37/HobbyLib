// Advice only: invoke the existing rule engine on the remaining 70 development inputs.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {loadRadar} from '../../scripts/load-radar.mjs';
import {ROOT,DATA,REPORT,read,write,sha,normalized} from '../pilot-workbench/common.mjs';
const samples=read(resolve(DATA,'samples.json')).filter(x=>x.split==='development' && Number(x.id.slice(1))>30);
assert.equal(samples.length,70);assert(samples.every(x=>x.split==='development'));
const r=loadRadar(ROOT),{createItem}=r.get('engine'),{DEFAULT_PREFS,EMPTY_FACTS}=r.get('types'),{applyMetadata}=r.get('metadata'),{repairClassification}=r.get('classification'),{productIndex,similarity,IDENTITY_RULE_VERSION}=r.get('identity'),{matchDecision}=r.get('match-decision');
const raw=readFileSync(resolve(ROOT,'research/editorial-20261021/workflow/items.jsonl'),'utf8');
const wf=raw.trim().split('\n').map(JSON.parse);
// Deliberately omit ALL catalog Offer URLs/keys, not merely the current URL.
// This is a compact historical identity-index probe, not a full production ingest replay.
const items=wf.filter(x=>!x.facts.archivedInto).map(x=>({...EMPTY_FACTS,id:x.id,ordinal:x.ordinal,title:'',description:'',image:'',brand:'',series:'',year:'',category:'',kind:'base',tags:[],isbn:'',ownership:'unknown',quantity:0,priority:50,rating:null,notes:'',review:true,bucket:'normal',createdAt:'2026-10-25T00:00:00.000Z',...x.facts,editorial:undefined,offers:[],evidence:[]}));
const index=productIndex(items),byId=new Map(items.map(x=>[x.id,x])),at=performance.now(),rows=[];
const projection=x=>({id:x.id,ordinal:x.ordinal,title:x.title,category:x.category,productType:x.productType,isbn:x.isbn,jan:x.jan,kind:x.kind,series:x.series,wave:x.wave,manufacturer:x.manufacturer});
for(const sample of samples){const p=sample.raw;let candidate=createItem(p.title,p.description,p.offer,DEFAULT_PREFS,p.image);candidate.id='pilot-input-'+sample.id;candidate.createdAt=p.offer.observedAt;candidate.offers=[{...p.offer,listingTitle:p.offer.listingTitle||p.title}];
 if(p.categoryLabel)candidate.evidence.push({field:'来源分类',value:p.categoryLabel,url:p.offer.url,at:p.offer.observedAt,method:'saved-listing-category'});
 if(p.facts)candidate=applyMetadata(candidate,p.facts,p.offer.url);candidate=repairClassification(candidate);
 const started=performance.now(),decision=matchDecision(items,candidate,index),repeat=matchDecision(items,candidate,index);assert.equal(decision.decisionId,repeat.decisionId);
 // A separate same-listing rescan probe; this is deliberately NOT the hidden-link experiment above.
 const self={...candidate,id:'pilot-existing-'+sample.id},selfItems=[self],selfDecision=matchDecision(selfItems,candidate,productIndex(selfItems));
 assert.equal(selfDecision.targetItemId,self.id,'Same listing rescan must find its existing record');
 const nearest=items.map(x=>({item:x,score:similarity(normalized(x.title),normalized(candidate.title))})).filter(x=>x.score>=.35).sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id)).slice(0,5);
 rows.push({id:sample.id,inputHash:sha(sample.raw),decision,candidates:decision.candidateIds.map(id=>projection(byId.get(id))),textNeighbours:nearest.map(x=>({...projection(x.item),similarity:Math.round(x.score*1000)/1000})),inputFacts:{title:candidate.title,category:candidate.category,kind:candidate.kind,series:candidate.series,isbn:candidate.isbn,jan:candidate.jan,wave:candidate.wave},elapsedMs:Math.round((performance.now()-started)*100)/100,replayIdentical:true,sameListingRescan:{targetMatched:true,reasons:selfDecision.reasonCodes,scope:'separate synthetic one-record rescan; not accuracy evidence'}});
}
const counts=Object.fromEntries(['matched','ambiguous','conflict','unmatched'].map(s=>[s,rows.filter(x=>x.decision.status===s).length]));
const result={version:1,runAt:new Date().toISOString(),mode:'existing-rule-23-offline-compact-index-probe',rulesVersion:IDENTITY_RULE_VERSION,codeSource:'044155730e21684700366d250f24cb89f58d8c39',catalogHash:sha(raw),catalogSize:items.length,catalogDate:'2026-10-25',sameListingShortcut:'disabled: all reference offers removed',scope:'Candidate normalization reuses createItem/applyMetadata/repairClassification. No network enrichment, full ingest, production write, or human accuracy labels.',processed:70,remaining:200,counts,accuracy:null,humanLabels:0,sourceRequests:0,paidApiRequests:0,elapsedMs:Math.round(performance.now()-at),rows};
write(resolve(ROOT,'research/pilot-v3-20261030/baseline-70.json'),result);console.log(JSON.stringify({...result,rows:undefined}));r.close();

