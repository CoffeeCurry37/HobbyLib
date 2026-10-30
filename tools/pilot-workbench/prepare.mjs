// Offline, immutable inputs only. No production client, credentials or network.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,REPORT,DATA,read,write,sha,sourceKey,normalized,family,safeDataDir,labels} from './common.mjs';
safeDataDir();
const manifest=read(resolve(ROOT,'public/fate-crawl/manifest.json'));
const workflow=readFileSync(resolve(ROOT,'research/editorial-20261021/workflow/items.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const sources=read(resolve(ROOT,'research/editorial-20261021/workflow/sources.json'));
const old32=new Set(read(resolve(ROOT,'docs/reports/issue-3/review-list.json')).items.map(x=>x.itemId));
const byId=new Map(workflow.map(x=>[x.id,x])),byUrl=new Map();
for(const s of sources){let key;try{key=sourceKey(s.url);}catch{continue;}byUrl.set(key,[...new Set([...(byUrl.get(key)||[]),...s.memberIds])]);}
let pool=[];const files=new Map();
for(const f of manifest.files){const file='public'+f,b=readFileSync(resolve(ROOT,file)),hash=sha(b),rows=JSON.parse(b);files.set(file,{hash,rows});
 rows.forEach((row,index)=>{if(row.offer?.url&&row.offer.observedAt)pool.push({file,index,sha256:hash,row,key:sourceKey(row.offer.url)});});}
// Latest saved observation wins; each listing is one sample, branch prices are not separate products.
const unique=new Map();for(const p of pool){const old=unique.get(p.key);if(!old||p.row.offer.observedAt>=old.row.offer.observedAt)unique.set(p.key,p);}
const secondary=p=>/suruga|mercari|auctions.yahoo|mandarake/.test(p.row.offer.url)||/amiami/.test(p.row.offer.url)&&/-R(?:&|$)/.test(p.row.offer.url);
pool=[...unique.values()].filter(p=>secondary(p)&&p.row.facts?.origin!=='doujin'&&!p.row.facts?.circle);
const recent=p=>/Fes\.?\s*202[56]/i.test(p.row.title)&&/アニプレックス|Aniplex/.test(p.row.facts?.brand||'');
const book=p=>/書籍|コミック|小説|資料集|画集|アニメムック|雑誌/.test(p.row.facts?.category||'')||/material|turas\s*realta/i.test(p.row.title);
const figure=p=>/フィギュア|figma|ねんどろいど/.test(p.row.title+' '+p.row.facts?.category);
const game=p=>/^(?:PS[245P]|PSVITA|ニンテンドー|ゲームソフト)/.test(p.row.facts?.category||'')||/ソフト|プロダクトコード|衣装.*コード/.test(p.row.title);
const lot=p=>/まとめ|セット|欠品|状態難|箱説なし|不備/.test(p.row.title);
const card=p=>/ウエハース|カード|色紙|トレーディング|ランダム|ちょこのっこ|ラバーストラップ/.test(p.row.title+' '+p.row.facts?.category)&&!book(p)&&!game(p);
const tests={books:book,cards:card,games:game,figures:figure,recent,lots:lot};
// Shared families and historical editorial groups are unioned BEFORE splitting.
const parent=new Map(),find=k=>{if(!parent.has(k))parent.set(k,k);if(parent.get(k)!==k)parent.set(k,find(parent.get(k)));return parent.get(k);};
const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(a<b?b:a,a<b?a:b);};
for(const p of pool){const keys=['listing:'+p.key,'title:'+normalized(p.row.title),...(family(p.row.title)?['family:'+family(p.row.title)]:[]),...(byUrl.get(p.key)||[]).map(id=>'workflow:'+(byId.get(id)?.groupId||id))];keys.forEach(k=>union(keys[0],k));}
const seenGroups=new Set(workflow.filter(x=>old32.has(x.id)||['verified','partial'].includes(x.status)).map(x=>find('workflow:'+x.groupId)));
const chosen=[],used=new Set();
const add=(p,stratum,id)=>{if(used.has(p.key))throw new Error('Duplicate '+p.key);used.add(p.key);chosen.push({...p,stratum,id,group:'G-'+sha(find('listing:'+p.key)).slice(0,16),previouslyResearched:seenGroups.has(find('listing:'+p.key))});};
const seeds=read(resolve(ROOT,'tools/pilot-workbench/seeds.json'));
for(const seed of seeds){let p;if(seed.file.startsWith('research/pilot-300-20261029/')){const b=readFileSync(resolve(ROOT,seed.file));assert.equal(sha(b),seed.sha256);p={file:seed.file,index:0,sha256:sha(b),row:JSON.parse(b),key:sourceKey(seed.url)};}else{const f=files.get(seed.file);assert.equal(f.hash,seed.sha256);p={file:seed.file,index:seed.index,sha256:f.hash,row:f.rows[seed.index],key:sourceKey(seed.url)};}assert.equal(p.row.offer.url,seed.url);add(p,seed.stratum,seed.id);}
const targets={books:60,cards:60,games:60,figures:40,recent:40,lots:40};
// Fifteen materials when the pool permits; otherwise a visible shortfall.
const ordered=pool.sort((a,b)=>sha('pilot-v1|'+a.key).localeCompare(sha('pilot-v1|'+b.key)));
for(const [stratum,target] of Object.entries(targets)){
 let candidates=ordered.filter(p=>tests[stratum](p)&&!used.has(p.key));
 if(stratum==='books')candidates.sort((a,b)=>Number(/material/i.test(b.row.title))-Number(/material/i.test(a.row.title)));
 for(const p of candidates){if(chosen.filter(x=>x.stratum===stratum).length>=target)break;add(p,stratum);}
}
// Preserve real inputs if a stratum is short: fill from other secondhand items and report the difference.
for(const p of ordered){if(chosen.length>=300)break;if(!used.has(p.key))add(p,'lots');}
assert.equal(chosen.length,300);chosen.forEach((x,i)=>x.id??='P'+String(i+1).padStart(3,'0'));
const devGroups=new Set(chosen.filter(x=>Number(x.id.slice(1))<=30||x.previouslyResearched).map(x=>x.group));
const groups=[...new Set(chosen.map(x=>x.group))].sort((a,b)=>sha(a).localeCompare(sha(b)));
for(const g of groups){if(chosen.filter(x=>devGroups.has(x.group)).length>=100)break;devGroups.add(g);}
const rows=chosen.map(x=>({id:x.id,stratum:x.stratum,group:x.group,split:devGroups.has(x.group)?'development':'holdout',previouslyResearched:x.previouslyResearched,sourceKey:x.key,title:x.row.title,source:x.row.offer.source,url:x.row.offer.url,observedAt:x.row.offer.observedAt,observationKind:x.row.offer.observation,provenance:{file:x.file,index:x.index,sha256:x.sha256,rowSha256:sha(x.row)},raw:x.row}));
const compact=rows.map(({raw,...x})=>x);
const counts=key=>Object.fromEntries([...new Set(rows.map(x=>x[key]))].map(k=>[k,rows.filter(x=>x[key]===k).length]));
const summary={version:1,preparedAt:new Date().toISOString(),scope:'Historical secondhand listings plus one search-index observation; no current inventory claim. Curated development cases, not random accuracy evaluation.',prepared:300,firstBatch:30,rawManifestHash:sha(compact),sources:counts('source'),strata:counts('stratum'),targets,split:counts('split'),groups:new Set(rows.map(x=>x.group)).size,materialBooks:rows.filter(x=>x.stratum==='books'&&/material/i.test(x.title)).length,previouslyResearched:rows.filter(x=>x.previouslyResearched).length,holdoutStatus:'reserved-unlabelled; grouping needs human audit before a blind generalization test',catalogScope:'15811 historical non-doujin compact records; not a fresh complete production export',humanLabels:0,productionWrites:0,paidApiRequests:0};
const input=resolve(DATA,'samples.json');if(existsSync(input)){assert.equal(sha(read(input)),sha(rows),'Frozen sample set changed: use a new pilot directory/version');}else write(input,rows);
const priorFile=resolve(REPORT,'preparation.json');if(existsSync(priorFile)){const prior=read(priorFile);if(prior.rawManifestHash===summary.rawManifestHash){summary.lastValidatedAt=summary.preparedAt;summary.preparedAt=prior.preparedAt;}}
write(resolve(REPORT,'manifest.json'),compact);write(priorFile,summary);
console.log(JSON.stringify(summary));
