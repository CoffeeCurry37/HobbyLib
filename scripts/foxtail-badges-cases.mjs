import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261112/foxtail-badges',priv='work/series-evidence-20261112/foxtail-badges',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim(),strip=s=>norm(clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')));
const books=read(priv+'/discovery-capture.json').filter(x=>x.url.includes('kadokawa')).map(({url})=>{
 const {body:b,source}=cached(url),title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),volume=Number(title.match(/CCC FoxTail \((\d+)\)/)?.[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1]),format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
 const tt=strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');assert.ok(tt.includes('たけのこ星人')&&tt.includes('角川コミックス・エース'));assert.ok(volume&&isbn&&pages&&format==='B6変形判');
 return {source,officialTitle:title,volume,isbn,pages,format,artist:'たけのこ星人',label:'角川コミックス・エース',medium:'paper'};
}).sort((a,b)=>a.volume-b.volume);assert.deepEqual(books.map(b=>b.volume),Array.from({length:13},(_,i)=>i+1));
const index=cached('https://www.hobbystock.jp/sp/sm/fgo/?m=1054-html'),badges=[5,6].map(vol=>{
 const url='https://www.hobbystock.jp/item/view/hso-ccg-0001529'+(vol===5?'7':'8')+'?ga=sm_fgo',{body:b,source}=cached(url),title=clean(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').split('｜')[0],meta=clean(b.match(/<meta property="og:description" content="([\s\S]*?)"\s*\/>/)?.[1]||''),text=strip(b),keywords=clean(b.match(/<meta name="keywords" content="([^"]+)"/)?.[1]||''),jans=[...keywords.matchAll(/\b\d{13}\b/g)].map(m=>m[0]),lineup=meta.split(/\r?\n/).filter(x=>x.startsWith('・')).map(x=>norm(x.slice(1)));
 assert.equal(lineup.length,10);assert.equal(new Set(lineup).size,10);assert.equal(jans.length,1);assert.ok(title.includes('vol.'+vol)&&title.includes('トレーディング缶バッジ')&&title.includes('10個入り1BOX'));
 assert.ok(meta.includes('■1BOX10個入り')&&meta.includes('1BOXのご購入で全10種揃います。')&&meta.includes('■サイズ：直径約57mm')&&meta.includes('■素材：紙、スチール'));assert.ok(text.includes('発売日 2026年8月発売'));
 const bonus=text.match(/BOX購入特典「([^」]+) 缶バッジ」/)?.[1];assert.ok(bonus);assert.ok(index.body.includes(url));assert.equal(jans[0],vol===5?'4580822009185':'4580822009208');
 return {source,indexSource:index.source,officialTitle:title,volume:vol,officialBoxJan:jans[0],lineup,regularTypes:10,boxCount:10,nominalDiameter:'約57mm',materials:['紙','スチール'],releaseMonth:'2026-08',storeBoxBonus:bonus,scope:'仅商品自身标题、meta规格、明确发售月和店铺条件特典；排除推荐区、2019缶钥匙扣及亚克力立牌'};
});
const observations=read(dir+'/web-observations.json'),all=[];
const bind=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
for(const key of ['foxtail','vol5','vol6']){
 const rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id),base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:bind(i)};
  if(i.editorial||i.manualFields?.length||i.locked||i.summary)return {...base,status:'protected',reason:'保留已认可或既有资料'};
  if(key==='foxtail'){
   if(i.id.startsWith('family-')){assert.ok(i.description.includes('同出版社、同媒介版本'));return {...base,status:'supported',source:books[0].source,additionalSources:[books[12].source],officialTitle:i.title,recordKind:'logical-series',scope:'逻辑系列目录；以官方首卷与后续单卷书目佐证，不声明完结、整套或拥有',summary:'《フェイト/エクストラ CCC FoxTail》纸本漫画系列目录，由たけのこ星人绘制，收录于角川コミックス・エース。各卷独立刊行并有独立ISBN；本条用于组织单卷，不表示实体套装、已经完结或已拥有全套。',notes:'保留逻辑目录关系；不与ろび～な的EXTRA/CCC漫画混淆，不新增缺卷或合并来源。'};}
   const title=norm(i.title),volume=Number(title.match(/CCC FoxTail\s*\(?(\d+)\)?/)?.[1]),f=books.find(f=>f.volume===volume);assert.ok(f,title);assert.equal(i.isbn,f.isbn);if(i.jan)assert.equal(i.jan,f.isbn);assert.ok(i.evidence.some(e=>e.url===f.source.url));
   return {...base,status:'supported',source:f.source,officialTitle:f.officialTitle,volume,officialIsbn:f.isbn,recordKind:'paper-volume',identityMatch:'原作品名、卷号、ISBN与同一官方URL精确对应',scope:'出版社纸本书目自身标题、作者、ISBN、页数、开本；不使用推荐区或电子版参数',summary:'《フェイト/エクストラ CCC FoxTail》第'+volume+'卷纸本漫画，たけのこ星人绘制，角川コミックス・エース出版。官方书目列示B6变形判、'+f.pages+'页，ISBN '+f.isbn+'。',notes:'仅补空缺简介；书号、原字段与证据保持。未改发行日/初版印次，不把商店系列列表日期当作版权页证据。'};
  }
  const vol=key==='vol5'?5:6,f=badges.find(f=>f.volume===vol),title=norm(i.title);assert.ok(title.includes('トレーディング缶バッジ vol.'+vol));assert.ok(i.evidence.some(e=>e.field==='brand'&&e.value==='ホビーストック'));assert.equal(i.offers.length,1);
  const url=i.offers[0].url,suruga=url.startsWith('https://www.suruga-ya.jp/'),amiami=url.startsWith('https://www.amiami.jp/');assert.ok(suruga||amiami);
  if(suruga)assert.ok(i.evidence.some(e=>e.field==='来源分类'&&e.value==='バッジ・ビンズ'));
  let recordKind,character,extra,retailerObservation;
  if(title.startsWith('【パック】')){recordKind='pack';extra='本条保留为原零售来源的单包条目，未指定角色。系列普通款共10种；不将整盒规格视为单包内容。';assert.equal(i.jan,'');}
  else if(title.startsWith('全10種セット')){recordKind='retailer-complete-set';const o=observations.find(o=>o.facts.volume===vol);assert.equal(new URL(url).pathname.split('/').pop(),o.facts.managementCode);assert.deepEqual(o.facts.lineup.map(norm).sort(),[...f.lineup].sort());retailerObservation={id:o.id,url:o.url,sha256:hash(JSON.stringify(o))};extra='本条为原零售来源列示的普通款全10种组合，内容与官方普通款清单对应；不据此认定为原封整盒或包含店铺特典。';assert.equal(i.jan,'');}
  else if(title.startsWith('【ボックス】')||title.includes('10個入りBOX')){recordKind='box';if(amiami){assert.equal(i.jan,f.officialBoxJan);assert.ok(i.description.includes('【1BOX】10個入り'));}else assert.equal(i.jan,'');extra='本条为整盒条目。厂商规格为每BOX 10枚并集齐普通款10种；店铺购买特典另计，不据此保证二手包装及附属品完整。';}
  else{recordKind='single';character=title.split(' 「')[0];assert.ok(f.lineup.includes(character),title);assert.equal(i.jan,'');extra='本条为'+character+'普通单款，属于该系列10种普通款之一。店铺整盒购买特典另计。';}
  const identityEvidence=[...new Map(i.evidence.filter(e=>['brand','来源分类','jan'].includes(e.field)).map(e=>[e.field+'|'+e.value,e])).values()];
  return {...base,status:'supported',source:f.source,additionalSources:[index.source],officialTitle:f.officialTitle,volume:vol,recordKind,...(character?{character}:{}),...(retailerObservation?{retailerObservation}:{}),identityEvidence,
   identityMatch:amiami?'原BOX JAN与厂商BOX元信息完全一致，作品/vol/包装类型对应':recordKind==='single'?'原厂商、徽章类型、vol及完整职阶/角色与厂商普通款清单唯一对应':'原来源明确同厂商/作品/徽章vol及包装类型，使用相同系列规格；全套另核相同零售管理编号的内容清单',
   scope:'厂商本款规格与原来源明确身份逐项对应；普通单款、单包、整盒和零售全套分别解释；BOX JAN只用于原BOX记录核对',
   summary:'HOBBY STOCK《Fate/Grand Order》ぴくりる! 徽章vol.'+vol+'，使用Q版角色插画，徽章直径约57mm，材质为纸和钢。厂商标示2026年8月发售。'+extra,
   notes:'只补空缺简介及两条出处；原JAN、个人字段与报价保留，空JAN不填。不混入同角色立牌、缶钥匙扣或店铺特典，不更新实时库存。'};
 });assert.equal(rows.length,14);assert.equal(rows.filter(r=>r.status==='supported').length,14);write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
