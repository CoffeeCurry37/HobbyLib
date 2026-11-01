// Explicit public-source capture; offline recognition/server never fetch arbitrary URLs.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from '../pilot-workbench/common.mjs';
import {hash as sha} from './core.mjs';
export const CACHE=resolve(ROOT,'work/pilot-v3/source-cache');
const hosts=new Set(['bpnavi.jp','www.gamecity.ne.jp','www.bandaispirits.co.jp','on-line.1kuji.com','cdn.comic-walker.com','comic-walker.com','store.kadokawa.co.jp','fes.fate-go.jp','exhibition.fate-go.jp','www.lawson.co.jp','1kuji.com','www.1kuji.com','assets.1kuji.com','dvs-cover.kodansha.co.jp','auc-pctr.c.yimg.jp','www.fate-sn.com','typemoon.com','cache.typemoon.com','fate-extella.jp','info.fate-extella.jp','fate-extella-link.jp','celebration.fate-extella.jp','www.marv.jp','corp.marv.jp','marvelous-usa.com','www.bandai.co.jp','bandai-a.akamaihd.net','p-bandai.jp','www.suruga-ya.jp','cdn.suruga-ya.jp','www.suruga-ya.com','order.mandarake.co.jp','img.mandarake.co.jp','img.amiami.jp','www.amiami.jp','static.mercdn.net','auctions.c.yimg.jp','www.goodsmile.com','www.goodsmile.info','images.goodsmile.info','images.goodsmile.com','online.aniplex.co.jp','www.aniplex.co.jp','www.kodansha.co.jp','api.kodansha.co.jp','cdn.kdkw.jp','www.kadokawa.co.jp','shop.toysanta.jp','bikkuriman.zonosite.com']);
export function permitted(url){const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port||!hosts.has(u.hostname))throw Error('Source not in approved public host list: '+u.hostname);return u;}
export function verifyDigest(actual,expected){if(expected&&actual!==expected)throw Error('Source image changed; archived annotations cannot be reused');}
export async function capture(spec){
 const key=sha(spec.url),metaFile=resolve(CACHE,key+'.json');if(existsSync(metaFile)){const old=JSON.parse(readFileSync(metaFile,'utf8'));if(!spec.retry||old.status==='captured'){if(old.status==='captured')verifyDigest(old.sha256,spec.expectedSha256);return {...old,body:undefined,cacheHit:true};}}
 const start=performance.now();let result={id:spec.id,url:spec.url,kind:spec.kind||'html',at:new Date().toISOString(),requestCount:0,cacheHit:false};
 try{let url=spec.url,res;for(let hop=0;hop<4;hop++){permitted(url);result.requestCount++;res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'HobbyLib-Research/0.3 (bounded public catalogue)'}});if(res.status>=300&&res.status<400){url=new URL(res.headers.get('location'),url).href;continue;}break;}
 result.finalUrl=url;result.httpStatus=res.status;if(!res.ok)throw Error('HTTP '+res.status);
 const limit=spec.kind==='image'?12_000_000:3_000_000;let size=0,chunks=[];for await(const chunk of res.body){size+=chunk.length;if(size>limit)throw Error('Body limit exceeded');chunks.push(chunk);}
 const bytes=Buffer.concat(chunks);result.bytes=size;result.sha256=sha(bytes);verifyDigest(result.sha256,spec.expectedSha256);result.contentType=res.headers.get('content-type')||'';
 if(spec.kind==='image'){
  const magic=bytes.subarray(0,12);const mime=magic[0]===255&&magic[1]===216?'image/jpeg':magic.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':magic.subarray(0,4).toString()==='RIFF'&&magic.subarray(8,12).toString()==='WEBP'?'image/webp':/^GIF8[79]a/.test(magic.toString())?'image/gif':null;
  if(!mime)throw Error('Not a raster image');result.declaredContentType=result.contentType;result.contentType=mime;
  result.file=key+'.img';writeFileSync(resolve(CACHE,result.file),bytes);
 }else{result.body=bytes.toString('utf8');if(/Access Denied|Just a moment|サーバーメンテナンス中|mainte2.channel/.test(result.body.slice(0,6000)+url))throw Error('Access or maintenance gate');}
 result.status='captured';
 }catch(e){result.status='unavailable';result.error=e.message;}
 result.elapsedMs=Math.round(performance.now()-start);writeFileSync(metaFile,JSON.stringify(result,null,2));return {...result,body:undefined};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/capture.mjs')){
 const path=resolve(ROOT,process.argv[2]||'work/pilot-v3/capture-plan.json');if(!path.startsWith(resolve(ROOT,'work')+'/')&&!path.startsWith(resolve(ROOT,'work')+'\\'))throw Error('Plan must be in work/');
 const plan=JSON.parse(readFileSync(path,'utf8'));if(plan.length>350)throw Error('Request budget exceeded');mkdirSync(CACHE,{recursive:true});
 const results=[];let next=0;await Promise.all(Array.from({length:4},async()=>{while(next<plan.length){const i=next++;const r=await capture(plan[i]);results[i]=r;if((i+1)%10===0||i<4)console.log(JSON.stringify({done:i+1,total:plan.length,id:r.id,status:r.status,cacheHit:r.cacheHit}));}}));
 writeFileSync(path.replace(/\.json$/,'.receipts.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({completed:results.length,captured:results.filter(r=>r.status==='captured').length,requests:results.reduce((n,r)=>n+(r.cacheHit?0:r.requestCount),0),cacheHits:results.filter(r=>r.cacheHit).length}));
}


