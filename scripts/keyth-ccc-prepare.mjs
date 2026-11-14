import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,targetRows,clean} from './four-series-common.mjs';
const dir='research/series-evidence-20261114/keyth-ccc',priv='work/series-evidence-20261114/keyth-ccc';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const groups=read('research/series-evidence-20261114/melty-capsule/next-sources.json').groups,items=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),capture=[];
for(const [n,g]of groups.entries()){
 const key=n?'ccc':'keyth',ts=targetRows().filter(t=>t.groupId===g.groupId);assert.equal(ts.length,g.candidates);write(priv+'/'+key+'-targets.json',ts);
 const identity=ts.map(t=>{const i=items.get(t.id);return {id:i.id,title:i.title,description:i.description,isbn:i.isbn,jan:i.jan,image:i.image,images:i.images,evidence:i.evidence,offerUrls:[...new Set(i.offers.map(o=>o.url))],protected:!!(i.editorial||i.summary||i.locked||i.manualFields?.length)}});write(priv+'/'+key+'-identity.json',identity);
 console.log(JSON.stringify({key,rows:identity.map(i=>({id:i.id,title:i.title,isbn:i.isbn,jan:i.jan,description:i.description,image:i.image,protected:i.protected}))}));
 const urls=n?identity.flatMap(i=>i.evidence.map(e=>e.url).filter(u=>u?.startsWith('https://www.kadokawa.co.jp/product/'))):g.sources;for(const url of new Set(urls))capture.push({url,groupId:g.groupId});
 if(!n){const {body,source}=cached(g.sources[0]);console.log(JSON.stringify({source,text:clean(body.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').slice(0,8000),images:[...body.matchAll(/<img[^>]*>/g)].map(m=>m[0])}));for(const i of identity){const u=i.offerUrls.find(u=>u.includes('/product/detail/'));if(u)capture.push({url:u.split('?')[0],groupId:g.groupId});}}
}
write(dir+'/order.json',groups.map((g,n)=>({...g,key:n?'ccc':'keyth',status:'researching'})));write(priv+'/capture.json',capture);
