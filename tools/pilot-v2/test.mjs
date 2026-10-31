import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,sha,safeDataDir} from '../pilot-workbench/common.mjs';
import {loadInputs,buildModel,admission,visibility,identityCompatible,scopedSaleForm,fieldMerge} from './model.mjs';
import {openV2Store} from './store.mjs';
import {createV2} from './server.mjs';
import http from 'node:http';
mkdirSync(resolve(ROOT,'work/pilot-v2-qa'),{recursive:true});
const temp=()=>mkdtempSync(resolve(ROOT,'work/pilot-v2-qa/run-'));
test('first30 provenance and post-prediction review are bound; remaining270 not processed',()=>{
 const input=loadInputs(),m=buildModel(input);assert.equal(m.rows.length,30);assert.equal(new Set(m.rows.map(r=>r.id)).size,30);assert(m.rows.every(r=>/^P0(?:0[1-9]|[12]\d|30)$/.test(r.id)));assert.equal(m.independentGoldLabels,0);assert.equal(m.productionWrites,0);assert.equal(new Set(m.products.map(p=>p.id)).size,m.products.length);assert(m.rows.every(r=>m.products.some(p=>p.id===r.productId)));
 assert(m.products.every(p=>p.sources.every(id=>m.evidence.some(e=>e.id===id))));assert(m.rows.every(r=>r.summary.split(/[。！？!?]/).filter(x=>x.trim()).length<=3));
 const bad=structuredClone(input);bad.proposals[0].summary='changed';assert.notEqual(sha(bad.proposals[0]),input.feedback.rows[0].proposalRowSha256);
});
test('catalogues preserve all content characters, single volumes, five works and real version matrix',()=>{
 const m=buildModel(),p=id=>m.products.find(p=>p.id===id);assert.deepEqual([1,2,3,8].map(i=>p('material-'+i).characters.length),[38,35,37,24]);
 assert.equal(m.rows.find(r=>r.id==='P005').decision.saleFormDecision.form,'seller-set');assert.equal(p('sample-P005').links.length,22);assert(!p('sample-P005').links.some(x=>x.id==='turas-23'));assert(p('turas-23').isbn);assert.equal(p('turas-23').mode,'permanent');
 assert.equal(m.groups.filter(g=>['extra','extra-ccc','extella','extella-link','extra-record'].includes(g.id)).length,5);assert.deepEqual(p('extella-limited').variants.map(x=>x.platform),['Switch']);assert.deepEqual(p('extella-velber').variants.map(x=>x.platform),['PS4 + PS Vita']);assert.equal(new Set(p('extella-regular').variants.map(x=>x.jan)).size,3);
 assert(!p('extella-velber').summary.includes('此挂牌'));assert(!p('extella-regular').summary.includes('此挂牌'));assert.equal(p('sample-P025').facts.find(f=>f.field==='发放方式').status,'user-confirmed');
 assert.equal(m.products.filter(p=>p.groupId==='wafer14').length,34);assert.equal(m.products.filter(p=>p.groupId==='wafer14'&&p.mode==='review').length,32);assert.notEqual(p('sample-P018').id,p('sample-P019').id);
});
test('admission handles fixed-set parts, incomplete parent, independent outfit and explicit bonus exception',()=>{
 assert.equal(admission({fixedSetPart:true}).mode,'excluded');assert.equal(admission({fixedSetPart:true,explicitBonusException:true}).mode,'temporary');assert.equal(admission({incompleteParent:true}).mode,'permanent');assert.equal(admission({independentlySoldOutfit:true}).mode,'permanent');assert.equal(admission({scopeUnknown:true}).mode,'review');
 const m=buildModel();assert.equal(m.rows.find(r=>r.id==='P030').mode,'excluded');assert.equal(m.rows.find(r=>r.id==='P028').mode,'review');assert.equal(m.rows.find(r=>r.id==='P020').mode,'temporary');
});
test('title sale range overrides mis-scoped member ISBN; price cannot assert a set',()=>{
 assert.deepEqual(scopedSaleForm('turas realta 1–22卷套装','骏河屋','9784065107645',9000),{form:'seller-set',from:1,to:22,isbnScope:'member-not-set',priceUsedForIdentity:false});
 assert.equal(scopedSaleForm('稀有单本','骏河屋','9784065107645',9000).form,'unknown');
 for(const key of ['work','platform','edition','volume','isbn','wave','className','cardNumber','character'])assert.equal(identityCompatible({[key]:'A'},{[key]:'B'}),false);
});
test('temporary lifecycle requires all confirmed endings; 404 and zero offers do not delete permanent pages',()=>{
 assert.equal(visibility('permanent',[]),'visible');assert.equal(visibility('temporary',[]),'visible');assert.equal(visibility('temporary',[{status:'sold',confirmed:false}]),'visible');assert.equal(visibility('temporary',[{status:'unreachable',confirmed:false}]),'visible');
 assert.equal(visibility('temporary',[{status:'sold',confirmed:true}]),'archived');assert.equal(visibility('temporary',[{status:'sold',confirmed:true},{status:'available',confirmed:true}]),'visible');assert.equal(visibility('permanent',[{status:'sold',confirmed:true}]),'visible');
});
test('ten replays preserve inputs, observations, manual summary, review and simulation history',()=>{
 const dir=temp();let s=openV2Store(dir);s.initialize();const a=s.detail('material-1'),row=a.rows[0],count=()=>Object.fromEntries(['inputs','runs','observations','reviews','descriptions'].map(t=>[t,s.db.prepare('SELECT COUNT(*) AS n FROM '+t).get().n]));
 const inputBefore=s.db.prepare('SELECT * FROM inputs ORDER BY id').all(),observedBefore=s.db.prepare('SELECT * FROM observations ORDER BY source_key').all();
 s.change(a.id,{text:'人工保留的资料集简介。',expectedRevision:0,modelHash:a.modelHash},'summary');
 s.saveReview('P001',{decision:'correct',reviewer:'Automated QA fixture',reason:'Input safety test',correction:'<img src=x onerror=alert(1)>',modelHash:a.modelHash,inputHash:row.inputHash,expectedRevision:0});
 const before=count();for(let i=0;i<10;i++)s.initialize();assert.deepEqual(count(),before);assert.deepEqual(s.db.prepare('SELECT * FROM inputs ORDER BY id').all(),inputBefore);assert.deepEqual(s.db.prepare('SELECT * FROM observations ORDER BY source_key').all(),observedBefore);assert.equal(s.detail(a.id).summary,'人工保留的资料集简介。');
 const set=s.detail('sample-P005');s.change(set.id,{value:'ended',expectedRevision:0,modelHash:set.modelHash},'scenario');assert.equal(s.detail(set.id).visibility,'archived');assert.equal(s.detail('turas-1').visibility,'visible');assert.equal(s.detail('turas-23').visibility,'visible');
 s.close();s=openV2Store(dir);s.initialize();assert.equal(s.detail(a.id).rows[0].reviews.length,1);assert.equal(s.detail(set.id).visibility,'archived');assert.equal(s.detail(a.id).summary,'人工保留的资料集简介。');s.close();
});
test('competing stale review/summary writes fail; provenance and reviewed-first30 boundaries enforced',()=>{
 const dir=temp(),s=openV2Store(dir),other=openV2Store(dir);s.initialize();other.initialize();const a=s.detail('material-1'),v={decision:'accept',reviewer:'QA fixture',reason:'fixture',modelHash:a.modelHash,inputHash:a.rows[0].inputHash,expectedRevision:0};s.saveReview('P001',v);assert.throws(()=>other.saveReview('P001',v),/新版本/);assert.throws(()=>s.saveReview('P031',v),/首30/);assert.throws(()=>s.saveReview('P001',{...v,inputHash:'wrong'}),/依据/);s.change(a.id,{text:'保留。',expectedRevision:0,modelHash:a.modelHash},'summary');assert.throws(()=>other.change(a.id,{text:'覆盖。',expectedRevision:0,modelHash:a.modelHash},'summary'),/新版本/);s.close();other.close();
});
test('observation replay, old data, source identity conflict and restoration are safe',()=>{
 const s=openV2Store(temp());s.initialize();const old=s.detail('extella-regular').originalOffers[0];const next={...old,status:'sold',confirmed:true,observedAt:'2026-10-31T01:00:00Z'};delete next.eventSequence;assert.equal(s.observe(next).changed,true);assert.equal(s.observe(next).changed,false);assert.equal(s.observe({...next,status:'available',observedAt:'2026-10-01T01:00:00Z'}).changed,false);assert.throws(()=>s.observe({...next,identity:{...next.identity,platform:'Switch'},observedAt:'2026-11-01T01:00:00Z'}),/冲突/);assert.equal(s.observe({...next,status:'available',observedAt:'2026-11-01T01:00:00Z'}).changed,true);assert.equal(s.detail('extella-regular').originalOffers.length,1);s.close();
});
test('field updates do not grow or override human facts',()=>{
 const a=[{field:'简介',value:'人工句子。',manual:true},{field:'角色',value:'甲',status:'supported'}];let x=a;for(let i=0;i<10;i++)x=fieldMerge(x,[{field:'简介',value:'追加。'},{field:'角色',value:'乙',status:'proposed'}]);assert.deepEqual(x,a);
});
test('isolation rejects path escapes and UI renders source strings as text',()=>{
 for(const path of [ROOT,resolve(ROOT,'work'),resolve(ROOT,'public'),resolve(ROOT,'work-other')])assert.throws(()=>safeDataDir(path));
 const js=readFileSync(resolve(ROOT,'tools/pilot-v2/public/app.js'),'utf8'),server=readFileSync(resolve(ROOT,'tools/pilot-v2/server.mjs'),'utf8');assert(!/innerHTML|insertAdjacentHTML|document\.write/.test(js));assert(!/import.*(production|d1|standalone)/i.test(server));assert.match(server,/server\.listen\(port,'127\.0\.0\.1'/);
});
test('HTTP persists valid edits but rejects cross origin, wrong token, stale hash, large body and production endpoints',async()=>{
 const app=createV2({port:0,dataDir:temp()}),address=await app.start(),origin='http://127.0.0.1:'+address.port;
 try{const b=await(await fetch(origin+'/api/catalog')).json();assert.equal(b.rows.length,30);assert(!b.rows.some(x=>x.id==='P031'));const p=await(await fetch(origin+'/api/product/material-1')).json(),v={decision:'defer',reviewer:'QA fixture',reason:'HTTP QA',inputHash:p.rows[0].inputHash,modelHash:b.hash,expectedRevision:0},headers={'Content-Type':'application/json',Origin:origin,'X-Pilot-Token':b.token},endpoint=origin+'/api/review/P001';
 assert.equal((await fetch(endpoint,{method:'POST',headers:{...headers,Origin:'https://evil.invalid'},body:JSON.stringify(v)})).status,403);
 assert.equal((await fetch(endpoint,{method:'POST',headers:{...headers,'X-Pilot-Token':'wrong'},body:JSON.stringify(v)})).status,403);
 assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...v,reason:'x'.repeat(17000)})})).status,413);
 assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(v)})).status,201);
 assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(v)})).status,409);
 assert.equal((await fetch(origin+'/api/production/apply',{method:'POST',headers,body:'{}'})).status,404);
 assert.equal((await fetch(origin+'/work/pilot-300/pilot.sqlite')).status,404);
 const hostile=await new Promise(ok=>http.get(origin+'/api/catalog',{headers:{Host:'evil.invalid'}},r=>{r.resume();ok(r.statusCode);}));assert.equal(hostile,403);
 assert.match((await fetch(origin)).headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
 }finally{await app.close();}
});
