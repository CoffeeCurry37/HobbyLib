import {createServer,IncomingMessage,ServerResponse} from 'node:http';
import {readFileSync,existsSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {randomBytes,createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {createGzip} from 'node:zlib';import {Readable} from 'node:stream';import {pipeline} from 'node:stream/promises';
import {openDatabase} from './sqlite';
import {browserAssistant} from './browser';
import {withSourceReader} from '../lib/radar/reader';
import {createScheduler} from './scheduler';
import {withDatabase} from '../lib/radar/store';
import {getStateResponse,postAction} from '../lib/radar/service';
import {BACKUP_IMPORT_BYTES} from '../lib/radar/import-limits';

const port=Number(process.env.PORT||8080),host=process.env.HOST||'127.0.0.1';
const origin=new URL(process.env.RADAR_ORIGIN||`http://localhost:${port}`).origin;
const password=process.env.RADAR_PASSWORD||'';if(password.length<16)throw new Error('Set RADAR_PASSWORD to a private password of at least 16 characters before starting.');
const passwordHash=createHash('sha256').update(password).digest();
const directory=resolve(process.env.RADAR_DATA_DIR||'./data');mkdirSync(directory,{recursive:true,mode:0o700});
const secretFile=join(directory,'session.key');if(!existsSync(secretFile))writeFileSync(secretFile,randomBytes(32),{mode:0o600,flag:'wx'});
const secret=readFileSync(secretFile);const database=openDatabase(join(directory,'radar.sqlite'));
const assetRoot=resolve('dist-standalone/client');
const sign=(value:string)=>createHmac('sha256',secret).update(value).digest('hex');
const same=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function authorized(req:IncomingMessage){const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('radar_session='))?.slice(14);if(!cookie)return false;const [expires,signature]=cookie.split('.');return !!signature&&Number(expires)>Date.now()&&same(signature,sign(expires+passwordHash.toString('hex')));}
const attempts=new Map<string,{count:number;until:number}>();
let queue:Promise<unknown>=Promise.resolve();function exclusive<T>(fn:()=>Promise<T>):Promise<T>{const next=queue.then(fn,fn);queue=next.catch(()=>{});return next;}
const browser=browserAssistant(directory);
const scheduler=createScheduler(database,origin,fn=>exclusive(()=>withSourceReader(browser.read,fn)));
const loginPage=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>登录 · Collector Radar</title><style>body{font:16px system-ui;background:#f5f7f2;color:#253c2b;max-width:440px;margin:12vh auto;padding:24px}form{padding:32px;background:white;border:1px solid #d5dfd1;border-radius:16px}h1{font-size:26px}p{line-height:1.8}input,button{box-sizing:border-box;width:100%;padding:13px;margin:12px 0;font:inherit;border:1px solid #9baa91;border-radius:7px}button{background:#315d3f;color:white;cursor:pointer}</style><form method="post" action="/login"><h1>收藏雷达</h1><p>独立运行工作室<br>输入部署时设置的工作室密码。</p><label>工作室密码<input type="password" name="password" autocomplete="current-password" required minlength="16"></label><button>进入商品库</button></form></html>`;
async function bodyOf(req:IncomingMessage,limit=4500000){const chunks:Buffer[]=[];let size=0;for await(const c of req){size+=c.length;if(size>limit)throw new Error('内容超过 '+Math.floor(limit/1000000)+' MB');chunks.push(c);}return Buffer.concat(chunks).toString('utf8');}
async function send(response:Response,res:ServerResponse,gzip=false){res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));if(!response.body){res.end();return;}if(gzip&&response.headers.get('Content-Type')?.includes('application/json')){res.removeHeader('Content-Length');res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');await pipeline(Readable.fromWeb(response.body as any),createGzip(),res);return;}const reader=response.body.getReader();try{for(;;){const next=await reader.read();if(next.done||res.destroyed)break;if(!res.write(Buffer.from(next.value)))await new Promise<void>(resolve=>res.once('drain',resolve));}}finally{reader.releaseLock();}res.end();}

const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");
 try{
  const url=new URL(req.url||'/',origin);
  if(req.method==='POST'&&req.headers.origin!==origin){res.writeHead(403);res.end('请求来源不匹配');return;}
  if(url.pathname==='/login'){
   if(req.method==='GET'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(loginPage);return;}
   if(req.method!=='POST'){res.writeHead(405);res.end();return;}
   const address=req.socket.remoteAddress||'local';const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
   const prior=attempts.get(address);if(prior&&prior.count>=8){res.writeHead(429);res.end('登录尝试过多，请 15 分钟后再试。');return;}
   const supplied=new URLSearchParams(await bodyOf(req)).get('password')||'';
   if(!timingSafeEqual(createHash('sha256').update(supplied).digest(),passwordHash)){attempts.set(address,{count:(prior?.count||0)+1,until:now+900000});res.writeHead(401,{'Content-Type':'text/html; charset=utf-8'});res.end(loginPage.replace('<p>','<p>密码不正确。<br>'));return;}
   attempts.delete(address);const expires=String(now+7*86400000);res.setHeader('Set-Cookie',`radar_session=${expires}.${sign(expires+passwordHash.toString('hex'))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${origin.startsWith('https:')?'; Secure':''}`);res.writeHead(303,{Location:'/'});res.end();return;
  }
  if(!authorized(req)){if(url.pathname.startsWith('/api/')){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'登录已过期，请刷新并重新登录'}));}else{res.writeHead(303,{Location:'/login'});res.end();}return;}
  if(url.pathname==='/api/accounts'){
   if(req.method==='GET'){await send(Response.json(browser.status()),res);return;}
   if(req.method!=='POST'){res.writeHead(405);res.end();return;}const input=JSON.parse(await bodyOf(req));
   const data=input.action==='open'?await browser.open(input.shop):input.action==='capture'?await browser.capture(input.shop,input.kind):input.action==='close'?(await browser.close(),{message:'本机浏览器已关闭；已保存的会话仍在专用配置目录'}):null;
   if(!data)throw new Error('无效的账号操作');await send(Response.json(data),res);return;
  }
  if(url.pathname==='/api/monitor'){
   if(req.method==='GET'){await send(Response.json({jobs:scheduler.status()}),res);return;}
   if(req.method==='POST'){const data=JSON.parse(await bodyOf(req));scheduler.resume(data.url);await send(Response.json({ok:true,jobs:scheduler.status()}),res);return;}
  }
  if(url.pathname==='/api/radar'){
   if(req.method!=='GET'&&req.method!=='POST'){res.writeHead(405);res.end();return;}
   const request=new Request(origin+url.pathname+url.search,{method:req.method,headers:{'Content-Type':'application/json',...(req.headers.origin?{Origin:req.headers.origin}:{})},...(req.method==='POST'?{body:await bodyOf(req,BACKUP_IMPORT_BYTES)}:{})});
   const action=()=>withSourceReader(browser.read,()=>withDatabase(database,()=>req.method==='POST'?postAction(request,'owner','standalone'):getStateResponse(request,'owner','standalone')));
   await send(req.method==='POST'?await exclusive(action):await action(),res,/\bgzip\b/.test(req.headers['accept-encoding']||''));return;
  }
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const filename=resolve(assetRoot,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(assetRoot+'/')||!existsSync(filename)||!statSync(filename).isFile()){res.writeHead(404);res.end('未找到页面');return;}
  const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
  res.setHeader('Content-Type',types[extname(filename)]||'application/octet-stream');res.end(readFileSync(filename));
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e instanceof Error?e.message:'操作失败'}));}
});
server.requestTimeout=120000;server.listen(port,host,()=>console.log(`Collector Radar ready at ${origin}. Background monitor follows saved settings.`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{scheduler.stop();void browser.close();server.close(()=>{database.close();process.exit(0);});});
