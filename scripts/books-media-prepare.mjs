import fs from 'node:fs';import {read,write,hash,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/books-media',priv='work/series-evidence-20261105/books-media';fs.mkdirSync(priv,{recursive:true});
for(const g of read(dir+'/order.json')){
 const rows=targetRows().filter(t=>t.groupId===g.groupId);write(priv+'/'+g.key+'-targets.json',rows);
 const urls=[...new Set(rows.flatMap(t=>t.sourceUrls))];
 const cache=urls.map(url=>{const key=hash(url);const files=['work/series-evidence-20261103/cache/'+key+'.json','../hobbylib-review-20261028/work/pilot-v3/source-cache/'+key+'.json'];return{url,caches:files.filter(p=>fs.existsSync(p)).map(p=>{const d=read(p);return{path:p,status:d.status,at:d.at,body:!!d.body,sha256:d.sha256}})};});
 write(priv+'/'+g.key+'-cache-index.json',cache);
 console.log(JSON.stringify({key:g.key,rows:rows.map(t=>({id:t.id,title:t.title,isbn:t.isbn,jan:t.jan,publisher:t.publisher,kind:t.kind})),cached:cache.filter(c=>c.caches.length)}));
}

