import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261114/melty-capsule',priv='work/series-evidence-20261114/melty-capsule';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const groups=read('research/series-evidence-20261113/strangefake-mirror/next-sources.json').groups,items=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),capture=[];
for(const [n,g]of groups.entries()){
 const key=n?'capsule':'melty',ts=targetRows().filter(t=>t.groupId===g.groupId);assert.equal(ts.length,10);write(priv+'/'+key+'-targets.json',ts);
 const identity=ts.map(t=>{const i=items.get(t.id);return {id:i.id,title:i.title,description:i.description,isbn:i.isbn,jan:i.jan,image:i.image,images:i.images,evidence:i.evidence,offerUrls:[...new Set(i.offers.map(o=>o.url))],protected:!!(i.editorial||i.summary||i.locked||i.manualFields?.length)}});write(priv+'/'+key+'-identity.json',identity);
 console.log(JSON.stringify({key,rows:identity.map(i=>({id:i.id,title:i.title,isbn:i.isbn,jan:i.jan,image:i.image,protected:i.protected}))}));
 const urls=n?g.sources:identity.flatMap(i=>i.evidence.map(e=>e.url).filter(u=>u?.startsWith('https://www.kadokawa.co.jp/product/')));for(const url of new Set(urls))capture.push({url,groupId:g.groupId});
 if(n){const {body,source}=cached(g.sources[0]);console.log(JSON.stringify({source,imgs:[...body.matchAll(/<img[^>]*>/g)].map(m=>m[0]),section:body.slice(body.indexOf('缶バッジコレクション')-350,body.indexOf('缶バッジコレクション')+1300)}));for(const i of identity){const u=i.offerUrls.find(u=>u.includes('/product/detail/'));if(u)capture.push({url:u.split('?')[0],groupId:g.groupId});}}
}
write(dir+'/order.json',groups.map((g,n)=>({...g,key:n?'capsule':'melty',status:'researching'})));write(priv+'/capture.json',capture);
