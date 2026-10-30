// Local pilot only. No production client, env credential loading or outbound requests.
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore} from './store.mjs';
import {REPORT,read} from './common.mjs';
export function createWorkbench({dataDir,port=8789}={}){
 const store=openStore(dataDir);store.initialize();const token=randomBytes(32).toString('hex');
 const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/favicon.svg':['favicon.svg','image/svg+xml']};
 const server=http.createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${server.address().port}`;
  const send=(status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
  if(req.headers.host!==`127.0.0.1:${server.address().port}`||(req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'仅允许本机同源访问'});
  const url=new URL(req.url,origin),path=url.pathname;
  if(req.method==='GET'&&assets[path]){const [f,type]=assets[path];return send(200,readFileSync(new URL('./public/'+f,import.meta.url)),type);}
  if(req.method==='GET'&&path==='/api/bootstrap')return send(200,{token,samples:store.list(),preparation:read(resolve(REPORT,'preparation.json')),baseline:((({rows,...x})=>x)(read(resolve(REPORT,'baseline-30.json')))),evidence:read(resolve(REPORT,'evidence.json')),catalogues:read(resolve(REPORT,'catalogues.json'))});
  if(req.method==='GET'&&/^\/api\/sample\/P\d{3}$/.test(path)){const value=store.detail(path.split('/').at(-1));return send(value?200:404,value||{error:'不存在'});}
  if(req.method==='GET'&&path==='/api/reviews'){const reviews=store.list().flatMap(s=>store.history(s.id).map(r=>({id:s.id,...r})));res.setHeader('Content-Disposition','attachment; filename="pilot-reviews.json"');return send(200,{scope:'local-pilot-only',productionWrites:0,reviews});}
  if(req.method==='POST'&&/^\/api\/sample\/P\d{3}\/review$/.test(path)){
   if(req.headers['x-pilot-token']!==token||req.headers.origin!==origin||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))return send(403,{error:'审核请求来源校验失败'});
   const chunks=[];let length=0;try{for await(const chunk of req){length+=chunk.length;if(length>20000){send(413,{error:'内容过长'});return;}chunks.push(chunk);}const result=store.saveReview(path.split('/')[3],JSON.parse(Buffer.concat(chunks).toString('utf8')));return send(201,result);}catch(e){return send(409,{error:e.message});}
  }
  return send(404,{error:'没有此功能；试点不提供生产同步接口'});
 });
 return {server,store,start:()=>new Promise(r=>server.listen(port,'127.0.0.1',()=>r(server.address()))),close:()=>new Promise(r=>server.close(()=>{store.close();r();}))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=createWorkbench({port:Number(process.env.HOBBYLIB_PILOT_PORT||8789),dataDir:process.env.HOBBYLIB_PILOT_DATA_DIR});const a=await app.start();console.log(`HobbyLib pilot: http://127.0.0.1:${a.port} — local experiment only`);process.on('SIGINT',async()=>{await app.close();process.exit(0);});}
