import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/wafers',priv='work/series-evidence-20261110/wafers';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const order=read('research/series-evidence-20261105/books-media/next-sources.json').groups.map((g,n)=>({...g,key:n?'special25':'wafer2'}));
write(dir+'/order.json',order);
const ts=targetRows(),originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
for(const g of order){const targets=ts.filter(t=>t.groupId===g.groupId);assert.equal(targets.length,24);write(priv+'/'+g.key+'-targets.json',targets);write(priv+'/'+g.key+'-identity.json',targets.map(t=>{const i=originals.get(t.id);return{id:i.id,title:i.title,description:i.description,productLine:i.productLine,wave:i.wave,member:i.member,summary:i.summary,image:i.image,images:i.images,jan:i.jan,isbn:i.isbn,editorial:i.editorial,manualFields:i.manualFields,locked:i.locked,evidence:i.evidence,offerUrls:i.offers.map(o=>o.url),fingerprint:hash(JSON.stringify(i))}}));console.log(JSON.stringify({key:g.key,count:targets.length,identities:targets.map(t=>{const i=originals.get(t.id);return{id:i.id,title:i.title,summary:i.summary,image:i.image,wave:i.wave,jan:i.jan,offers:i.offers.length,editorial:!!i.editorial}})}))}
const urls=[...new Set(order.flatMap(g=>[...g.sources,...(g.secondarySources||[])]))];write(priv+'/discovery-capture.json',urls.map(url=>({url,kind:'html'})));

