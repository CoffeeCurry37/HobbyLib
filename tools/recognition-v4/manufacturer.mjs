import fs from 'node:fs';
import {read,cached,sourceCache,enrichManufacturer,text} from './sources.mjs';
// Search discovery receipts are data. The same enrichment adapter handles all matching sources.
const plans=['manufacturer-pages.json','manufacturer-more.json','manufacturer-linked.json'].flatMap(n=>read('work/pilot-v4/'+n)).filter(p=>/^P\d+$/.test(p.id));
plans.push({id:'P199',url:'https://www.goodsmile.info/ja/product/6426/'});
const cache=sourceCache(),samples=read('work/pilot-300/samples.json'),enrichment=[],images=[];
for(const q of plans){const c=cached(q.url);if(c?.status!=='captured')continue;const s=samples.find(s=>s.id===q.id),p={id:q.id,sources:[q.url],images:[],tags:[]};enrichManufacturer(p,cache);const title=text(c.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
 if(!title||!p.images.length)continue;enrichment.push({sampleId:q.id,sourceUrl:q.url,sourceTitle:title,sourceHash:c.sha256,listingTitle:s.title,officialDetails:p.officialDetails,images:p.images,identityReview:'same character, product line and named variant; release/reissue scope kept separate'});for(const i of p.images)if(!cached(i.url))images.push({id:q.id,url:i.url,kind:'image',sourceUrl:q.url,role:i.role});}
fs.mkdirSync('research/pilot-v4-20261031',{recursive:true});fs.writeFileSync('research/pilot-v4-20261031/manufacturer-evidence.json',JSON.stringify(enrichment));fs.writeFileSync('work/pilot-v4/manufacturer-images.json',JSON.stringify([...new Map(images.map(i=>[i.url,i])).values()]));console.log(JSON.stringify({products:enrichment.length,images:images.length,titles:enrichment.map(e=>[e.sampleId,e.sourceTitle])}));
