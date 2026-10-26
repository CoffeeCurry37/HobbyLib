import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const [beforeFile,afterFile,output]=process.argv.slice(2),before=JSON.parse(readFileSync(beforeFile)),after=JSON.parse(readFileSync(afterFile)),radar=loadRadar();
try {
 const all=[...after.items,...after.archived],byId=new Map(all.map(i=>[i.id,i]));assert.equal(byId.size,all.length);
 const personal=['ownership','quantity','notes','rating','priority','watchlisted','manualOrder','catalogNodeId','createdAt'];
 for(const old of [...before.items,...before.archived]){const next=byId.get(old.id);assert.ok(next,'Missing original ID: '+old.id);for(const key of personal)assert.deepEqual(next[key],old[key],'Personal field changed: '+old.id+' '+key);}
 const activeIds=new Set(after.items.map(i=>i.id));for(const r of after.relations)assert.ok(activeIds.has(r.fromId)&&activeIds.has(r.toId),'Invalid relation: '+r.id);
 assert.ok(after.items.every(i=>(i.images?.length||0)<=10),'More than ten images');
 const {exactMergePlan}=radar.get('duplicate-groups'),pairs=exactMergePlan(after.items);assert.equal(pairs.length,0,'Strict duplicate pairs remain');
 const {buildCatalogue}=radar.get('taxonomy'),{canonicalEvent,catalogueLabel}=radar.get('event-name'),tree=buildCatalogue(after.items,after.prefs),keys=new Set();for(const n of tree.nodes){const key=JSON.stringify([n.parentId,catalogueLabel(n.name)]);assert.ok(!keys.has(key),'Duplicate hierarchy node: '+n.name);keys.add(key);}
 assert.ok(after.items.every(i=>!i.event||canonicalEvent(i.event)===i.event),'Event alias not normalized');
 const bases=['source-2e9972988f84c4b955302b3258f872f2','source-56e2c90817eb8f1a0ecf37bc6902a3ef','source-ef582f5eedf300f7c58570874e6ff6d1'];for(const id of bases)assert.equal(after.relations.filter(r=>r.fromId===id&&r.kind==='bonus').length,29);
 const official=after.items.filter(i=>i.id.startsWith('official-v13-'));assert.equal(official.length,41);assert.ok(official.every(i=>i.image));
 const cards=after.items.filter(i=>/ウエハース|Dream Striker|Final Journey/.test(i.title));assert.ok(cards.every(i=>i.image&&!/no_photo|noimage|\/blank\./i.test(i.image)),'Release card image missing');
 const doujin=['source-4c8c3b3842557ef9bbce744e499bbbb2','source-cbd01ff12f5dcca066d084b3d0316dc6'];for(const id of doujin){const i=byId.get(id);assert.ok(i?.image);assert.ok(i.evidence.some(e=>/melonbooks|toranoana|booth/.test(e.url)));}
 assert.equal(after.prefs.fateSnapshot.nextBatch,68);assert.equal(after.prefs.fateSnapshot.id,'fate-v013-2dc8dcb21ee0d3ec');
 const report={verifiedAt:new Date().toISOString(),activeProducts:after.items.length,mergeArchives:after.archived.length,relations:after.relations.length,originalIdsPreserved:before.items.length+before.archived.length,personalFieldsPreserved:personal,ownedRecords:after.items.filter(i=>i.ownership==='owned').length,strictDuplicatePairs:pairs.length,duplicateHierarchyNodes:0,maxGalleryImages:Math.max(...after.items.map(i=>i.images?.length||0)),officialCatalogueAdditions:official.length,samuraiBonusLinksPerPlatform:29,waferAndFesRecordsWithImages:cards.length,otherRecordsMissingImage:after.items.filter(i=>!i.image).length,originalDoujinMatches:doujin.length,snapshot:after.prefs.fateSnapshot,verificationLimits:['No browser visual QA or real Windows execution','Public source coverage is partial','Image URLs are not an offline image cache','No scheduled cloud monitoring enabled']};
 writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{radar.close();}
