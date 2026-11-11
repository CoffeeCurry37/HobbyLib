import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/extella-wafer3',priv='work/series-evidence-20261110/extella-wafer3';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const order=read('research/series-evidence-20261110/wafers/next-sources.json').groups.map((g,n)=>({...g,key:n?'wafer3':'extella'}));write(dir+'/order.json',order);
const ts=targetRows(),originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
for(const g of order){
 const targets=ts.filter(t=>t.groupId===g.groupId);assert.equal(targets.length,g.candidates);write(priv+'/'+g.key+'-targets.json',targets);
 write(priv+'/'+g.key+'-identity.json',targets.map(t=>{const i=originals.get(t.id);return{id:i.id,title:i.title,description:i.description,series:i.series,productLine:i.productLine,wave:i.wave,member:i.member,summary:i.summary,platform:i.platform,edition:i.edition,productType:i.productType,image:i.image,images:i.images,jan:i.jan,isbn:i.isbn,editorial:i.editorial,manualFields:i.manualFields,locked:i.locked,evidence:i.evidence,offerUrls:i.offers.map(o=>o.url),fingerprint:hash(JSON.stringify(i))}}));
 console.log(JSON.stringify({key:g.key,count:targets.length,identities:targets.map(t=>{const i=originals.get(t.id);return{id:i.id,title:i.title,description:i.description,summary:i.summary,jan:i.jan,platform:i.platform,edition:i.edition,offers:i.offers.map(o=>o.url),editorial:!!i.editorial}})}));
}
write(priv+'/discovery-capture.json',[...new Set(order.flatMap(g=>g.sources))].map(url=>({url,kind:'html'})));

