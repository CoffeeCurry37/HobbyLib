// Explicit, bounded, public-source capture. Never loaded by the workbench server.
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,DATA,sha,read,write,safeDataDir} from './common.mjs';
safeDataDir();const out=resolve(DATA,'source-cache');mkdirSync(out,{recursive:true});
const inputs=read(resolve(ROOT,'research/pilot-300-20261029/source-plan.json'));
if(inputs.length>35)throw new Error('Capture budget exceeded');
const permitted=new Set(['typemoon.com','www.kodansha.co.jp','www.bandai.co.jp','fate-extella.jp','info.fate-extella.jp','fate-extella-link.jp','www.goodsmile.com','www.goodsmile.info','online.aniplex.co.jp']);
const report=[];
for(const spec of inputs){
 const file=resolve(out,spec.id+'.json');if(existsSync(file)){report.push({...read(file),body:undefined});continue;}
 const at=new Date().toISOString();let entry={...spec,retrievedAt:at};
 try{const url=new URL(spec.url);if(!permitted.has(url.hostname)||url.protocol!=='https:')throw new Error('Source not allowed');
  const res=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(18000),headers:{'User-Agent':'HobbyLib-local-research/1.0'}});
  const text=await res.text();if(text.length>3_000_000)throw new Error('Response too large');
  entry={...entry,httpStatus:res.status,finalUrl:res.url,bodySha256:sha(text),body:text,status:res.ok&&!/mainte2.channel|サーバーメンテナンス中|Access Denied|Just a moment/.test(res.url+' '+text.slice(0,5000))?'captured':'unavailable'};
 }catch(e){entry={...entry,status:'unavailable',error:String(e.message)};}
 write(file,entry);report.push({...entry,body:undefined});console.log(JSON.stringify({id:entry.id,status:entry.status,http:entry.httpStatus}));
}
write(resolve(DATA,'source-capture-log.json'),report);
