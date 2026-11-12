import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261112/emiya-chara22',priv='work/series-evidence-20261112/emiya-chara22',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim(),strip=s=>norm(clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')));
const books=read(priv+'/discovery-capture.json').filter(x=>x.url.includes('kadokawa')).map(({url})=>{
 const {body:b,source}=cached(url),title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),volume=Number(title.match(/衛宮さんちの今日のごはん \((\d+)\)/)?.[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1]),format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
 const tt=strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');assert.ok(tt.includes('TAa')&&tt.includes('角川コミックス・エース'));assert.ok(volume&&isbn&&pages&&format==='B6変形判');
 return {source,officialTitle:title,volume,isbn,pages,format,artist:'TAa',label:'角川コミックス・エース',medium:'paper'};
}).sort((a,b)=>a.volume-b.volume);assert.deepEqual(books.map(b=>b.volume),Array.from({length:12},(_,i)=>i+1));
const {body:b,source}=cached('https://market.algernonproduct.co.jp/items/149340313'),spec=strip(b).split('【商品情報】')[1].split('<ご購入前にご一読下さい>')[0];
assert.ok(spec.startsWith(' Fate/Grand Order きゃらとりあ缶 Vol.22 BOX'));assert.ok(spec.includes('<素材> ブリキ')&&spec.includes('<サイズ> 直径約 56mm')&&spec.includes('<発売元> 株式会社アルジャーノンプロダクト'));
const lineup=spec.split(' #').slice(4).map(norm);assert.equal(lineup.length,10);assert.equal(new Set(lineup).size,10);
const badge={source,officialTitle:'Fate/Grand Order きゃらとりあ缶 Vol.22 BOX',volume:22,lineup,material:'ブリキ',diameter:'約56mm',scope:'官方商店商品信息自身区段的规格及角色标签；未以推荐商品推定规格，未从价格推断数量或条码。'};
const observations=read(dir+'/web-observations.json'),all=[];
const bind=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
for(const key of ['emiya','chara22']){
 const rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id),base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:bind(i)};
  if(i.editorial||i.manualFields?.length||i.locked||i.summary)return {...base,status:'protected',reason:'保留已认可或既有资料'};
  if(key==='emiya'){
   if(i.id.startsWith('family-')){assert.ok(i.description.includes('同出版社、同媒介版本'));return {...base,status:'supported',source:books[0].source,additionalSources:[books[11].source],officialTitle:i.title,recordKind:'logical-series',scope:'逻辑系列目录；官方首卷与后续纸本书目佐证，不声明完结、整套或拥有',summary:'《衛宮さんちの今日のごはん》纸本漫画系列目录，TAa绘制，收录于角川コミックス・エース。各卷独立刊行并有独立ISBN；本条用于组织单卷，不表示实体套装、已经完结或已拥有全套。',notes:'保留逻辑目录关系；不把电子版或特装版附属品写入普通纸本单卷，不新增缺卷或合并来源。'};}
   const title=norm(i.title),volume=Number(title.match(/衛宮さんちの今日のごはん\s*\(?(\d+)\)?/)?.[1]),f=books.find(f=>f.volume===volume);assert.ok(f,title);assert.equal(i.isbn,f.isbn);if(i.jan)assert.equal(i.jan,f.isbn);assert.ok(i.evidence.some(e=>e.url===f.source.url));
   return {...base,status:'supported',source:f.source,officialTitle:f.officialTitle,volume,officialIsbn:f.isbn,recordKind:'paper-volume',identityMatch:'原作品名、卷号、ISBN与同一官方URL精确对应',scope:'出版社纸本书目自身标题、作者、ISBN、页数、开本；不使用推荐区、电子版或特装附件',summary:'《衛宮さんちの今日のごはん》第'+volume+'卷纸本漫画，TAa绘制，角川コミックス・エース出版。官方书目列示B6变形判、'+f.pages+'页，ISBN '+f.isbn+'。',notes:'仅补空缺简介及两条出处；书号、原字段与证据保持。不更改初版印次或发行日期，不添加食谱、画集或环保袋特装附件。'};
  }
  const title=norm(i.title);assert.ok(title.includes('Fate/Grand Order きゃらとりあ缶 Vol.22'));assert.ok(i.evidence.some(e=>e.field==='brand'&&e.value==='アルジャーノンプロダクト'));assert.ok(i.evidence.some(e=>e.field==='category'&&e.value==='バッジ・ビンズ'));assert.equal(i.offers.length,1);assert.equal(i.jan,'');assert.equal(i.isbn,'');
  const url=i.offers[0].url;assert.ok(url.startsWith('https://www.suruga-ya.jp/'));let recordKind,character,extra,retailerObservation;
  if(title.startsWith('【パック】')){recordKind='pack';extra='本条按原零售目录保留为未指定角色的单包条目；单包封入枚数与条码尚待确认。';}
  else if(title.startsWith('全10種セット')){recordKind='retailer-complete-set';extra='原零售目录以“全10种套装”收录本条，保留该来源身份；具体封装和附属内容仍待核实，不据此认定为原封BOX。';}
  else if(title.startsWith('【ボックス】')){recordKind='box';const o=observations.find(o=>o.id==='surugaya-chara22-box');assert.equal(new URL(url).pathname.split('/').pop(),o.facts.managementCode);retailerObservation={id:o.id,url:o.url,sha256:hash(JSON.stringify(o))};extra='本条为整盒条目，骏河屋同编号页面列示每BOX 10枚。整盒是否必定集齐尚待确认。';}
  else{recordKind='single';character=title.split(' 「')[0];assert.ok(lineup.includes(character),title);extra='本条为'+character+'单款，角色及服装括注与官方清单对应。';}
  return {...base,status:'supported',source,officialTitle:badge.officialTitle,volume:22,recordKind,...(character?{character}:{}),...(retailerObservation?{retailerObservation,second:retailerObservation.url}:{}),identityEvidence:i.evidence.filter(e=>['brand','category'].includes(e.field)),identityMatch:recordKind==='single'?'原厂商、徽章类型、Vol及完整职阶/角色/服装与官方角色标签唯一对应':'原来源明确同厂商/作品/徽章Vol与包装类型；BOX数量另核原编号详情，单包及全套仅保留目录身份',scope:'官方商店明确尺寸、材质及10名角色标签；单款、单包、BOX和零售全套分别解释，不推断条码或完整性',summary:'アルジャーノンプロダクト《Fate/Grand Order》きゃらとりあ缶Vol.22徽章，直径约56mm，材质为马口铁。官方商品信息列出10种角色款。'+extra,notes:'只补明确的简介和两条出处；原JAN、发行日期、个人字段与报价保留。空JAN不填，零售商完整性及条码差异保留待查，不更新库存。'};
 });assert.equal(rows.length,13);assert.equal(rows.filter(r=>r.status==='supported').length,13);write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
