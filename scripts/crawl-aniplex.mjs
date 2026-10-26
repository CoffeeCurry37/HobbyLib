// Public official catalogues, restartable list and individual-variant capture.
import ts from 'typescript';import{readFileSync,writeFileSync,readdirSync,mkdtempSync,mkdirSync,existsSync,rmSync}from'node:fs';import{createRequire}from'node:module';import{join,resolve}from'node:path';import{tmpdir}from'node:os';
const output=resolve(process.argv[2]),temporary=mkdtempSync(join(tmpdir(),'aniplex-crawl-')),require=createRequire(import.meta.url);mkdirSync(output,{recursive:true});
let stopping=false;process.on('SIGINT',()=>stopping=true);process.on('SIGTERM',()=>stopping=true);
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(temporary,file.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(temporary,f),readFileSync('lib/radar/'+f));
 const{fetchPublic,parseHtml}=require(join(temporary,'collector.cjs')),{ANIPLEX_EVENTS}=require(join(temporary,'aniplex-events.cjs'));
 const reportPath=join(output,'audit.json'),audit=existsSync(reportPath)?JSON.parse(readFileSync(reportPath,'utf8')):{at:new Date().toISOString(),sources:[],details:0,variants:0,failures:[]};
 const persist=()=>writeFileSync(reportPath,JSON.stringify(audit,null,2));
 for(const[group,event]of Object.entries(ANIPLEX_EVENTS)){
  if(stopping)break;const file=join(output,group+'.json');if(existsSync(file))continue;
  try{const url='https://online.aniplex.co.jp/'+group,root=await fetchPublic(url),initial=parseHtml(root.text,root.url),products=new Map(initial.products.map(p=>[p.offer.url,p]));if(group.endsWith('.html'))initial.total=products.size;let next=initial.next;
   if(next){const large=new URL(next);large.searchParams.set('start','0');large.searchParams.set('sz','200');next=large.href;}
   const seen=new Set();while(next&&!stopping){if(seen.has(next))throw new Error('Repeated official page');seen.add(next);const response=await fetchPublic(next),page=parseHtml(response.text,response.url);if(!page.products.length)break;for(const p of page.products)products.set(p.offer.url,p);next=page.next;await new Promise(r=>setTimeout(r,800));}
   const data={group,event,url,total:initial.total,products:[...products.values()],at:new Date().toISOString(),complete:!next&&initial.total===products.size};writeFileSync(file,JSON.stringify(data));audit.sources.push({group,event,total:initial.total,products:products.size,complete:data.complete});persist();console.log(JSON.stringify(audit.sources.at(-1)));
  }catch(e){audit.failures.push({group,error:e.message});persist();console.log(JSON.stringify({group,error:e.message}));}
 }
 if(process.argv.includes('--details'))for(const source of audit.sources){const data=JSON.parse(readFileSync(join(output,source.group+'.json'),'utf8'));for(const product of data.products){if(stopping)break;const id=new URL(product.offer.url).pathname.slice(1),file=join(output,'detail-'+id+'.json');if(existsSync(file))continue;
  try{const page=await fetchPublic(product.offer.url),parsed=parseHtml(page.text,page.url);if(!parsed.products.length)throw new Error('No scoped product detail');const variants=parsed.products.map(p=>({...p,title:p.title.includes('Fes.')||p.title.includes('最終再臨展')?p.title:source.event+' '+p.title,facts:{...p.facts,event:source.event},image:p.image||product.image}));writeFileSync(file,JSON.stringify({url:product.offer.url,at:new Date().toISOString(),products:variants}));audit.details++;audit.variants+=variants.length;persist();if(audit.details%20===0)console.log(JSON.stringify({details:audit.details,variants:audit.variants}));
  }catch(e){audit.failures.push({url:product.offer.url,error:e.message});persist();}await new Promise(r=>setTimeout(r,1000));
 }if(stopping)break;}
 console.log(JSON.stringify({sources:audit.sources.length,details:audit.details,variants:audit.variants,failures:audit.failures.length,stopped:stopping}));
}finally{rmSync(temporary,{recursive:true,force:true});}
