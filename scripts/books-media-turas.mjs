import assert from 'node:assert/strict';
import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/books-media',priv='work/series-evidence-20261105/books-media';
const at=new Date().toISOString(),series=cached('https://www.kodansha.co.jp/titles/1000030527');
const strip=s=>clean(s.replace(/<[^>]+>/g,' ')).normalize('NFKC').replace(/\s+/g,' ').trim();
const targets=read(priv+'/turas-targets.json'),volumes=[],rows=[];
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const setObservation={id:'turas-retailer-set',url:'https://www.suruga-ya.jp/product/detail/WK13678',at,kind:'public-web-text-observation',retailerCode:'WK13678',volumeRange:[1,22],publisher:'講談社',author:'カワグチタケシ',scope:'独立零售正文明确1至22卷；不是整个系列完结全集；不把第22卷ISBN当套装ISBN。'};
write(dir+'/web-observations.json',[setObservation]);
for(const t of targets){
 const original=originals.get(t.id),r={itemId:t.id,groupId:t.groupId,title:t.title,status:'pending',identityBinding:{isbn:original.isbn||'',jan:original.jan||'',productLine:original.productLine||'',offerUrls:[...new Set(original.offers.map(o=>o.url))].sort()}};
 if(original.editorial||original.locked||original.manualFields?.length||original.summary){rows.push({...r,status:'protected',reason:'保留认可、人工或既有简介'});continue}
 const official=t.sourceUrls.filter(u=>u.startsWith('https://www.kodansha.co.jp/comic/products/'));
 if(official.length===1){
  const p=cached(official[0]),titles=[...p.body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>strip(m[1])).filter(t=>t.includes('turas realta'));
  assert.equal(titles.length,1);const title=titles[0];
  const fields=Object.fromEntries([...p.body.matchAll(/<h5[^>]*>([\s\S]*?)<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map(m=>[strip(m[1]),strip(m[2])]));
  const isbn=p.body.match(/property="books:isbn"\s+content="(\d{13})"/)?.[1],v=+(title.match(/\((\d+)\)$/)?.[1]||0),tv=+(t.title.normalize('NFKC').match(/(?:\(|\s)(\d+)\)?(?:\s|$)/)?.[1]||0);
  assert.equal(isbn,t.isbn);assert.equal(v,tv);assert.ok(v>=1&&v<=23);assert.equal(fields.ISBN,isbn);
  assert.equal(fields['判型'],'新書');assert.match(fields['ページ数'],/^\d+ページ$/);assert.ok(p.body.includes('/titles/1000030527'));
  const credits=strip(p.body.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');
  assert.ok(credits.includes('TYPE-MOON')&&credits.replace(/\s/g,'').includes('カワグチタケシ'));
  const f={volume:v,title,isbn,format:fields['判型'],pages:parseInt(fields['ページ数']),releaseDate:fields['発売日']||fields['発売日']===0?fields['発売日']:undefined,source:p.source};
  volumes.push(f);
  Object.assign(r,{status:'supported',scope:'出版社单卷实体书页：系列、卷次、ISBN逐项一致；电子书入口不作为纸本ISBN版本',sourceRole:'publisher-physical-volume',officialTitle:title,source:p.source,catalogueSource:series.source,volume:v,isbn,summary:'《Fate/Grand Order -turas réalta-》第'+v+'卷，TYPE-MOON原作、カワグチタケシ作画，讲谈社出版。纸本为新书判，共'+f.pages+'页；本卷ISBN为'+isbn+'。',notes:'单卷ISBN与厂商页精确匹配；保留原标题、图片及所有挂牌；未新增电子版或改写现有书号。'});
 }else if(t.id==='family-b2dccdb61ccca484a2b9ee8fd58317f1'){
  assert.ok(strip(series.body).includes('全23件'));
  Object.assign(r,{status:'supported',scope:'出版社系列总目录；本条是系列汇总，非实物套装',sourceRole:'publisher-series-index',officialTitle:'Fate/Grand Order -turas réalta-',source:series.source,summary:'《Fate/Grand Order -turas réalta-》是TYPE-MOON原作、カワグチタケシ作画、讲谈社出版的FGO第一部漫画改编系列。本条为各卷的系列目录；各单卷以自己的ISBN区分，不代表一套实物书。',notes:'作者归属另与出版社卷1页核对；系列目录不按实物套装计件。',second:cached('https://www.kodansha.co.jp/comic/products/0000052938').source.url});
 }else if(t.id==='99580aa8-c85e-44ee-90d1-38be2b146bc8'){
  assert.ok(t.sourceUrls.includes(setObservation.url));
  Object.assign(r,{status:'supported',scope:'独立零售编号WK13678正文确认1至22卷组合；不将单册ISBN视为整套ISBN',sourceRole:'publisher-series-with-retailer-set',officialTitle:'Fate/Grand Order -turas réalta- 1–22巻セット',source:series.source,second:setObservation.url,observation:{...setObservation,sha256:hash(JSON.stringify(setObservation))},summary:'《Fate/Grand Order -turas réalta-》第1至22卷的零售组合，由カワグチタケシ作画、讲谈社出版。组合范围以零售编号WK13678的说明为准，不包含第23卷，也不等于整个系列的完结全集。',notes:'留存JAN 9784065436097是第22卷书号，不写成套装书号；现有字段原样保留，明确组合范围。'});
 }else throw Error('Unreviewed book '+t.id);
 rows.push(r);
}
assert.equal(volumes.length,23);assert.equal(new Set(volumes.map(v=>v.volume)).size,23);assert.equal(rows.length,25);
write(dir+'/turas-facts.json',{at,catalogueSource:series.source,volumes:volumes.sort((a,b)=>a.volume-b.volume),accessNote:'网页工具旧403与本轮普通公开直连200不同；未登录、未绕过，已保存原HTML哈希。'});
write(dir+'/cases-turas.json',{at,rows});
console.log(JSON.stringify({reviewed:rows.length,supported:rows.filter(r=>r.status==='supported').length,volumes:volumes.map(v=>({volume:v.volume,isbn:v.isbn,pages:v.pages}))}));

