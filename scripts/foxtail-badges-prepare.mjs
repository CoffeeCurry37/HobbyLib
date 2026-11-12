import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,targetRows,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261112/foxtail-badges',priv='work/series-evidence-20261112/foxtail-badges';assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});
const order=read('research/series-evidence-20261111/climax-kengou/next-sources.json').groups.map((g,k)=>({...g,key:['foxtail','vol5','vol6'][k]}));write(dir+'/order.json',order);
const ts=targetRows(),originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),capture=[];
for(const g of order){const targets=ts.filter(t=>t.groupId===g.groupId);assert.equal(targets.length,14);write(priv+'/'+g.key+'-targets.json',targets);
const rows=targets.map(t=>{const i=originals.get(t.id);return {id:i.id,title:i.title,description:i.description,isbn:i.isbn,jan:i.jan,productLine:i.productLine,member:i.member,editorial:!!i.editorial,summary:i.summary,evidence:i.evidence,offers:i.offers.map(o=>({url:o.url,variant:o.variant})),fingerprint:hash(JSON.stringify(i))}});write(priv+'/'+g.key+'-identity.json',rows);capture.push(...g.sources,...rows.flatMap(i=>i.evidence.map(e=>e.url).filter(u=>u?.startsWith('https://www.kadokawa.co.jp/product/'))));console.log(JSON.stringify({key:g.key,rows:rows.map(({evidence,description,...i})=>({...i,description:description.slice(0,350)}))}));}
write(priv+'/discovery-capture.json',[...new Set(capture)].map(url=>({url,kind:'html'})));

