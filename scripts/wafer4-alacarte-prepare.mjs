import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,targetRows,cached,clean} from './four-series-common.mjs';
const dir='research/series-evidence-20261120/wafer4-alacarte',priv='work/series-evidence-20261120/wafer4-alacarte';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const groups=read('research/series-evidence-20261114/keyth-ccc/next-sources.json').groups,items=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),capture=[];
for(const [n,g]of groups.entries()){
 const key=n?'alacarte':'wafer4',ts=targetRows().filter(t=>t.groupId===g.groupId);assert.equal(ts.length,g.candidates);write(priv+'/'+key+'-targets.json',ts);
 const identity=ts.map(t=>{const i=items.get(t.id);return{id:i.id,title:i.title,description:i.description,isbn:i.isbn,jan:i.jan,image:i.image,images:i.images,evidence:i.evidence,offerUrls:[...new Set(i.offers.map(o=>o.url))],protected:!!(i.editorial||i.summary||i.locked||i.manualFields?.length)}});write(priv+'/'+key+'-identity.json',identity);console.log(JSON.stringify({key,rows:identity.map(({id,title,isbn,jan,protected:p})=>({id,title,isbn,jan,protected:p}))}));
 for(const url of g.sources)capture.push({url,groupId:g.groupId});
 for(const i of identity)for(const url of i.offerUrls.filter(u=>u.includes('/product/detail/')||u.includes('mandarake.co.jp/order/detailPage/')))capture.push({url,groupId:g.groupId});
}
write(dir+'/order.json',groups.map((g,n)=>({...g,key:n?'alacarte':'wafer4',status:'researching'})));write(priv+'/capture.json',capture);
