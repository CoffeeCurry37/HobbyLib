// Public catalogue capture with restartable pages and product-specific evidence.
import ts from 'typescript';
import{readFileSync,writeFileSync,readdirSync,mkdtempSync,mkdirSync,existsSync,rmSync}from'node:fs';
import{createRequire}from'node:module';import{join,resolve}from'node:path';import{tmpdir}from'node:os';
const output=resolve(process.argv[2]),selected=process.argv[3]||'all',temporary=mkdtempSync(join(tmpdir(),'source-catalogue-')),require=createRequire(import.meta.url);
mkdirSync(output,{recursive:true});let stopping=false;process.on('SIGINT',()=>stopping=true);process.on('SIGTERM',()=>stopping=true);
const aniplex=['fateproject','fateGO'].map(id=>({id:'aniplex-'+id,url:'https://online.aniplex.co.jp/'+id,maxPages:20}));
const amiami=[['figures','1',8],['books','8',8],['music','7',8]].map(([id,category,maxPages])=>({id:'amiami-'+id,url:'https://slist.amiami.jp/top/search/list?s_keywords=Fate&pagemax=60&s_sortkey=regtimed&s_cate_tag='+category,maxPages}));
amiami.push({id:'amiami-typemoon-books',url:'https://slist.amiami.jp/top/search/list?pagemax=60&s_cate2=161&s_maker_id=2638',maxPages:8});
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(temporary,file.replace('.ts','.cjs')),ts.transpileModule(readFileSync('lib/radar/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(temporary,f),readFileSync('lib/radar/'+f));
 const{fetchPublic,parseHtml,yen}=require(join(temporary,'collector.cjs')),{offerKey}=require(join(temporary,'identity.cjs')),{readHtml,all,decode}=require(join(temporary,'html.cjs'));
 for(const config of [...aniplex,...amiami].filter(c=>selected==='all'||c.id.startsWith(selected))){
  if(stopping)break;const path=join(output,config.id+'.json'),state=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{...config,next:config.url,pages:[],products:[],failures:[],details:[],total:null};
  const persist=()=>writeFileSync(path,JSON.stringify({...state,updatedAt:new Date().toISOString()}));
  const products=new Map(state.products.map(p=>[offerKey(p.offer),p]));
  if(state.total!==null&&products.size>=state.total)state.next=null;
  while(state.next&&state.pages.length<config.maxPages&&!stopping){
   try{const page=await fetchPublic(state.next),parsed=parseHtml(page.text,page.url);if(!parsed.products.length)throw new Error('No scoped catalogue products');
    const pageKey=parsed.products.map(p=>offerKey(p.offer)).sort().join('|');if(state.pages.some(p=>p.key===pageKey))throw new Error('Repeated catalogue window');
    state.pages.push({url:state.next,count:parsed.products.length,key:pageKey});state.total=parsed.total??state.total;for(const p of parsed.products)products.set(offerKey(p.offer),p);state.products=[...products.values()];
    state.next=state.total!==null&&products.size>=state.total?null:parsed.next; if(config.id.startsWith('aniplex')&&state.next){const u=new URL(state.next);u.searchParams.set('sz','200');state.next=u.href;}
    persist();console.log(JSON.stringify({source:config.id,pages:state.pages.length,products:products.size,total:state.total,next:!!state.next}));
   }catch(e){state.failures.push({url:state.next,error:e.message});state.status='paused';persist();break;}
   await new Promise(r=>setTimeout(r,1000));
  }
  const targets=state.products.filter(p=>!/^聖晶石販売ページ$/.test(p.title));
  for(const product of targets){
   if(stopping)break;const code=config.id.startsWith('aniplex')?new URL(product.offer.url).pathname.slice(1,-5):new URL(product.offer.url).searchParams.get('gcode')||new URL(product.offer.url).searchParams.get('scode');
   const filename=(config.id.startsWith('aniplex')?'aniplex-':'amiami-')+code+'.json',detailPath=join(output,filename);if(state.details.includes(filename))continue;
   if(existsSync(detailPath)){state.details.push(filename);persist();continue;}
   try{const page=await fetchPublic(product.offer.url),parsed=parseHtml(page.text,page.url);if(!parsed.products.length)throw new Error('No scoped product detail');
    writeFileSync(join(output,(config.id.startsWith('aniplex')?'aniplex-':'amiami-')+code+'.html'),page.text);
    const details=parsed.products.map(p=>({...p,provisional:false,image:p.image||product.image,facts:{...product.facts,...p.facts,series:p.facts?.series||product.facts?.series}}));
    if(config.id.startsWith('aniplex'))for(const li of all(readHtml(page.text),n=>n.tag==='li'&&!!n.attrs['data-attr-url']&&!!n.attrs['data-attr-id'])){
     const variant=details.find(p=>p.offer.variant===li.attrs['data-attr-id']);if(!variant)continue;
     await new Promise(r=>setTimeout(r,500));const response=await fetchPublic(li.attrs['data-attr-url']),v=JSON.parse(response.text).product;if(!v||!v.productName)throw new Error('Invalid official variant response');
     variant.title=v.productName||variant.title;variant.offer.listingTitle=variant.title;
     // A variation response often repeats the shared gallery. The SKU thumbnail identifies the chosen design.
     if(!variant.image||/\/temple?tes\//.test(variant.image))variant.image=v.images?.large?.[0]?.absURL||v.images?.large?.[0]?.url&&new URL(v.images.large[0].url,page.url).href||variant.image;
     variant.offer.price=Number.isFinite(v.price?.sales?.value)?v.price.sales.value:null;variant.offer.priceBasis='tax_included';variant.offer.productKey=v.id;
     if(v.available===false||v.isUnavailable===true||/ご購入いただけません|販売終了/.test((v.availability?.messages||[]).join(' ')))variant.offer.availability='sold';
     if(v.releaseDateString){variant.facts.releaseDate=v.releaseDateString;variant.facts.year=v.releaseDateString.slice(0,4);variant.offer.releaseDate=v.releaseDateString;}
     const msrp=yen(v.retailPrice||'');if(msrp!==null)variant.facts.msrp=msrp;
     if(typeof v.brand==='string'&&v.brand)variant.facts.brand=v.brand;
     for(const group of v.attributes||[])for(const a of group.attributes||[]){const value=(Array.isArray(a.value)?a.value.join(' '):String(a.value||'')).normalize('NFKC');if(a.label==='JANコード'&&/^\d{8}$|^\d{13}$/.test(value)){variant.facts.jan=value;variant.offer.jan=value;}if(a.label==='ISBN'&&/^\d{10}$|^\d{13}$/.test(value)){variant.facts.isbn=value;variant.offer.isbn=value;}}
    }
    writeFileSync(detailPath,JSON.stringify({url:product.offer.url,at:new Date().toISOString(),products:details}));state.details.push(filename);persist();
    if(state.details.length%20===0)console.log(JSON.stringify({source:config.id,details:state.details.length,targets:targets.length}));
   }catch(e){state.failures.push({url:product.offer.url,error:e.message});persist();}
   await new Promise(r=>setTimeout(r,1000));
  }
  const unresolved=state.failures.filter(f=>!state.products.some(p=>p.offer.url===f.url&&state.details.includes((config.id.startsWith('aniplex')?'aniplex-':'amiami-')+(config.id.startsWith('aniplex')?new URL(p.offer.url).pathname.slice(1,-5):new URL(p.offer.url).searchParams.get('gcode')||new URL(p.offer.url).searchParams.get('scode'))+'.json'))&&!(state.total!==null&&products.size>=state.total&&f.error==='No scoped catalogue products'));
  state.resolvedFailures=[...(state.resolvedFailures||[]),...state.failures.filter(f=>!unresolved.includes(f))];state.failures=unresolved;
  state.status=stopping?'stopped':state.next?'bounded':state.failures.length?'partial':'completed';persist();console.log(JSON.stringify({source:config.id,status:state.status,details:state.details.length,failures:state.failures.length}));
 }
}finally{rmSync(temporary,{recursive:true,force:true});}