write(dir+'/official-facts.json',{at,books,badges,indexSource:index.source,scope:'13个纸本单卷书目+2个徽章BOX官方商品页及专题；纸本/目录、徽章单款/单包/BOX/零售全套分别核对。',fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/field-pending.json',{at,items:all.filter(r=>r.recordKind==='pack').map(r=>({itemId:r.itemId,title:r.title,safeSummaryPrepared:true,unconfirmedFields:['单包封入枚数','单包专属JAN'],reason:'原来源明确单包身份，但本轮详情页不可读；厂商当前页面为BOX规格，不把BOX数量/条码下放单包。',next:'有对应单包详情或明确包装照片后补充。'})),note:'2条单包可补系列及身份简介，封入枚数和条码仍未确认；不计为未写入候选，不代表完整核实。'});
write(dir+'/same-package-records.json',{at,action:'none',groups:[5,6].map(volume=>({volume,ids:all.filter(r=>r.recordKind==='box'&&r.volume===volume).map(r=>r.itemId),source:badges.find(f=>f.volume===volume).source})),rule:'同BOX多来源保持原ID；全套和BOX不合并；无新增商品、特典或关系。'});
console.log(JSON.stringify({candidates:all.length,supported:all.filter(r=>r.status==='supported').length,byKind:Object.fromEntries([...Map.groupBy(all,r=>r.recordKind)].map(([k,v])=>[k,v.length])),books:books.map(b=>({vol:b.volume,pages:b.pages})),badgeLineups:badges.map(b=>({vol:b.volume,boxJan:b.officialBoxJan,characters:b.lineup,bonus:b.storeBoxBonus})),pendingFields:2}));

