// Bounded public image lookup. Retailer CDN is a separate public asset surface;
// no cookies, login, proxy, challenge solving or modified access headers.
import {writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from '../pilot-workbench/common.mjs';
import {read} from './series.mjs';
const planPath=resolve(ROOT,'work/pilot-v3/image-search-plan.json');
const model=read('research/pilot-v3-20261030/catalogue-v3.json'),samples=read('work/pilot-300/samples.json').filter(s=>s.split==='development'&&!['P015','P026','P028'].includes(s.id)),plan=existsSync(planPath)?read(planPath):[];
for(const s of samples){const r=model.rows.find(r=>r.id===s.id),p=model.products.find(p=>p.id===r.productId);if(p.imageStatus==='local-confirmed')continue;for(const i of p.images){const u=new URL(i.url);if(u.hostname==='www.suruga-ya.jp'&&u.pathname==='/database/photo.php'){const code=u.searchParams.get('shinaban');if(/^[a-zA-Z0-9]+$/.test(code))plan.push({id:s.id+'-cdn-candidate',sampleId:s.id,url:'https://cdn.suruga-ya.jp/database/pics_webp/game/'+code.toLowerCase()+'.jpg.webp',kind:'image',sourceUrl:s.url,identityScope:code,derivedFrom:i.url,role:'店铺同一商品编号的公开目录图候选'});}}}
plan.push({id:'aslaug-cover-source',url:'https://typemoon.com/news/2022/gvfuKG'});
const unique=[...new Map(plan.map(p=>[p.url,p])).values()];writeFileSync(planPath,JSON.stringify(unique,null,2));console.log(JSON.stringify({boundedRequests:unique.length}));
