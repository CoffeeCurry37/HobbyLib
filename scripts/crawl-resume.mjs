// Durable, polite anonymous crawl. No shop cookies, age-gate bypass or account credentials.
import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
const output=resolve(process.argv[2]||'crawl-checkpoints'),which=process.argv[3]||'all';mkdirSync(output,{recursive:true});
const temporary=mkdtempSync(join(tmpdir(),'radar-crawl-')),require=createRequire(import.meta.url);
let stopping=false;process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(temporary,file.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(temporary,f),readFileSync('lib/radar/'+f));
 const {fetchPublic,parseHtml}=require(join(temporary,'collector.cjs')),{listingPageKey,searchScope}=require(join(temporary,'crawl-progress.cjs')),{advanceCrawl}=require(join(temporary,'crawl-queue.cjs'));
 const previous=JSON.parse(readFileSync('lib/radar/fate-crawl-audit.json','utf8'));
 const tasks=previous.sources.map((s,n)=>({id:n===3?'mandarake':'suruga-'+n,name:s.name,url:s.url,next:s.next,total:s.total,start:s.pages.length}));
 tasks.push({id:'suruga-doujin',name:'骏河屋 · Fate 同人原作',url:'https://www.suruga-ya.jp/search?category=1100&search_word=&ck=true&inStock=On&subgenre=Fate',start:0});
 for(const task of tasks.filter(t=>which==='all'||t.id===which)){
  const folder=join(output,task.id),path=join(folder,'checkpoint.json');mkdirSync(folder,{recursive:true});
  const checkpoint=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{...task,next:task.next||task.url,pages:[],observations:0,status:'pending'};
  const seen=new Set(checkpoint.pages.map(p=>p.url)),pageKeys=new Set(),listingUrls=new Set();checkpoint.pending||=[];
  for(const p of checkpoint.pages){const page=JSON.parse(readFileSync(join(folder,p.file),'utf8'));pageKeys.add(searchScope(page.finalUrl||page.url)+':'+listingPageKey(page.products));for(const product of page.products)listingUrls.add(product.offer.url);}
  if(checkpoint.status==='completed')continue;
  while(checkpoint.next&&!stopping){const url=checkpoint.next;if(seen.has(url)){checkpoint.status='repeated_page';break;}
   try{const response=await fetchPublic(url),parsed=parseHtml(response.text,response.url);if(!parsed.products.length)throw new Error('来源未返回商品列表，保留断点等待复核');
    const n=checkpoint.start+checkpoint.pages.length+1,at=new Date().toISOString(),file='page-'+n+'.json';
    writeFileSync(join(folder,file),JSON.stringify({url,finalUrl:response.url,observedAt:at,total:parsed.total,next:parsed.next,products:parsed.products}));
    const key=searchScope(response.url)+':'+listingPageKey(parsed.products),repeated=pageKeys.has(key),progress=advanceCrawl(url,{...parsed,next:repeated?null:parsed.next,incomplete:repeated},[...seen],checkpoint.pending);
    checkpoint.pages.push({url,file,count:parsed.products.length,observedAt:at,repeated});seen.add(url);pageKeys.add(key);for(const product of parsed.products)listingUrls.add(product.offer.url);checkpoint.observations+=parsed.products.length;checkpoint.uniqueListings=listingUrls.size;checkpoint.total=parsed.total??checkpoint.total;checkpoint.next=progress.next;checkpoint.pending=progress.pending;checkpoint.status=progress.next?'running':repeated?'window_limited':'completed';checkpoint.error=repeated?'重复结果窗口；未声明全量完成，按来源明确的年份/类别分段续采':'';checkpoint.updatedAt=at;
    writeFileSync(path,JSON.stringify(checkpoint,null,2));process.stdout.write(JSON.stringify({source:task.id,page:n,observations:checkpoint.observations,total:checkpoint.total,next:!!checkpoint.next})+'\n');
    if(checkpoint.next)await new Promise(r=>setTimeout(r,3500));
   }catch(error){checkpoint.status='paused';checkpoint.error=String(error.message||error);checkpoint.updatedAt=new Date().toISOString();writeFileSync(path,JSON.stringify(checkpoint,null,2));process.stdout.write(JSON.stringify({source:task.id,status:checkpoint.status,error:checkpoint.error})+'\n');break;}
  }
  if(stopping&&checkpoint.next){checkpoint.status='stopped';writeFileSync(path,JSON.stringify(checkpoint,null,2));}
 }
}finally{rmSync(temporary,{recursive:true,force:true});}
