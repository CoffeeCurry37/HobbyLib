import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf';
const year=Number(process.argv[2]),g=read(dir+'/order.json').find(x=>Number(x.label.slice(-4))===year);
const queue=[g.source],seen=new Set(),pages=[],missing=[];let total;
for(let i=0;i<queue.length;i++){
 const u=queue[i];if(seen.has(u))continue;seen.add(u);
 if(!fs.existsSync('work/series-evidence-20261103/cache/'+hash(u)+'.json')){missing.push({url:u,groupId:g.groupId});continue}
 const {body,source}=cached(u);const n=Number(body.match(/(\d+)\s*件の結果/)?.[1]);if(n)total??=n;
 const entries=[...body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)].map(([tile])=>({url:new URL(clean(tile.match(/href="([^"]+\.html)"/)[1]),u).href}));
 const next=[...body.matchAll(/(?:href|data-url)="([^"]+)"/g)].map(m=>clean(m[1])).filter(s=>s.includes('Search-UpdateGrid?')&&s.includes('cgid='+new URL(g.source).pathname.slice(1))&&s.includes('start='));
 pages.push({source,entries});queue.push(...next);
 assert.ok(queue.length<20);
}
write(priv+'/'+year+'-pagination.json',missing);
if(!missing.length){const entries=[...new Set(pages.flatMap(p=>p.entries.map(e=>e.url)))];assert.equal(entries.length,total);write(dir+'/catalogue-'+year+'.json',{year,groupId:g.groupId,total,pages,entries});}
console.log(JSON.stringify({year,pages:pages.length,total,entries:pages.reduce((n,p)=>n+p.entries.length,0),missing}));