write(dir+'/official-facts.json',{at,books,badge,scope:'12纸本单卷+逻辑目录；官方商店10名角色与13条来源身份分别绑定。只补明确事实，未确认的包装内容、条码及整盒完整性不推断。',fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/field-pending.json',{at,items:all.filter(r=>['box','pack','retailer-complete-set'].includes(r.recordKind)).map(r=>({itemId:r.itemId,title:r.title,safeSummaryPrepared:true,unconfirmedFields:r.recordKind==='box'?['整盒必定集齐与否','BOX专属JAN']:r.recordKind==='pack'?['单包封入枚数','单包专属JAN']:['零售全套具体封装','附属内容','全套专属JAN'],reason:r.recordKind==='box'?'零售商完整性说法不一致；所见两组JAN包装归属未由厂商明确。':'本轮原详情不可读，只保留已有目录身份及厂商明确系列参数。',next:'取得对应包装的厂商明确规格或可读同编号详情再补。'})),note:'3条已准备安全范围简介，缺少或冲突字段继续待查；所有13条原空JAN均保留，不计为完整核实。'});
console.log(JSON.stringify({candidates:all.length,supported:all.filter(r=>r.status==='supported').length,byKind:Object.fromEntries([...Map.groupBy(all,r=>r.recordKind)].map(([k,v])=>[k,v.length])),books:books.map(b=>({vol:b.volume,pages:b.pages})),lineup,fieldPending:3}));

