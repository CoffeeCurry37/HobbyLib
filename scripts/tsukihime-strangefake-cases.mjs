import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261113/tsukihime-strangefake',priv='work/series-evidence-20261113/tsukihime-strangefake',at=new Date().toISOString();assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const snapshot=read('work/v6/production-after.json'),originals=new Map(snapshot.items.map(i=>[i.id,i]));
const norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim(),strip=s=>norm(clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')));
const facts=read(priv+'/discovery-capture.json').map(({url})=>{
 const {body:b,source}=cached(url),data=JSON.parse(b.match(/window\.item\s*=\s*(\{[^\r\n]+\});/)[1]);
 const title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),volume=Number(title.match(/\((\d+)\)/)?.[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1]),format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
 assert.equal(data.item_code,new URL(url).pathname.split('/').filter(Boolean).at(-1));assert.equal(norm(data.disp_title),title);assert.equal(data.isbn_13,isbn);assert.equal(data.page_num,pages);assert.equal(format,'B6判');assert.equal(data.togo_item_kbn,1);assert.equal(data.product_form,5);
 const start=b.indexOf('id="book-title-sp"'),end=b.indexOf('同じシリーズ',start),body=strip(b.slice(start,end>start?end:start+20000));assert.ok(body.includes('紙書籍'));
 const key=title.startsWith('真月譚')?'tsukihime':'strangefake',authors=strip(data.author_name1);assert.ok(authors.includes(key==='tsukihime'?'佐々木少年':'森井 しづき')&&authors.includes('TYPE-MOON'));if(key==='strangefake')assert.ok(authors.includes('成田 良悟')&&body.includes('TYPE-MOON BOOKS版'));
 const heading=strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),label=key==='tsukihime'?'電撃コミックス':'角川コミックス・エース';assert.ok(heading.includes(label));
 return {key,source,officialTitle:title,volume,isbn,pages,format,releaseDate:data.release_date,magazineJan:data.magazine_jan||null,creator:key==='tsukihime'?'佐々木少年':'森井しづき',credits:authors,label,medium:'paper',scope:'只读本商品window.item及纸本书目字段；不采用关联电子版/推荐区资料。magazineJan与ISBN分别记录，非推测相等。'};
}).sort((a,b)=>a.key.localeCompare(b.key)||a.volume-b.volume);
assert.deepEqual(facts.filter(f=>f.key==='tsukihime').map(f=>f.volume),[1,2,3,4,5,6,7,8,9,10]);assert.deepEqual(facts.filter(f=>f.key==='strangefake').map(f=>f.volume),[1,2,3,4,5]);
const retailUrl='https://www.suruga-ya.jp/kaitori/search_buy?category=70110&search_word=Fate';
const observations=[{id:'strangefake-retailer-isbn-binding',url:retailUrl,at,kind:'public-web-text-observation',hashMeaning:'观察JSON哈希，不是原HTML哈希',facts:[
 {volume:2,code:'503172316',isbn:'9784048118231',releaseDate:'2026-02-04'},
 {volume:3,code:'503172325',isbn:'9784048118248',releaseDate:'2026-03-04'},
 {volume:4,code:'503172772',isbn:'9784048118255',releaseDate:'2026-04-10'},
 {volume:5,code:'503172773',isbn:'9784048118262',releaseDate:'2026-05-02'}
].map(f=>({...f,title:'新装版 Fate/strange Fake('+f.volume+') / 森井しづき',category:'B6コミック'})),scope:'四个管理编号逐行绑定标题、卷号、作者和ISBN；第3卷零售3月4日与出版社3月3日冲突，日期不写。库存/价格不采纳。'}];
write(dir+'/web-observations.json',observations);
const ob={id:observations[0].id,url:retailUrl,sha256:hash(JSON.stringify(observations[0]))},all=[];
const bind=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
const notes='仅补空简介与两条出处；认可、ISBN/JAN、原名、旧描述/证据、图片、个人状态、挂牌历史和关系保留。出版日期不等于具体印次，不补造ISBN或合并同卷多来源。';
for(const key of ['tsukihime','strangefake']){
 const books=facts.filter(f=>f.key===key),rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id),base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:bind(i)};
  if(i.editorial||i.manualFields?.length||i.locked||i.summary)return {...base,status:'protected',reason:'保留已认可或既有资料'};
  if(i.id.startsWith('family-')){
   assert.ok(i.description.includes('同出版社、同媒介版本'));const childIds=snapshot.relations.filter(r=>r.fromId===i.id&&r.kind==='contains').map(r=>r.toId);assert.equal(childIds.length,key==='tsukihime'?10:i.id==='family-0a2ecde8103f9d27ccdf0b70cb2e5a3d'?4:5);assert.ok(childIds.every(id=>read(priv+'/'+key+'-targets.json').some(t=>t.id===id)));
   return {...base,status:'supported',source:books[0].source,additionalSources:[books.at(-1).source],officialTitle:i.title,recordKind:'logical-series',childIds,
    scope:'现有逻辑父级与其单卷关系核对；官方纸本首卷及后续卷佐证作品和版本，不认定实体套装或拥有',
    summary:key==='tsukihime'?'《真月譚 月姫》纸本漫画系列目录，由佐々木少年绘制，官方书目列入電撃コミックス。各卷独立刊行并有独立ISBN；本条组织现有单卷，不表示一件实体套装或已拥有整套。':'《新装版 Fate/strange Fake》纸本漫画系列目录，森井しづき绘制，成田良悟／TYPE-MOON原作，角川コミックス・エース出版。此处为漫画新装版目录；各卷与TYPE-MOON BOOKS版分别保留，不表示实体套装、已经完结或已拥有全套。',
    notes:notes+' 两个同名新装版目录及各自成员关系保持，不自动归并。'};
  }
  const title=norm(i.title),volume=Number(title.match(/(?:月姫|strange Fake)\s*(?:\((\d+)\)|(\d+)(?=\s|$))/)?.slice(1).find(Boolean)),f=books.find(f=>f.volume===volume);assert.ok(f,title);
  let recordKind,identityMatch,retailerObservation;
  if(i.isbn){assert.equal(i.isbn,f.isbn);assert.ok(i.evidence.some(e=>e.url===f.source.url));recordKind='publisher-bound-volume';identityMatch='原卷号、ISBN和官方URL与出版社当前纸本书目精确一致';}
  else {assert.equal(key,'strangefake');const r=observations[0].facts.find(r=>r.volume===volume);assert.ok(r);assert.ok(i.offers.some(o=>o.url==='https://www.suruga-ya.jp/product/detail/'+r.code));assert.ok(i.description.includes('森井しづき')&&i.description.includes('B6コミック'));assert.ok(i.evidence.some(e=>e.field==='category'&&e.value==='B6コミック'));assert.equal(r.isbn,f.isbn);recordKind='retailer-bound-volume';identityMatch='原零售管理编号、卷号、作者与可读零售索引ISBN精确对应出版社纸本新装版；原空ISBN保持';retailerObservation=ob;}
  if(key==='tsukihime')assert.equal(i.jan,f.magazineJan);else assert.equal(i.jan,'');
  const dateConflict=key==='strangefake'&&volume===3;if(dateConflict)assert.equal(f.releaseDate,'2026-03-03');
  let summary=key==='tsukihime'?'《真月譚 月姫》第'+volume+'卷纸本漫画，佐々木少年绘制，官方书目列入電撃コミックス。出版社列示B6判、'+f.pages+'页，ISBN '+f.isbn+'。':'《新装版 Fate/strange Fake》第'+volume+'卷纸本漫画，森井しづき绘制，成田良悟／TYPE-MOON原作，角川コミックス・エース出版。官方纸本规格为B6判、'+f.pages+'页。';
  if(dateConflict)summary+='发售日期在出版社与零售资料之间存在差异，暂不补写日期。';else summary+='官方纸本书目列示发售日为'+f.releaseDate+'；具体印次不作推定。';
  return {...base,status:'supported',source:f.source,officialTitle:f.officialTitle,officialIsbn:f.isbn,volume,recordKind,identityMatch,...(retailerObservation?{retailerObservation,second:retailUrl}:{}),...(dateConflict?{dateConflict:true,retailerObservation:ob}:{}),scope:'出版社本卷纸本书目；卷号、书号/原零售管理编号逐项绑定，纸本与电子版及旧版/新装版分开',summary,notes:notes+(dateConflict?' 第3卷3月3日/3月4日差异保留，不以多数来源代替核定。':''),identityEvidence:[...new Map(i.evidence.filter(e=>['isbn','jan','publisher','category'].includes(e.field)).map(e=>[e.field+'|'+e.value,e])).values()]};
 });assert.equal(rows.length,11);assert.ok(rows.every(r=>r.status==='supported'));write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
