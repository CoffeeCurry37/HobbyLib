import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows} from './four-series-common.mjs';
const pub='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf';
fs.mkdirSync(priv,{recursive:true});
const groups=read(pub+'/order.json'),ts=targetRows();
for(const g of groups){
 const year=Number(g.label.slice(-4)),rows=ts.filter(t=>t.groupId===g.groupId);
 assert.equal(rows.length,g.candidates);
 write(priv+'/'+year+'-targets.json',rows);
 const urls=[...new Set([g.source,...rows.flatMap(r=>(r.officialObservations||[]).map(o=>o.url))])];
 write(priv+'/'+year+'-capture.json',urls.map(url=>({url,groupId:g.groupId})));
 console.log(JSON.stringify({year,candidates:rows.length,urls:urls.length,protected:rows.filter(r=>r.editorial||r.locked||r.manualFields?.length||r.summary).length,missingOfficial:rows.filter(r=>!r.officialObservations?.length).map(r=>({id:r.id,title:r.title,urls:r.sourceUrls}))}));
}

