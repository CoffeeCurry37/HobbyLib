// Collect candidates, never write uncertain image/title matches to the catalogue.
import ts from'typescript';import{readFileSync,writeFileSync,readdirSync,mkdtempSync,mkdirSync,existsSync,rmSync}from'node:fs';import{createRequire}from'node:module';import{join,resolve}from'node:path';import{tmpdir}from'node:os';
const[input,output]=process.argv.slice(2),dir=mkdtempSync(join(tmpdir(),'radar-images-')),require=createRequire(import.meta.url);mkdirSync(output,{recursive:true});
try{for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(dir,f.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(dir,f),readFileSync('lib/radar/'+f));
 const{fetchPublic,parseHtml}=require(join(dir,'collector.cjs')),{createItem}=require(join(dir,'engine.cjs')),{sameProduct}=require(join(dir,'identity.cjs')),{applyMetadata}=require(join(dir,'metadata.cjs'));
 const state=JSON.parse(readFileSync(input,'utf8')),items=state.items.filter(i=>!i.image&&!i.demo),audit={attempted:0,matched:0,unresolved:[]};
 for(const item of items){const file=join(output,item.id+'.json');if(existsSync(file))continue;audit.attempted++;
  try{let matched;for(const offer of item.offers.slice(0,1)){try{const page=await fetchPublic(offer.url),p=parseHtml(page.text,page.url).products.find(p=>p.image&&sameProduct(item,applyMetadata(createItem(p.title,p.description,p.offer,state.prefs),p.facts||{},p.offer.url)));if(p){matched=p;break;}}catch{}}
   if(!matched){const url='https://www.suruga-ya.jp/search?search_word='+encodeURIComponent(item.title),page=await fetchPublic(url),candidates=parseHtml(page.text,page.url).products.filter(p=>p.image&&sameProduct(item,applyMetadata(createItem(p.title,p.description,p.offer,state.prefs),p.facts||{},p.offer.url)));if(candidates.length===1)matched=candidates[0];}
   if(matched){writeFileSync(file,JSON.stringify(matched));audit.matched++;}else audit.unresolved.push({id:item.id,reason:'没有唯一明确匹配'});
  }catch(e){audit.unresolved.push({id:item.id,reason:e.message});}
  writeFileSync(join(output,'audit.json'),JSON.stringify(audit,null,2));if(audit.attempted%20===0)console.log(JSON.stringify({attempted:audit.attempted,matched:audit.matched,remaining:items.length-audit.attempted}));await new Promise(r=>setTimeout(r,1000));
 }console.log(JSON.stringify(audit));
}finally{rmSync(dir,{recursive:true,force:true});}
