import {readFileSync,writeFileSync} from 'node:fs';
import {loadRadar} from './load-radar.mjs';
const [beforePath,afterPath,output]=process.argv.slice(2),before=JSON.parse(readFileSync(beforePath)),after=JSON.parse(readFileSync(afterPath)),r=loadRadar(),old=new Map(before.items.map(i=>[i.id,i])),byId=new Map(after.items.map(i=>[i.id,i]));
const fresh=after.items.filter(i=>!old.has(i.id)),pairs=r.get('duplicate-groups').exactMergePlan(after.items),groups={};
for(const i of fresh){const k=i.origin+' / '+i.majorClass;groups[k]=(groups[k]||0)+1;}
const imageGains=after.items.filter(i=>old.has(i.id)&&!old.get(i.id).image&&i.image).length;
const metadataChanges=after.items.filter(i=>old.has(i.id)&&['origin','category','majorClass','circle','catalogueKey'].some(k=>JSON.stringify(old.get(i.id)[k])!==JSON.stringify(i[k]))).map(i=>({id:i.id,fields:['origin','category','majorClass','circle','catalogueKey'].filter(k=>JSON.stringify(old.get(i.id)[k])!==JSON.stringify(i[k]))}));
const candidates=pairs.map(p=>{const a=byId.get(p.fromId),b=byId.get(p.toId);return {...p,ageConflict:!!a.ageRating&&!!b.ageRating&&a.ageRating!=='unknown'&&b.ageRating!=='unknown'&&a.ageRating!==b.ageRating,newRecord:!old.has(a.id)||!old.has(b.id)};});
const report={at:new Date().toISOString(),newRecords:fresh.length,newImages:fresh.filter(i=>i.image).length,imageGains,metadataChanges,groups,candidates,relationsAdded:after.relations.length-before.relations.length};writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));r.close();
