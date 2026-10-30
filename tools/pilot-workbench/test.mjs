import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,DATA,REPORT,read,sha,safeDataDir,sourceKey} from './common.mjs';
import {openStore} from './store.mjs';
import {createWorkbench} from './server.mjs';
import http from 'node:http';
const temp=()=>mkdtempSync(resolve(safeDataDir(resolve(ROOT,'work/pilot-qa')),'run-'));
test('300 immutable real inputs: unique URLs, complete hashes, split isolation',()=>{
 const inputs=read(resolve(DATA,'samples.json')),manifest=read(resolve(REPORT,'manifest.json')),prep=read(resolve(REPORT,'preparation.json'));
 assert.equal(inputs.length,300);assert.equal(new Set(inputs.map(x=>sourceKey(x.url))).size,300);assert.equal(sha(manifest),prep.rawManifestHash);
 const files=new Map(),groups=new Map();for(const s of inputs){assert.equal(sha(s.raw),s.provenance.rowSha256);assert.equal(s.url,s.raw.offer.url);assert.equal(sourceKey(s.url),s.sourceKey);if(!files.has(s.provenance.file)){const p=resolve(ROOT,s.provenance.file);files.set(s.provenance.file,{hash:sha(readFileSync(p)),rows:read(p)});}const f=files.get(s.provenance.file);assert.equal(f.hash,s.provenance.sha256);assert.equal(sha(Array.isArray(f.rows)?f.rows[s.provenance.index]:f.rows),s.provenance.rowSha256);assert(!s.previouslyResearched||s.split==='development');if(groups.has(s.group))assert.equal(groups.get(s.group),s.split);groups.set(s.group,s.split);}
 assert.equal(inputs.filter(x=>x.split==='holdout').length,200);assert(inputs.slice(0,30).every(x=>x.split==='development'));
});
test('30 research records: evidence references, all material characters, no fabricated full card catalogue',()=>{
 const p=read(resolve(REPORT,'proposals-30.json')),e=read(resolve(REPORT,'evidence.json')),c=read(resolve(REPORT,'catalogues.json')),b=read(resolve(REPORT,'baseline-30.json'));const ids=new Set(e.map(x=>x.id));assert.equal(p.rows.length,30);assert.equal(p.humanLabels,0);assert.equal(b.accuracy,null);assert(b.rows.every(x=>x.replayIdentical&&x.sameListingRescan.targetMatched));
 for(const r of p.rows){assert.equal(r.humanReviewed,false);assert(r.facts.length&&r.unknowns.length);for(const id of [...r.sources,...r.facts.flatMap(f=>f.sources),...r.relationships.flatMap(x=>x.sources)])assert(ids.has(id),id);assert.equal(r.inputHash,b.rows.find(x=>x.id===r.id).inputHash);}
 assert.deepEqual(p.rows.slice(0,4).map(r=>r.facts.find(x=>x.field==='收录角色').value.length),[38,35,37,24]);assert.equal(c.find(x=>x.id==='turas').members.length,23);assert(c.find(x=>x.id==='wafer14').members.every(x=>x.status==='proposed'));assert.equal(p.rows[17].facts.find(x=>x.field==='本体是否包含').value,false);assert(p.rows[4].facts.some(x=>x.status==='conflict'));
});
test('local database import is repeatable and preserves versioned review through reopening',()=>{
 const dir=temp();let s=openStore(dir);s.initialize();const a=s.detail('P001'),v={decision:'correct',reviewer:'QA fixture (not real user)',reason:'test only',correction:'<script>alert(1)</script>',expectedRevision:0,inputHash:a.inputHash,proposalHash:a.proposalHash,scope:'single-sample'};const saved=s.saveReview(a.id,v);assert.equal(saved.revision,1);s.initialize();assert.equal(s.list().length,300);assert.equal(s.detail(a.id).reviews.length,1);assert.throws(()=>s.saveReview(a.id,v),/已更新/);assert.throws(()=>s.saveReview(a.id,{...v,expectedRevision:1,inputHash:'wrong'}),/变化/);s.close();s=openStore(dir);s.initialize();assert.equal(s.detail(a.id).reviews[0].correction,v.correction);assert.equal(s.detail('P031').proposal,null);s.close();
});
test('database paths stay under work, unrelated locations rejected',()=>{
 for(const p of [ROOT,resolve(ROOT,'work'),resolve(ROOT,'data'),resolve(ROOT,'work/../public'),resolve(ROOT,'work-other')])assert.throws(()=>safeDataDir(p));
});
test('HTTP denies off-origin writes, hostile host, excessive bodies, missing token and production-like endpoints',async()=>{
 const app=createWorkbench({dataDir:temp(),port:0}),address=await app.start(),origin='http://127.0.0.1:'+address.port;
 try{let r=await fetch(origin+'/api/bootstrap');assert.equal(r.status,200);const b=await r.json();assert.equal(b.samples.length,300);assert(!JSON.stringify(b).includes('RADAR_PASSWORD'));
  const a=await(await fetch(origin+'/api/sample/P001')).json(),payload={decision:'defer',reviewer:'QA fixture',reason:'not human gold',expectedRevision:0,inputHash:a.inputHash,proposalHash:a.proposalHash},endpoint=origin+'/api/sample/P001/review';
  const headers={'Content-Type':'application/json','Origin':origin,'X-Pilot-Token':b.token};
  assert.equal((await fetch(endpoint,{method:'POST',headers:{...headers,Origin:'https://evil.invalid'},body:JSON.stringify(payload)})).status,403);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(payload)})).status,403);
  const hostileStatus=await new Promise((ok,fail)=>{http.get(origin+'/api/bootstrap',{headers:{Host:'evil.invalid'}},r=>{r.resume();ok(r.statusCode);}).on('error',fail);});assert.equal(hostileStatus,403);
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...payload,reason:'x'.repeat(21000)})})).status,413);
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(payload)})).status,201);
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(payload)})).status,409);
  assert.equal((await fetch(origin+'/api/production/apply',{method:'POST',headers,body:'{}'})).status,404);
  assert.equal((await fetch(origin+'/work/pilot-300/pilot.sqlite')).status,404);
  const exported=await(await fetch(origin+'/api/reviews')).json();assert.equal(exported.reviews.length,1);assert.equal(exported.productionWrites,0);
  const html=await fetch(origin+'/');assert.match(html.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.equal(html.status,200);
 }finally{await app.close();}
});
test('UI renders untrusted text safely; server has no production imports',()=>{
 const js=readFileSync(resolve(ROOT,'tools/pilot-workbench/public/app.js'),'utf8'),server=readFileSync(resolve(ROOT,'tools/pilot-workbench/server.mjs'),'utf8');assert(!/innerHTML|insertAdjacentHTML|document\.write/.test(js));assert(!/import.*(d1|production|standalone)/i.test(server));assert.match(server,/server\.listen\(port,'127\.0\.0\.1'/);
});
