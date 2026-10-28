// Bounded diagnostics, not a replacement for the historical full-import test.
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const report=[];
for(const root of [process.cwd(),process.argv[2]]){
 if(!root)continue;const r=loadRadar(root),{createItem}=r.get('engine'),{DEFAULT_PREFS}=r.get('types');
 const item=(title,patch={})=>({...createItem(title,'',undefined,DEFAULT_PREFS),...patch});
 const {inferSetMembers,ownershipSummary}=r.get('sets'),{inferredPath}=r.get('taxonomy');
 const singles=[1,2,3].map(n=>item('Fate/strange Fake '+n,{category:'ライトノベル',publisher:'KADOKAWA',ownership:'owned',quantity:1})),lot=item('Fate/strange Fake 1～9巻セット / 成田良悟',{kind:'set',publisher:'KADOKAWA',category:'ライトノベルセット'});
 const state={items:[...singles,lot],relations:[],prefs:DEFAULT_PREFS,notices:[],scans:[]};const inferred=inferSetMembers(state);state.items.push(...inferred.items);state.relations.push(...inferred.relations);
 const summary=ownershipSummary(lot,state),publicManifest=JSON.parse(readFileSync(root+'/public/fate-crawl/manifest.json')),runtimeManifest=JSON.parse(readFileSync(root+'/lib/radar/fate-crawl-manifest.json'));
 const db=r.get('sqlite').openDatabase(':memory:'),{withDatabase,savePrefs}=r.get('store'),{postAction}=r.get('service');
 try{
  await withDatabase(db,()=>savePrefs('owner',{...DEFAULT_PREFS,autoLink:false,autoEnrich:false,fateSnapshot:{id:publicManifest.id,nextBatch:publicManifest.files.length-1}}));
  // Reach the final public batch with one real source observation; no full import.
  const product=JSON.parse(readFileSync(root+'/public'+publicManifest.files.at(-1)))[0];
  const res=await withDatabase(db,()=>postAction(new Request('https://test.local/api/radar',{method:'POST',body:JSON.stringify({action:'parsed-source-import',snapshotId:publicManifest.id,batch:publicManifest.files.length-1,products:[product],compact:true})}),'owner','standalone'));
  report.push({root,v8Ownership:{owned:summary.owned,missing:summary.missing,unmarked:summary.unmarked,total:summary.total},v8Taxonomy:inferredPath(item('Fate/Grand Order ウエハース No.21')),fateSnapshot:{publicId:publicManifest.id,runtimeId:runtimeManifest.id,publicBatches:publicManifest.files.length,runtimeBatches:runtimeManifest.files.length,lastPublicBatchHTTP:res.status,scans:db.raw.prepare("SELECT count(*) n FROM scans WHERE id LIKE 'fate-audit-%'").get().n,fullImportRerun:false}});
 }finally{db.close();r.close();}
}
writeFileSync('docs/reports/issue-3/legacy-diagnostics.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
