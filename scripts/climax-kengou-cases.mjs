import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261111/climax-kengou',priv='work/series-evidence-20261111/climax-kengou',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const strip=s=>clean(s.replace(/<[^>]+>/g,' ')).normalize('NFKC').replace(/\s+/g,' ').trim();
const climax=read(priv+'/discovery-capture.json').filter(x=>x.url.includes('kadokawa')).map(x=>{
 const {body:b,source}=cached(x.url),title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),volume=Number(title.match(/CLIMAX!\((\d+)\)/)?.[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1])||null,format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
 assert.ok(volume&&isbn&&title.includes('マジキュー4コマ Fate/stay night'));assert.ok(strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').includes('MCコミックス'));
 return {source,officialTitle:title,volume,isbn,pages,format:format==='その他'?null:format,publisherCatalog:'KADOKAWA',label:'MCコミックス',medium:'paper'};
});
assert.equal(climax.length,15);
const kengou=read(priv+'/official-detail-capture.json').map(x=>{
 const {body:b,source}=cached(x.url),title=[...b.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>strip(m[1])).find(t=>t.includes('英霊剣豪七番勝負')),volume=Number(title.match(/\((\d+)\)$/)?.[1]);
 const start=b.indexOf('>紙版</h4>'),end=b.indexOf('>電子版</h4>');assert.ok(start>0&&end>start);
 const paper=strip(b.slice(start,end)),isbn=paper.match(/ISBN (\d{13})/)[1],pages=Number(paper.match(/ページ数 (\d+)ページ/)[1]),date=paper.match(/発売日 (\d{4})年(\d{2})月(\d{2})日/).slice(1).join('-');
 assert.ok(volume>=1&&volume<=6&&paper.includes('判型 新書')&&paper.includes('講談社コミックス'));
 const titleTag=strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');assert.ok(titleTag.includes('TYPE-MOON')&&titleTag.replace(/\s+/g,'').includes('渡れい'));
 return {source,officialTitle:title,volume,isbn,pages,releaseDate:date,format:'新書',publisher:'講談社',label:'講談社コミックス',author:'渡れい',original:'TYPE-MOON',medium:'paper'};
});
assert.equal(kengou.length,6);
const obs=read(dir+'/web-observations.json')[0],series=cached('https://www.kodansha.co.jp/titles/1000034580'),all=[];
for(const [key,count,facts] of [['climax',16,climax],['kengou',15,kengou]]){
 const rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id),identityBinding={...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()},base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding};
  if(i.editorial||i.manualFields?.length||i.locked||i.summary)return {...base,status:'protected',reason:'保留已认可或既有资料'};
  if(i.id.startsWith('family-')){
   assert.ok(i.description.includes('同出版社、同媒介版本'));
   const f=facts.find(f=>f.volume===1),last=facts.find(f=>f.volume===(key==='climax'?16:6));
   return {...base,status:'supported',source:f.source,additionalSources:[last.source,...(key==='kengou'?[series.source]:[])],officialTitle:i.title,recordKind:'logical-series',
    scope:'逻辑系列目录只补作品与纸本系列范围；官方首卷和后续卷佐证，不声明整套、完结或拥有状态',
    summary:key==='climax'?'《マジキュー4コマ Fate/stay night CLIMAX!》纸本四格漫画系列目录。角川官方书目收录于MCコミックス，各卷具有独立ISBN；本条用于组织单卷，不代表实体套装、全卷已收录或作品已经完结。':'《Fate/Grand Order -Epic of Remnant- 英霊剣豪七番勝負》漫画纸本系列目录。TYPE-MOON原作、渡れい作画，讲谈社出版。各卷独立刊行；本条不代表实体套装、已经完结或已拥有整套。',
    notes:'保留逻辑目录和单卷的原有关系，不新增缺卷、不归并、不迁移个人状态。'};
  }
  let volume,match,retailerObservation,identityEvidence,recordKind;
  if(key==='climax'){
   const norm=strip(i.title);volume=Number(norm.match(/CLIMAX!\s*\((\d+)\)/)?.[1]);const f=facts.find(f=>f.volume===volume);assert.ok(f,norm);assert.equal(i.isbn,f.isbn);assert.ok(i.evidence.some(e=>e.url===f.source.url));
   match='原记录卷号与ISBN均精确对应角川官方书目；原官方来源URL相同';recordKind='publisher-single';
  }else{
   const norm=strip(i.title);volume=Number(norm.match(/英霊剣豪七番(?:勝負)?\s*(?:\((\d+)\)|(\d+)(?=\s|$))/)?.slice(1).find(Boolean));assert.ok(volume>=1&&volume<=6,norm);
   if(i.id.startsWith('member-')){
    const e=i.evidence.find(e=>e.field==='套装成员'&&e.url?.includes('/WK13629'));assert.ok(e&&/1[~～]6巻セット/.test(e.value));assert.ok(obs.facts.setVolumes.includes(volume));
    identityEvidence=[e];retailerObservation={id:obs.id,url:obs.url,sha256:hash(JSON.stringify(obs))};recordKind='derived-set-member';
    match='原套装成员证据明确1～6卷、渡れい；当前骏河屋WK13629页面确认讲谈社/マガジンKC实体套装，逐卷对应讲谈社纸版书目';
   }else{
    assert.ok(i.description.includes('渡れい'));assert.ok(i.evidence.some(e=>e.field==='publisher'&&e.value==='講談社'));
    assert.ok(i.description.includes('週刊少年マガジンKC')||i.description.includes('書籍商品は流通'));
    identityEvidence=[...new Map(i.evidence.filter(e=>['publisher','category'].includes(e.field)).map(e=>[e.field+'|'+e.value,e])).values()];
    recordKind='retailer-single';match='原实体书来源明确作品、卷号、讲谈社及渡れい，且纸本书籍/配送语境明确；与官方纸版单卷对应';
   }
  }
  const f=facts.find(f=>f.volume===volume);assert.ok(f);
  for(const value of [i.isbn,i.jan].filter(Boolean))assert.equal(value,f.isbn);
  const summary=key==='climax'?'《マジキュー4コマ Fate/stay night CLIMAX!》第'+volume+'卷，MCコミックス纸本四格漫画。角川官方书目列示ISBN '+f.isbn+'。'+(f.pages?'官方规格为'+f.format+'、'+f.pages+'页。':'官方页未明确页数及具体开本，暂不补写。'):
   '《Fate/Grand Order -Epic of Remnant- 英霊剣豪七番勝負》第'+volume+'卷纸本漫画，TYPE-MOON原作、渡れい作画，讲谈社出版。官方纸版书目列示'+f.format+'、'+f.pages+'页，'+f.releaseDate+'发售。'+(recordKind==='derived-set-member'?'本条保留为原1～6卷套装的独立单卷成员。':'');
  return {...base,status:'supported',source:f.source,officialTitle:f.officialTitle,officialIsbn:f.isbn,volume,recordKind,identityMatch:match,...(identityEvidence?{identityEvidence}:{}),...(retailerObservation?{retailerObservation}:{}),
   scope:'限定出版社纸本书目；卷号及原ISBN或实体书来源相互核对，纸版与电子版字段分开，不使用推荐区资料',summary,
   notes:'只补空缺简介和两条出处；原ISBN/JAN、报价、原证据、关系及个人状态保留。官方出版日期不表示初版印次，套装日期/价格不下放单卷。'};
 });assert.equal(rows.length,count);assert.equal(rows.filter(r=>r.status==='supported').length,count);
 write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
write(dir+'/official-facts.json',{at,climax,kengou,seriesSource:series.source,scope:'CLIMAX候选无第9卷，不新增；第1～8卷官方未明确页数/具体开本，不类推。英霊剣豪仅采用纸版书目信息，不把电子版、套装价格/日期、推荐作品或印次混入。',fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/same-volume-records.json',{at,action:'none',groups:[...Map.groupBy(all.filter(r=>r.volume&&r.groupId==='series-2b6dbd370b1c0da3'),r=>r.volume)].map(([volume,rows])=>({volume,itemIds:rows.map(r=>r.itemId),source:rows[0].source})),rule:'同卷多来源记录保持独立，套装派生成员关系不改动'});
console.log(JSON.stringify({candidates:all.length,supported:all.filter(r=>r.status==='supported').length,climaxVolumes:climax.length,kengouVolumes:kengou.length,derived:all.filter(r=>r.recordKind==='derived-set-member').length}));

