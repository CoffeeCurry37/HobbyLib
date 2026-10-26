// Recheck uncertain sets and image-less inferred members using their recorded parent source.
import ts from 'typescript';import{readFileSync,writeFileSync,readdirSync,mkdtempSync,mkdirSync,existsSync,rmSync}from'node:fs';import{createRequire}from'node:module';import{join,resolve}from'node:path';import{tmpdir}from'node:os';import{createHash}from'node:crypto';
const [input,target]=process.argv.slice(2),output=resolve(target),temporary=mkdtempSync(join(tmpdir(),'known-records-')),require=createRequire(import.meta.url);mkdirSync(output,{recursive:true});
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(temporary,file.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(temporary,f),readFileSync('lib/radar/'+f));
 const{fetchPublic,parseHtml}=require(join(temporary,'collector.cjs'));
 let data;try{data=JSON.parse(readFileSync(input,'utf8'));}catch{throw new Error('Verified complete backup required');}
 const missing=new Set(data.items.filter(i=>i.inferredMember&&!i.image).map(i=>i.id)),parents=new Set(data.relations.filter(r=>r.kind==='contains'&&missing.has(r.toId)).map(r=>r.fromId)),urls=[...new Set(data.items.filter(i=>parents.has(i.id)).flatMap(i=>i.offers.filter(o=>o.source==='骏河屋').map(o=>o.url)))];
 urls.push('https://www.amiami.jp/top/detail/detail?gcode=BOK-4605-R','https://www.amiami.jp/top/detail/detail?scode=TVG-PSP-0979-R','https://www.amiami.jp/top/detail/detail?gcode=BOK-0607A');
 const audit={source:'已收录套装原站复核',targets:urls.length,details:0,failures:[]};
 for(const url of urls){const path=join(output,'known-'+createHash('sha256').update(url).digest('hex').slice(0,16)+'.json');if(existsSync(path)&&!process.argv.includes('--refresh')){audit.details++;continue;}
  try{const response=await fetchPublic(url),parsed=parseHtml(response.text,response.url);if(!parsed.products.length)throw new Error('No scoped product detail');writeFileSync(path,JSON.stringify({url,products:parsed.products,at:new Date().toISOString()}));audit.details++;}
  catch(e){audit.failures.push({url,error:e.message});}writeFileSync(join(output,'audit.json'),JSON.stringify(audit,null,2));if(audit.details%10===0)console.log(JSON.stringify({details:audit.details,targets:urls.length}));await new Promise(r=>setTimeout(r,1000));
 }
 console.log(JSON.stringify(audit));
}finally{rmSync(temporary,{recursive:true,force:true});}