assert.equal(all.length,22);
write(dir+'/official-facts.json',{at,books:facts,scope:'15个纸本单卷商品页，19条单卷记录与3个逻辑目录。月姫既有491前缀JAN逐条对应官方本商品magazine_jan，保持与ISBN各自的含义。新装版第3卷日期冲突单列，不把TYPE-MOON BOOKS既有版改作新装版。',fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/field-pending.json',{at,items:all.filter(r=>r.dateConflict).map(r=>({itemId:r.itemId,title:r.title,fields:['发售日期'],publisherDate:'2026-03-03',retailerDate:'2026-03-04',publisherSource:r.source,retailerObservation:ob,reason:'同卷/同ISBN已确认，但两来源日期不一致；可补身份、作者及页数，日期留待查。',needed:'出版社更正/发行说明或可区分实际发售与零售上架日期的独立依据。',appliedSafeSummary:false})),note:'第3卷的2条记录保留日期差异；其余原资料与本轮无关的历史待查不变。'});
write(dir+'/same-volume-records.json',{at,action:'none',groups:[...Map.groupBy(all.filter(r=>r.volume&&r.groupId==='series-0ca1528ecc218583'),r=>r.volume)].filter(([,rs])=>rs.length>1).map(([volume,rs])=>({volume,itemIds:rs.map(r=>r.itemId),source:rs[0].source})),logicalDirectories:all.filter(r=>r.groupId==='series-0ca1528ecc218583'&&r.recordKind==='logical-series').map(r=>({itemId:r.itemId,childIds:r.childIds})),rule:'四组同卷多来源及两个逻辑目录均保留原ID和关联，不自动归并。'});
console.log(JSON.stringify({candidates:22,ready:22,pending:0,fieldPending:2,logicalDirectories:3,distinctBookVolumes:15,sameVolumeGroups:4}));
