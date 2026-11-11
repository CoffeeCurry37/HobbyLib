import {read,write,cached,clean} from './four-series-common.mjs';import assert from 'node:assert/strict';
const priv='work/series-evidence-20261111/climax-kengou',strip=s=>clean(s.replace(/<[^>]+>/g,' ')).normalize('NFKC').replace(/\s+/g,' ').trim(),links=[];
for(const url of ['https://www.kodansha.co.jp/comic/products/0000392813','https://www.kodansha.co.jp/comic/products/0000425986']){
const b=cached(url).body;
for(const m of b.matchAll(/<a\b[^>]*href=["']([^"']+\/comic\/products\/\d+)["'][^>]*>([\s\S]*?)<\/a>/g)){
const label=strip(m[2])+' '+clean(m[2].match(/alt="([^"]+)"/)?.[1]||'').normalize('NFKC');if(label.includes('英霊剣豪七番勝負'))links.push({url:m[1],label});
}}
const rows=[...new Map(links.map(r=>[r.url,r])).values()];assert.equal(rows.length,6);write(priv+'/publisher-links.json',rows);
write(priv+'/official-detail-capture.json',rows.map(r=>({url:r.url,kind:'html'})));console.log(JSON.stringify(rows));

