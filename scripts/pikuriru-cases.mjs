import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261111/pikuriru',priv='work/series-evidence-20261111/pikuriru',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Do not rebuild an applied round');
const index=cached('https://www.hobbystock.jp/sp/sm/fgo/?m=1054-html');
const products=read(priv+'/index-products.json'),originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const strip=s=>clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
const normal=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim();
const facts=[],bundles=[];
for(const entry of products){
 const p=cached(entry.url),title=clean(p.body.match(/<title>([\s\S]*?)<\/title>/)?.[1]).split('｜')[0],text=strip(p.body),keywords=clean(p.body.match(/<meta name="keywords" content="([^"]+)"/)?.[1]),jans=[...keywords.matchAll(/\b\d{13}\b/g)].map(m=>m[0]);
 assert.equal(jans.length,1);const jan=jans[0];assert.equal((10-[...jan.slice(0,12)].reduce((n,c,k)=>n+Number(c)*(k%2?3:1),0)%10)%10,Number(jan[12]));
 const start=text.indexOf('商品の仕様'),spec=text.slice(start,text.indexOf('TYPE-MOON',start)),date=text.match(/発売日\s+(\d{4}年\d+月発売)/)?.[1];
 assert.equal(date,'2026年8月発売');assert.ok(spec.includes('■素材：アクリル')&&spec.includes('■付属品：台座')&&spec.includes('キャラクターによって多少異なります'));
 const vol=Number(title.match(/vol\.([56])/)[1]),nominal=vol===6?'96mm×71mm':'91mm×73mm';
 assert.ok(spec.includes(vol===6?'縦約96mm×横約71mm':'縦約91mm×横約73mm'));
 const base={source:p.source,indexSource:index.source,officialTitle:title,manufacturerCode:new URL(entry.url).pathname.split('/').pop(),jan,volume:vol,releaseMonth:'2026-08',material:'acrylic',originalAccessory:'base',nominalSize:nominal,sizeCaveat:'官方约值且明确角色间有差异；不作逐款精确尺寸',scope:'仅取商品自身标题、meta关键词条码和规格块；排除推荐区/其他vol内容'};
 if(title.includes('10種セット')){const bonus=text.match(/10種セット購入特典「([^」]+) アクリルスタンド」/)?.[1];assert.ok(bonus);bundles.push({...base,regularTypes:10,storeSetBonus:bonus,scope:'十种套购条件特典；与普通单品、另一vol及徽章商品分别保留'});continue;}
 const match=title.match(/^ぴくりる！ Fate\/Grand Order アクリルスタンド vol\.([56]) (.+)$/);assert.ok(match,title);
 const character=match[2];assert.equal(normal(entry.title),'アクリルスタンド vol.'+vol+' '+normal(character));
 facts.push({...base,character});
}
assert.equal(facts.length,20);assert.equal(bundles.length,2);
assert.equal(new Set(facts.map(f=>f.jan)).size,20);
assert.equal(bundles.find(f=>f.volume===6).storeSetBonus,'セイバー/アーサー・ペンドラゴン〔プロトタイプ〕');
assert.equal(bundles.find(f=>f.volume===5).storeSetBonus,'セイバー/エリザベート・バートリー〔ブレイブ〕');
const all=[];
for(const [key,vol,count] of [['vol6',6,17],['vol5',5,16]]){
 const rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id);assert.ok(i);const identityBinding={...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()};
  const base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding};
  if(i.editorial||i.manualFields?.length||i.locked||i.summary)return {...base,status:'protected',reason:'保留已认可、人工字段或既有简介'};
  const title=normal(i.title);let character;
  const suruga=i.offers.every(o=>new URL(o.url).hostname==='www.suruga-ya.jp'),amiami=i.offers.every(o=>new URL(o.url).hostname==='www.amiami.jp');assert.ok(i.offers.length===1&&(suruga||amiami));
  if(suruga){const m=title.match(/^(.+) ぴくりる! アクリルスタンド vol\.([56]) 「Fate\/Grand Order」$/);assert.ok(m,title);assert.equal(+m[2],vol);character=m[1];assert.ok(i.evidence.some(e=>e.field==='category'&&e.value==='アクリルスタンド・アクリルパネル'));}
  else{const m=title.match(/^ぴくりる! Fate\/Grand Order アクリルスタンド vol\.([56]) (.+)\[ホビーストック\]《発売済・在庫品》$/);assert.ok(m,title);assert.equal(+m[1],vol);character=m[2];}
  assert.ok(i.evidence.some(e=>e.field==='brand'&&e.value==='ホビーストック'));
  const matches=facts.filter(f=>f.volume===vol&&normal(f.character)===character);assert.equal(matches.length,1,i.id);const f=matches[0];
  if(i.jan)assert.equal(i.jan,f.jan,i.id);
  assert.ok(!/セット|特典|キーホルダー|缶バッジ/.test(title));
  const identityEvidence=[...new Map(i.evidence.filter(e=>['brand','category','来源分类','jan','releaseDate'].includes(e.field)).map(e=>[e.field+'|'+e.value,e])).values()];
  return {...base,status:'supported',source:f.source,additionalSources:[index.source],officialTitle:f.officialTitle,manufacturerCode:f.manufacturerCode,officialJan:f.jan,character:f.character,volume:vol,identityEvidence,
   identityMatch:i.jan?'原JAN与厂商meta条码一致，且作品、vol、立牌种类、职阶/角色完全对应':'原来源明确为HOBBY STOCK立牌；作品、vol及完整职阶/角色与官方单品、专题入口唯一对应。原JAN为空继续保留。',
   scope:'厂商单品和专题入口与原记录的作品、立牌种类、vol、完整职阶/角色逐项对应；有原JAN时另核条码，不据商品编号猜款式',
   summary:'HOBBY STOCK《Fate/Grand Order》ぴくりる! 亚克力立牌 vol.'+vol+'，款式为'+f.character+'。采用Q版角色插画，材质为亚克力，官方原配底座；厂商标示2026年8月发售。本条为单款立牌，店铺套购特典另计。',
   notes:'只补空缺简介；原JAN、原名、图片、报价历史及个人状态保留。官方尺寸为角色间有差异的约值，省略逐款精确尺寸；不承诺二手附属品齐全，不写实时库存，不自动归并同款来源。'};
 });
 assert.equal(rows.length,count);assert.equal(rows.filter(r=>r.status==='supported').length,count);
 write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
assert.equal(all.length,33);
write(dir+'/official-facts.json',{at,indexSource:index.source,products:facts,bundles,reviewedSourceRecords:33,distinctOfficialSingles:20,scope:'vol.6 17条对应10种；vol.5 16条对应10种。来源记录数量不是新增角色数；全部保持独立ID，不新增套装/特典。',notAppliedFields:['精确逐款尺寸','新增JAN字段','实时库存','二手当前附属品完整性'],fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/web-observations.json',[]);
write(dir+'/same-style-records.json',{at,action:'none',rule:'仅记录同官方单品的多来源匹配，不归并、不迁移挂牌和个人状态',groups:[...Map.groupBy(all,r=>r.manufacturerCode)].filter(([k,v])=>v.length>1).map(([manufacturerCode,rows])=>({manufacturerCode,officialJan:rows[0].officialJan,source:rows[0].source,itemIds:rows.map(r=>r.itemId)}))});
console.log(JSON.stringify({reviewed:33,supported:33,pending:0,protected:0,distinctOfficialSingles:20,multipleSourcePairs:13}));

