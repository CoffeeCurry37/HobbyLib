// Bounded public continuation: no credentials, wall bypass or invented data.
// node scripts/crawl-v14.mjs [output] [source|all] [maximum 1..2 pages]
import{existsSync,mkdirSync,readFileSync,writeFileSync}from'node:fs';
import{join,resolve}from'node:path';
import{loadRadar}from'./load-radar.mjs';
const output=resolve(process.argv[2]||'../capture-v14'),which=process.argv[3]||'all',maximum=Math.min(2,Math.max(1,Number(process.argv[4]||2)));
const ids=['mandarake','suruga','amiami','mercari','yahoo','melonbooks','toranoana','booth'];
const manifest=JSON.parse(readFileSync('lib/radar/fate-crawl-manifest.json','utf8'));
const tasks=manifest.sources.slice(-8).map((s,n)=>({...s,id:ids[n]}));
mkdirSync(output,{recursive:true});
const radar=loadRadar(),{fetchPublic,parseHtml,makeOffer}=radar.get('collector'),{offerKey}=radar.get('identity');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let stopping=false;
process.once('SIGINT',()=>{stopping=true;});process.once('SIGTERM',()=>{stopping=true;});

// Public Yahoo HTML may omit visible cards but contain this exact result array.
// Do not recurse into recommendations, rankings, related items, or other state.
function yahooListingState(html,url,parsed){
 const request=new URL(url);
 if(request.hostname!=='auctions.yahoo.co.jp'||!request.pathname.startsWith('/search/search')||parsed.products.length)return parsed;
 const raw=html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];if(!raw)return parsed;
 let data;try{data=JSON.parse(raw);}catch{return parsed;}
 const listing=data?.props?.pageProps?.initialState?.search?.items?.listing;
 if(!Array.isArray(listing?.items)||listing.metadata?.searchEngineStatus!=='200')return parsed;
 const price=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
 const products=listing.items.flatMap(p=>{
  if(typeof p.auctionId!=='string'||!/^[a-zA-Z0-9]+$/.test(p.auctionId)||typeof p.title!=='string'||!p.title.trim())return [];
  const title=p.title.trim(),category=(Array.isArray(p.categoryPath)?p.categoryPath:[]).filter(c=>c.id!==0&&typeof c.name==='string').map(c=>c.name).join(' > ');
  const offer=makeOffer('https://auctions.yahoo.co.jp/jp/auction/'+p.auctionId,title,price(p.price));
  offer.listingTitle=title;offer.buyout=price(p.buyNowPrice);offer.priceKind=p.isFixedPrice===true?'ask':'bid';
  offer.priceBasis=p.taxFlag===0||p.taxFlag===1?'tax_included':'unspecified';
  offer.condition=p.itemCondition==='NEW'?'未使用':typeof p.itemCondition==='string'?'来源状态 '+p.itemCondition+'（详情待核对）':'详情待核对';
  offer.stockNote='公开搜索结果；库存及竞拍结束时间须进入原站核对。';
  return [{title,description:title,image:typeof p.imageUrl==='string'&&p.imageUrl.startsWith('https://')?p.imageUrl:'',offer,...(category?{categoryLabel:category}:{}),facts:{...(category?{category}:{}),...(p.category?.isAdult===true?{ageRating:'r18'}:{})}}];
 });
 if(!products.length)return parsed;
 const total=Number.isSafeInteger(listing.totalResultsAvailable)&&listing.totalResultsAvailable>=0?listing.totalResultsAvailable:null;
 let next=parsed.next;const offset=Number(data.query?.b),limit=Number(listing.metadata?.limit);
 // Require echoed offset/page size, full result window, and remaining count.
 if(!next&&Number.isSafeInteger(offset)&&offset>0&&limit===Number(data.query?.n)&&limit===listing.items.length&&String(offset)===request.searchParams.get('b')&&String(limit)===request.searchParams.get('n')&&total!==null&&offset+limit<=total){const page=new URL(request);page.searchParams.set('b',String(offset+limit));next=page.href;}
 return {...parsed,products,total,next,needsBrowser:false,parseMethod:'yahoo-public-search-state'};
}

async function capture(task){
 const checkpoint=join(output,task.id+'-checkpoint.json'),initial=task.next||task.url;
 const state=existsSync(checkpoint)?JSON.parse(readFileSync(checkpoint,'utf8')):{id:task.id,url:initial,next:initial,pages:[],failures:[],observations:0,status:'pending',total:task.total??null};
 state.failures||=[];const keys=new Set();
 for(const page of state.pages)for(const p of JSON.parse(readFileSync(join(output,page.file),'utf8')).products)keys.add(offerKey(p.offer));
 const save=()=>{state.updatedAt=new Date().toISOString();writeFileSync(checkpoint,JSON.stringify(state,null,2));};
 while(state.next&&state.pages.length<maximum&&!stopping){
  const url=state.next,n=state.pages.length,at=new Date().toISOString();
  try{
   const response=await fetchPublic(url);writeFileSync(join(output,task.id+'-'+n+'.html'),response.text);
   const parsed=yahooListingState(response.text,response.url,parseHtml(response.text,response.url));
   if(!parsed.products.length){const unavailable=/<title[^>]*>\s*Site Unavailable\s*<\/title>/i.test(response.text);throw new Error(unavailable?'Source returned Site Unavailable; cursor preserved; no bypass attempted':'Public response contained no parseable products; cursor preserved for review');}
   if(!parsed.products.some(p=>!keys.has(offerKey(p.offer))))throw new Error('Repeated product window; cursor preserved for review');
   const file=task.id+'-'+n+'.json';writeFileSync(join(output,file),JSON.stringify({url,finalUrl:response.url,observedAt:at,...parsed}));
   state.pages.push({url,file,count:parsed.products.length,observedAt:at});state.observations+=parsed.products.length;state.total=parsed.total??state.total;
   for(const p of parsed.products)keys.add(offerKey(p.offer));state.uniqueListings=keys.size;state.next=parsed.next;state.status=parsed.next?'bounded':'page_end';save();
   console.log(JSON.stringify({source:task.id,pages:state.pages.length,observations:state.observations,next:state.next}));
   if(state.next&&state.pages.length<maximum)await sleep(1500);
  }catch(error){state.failures.push({url,error:String(error.message||error),code:error.code||undefined,observedAt:at});state.status='paused';save();break;}
 }
 if(stopping&&state.next){state.status='stopped';save();}
 console.log(JSON.stringify({source:task.id,status:state.status,pages:state.pages.length,observations:state.observations,failures:state.failures}));return state;
}
try{
 const chosen=tasks.filter(t=>which==='all'||which===t.id);if(!chosen.length)throw new Error('Unknown source '+which);
 const results=await Promise.allSettled(chosen.map(capture));
 for(let i=0;i<results.length;i++)if(results[i].status==='rejected'){console.error(JSON.stringify({source:chosen[i].id,error:String(results[i].reason?.message||results[i].reason)}));process.exitCode=1;}
}finally{radar.close();}
