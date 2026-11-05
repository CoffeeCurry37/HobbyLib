import {read,cached,clean} from './four-series-common.mjs';
const year=process.argv[2],dir='work/series-evidence-20261104/kyomaf';
const plain=s=>clean(s.replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' '));
for(const {url} of read(dir+'/'+year+'-capture.json')){
 try{const {body}=cached(url);
 if(!url.endsWith('.html')){
 const tiles=[...body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)];
 console.log(JSON.stringify({url,total:body.match(/(\d+)\s*件の結果/)?.[1],tiles:tiles.map(([b])=>new URL(clean(b.match(/href="([^"]+\.html)"/)[1]),url).href),next:[...body.matchAll(/(?:href|data-url)="([^"]+)"/g)].map(m=>clean(m[1])).filter(s=>s.includes('start='))}));
 }else{
 const sections=[...body.matchAll(/<h2 class="footer-item__title">[\s\S]*?<div class="itemDetail">([\s\S]*?)<\/div>/g)].map(m=>plain(m[0])).filter(s=>/^商品/.test(s.trim()));
 const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2])}));
 console.log(JSON.stringify({url,variants,spec:sections.join('\n').replace(/\s+/g,' ').slice(0,2100)}));
 }
 }catch(e){console.log(url,e.message)}
}

