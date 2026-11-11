import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261111/pikuriru',priv='work/series-evidence-20261111/pikuriru';
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});
const order=read('research/series-evidence-20261110/extella-wafer3/next-sources.json').groups.map((g,n)=>({...g,key:n?'vol5':'vol6'}));write(dir+'/order.json',order);
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),ts=targetRows();
for(const g of order){const targets=ts.filter(t=>t.groupId===g.groupId);assert.equal(targets.length,g.candidates);write(priv+'/'+g.key+'-targets.json',targets);
const ids=targets.map(t=>{const i=originals.get(t.id);return{id:i.id,title:i.title,description:i.description,member:i.member,productLine:i.productLine,series:i.series,jan:i.jan,image:i.image,images:i.images,editorial:i.editorial,summary:i.summary,manualFields:i.manualFields,locked:i.locked,evidence:i.evidence,offers:i.offers.map(o=>({url:o.url,variant:o.variant})),fingerprint:hash(JSON.stringify(i))}});write(priv+'/'+g.key+'-identity.json',ids);
console.log(JSON.stringify({key:g.key,rows:ids.map(i=>({id:i.id,title:i.title,jan:i.jan,summary:i.summary,editorial:!!i.editorial,offers:i.offers}))}));}
write(priv+'/discovery-capture.json',[...new Set(order.flatMap(g=>g.sources))].map(url=>({url,kind:'html'})));

