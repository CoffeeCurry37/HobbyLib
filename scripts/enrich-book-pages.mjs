// Input URLs must be observed publisher / publisher-registered book pages.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const [input,planFile,output]=process.argv.slice(2);if(!output)throw new Error('Usage: enrich-book-pages.mjs export.json observed-pages.json output-directory');
const state=JSON.parse(readFileSync(input,'utf8')),plan=JSON.parse(readFileSync(planFile,'utf8')),folder=resolve(output);mkdirSync(folder,{recursive:true});
const rows=[],failures=[];let cursor=0;
const get=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});if(!r.ok)throw new Error('HTTP '+r.status);return r;};
await Promise.all(Array.from({length:3},async()=>{while(cursor<plan.length){const {isbn,sourceUrl}=plan[cursor++];try{
 const host=new URL(sourceUrl).hostname;if(!['www.kodansha.co.jp','www.hanmoto.com'].includes(host))throw new Error('Unrecognized book source');
 const item=state.items.find(i=>!i.image&&i.kind!=='set'&&(i.isbn===isbn||i.jan===isbn));if(!item)continue;
 const path=join(folder,host+'-'+isbn+'.html'),html=existsSync(path)?readFileSync(path,'utf8'):await(await get(sourceUrl)).text();writeFileSync(path,html);
 if(html.match(/property="books:isbn"\s+content="([^"]+)"/)?.[1]!==isbn)throw new Error('Page ISBN mismatch');
 const image=html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]||'';
 if(!/^https:\/\/(?:dvs-cover\.kodansha\.co\.jp|img\.hanmoto\.com)\//.test(image))throw new Error('No book cover');
 if(host==='www.hanmoto.com'&&/itemprop="image"\s+content="[^"<>]*noimage/.test(html))throw new Error('Publisher registry has no cover');
 const r=await get(image);if(!/^image\//.test(r.headers.get('content-type')||'')||(await r.arrayBuffer()).byteLength<1000)throw new Error('Cover unavailable');
 const releaseDate=host==='www.kodansha.co.jp'?html.match(/発売日\s*<\/h5>\s*<p[^>]*>\s*(\d{4}年\d{2}月\d{2}日)/)?.[1]||'':'';
 const msrp=host==='www.kodansha.co.jp'?Number(html.match(/定価：\s*([\d,]+)円/)?.[1]?.replaceAll(',',''))||0:0;
 rows.push({id:item.id,expectedTitle:item.title,sourceUrl,confirmed:host==='www.kodansha.co.jp',image,images:[image],facts:{isbn,...(releaseDate?{releaseDate,year:releaseDate.slice(0,4)}:{}),...(msrp?{msrp}:{})},method:'出版社或出版社登记书目：精确 ISBN 与封面逐项核对；仅保留可读取的实际封面'});
 }catch(e){failures.push({isbn,sourceUrl,error:e.message});}}}));
writeFileSync(join(folder,'book-page-rows.json'),JSON.stringify(rows,null,2));writeFileSync(join(folder,'audit-book-pages.json'),JSON.stringify({targets:plan.length,matched:rows.length,withCover:rows.length,failures},null,2));console.log(JSON.stringify({targets:plan.length,withCover:rows.length,failures:failures.length}));
