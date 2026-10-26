// Inspect the complete exported catalogue, including preserved manual records.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const [beforeFile,afterFile,reportFile]=process.argv.slice(2);
if(!reportFile)throw Error('Usage: audit-v12-data.mjs before.json after.json report.json');
const before=JSON.parse(readFileSync(beforeFile)),after=JSON.parse(readFileSync(afterFile)),radar=loadRadar();
try{
 const {productClass,PRODUCT_CLASSES}=radar.get('product-class'),{sourceCategory}=radar.get('source-category'),{manualField,bookMedium}=radar.get('catalog'),{offerKey,sameProduct}=radar.get('identity'),{exactMergePlan}=radar.get('duplicate-groups'),{inferredPath}=radar.get('taxonomy'),{gameHardware,standaloneExtra}=radar.get('product-object');
 const items=after.items,index=new Map([...items,...(after.archived||[])].map(i=>[i.id,i])),classes={},errors=[],games=[],bookLines=new Map(),listingOwners=new Map(),isbnOwners=new Map();let protectedFields=0;
 for(const old of before.items){let next=index.get(old.id);const seen=new Set();while(next?.archivedInto&&!seen.has(next.id)){seen.add(next.id);next=index.get(next.archivedInto);}
  assert.ok(next,'Original record must remain recoverable');
  if(old.ownership==='owned'){assert.equal(next.id,old.id);assert.equal(next.ownership,'owned');assert.equal(next.quantity,old.quantity);assert.equal(next.notes,old.notes);}
  for(const key of Object.keys(old).filter(k=>manualField(old,k)&&!['evidence','offers','aliases','mergeSnapshot','archivedInto','schemaVersion','provisional','tags'].includes(k))){assert.deepEqual(next[key],old[key],'Manual field changed: '+key);protectedFields++;}
 }
 for(const i of items){const c=productClass(i),source=sourceCategory(i);classes[c]=(classes[c]||0)+1;
  if(i.majorClass!==c)errors.push({id:i.id,title:i.title,error:'Stored primary class mismatch'});
  if(!manualField(i,'tags')&&(i.tags.filter(t=>PRODUCT_CLASSES.includes(t)).length!==1||!i.tags.includes(c)))errors.push({id:i.id,title:i.title,error:'Primary class tag mismatch'});
  if(['book','comic','novel','magazine','art'].includes(source.type)&&c!=='书籍'&&c!=='同人'&&!standaloneExtra(i))errors.push({id:i.id,title:i.title,error:'Source-labelled book has wrong primary class',source:source.value,class:c});
  if(c==='游戏'){games.push({id:i.id,title:i.title,series:i.series,source:source.value,tags:i.tags.filter(t=>t.startsWith('平台:')),offers:i.offers.length});if(['Fate/strange Fake','Fate/Apocrypha','Fate/Zero'].includes(i.series)||gameHardware(i)||standaloneExtra(i))errors.push({id:i.id,title:i.title,error:'Game branch contradiction'});}
  if(c==='玩具'&&/^Fate(?:\/| 综合)|FGO/.test(i.series)&&!i.kuji&&!inferredPath(i).includes('Fate 综合'))errors.push({id:i.id,title:i.title,error:'Fate toy not consolidated'});
  if(c==='书籍'&&i.productLine&&i.wave){const key=[i.productLine,bookMedium(i),/新装版/.test(i.title)?'新装版':'原版'].join(' | ');if(!bookLines.has(key))bookLines.set(key,new Set());bookLines.get(key).add(i.wave);}
  for(const o of i.offers){const key=offerKey(o);if(!listingOwners.has(key))listingOwners.set(key,new Map());listingOwners.get(key).set(i.id,i);}
  if(i.isbn&&c==='书籍'){if(!isbnOwners.has(i.isbn))isbnOwners.set(i.isbn,[]);isbnOwners.get(i.isbn).push(i);}
 }
 const duplicateListings=[...listingOwners].filter(([,v])=>v.size>1).map(([key,v])=>({key,items:[...v.values()].map(i=>({id:i.id,title:i.title})),mergeable:[...v.values()].some((i,n,a)=>a.slice(n+1).some(j=>sameProduct(i,j)))}));
 const plan=exactMergePlan(items),awards=items.filter(i=>i.kuji?.catalogueGroup),lot=items.find(i=>i.offers.some(o=>o.url.includes('/x1247004159'))),lotRelations=lot?after.relations.filter(r=>r.fromId===lot.id&&r.kind==='contains'):[];
 const duplicateBookISBNs=[...isbnOwners].filter(([,v])=>v.some((a,n)=>v.slice(n+1).some(b=>sameProduct(a,b))));assert.equal(duplicateBookISBNs.length,0,'Mergeable book editions share a physical ISBN');
 assert.equal(plan.length,0,'Remaining strict automatic merge candidates');assert.equal(awards.length,44);assert.ok(awards.every(i=>i.image));
 if(lot){assert.equal(lot.imageRole,'lot_photo');assert.equal(lot.kind,'set');assert.equal(lot.saleForm,'seller_lot');assert.equal(lotRelations.length,4);assert.ok(lotRelations.every(r=>r.quantity===1&&index.has(r.toId)));}
 assert.equal(errors.length,0,JSON.stringify(errors.slice(0,20)));
 const result={active:items.length,archived:after.archived?.length||0,classes,images:items.filter(i=>i.image).length,missingImages:items.filter(i=>!i.image).length,missingOfferless:items.filter(i=>!i.image&&!i.offers.length).length,ownedPreserved:before.items.filter(i=>i.ownership==='owned').length,protectedFields,strictMergeCandidates:plan.length,duplicateListingIdentities:duplicateListings.length,duplicateBookISBNs:duplicateBookISBNs.length,duplicateListings,kujiAwardGroups:awards.length,kujiAwardImages:awards.filter(i=>i.image).length,kujiNamedMembers:items.filter(i=>i.kuji&&!i.kuji.catalogueGroup&&i.inferredMember).length,verifiedFourFigureLot:!!lot,verifiedLotMembers:lotRelations.length,gameProducts:games.length,games,bookLines:[...bookLines].map(([line,v])=>({line,volumes:[...v].sort((a,b)=>Number(a)-Number(b))})),snapshot:after.prefs.fateSnapshot,identityVersion:after.prefs.identityMigrated};
 writeFileSync(reportFile,JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify({...result,games:undefined,bookLines:undefined,duplicateListings:undefined}));
}finally{radar.close();}
