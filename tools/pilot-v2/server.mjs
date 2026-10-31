// Local experiment only: explicit assets, no production client, no outbound server requests.
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openV2Store} from './store.mjs';
export function createV2({dataDir,port=8791}={}){
 const store=openV2Store(dataDir);store.initialize();const token=randomBytes(32).toString('hex');
 const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/collector.css':['collector.css','text/css; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/favicon.svg':['favicon.svg','image/svg+xml']};
 const server=http.createServer(async(req,res)=>{
  const host='127.0.0.1:'+server.address().port,origin='http://'+host;
  const send=(status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
  if(req.headers.host!==host||(req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'仅允许本机同源访问'});
  const path=new URL(req.url,origin).pathname;
  if(req.method==='GET'&&assets[path]){const [file,type]=assets[path];return send(200,readFileSync(new URL('./public/'+file,import.meta.url)),type);}
  if(req.method==='GET'&&path==='/api/catalog')return send(200,{...store.snapshot(),token});
  if(req.method==='GET'&&path.startsWith('/api/product/')){let id;try{id=decodeURIComponent(path.slice('/api/product/'.length));}catch{return send(400,{error:'无效商品路径'});}const d=store.detail(id);return send(d?200:404,d||{error:'商品不存在'});}
  if(req.method==='GET'&&path==='/api/export'){res.setHeader('Content-Disposition','attachment; filename="pilot-v2-review.json"');return send(200,{scope:'local-pilot-v2',...store.snapshot()});}
  const write=path.match(/^\/api\/(review|summary|scenario)\/([a-zA-Z0-9_-]+)$/);
  if(req.method==='POST'&&write){
   if(req.headers.origin!==origin||req.headers['x-pilot-token']!==token||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))return send(403,{error:'请求来源校验失败'});
   const chunks=[];let size=0;try{for await(const c of req){size+=c.length;if(size>16000)return send(413,{error:'内容过长'});chunks.push(c);}const v=JSON.parse(Buffer.concat(chunks));return send(201,write[1]==='review'?store.saveReview(write[2],v):store.change(write[2],v,write[1]));}catch(e){return send(409,{error:e.message});}
  }
  return send(404,{error:'无此接口；试点不提供生产同步'});
 });
 return {server,store,start:()=>new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',()=>ok(server.address()));}),close:()=>new Promise(ok=>server.close(()=>{store.close();ok();}))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=createV2({port:Number(process.env.HOBBYLIB_V2_PORT||8791),dataDir:process.env.HOBBYLIB_V2_DATA_DIR});const a=await app.start();console.log('Collector Radar V2: http://127.0.0.1:'+a.port+' — isolated first30');process.on('SIGINT',async()=>{await app.close();process.exit(0);});}
