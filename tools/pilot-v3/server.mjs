import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT} from '../pilot-workbench/common.mjs';
export function createV3({port=8793,version='latest'}={}){
 const v6=version==='latest'&&existsSync(resolve(ROOT,'work/pilot-v6/catalogue-v6.json'));
 const v5=version==='latest'&&existsSync(resolve(ROOT,'research/pilot-v5-20261101/catalogue-v5.json'));
 const v4=version!=='v3'&&existsSync(resolve(ROOT,'research/pilot-v4-20261031/catalogue-v4.json'));
 const catalogue=v6?'work/pilot-v6/catalogue-v6.json':v5?'research/pilot-v5-20261101/catalogue-v5.json':v4?'research/pilot-v4-20261031/catalogue-v4.json':'research/pilot-v3-20261030/catalogue-v3.json';
 const results=v5?'research/pilot-v5-20261101/results-200.json':v4?'research/pilot-v4-20261031/results-200.json':'research/pilot-v3-20261030/results-70.json';
 const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/collector.css':['collector.css','text/css; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/favicon.svg':['favicon.svg','image/svg+xml']};
 const server=http.createServer((req,res)=>{const origin='http://127.0.0.1:'+server.address().port;const send=(status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
 if(req.headers.host!==new URL(origin).host||(req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'只允许本机同源访问'});if(req.method!=='GET')return send(405,{error:'当前工作台仅供浏览，未连接正式商品库'});
 const path=new URL(req.url,origin).pathname;if(assets[path]){const [file,type]=assets[path];return send(200,readFileSync(new URL('./public/'+file,import.meta.url)),type);}
 if(path==='/api/catalog')return send(200,readFileSync(resolve(ROOT,catalogue)));
 if(path==='/api/results')return send(200,readFileSync(resolve(ROOT,results)));
 const match=path.match(/^\/image\/([a-f0-9]{64})$/);if(match){const dir=resolve(ROOT,'work/pilot-v3/source-cache'),meta=resolve(dir,match[1]+'.json');if(!existsSync(meta))return send(404,{error:'图像未缓存'});const m=JSON.parse(readFileSync(meta));if(m.status!=='captured'||m.file!==match[1]+'.img'||!/^image\/(jpeg|png|webp|gif)$/.test(m.contentType))return send(404,{error:'无有效图像'});return send(200,readFileSync(resolve(dir,m.file)),m.contentType);}
 return send(404,{error:'无此入口'});
 });return {server,start:()=>new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',()=>ok(server.address()));}),close:()=>new Promise(ok=>server.close(ok))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=createV3({port:Number(process.env.HOBBYLIB_V3_PORT||8793)});console.log('Collector Radar V3: http://127.0.0.1:'+(await app.start()).port);}
