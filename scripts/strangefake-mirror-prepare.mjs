import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,targetRows,clean} from './four-series-common.mjs';
const dir='research/series-evidence-20261113/strangefake-mirror',priv='work/series-evidence-20261113/strangefake-mirror';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(priv,{recursive:true});assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const groups=read('research/series-evidence-20261113/tsukihime-strangefake/next-sources.json').groups,items=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const capture=[];
for(const [n,g]of groups.entries()){
 const key=n?'mirror':'badges',ts=targetRows().filter(t=>t.groupId===g.groupId);assert.equal(ts.length,11);write(priv+'/'+key+'-targets.json',ts);
 const identity=ts.map(t=>{const i=items.get(t.id);return{id:i.id,title:i.title,description:i.description,jan:i.jan,isbn:i.isbn,image:i.image,images:i.images,evidence:i.evidence,offerUrls:[...new Set(i.offers.map(o=>o.url))],protected:!!(i.editorial||i.summary||i.locked||i.manualFields?.length)}});write(priv+'/'+key+'-identity.json',identity);
 console.log(JSON.stringify({key,identities:identity.map(i=>({id:i.id,title:i.title,image:i.image,jan:i.jan,protected:i.protected}))}));
 for(const url of g.sources){const {body,source}=cached(url);console.log(JSON.stringify({key,source,imgs:[...body.matchAll(/<img[^>]*>/g)].map(m=>m[0]).filter(s=>!s.includes('logo')).slice(0,35)}));capture.push({url,groupId:g.groupId});}
 for(const i of identity){const url=i.offerUrls.find(u=>u.includes('/product/detail/'));if(url)capture.push({url:url.split('?')[0],groupId:g.groupId});}
}
write(dir+'/order.json',groups.map((g,n)=>({...g,key:n?'mirror':'badges',status:'researching'})));write(priv+'/capture.json',capture);
