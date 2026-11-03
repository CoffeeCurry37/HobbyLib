// Extract factual official variant records; never assumes listing counts prove identity.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir='work/series-evidence-20261103',out='research/series-evidence-20261103',h=u=>crypto.createHash('sha256').update(u).digest('hex');
export const decode=s=>String(s||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([a-f\d]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replace(/&(?:ldquo|rdquo);/g,'"').replace(/&(?:lsquo|rsquo);/g,"'").replaceAll('&nbsp;',' ');
export const plain=s=>decode(String(s||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'')).replace(/[ \t]+/g,' ').trim();
// Titles are text, not HTML: <単品> is a sale-scope qualifier and must survive.
export const signature=s=>decode(s).normalize('NFKC').toLowerCase().replace(/[\s“”"]/g,'');
export function titleForms(title,group){
 const set=new Set([signature(title)]),prefixes=[];
 if(group==='series-ce68dddea90c2498')prefixes.push('【大阪通販】','Fate/Grand Order Servant Art Chronicle 最終再臨展 ');
 if(group==='series-88ff9ccb22db52ee')prefixes.push('Fate/Grand Order展 -星見の回廊- ');
 for(const year of [2022,2023,2024,2025,2026])prefixes.push(`Fate/Grand Order Fes. ${year} (${year-2015}周年) `);
 prefixes.push('Fate/Grand Order 10th Anniversary OVER THE SAME SKY (2025) ');
 for(const p of prefixes){const s=signature(title),prefix=signature(p);if(s.startsWith(prefix))set.add(s.slice(prefix.length));}
 return set;
}
const all=JSON.parse(fs.readFileSync(out+'/official-catalogues.json')),byUrl=Map.groupBy(all.entries,e=>e.url),details=[],unavailable=[];
for(const [url,entries]of byUrl){
 const key=h(url),metaPath=dir+'/cache/'+key+'.json';if(!fs.existsSync(metaPath)){unavailable.push({url,reason:'not-captured'});continue;}
 const meta=JSON.parse(fs.readFileSync(metaPath));if(meta.status!=='captured'){unavailable.push({url,reason:meta.error});continue;}
 const body=fs.readFileSync(dir+'/cache/'+key+'.html','utf8');assert.equal(h(body),meta.sha256,'Source content changed');
 const schemas=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{try{const v=JSON.parse(m[1]);return Array.isArray(v)?v:v['@graph']||[v]}catch{return []}}),product=schemas.find(x=>x['@type']==='Product');
 if(!product||!product.name||product.sku!==entries[0].sku){unavailable.push({url,reason:'official-product-schema-missing-or-SKU-mismatch'});continue;}
 const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^\"]+)"[^>]*data-attr-url="([^\"]*)"[^>]*data-attr-value="([^\"]+)"[\s\S]*?<\/li>/g)].map(m=>({variantId:m[1],label:plain(m[3]),variationUrl:decode(m[2]),image:m[0].match(/<img[^>]+src="([^\"]+)"/)?.[1]})).map(v=>({...v,image:v.image?new URL(decode(v.image),url).href:null,imageRole:'official-labelled-variant-reference',visualChecked:false}));
 assert.equal(new Set(variants.map(v=>v.variantId)).size,variants.length,'Duplicate variant IDs');
 const block=body.split(/<span>商品概要<\/span>/)[1]?.split('<!-- ご注意 -->')[0]||'',text=plain(block),declared=Number(plain(product.name).match(/全(\d+)種/)?.[1])||null;
 const specification=text.match(/(?:■仕様|仕様)\s*([\s\S]*?)(?:※|■関連|©|&copy;|$)/)?.[1]?.trim().slice(0,700)||null;
 const d={url,sku:product.sku,title:plain(product.name),eventGroupIds:entries.map(e=>e.groupId),source:{url,at:meta.at,sha256:meta.sha256,cacheReused:!!meta.legacyCacheReused},declaredDesignCount:declared,selectableVariantCount:variants.length,variantListCompleteForPage:!!declared&&declared===variants.length,randomSale:/ランダム|トレーディング|ブラインド/.test(text+' '+product.name),completeSetOffered:variants.some(v=>/コンプリートセット/.test(v.label)),reissueMentioned:/再販|復刻/.test(text+' '+product.name),specification,images:(Array.isArray(product.image)?product.image:[product.image]).filter(Boolean),imageRole:variants.length>1?'official-group-reference':'official-product-reference',imageVisualChecked:false,releaseDate:null,variants};
 details.push(d);
}
const targets=JSON.parse(fs.readFileSync(dir+'/targets-projection.json')),selected=new Set(all.catalogues.map(c=>c.groupId)),detailsByUrl=new Map(details.map(d=>[d.url,d])),matches=[],issues=[];
for(const i of targets.filter(i=>selected.has(i.groupId))){
 if(i.editorial||i.locked){matches.push({itemId:i.id,groupId:i.groupId,status:'protected-existing-review',reason:'Existing editorial or manual lock; no changed fields'});continue;}
 const candidates=[];
 for(const url of i.sourceUrls){const d=detailsByUrl.get(url);if(!d)continue;const forms=titleForms(i.title,i.groupId),equal=title=>[...titleForms(title,i.groupId)].some(v=>forms.has(v));for(const v of d.variants)if(equal(v.label))candidates.push({d,v,method:signature(v.label)===signature(i.title)?'exact-official-source-and-full-variant-title':'exact-source-and-variant-title-after-known-event-prefix'});if(!d.variants.length&&equal(d.title))candidates.push({d,v:null,method:'exact-official-source-and-full-product-title'});}
 const conflictingObservation=candidates.length===1&&(i.officialObservations||[]).some(o=>o.url!==candidates[0].d.url||(o.variant&&o.variant!==candidates[0].v?.variantId));
 if(candidates.length===1&&!conflictingObservation){const {d,v,method}=candidates[0];matches.push({itemId:i.id,groupId:i.groupId,status:'official-identity-supported',title:i.title,sourceUrl:d.url,sourceSha256:d.source.sha256,sourceAt:d.source.at,sku:d.sku,variantId:v?.variantId||null,officialTitle:v?.label||d.title,image:v?.image||d.images[0]||null,imageRole:v?'official-labelled-variant-reference':'official-product-reference',imageVisualChecked:false,method,fullProductVerified:false,needsFreshTargetRead:true,productionApplied:false});}
 else {const reason=conflictingObservation?'conflicting-official-source-variant-key':candidates.length>1?'multiple-full-title-candidates':i.sourceUrls.some(u=>detailsByUrl.has(u))?'source-page-present-title-or-variant-not-exact':'no-captured-exact-official-source';issues.push({itemId:i.id,groupId:i.groupId,status:'pending-item-evidence',title:i.title,reason});}
}
const summary={at:new Date().toISOString(),catalogues:all.catalogues.length,catalogueEntries:all.entries.length,uniqueDetailUrls:byUrl.size,detailsCapturedAndParsed:details.length,detailsUnavailable:unavailable.length,selectableVariants:details.reduce((n,d)=>n+d.variants.length,0),selectedSnapshotRecords:matches.length+issues.length,protected:matches.filter(m=>m.status==='protected-existing-review').length,identitySupported:matches.filter(m=>m.status==='official-identity-supported').length,unresolved:issues.length,productVerified:0,productionApplied:0,completeGroups:0,limits:['Matching uses completed V6 local snapshot, not fresh live target versions.','Source URL plus full variant title is evidence for identity, not all five editorial checks.','Official image labels are extracted; no image visual verification implied.','Each event has historical/exhibitor/giveaway gaps outside current official store catalogue.']};
fs.mkdirSync(out+'/details',{recursive:true});for(const d of details)fs.writeFileSync(out+'/details/'+d.sku+'.json',JSON.stringify(d,null,2)+'\n');
fs.writeFileSync(out+'/identity-matches.json',JSON.stringify({summary,matches},null,2)+'\n');fs.writeFileSync(out+'/unresolved.json',JSON.stringify({summary,sourceFailures:unavailable,items:issues},null,2)+'\n');fs.writeFileSync(out+'/evidence-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
for(const c of all.catalogues)console.log(JSON.stringify({event:c.event,identitySupported:matches.filter(m=>m.groupId===c.groupId&&m.status==='official-identity-supported').length,protected:matches.filter(m=>m.groupId===c.groupId&&m.status==='protected-existing-review').length,unresolved:issues.filter(m=>m.groupId===c.groupId).length}));

