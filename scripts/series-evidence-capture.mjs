// Public, bounded source collection. No credentials and no production writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const privateRoot='work/series-evidence-20261103',cache=privateRoot+'/cache';
fs.mkdirSync(cache,{recursive:true});
const allowed=new Set(['www.taito.co.jp','www.taghobby.com','kujimap.com','clamp-net.com','hobby-maniax.com','news.fate-go.jp','1kuji.com','assets.1kuji.com','cdn.suruga-ya.jp','auctions.c.yimg.jp','www.bandai.co.jp','order.mandarake.co.jp','shop.toysanta.jp','www.suruga-ya.jp','on-line.1kuji.com','www.bandaispirits.co.jp','art.fate-go.jp','fes.fate-go.jp','exhibition.fate-go.jp','online.aniplex.co.jp','www.aniplex.co.jp','www.kadokawa.co.jp','www.typemoon.com','typemoon.com','cache.typemoon.com','anime.fate-go.jp']);
allowed.add('www.amiami.jp');allowed.add('robotrobot.jp');
allowed.add('auc-pctr.c.yimg.jp');
allowed.add('bandai-lifestyle.jp');
allowed.add('bandai-a.akamaihd.net');
for(const host of ['www.kodansha.co.jp','news.kodansha.co.jp','www.hanmoto.com'])allowed.add(host);
for(const host of ['stage.fate-go.jp','unison-s-g.com'])allowed.add(host);
for(const host of ['www.marv.jp','fate-extella.jp','www.fate-extella.jp','www.xseedgames.com','xseedgames.com'])allowed.add(host);
allowed.add('celebration.fate-extella.jp');
allowed.add('www.hobbystock.jp');
// Algernon's official public shop, discovered from its product catalogue.
allowed.add('market.algernonproduct.co.jp');
allowed.add('algernonproduct.co.jp');
// Official KADOKAWA shop index discovered for the current evidence round.
allowed.add('store.kadokawa.co.jp');
allowed.add('www.sk-japan.co.jp');
allowed.add('mochi2.shop-pro.jp');
allowed.add('img07.shop-pro.jp');
allowed.add('fate-extella-link.jp');
allowed.add('www.gamecity.ne.jp');
// Public publisher/regional press and retailer identity pages for LINK / Samurai.
for(const host of ['asia.sega.com','www.koeitecmoeurope.com','www.decibel-pr.com','auctions.yahoo.co.jp','www.mediamarkt.es','itemdrop.co.uk','www.gadcet.com'])allowed.add(host);
allowed.add('info.fate-extella.jp');
// Manufacturer / anime official entries for the next untouched evidence groups.
allowed.add('www.ensky.co.jp');
allowed.add('www.enskyshop.com');
allowed.add('anime.elmelloi.com');
// Key-th official shop linked from the discovered Fate/strange Fake catalogue.
allowed.add('www.curtain-damashii.com');
const allowedUrl=url=>{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port||!allowed.has(u.hostname))throw Error('Unapproved public source');return u;};
const planPath=process.argv[2],plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
if(!Array.isArray(plan)||plan.length>350)throw Error('Capture plan exceeds 350 URLs');
const oldCaches=['../hobbylib-review-20261028/work/pilot-v3/source-cache'];
const receiptFile=planPath.replace(/\.json$/,'.receipts.jsonl');
async function capture(spec){
 allowedUrl(spec.url);const key=hash(spec.url),meta=cache+'/'+key+'.json';
 if(fs.existsSync(meta)){const r=JSON.parse(fs.readFileSync(meta));if(!(process.argv.includes('--retry-environment-denied')&&r.errorCode==='EACCES'))return {...r,cacheHit:true};}
 for(const old of oldCaches){const p=path.join(old,key+'.json');if(!fs.existsSync(p))continue;const r=JSON.parse(fs.readFileSync(p));if(r.status==='captured'&&r.body&&Date.now()-Date.parse(r.at)<180*86400000){fs.writeFileSync(cache+'/'+key+'.html',r.body);const {body,...rest}=r;const result={...rest,legacyCacheReused:true,cacheHit:true};fs.writeFileSync(meta,JSON.stringify(result));return result;}}
 let r={url:spec.url,at:new Date().toISOString(),requestCount:0,cacheHit:false};
 try{
  let url=spec.url,res;for(let h=0;h<4;h++){allowedUrl(url);r.requestCount++;res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'HobbyLib-Research/0.4 (bounded public catalogue)'}});if(res.status>=300&&res.status<400){url=new URL(res.headers.get('location'),url).href;continue;}break;}
  r.finalUrl=url;r.httpStatus=res.status;if(!res.ok)throw Error('HTTP '+res.status);
  let bytes=0,chunks=[];for await(const chunk of res.body){bytes+=chunk.length;if(bytes>10000000)throw Error('Response exceeds bounded limit');chunks.push(chunk);}
  const buffer=Buffer.concat(chunks);r.bytes=bytes;r.sha256=hash(buffer);r.contentType=res.headers.get('content-type');
  const body=buffer.toString('utf8');if(/Access Denied|Just a moment|サーバーメンテナンス中|verify you are human/i.test(body.slice(0,6000)))throw Error('Access/maintenance gate');
  r.status='captured';r.title=body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const ext=spec.kind==='image'?'.img':'.html';fs.writeFileSync(cache+'/'+key+ext,buffer);r.file=key+ext;
 }catch(e){r.status='unavailable';r.error=e.message;r.errorCode=e.cause?.code;}
 fs.writeFileSync(meta,JSON.stringify(r,null,2));return r;
}
// Each hostname is sequential; at most three independent hosts run together.
const hostPlans=[...Map.groupBy(plan,s=>new URL(s.url).hostname).values()];let next=0,done=0;
await Promise.all(Array.from({length:Math.min(3,hostPlans.length)},async()=>{while(next<hostPlans.length){const group=hostPlans[next++];for(const spec of group){const r=await capture(spec);const fd=fs.openSync(receiptFile,'a');try{fs.writeSync(fd,JSON.stringify({...r,groupId:spec.groupId})+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}done++;if(done<8||done%10===0||done===plan.length)console.log(JSON.stringify({done,total:plan.length,url:r.url,status:r.status,cacheHit:r.cacheHit}));if(!r.cacheHit)await new Promise(resolve=>setTimeout(resolve,250));}}}));
