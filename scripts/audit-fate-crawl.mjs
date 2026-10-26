import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';import {tmpdir} from 'node:os';import {join} from 'node:path';
const require=createRequire(import.meta.url),dir=mkdtempSync(join(tmpdir(),'radar-fate-audit-'));
const pages=Math.max(1,Number(process.argv[2]||100000));
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts'))){const compiled=ts.transpileModule(readFileSync('lib/radar/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")');writeFileSync(join(dir,file.replace('.ts','.cjs')),compiled);}
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(dir,f),readFileSync('lib/radar/'+f));
 const {fetchPublic,parseHtml}=require(join(dir,'collector.cjs')),{FATE_SEARCHES}=require(join(dir,'source-presets.cjs')),{createItem}=require(join(dir,'engine.cjs')),{DEFAULT_PREFS}=require(join(dir,'types.cjs')),{applyMetadata}=require(join(dir,'metadata.cjs')),{productIndex,findProduct}=require(join(dir,'identity.cjs')),{inferredPath}=require(join(dir,'taxonomy.cjs'));
 const report={startedAt:new Date().toISOString(),scope:'Fate 全品类公开匿名入口；含关键词及来源系列补充。未读取账号。',observationPolicy:'保留全部来源观察；归并统计和商品库导入分别处理。',sources:[],items:[],finishedAt:''},catalogue=[],index=productIndex(catalogue);
 for(const preset of FATE_SEARCHES){const entry={name:preset.name,url:preset.url,status:'pending',pages:[],total:null,next:preset.url,added:0,matched:0,error:''};report.sources.push(entry);const seen=new Set();
  for(let n=1;entry.next&&n<=pages;n++){
   const url=entry.next;if(seen.has(url)){entry.status='repeated_page';entry.error='原站返回重复分页链接';break;}seen.add(url);process.stdout.write(`读取 ${preset.name} 第 ${n} 页\n`);
   try{const page=await fetchPublic(url),parsed=parseHtml(page.text,page.url);if(!parsed.products.length)throw new Error(page.url!==url?`重定向到非商品页：${page.url}`:'未识别到商品；未知总量，不能当作零条');
    entry.pages.push({url,finalUrl:page.url,count:parsed.products.length,total:parsed.total,observedAt:new Date().toISOString()});entry.total=parsed.total;entry.next=parsed.next;
    for(const p of parsed.products){let item=createItem(p.title,p.description,p.offer,DEFAULT_PREFS,p.image);if(p.facts)item=applyMetadata(item,p.facts,p.offer.url);const existing=findProduct(catalogue,item,index);if(existing){entry.matched++;existing.item.offers.push(...item.offers);}else{entry.added++;catalogue.push(item);index.add(item);}report.items.push({...p,path:inferredPath(item)});}
    entry.status=entry.next?'bounded':'completed';if(entry.next&&n<pages)await new Promise(r=>setTimeout(r,3500));
   }catch(error){entry.status='failed';entry.error=String(error.message||error);break;}
  }
 }
 report.finishedAt=new Date().toISOString();writeFileSync('lib/radar/fate-crawl-audit.json',JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify({sources:report.sources.map(s=>({name:s.name,status:s.status,pages:s.pages.length,total:s.total,added:s.added,matched:s.matched,error:s.error})),catalogued:catalogue.length})+'\n');
}finally{rmSync(dir,{recursive:true,force:true});}
