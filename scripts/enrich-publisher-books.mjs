// Exact ISBN search exposed by KADOKAWA's public catalogue. Validate each
// product page and image; do not reuse a neighbouring volume's cover.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const [input,output]=process.argv.slice(2);if(!output)throw new Error('Usage: enrich-publisher-books.mjs export.json output-directory');
const state=JSON.parse(readFileSync(input,'utf8')),folder=resolve(output);mkdirSync(folder,{recursive:true});
const items=state.items.filter(i=>!i.image&&i.kind!=='set'&&/^978404\d{7}$/.test(i.isbn||i.jan||'')&&/KADOKAWA|角川/i.test(i.publisher||i.brand||'')),rows=[],failures=[];let cursor=0;
const get=async(url,options={})=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(25000),redirect:'error'});if(!r.ok)throw new Error('HTTP '+r.status);return r;};
await Promise.all(Array.from({length:3},async()=>{while(cursor<items.length){const item=items[cursor++],isbn=item.isbn||item.jan;try{
 const searchFile=join(folder,'kadokawa-search-'+isbn+'.json');let search;
 if(existsSync(searchFile))search=JSON.parse(readFileSync(searchFile,'utf8'));else{search=await(await get('https://www.kadokawa.co.jp/product/search/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams({isbn,pageno:'1',pageno_book:'1',pageno_media:'1',size:'20',itemIdKbn:'1'})})).json();writeFileSync(searchFile,JSON.stringify(search));}
 const matches=[...new Map(Object.values(search.result||{}).flat().filter(r=>r.isbn===isbn&&/^\d{12}$/.test(r.itemCode)).map(r=>[r.itemCode,r])).values()];
 if(matches.length!==1)throw new Error('ISBN did not resolve to one physical edition');
 const match=matches[0],sourceUrl='https://www.kadokawa.co.jp/product/'+match.itemCode+'/',file=join(folder,'publisher-'+isbn+'.html');let html;
 if(existsSync(file))html=readFileSync(file,'utf8');else{html=await(await get(sourceUrl)).text();writeFileSync(file,html);}
 const facts=JSON.parse(html.match(/window\.item\s*=\s*(\{[^\n]+\});/)?.[1]||'{}');
 if(String(facts.isbn_13)!==isbn)throw new Error('Product ISBN mismatch');
 const image=html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]||'';
 if(!/^https:\/\/cdn\.kdkw\.jp\/cover_/.test(image))throw new Error('No actual publisher cover');
 const cover=await get(image);if(!/^image\//.test(cover.headers.get('content-type')||'')||(await cover.arrayBuffer()).byteLength<1000)throw new Error('Cover unavailable');
 const releaseDate=String(facts.release_date||'');
 const row={id:item.id,expectedTitle:item.title,sourceUrl,confirmed:true,image,images:[image],facts:{isbn,publisher:'KADOKAWA',...(releaseDate?{releaseDate,year:releaseDate.slice(0,4)}:{}),...(Number(facts.price)>0?{msrp:Number(facts.price)}:{})},method:'出版社商品页：ISBN 精确对应实体版本；主封面可读取；保留出版社发售日及含税定价'};
 rows.push(row);console.log(JSON.stringify({completed:rows.length,targets:items.length,isbn}));
 }catch(e){failures.push({id:item.id,isbn,error:e.message});}}}));
writeFileSync(join(folder,'publisher-additional-rows.json'),JSON.stringify(rows,null,2));writeFileSync(join(folder,'audit-publisher-additional.json'),JSON.stringify({targets:items.length,matched:rows.length,withCover:rows.length,failures},null,2));console.log(JSON.stringify({targets:items.length,withCover:rows.length,failures:failures.length}));
