// Re-read product-scoped images and categories. Retain every failure and the next URL.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{resolve,join}from'node:path';import{createHash}from'node:crypto';import{loadRadar}from'./load-radar.mjs';
const[input,output,kind='aniplex',limit='2000']=process.argv.slice(2),folder=resolve(output);mkdirSync(folder,{recursive:true});
const radar=loadRadar(),{fetchPublic,parseHtml}=radar.get('collector'),{offerKey}=radar.get('identity');
const items=JSON.parse(readFileSync(input,'utf8')).items,urls=[...new Set(items.flatMap(i=>i.offers.filter(o=>kind==='aniplex'?o.url.startsWith('https://online.aniplex.co.jp/item'):kind==='kuji'?o.url.startsWith('https://www.suruga-ya.jp/product/detail/')&&/一番くじ/.test(i.title):!i.image&&o.url.startsWith('https://www.amiami.jp/top/detail/')).map(o=>{const u=new URL(o.url);if(kind==='aniplex')u.search='';return u.href})))].sort();
const reportFile=join(folder,'audit-'+kind+'.json'),report={kind,targets:urls.length,completed:0,products:0,failures:[],next:null};let stopped=false;process.on('SIGINT',()=>stopped=true);process.on('SIGTERM',()=>stopped=true);
const all=[];for(const url of urls.slice(0,Number(limit))){if(stopped)break;const file=join(folder,kind+'-'+createHash('sha256').update(url).digest('hex').slice(0,16)+'.json');
 try{let data;if(existsSync(file))data=JSON.parse(readFileSync(file));else{
  const code=new URL(url).pathname.slice(1,-5),cached=kind==='aniplex'?'/workspace/scratch/71cf528f27f2/expanded-source/aniplex-'+code+'.html':null;
  const page=cached&&existsSync(cached)?{text:readFileSync(cached,'utf8'),url}:await fetchPublic(url);
  if(!cached||!existsSync(cached))writeFileSync(file.replace('.json','.html'),page.text);
  const parsed=parseHtml(page.text,page.url);if(!parsed.products.length)throw new Error('No scoped product');
  // Only retained original list metadata may fill missing release facts; no invented stock or prices.
  const old=items.flatMap(i=>i.offers.filter(o=>{const u=new URL(o.url);u.search='';return u.href===url}).map(o=>({i,o})));
  data={url,at:new Date().toISOString(),products:parsed.products.map(p=>{const prior=old.find(x=>offerKey(x.o)===offerKey(p.offer));return {...p,facts:{...(prior?{event:prior.i.event,series:prior.i.series}:{}),...p.facts}}})};writeFileSync(file,JSON.stringify(data));
  await new Promise(r=>setTimeout(r,900));
 }
 all.push(...data.products);report.completed++;report.products+=data.products.length;
 }catch(e){report.failures.push({url,error:e.message});}
 report.next=urls[urls.indexOf(url)+1]||null;writeFileSync(reportFile,JSON.stringify(report,null,2));if(report.completed%25===0)console.log(JSON.stringify({kind,completed:report.completed,targets:report.targets,products:report.products,failures:report.failures.length}));
}
writeFileSync(join(folder,kind+'-products.json'),JSON.stringify(all));report.status=report.completed===urls.length&&!report.failures.length?'completed':stopped?'stopped':'partial';writeFileSync(reportFile,JSON.stringify(report,null,2));console.log(JSON.stringify(report));radar.close();
