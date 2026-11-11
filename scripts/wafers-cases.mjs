import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/wafers',priv='work/series-evidence-20261110/wafers',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already applied; do not rebuild');
const source2=cached('https://www.bandai.co.jp/candy/products/2018/4549660224976000.html');
const mirror2=cached('https://www.bandai.co.jp/catalog/item.php?jan_cd=4549660224976000');
const source25=cached('https://www.bandai.co.jp/candy/products/2025/4570117918803000.html');
const mirror25=cached('https://www.bandai.co.jp/catalog/item.php?jan_cd=4570117918803000');
const parse=p=>[...p.body.matchAll(/(\d+)．(N|R|SR)\s+([^<]+)<br\s*\/?>/g)].map(m=>({number:+m[1],rarity:m[2],name:clean(m[3])}));
const lineup=parse(source2);assert.equal(lineup.length,24);assert.equal(new Set(lineup.map(f=>f.number)).size,24);assert.deepEqual(parse(mirror2),lineup);
for(const p of [source2,mirror2]){assert.ok(p.body.includes('全25種')&&p.body.includes('25．シークレット')&&p.body.includes('プラカード1枚')&&p.body.includes('メタリック'));}
for(const p of [source25,mirror25]){assert.ok(p.body.includes('全24種')&&p.body.includes('メタリックプラカード1枚')&&p.body.includes('ホロ箔')&&p.body.includes('2枚'));}
const byNumber=new Map(lineup.map(f=>[f.number,f]));
const specialRetailNames=['ヴォルフガング・アマデウス・モーツァルト','モードレッド','巌窟王 エドモン・ダンテス','ジャンヌ・ダルク〔オルタ〕','マリー・アントワネット','マーリン','アーサー・ペンドラゴン〔プロトタイプ〕','ジェームズ・モリアーティ','葛飾北斎','殺生院キアラ','アルトリア・ペンドラゴン〔オルタ〕','アルジュナ〔オルタ〕','謎のアルターエゴ・Λ','スペース・イシュタル','ヴァン・ゴッホ','蘆屋道満','光のコヤンスカヤ','沖田総司〔オルタ〕','アルクェイド・ブリュンスタッド','徐福','レディ・アヴァロン','駒姫','雨の魔女トネリコ','空を道とし 宮本武蔵'];
const observation={id:'special25-retailer-lineup',url:'https://www.suruga-ya.jp/product/detail/GN815102',at,kind:'public-web-text-observation',retailerCode:'GN815102',productCode:'2753157',lineup:specialRetailNames.map((name,n)=>({code:(n===23?'SST-':'ST-')+String(n+1).padStart(2,'0'),name})),scope:'独立零售齐款清单24张；可作实际卡号资料，不能建立旧本地占位编号的对应关系。',hashMeaning:'此记录的哈希为观察JSON哈希；原HTML直连不可用，不冒称已保存零售原文。'};
const imageUrl='https://www.bandai.co.jp/candy/published/bnc_files/product/YH9/000000425491OQDkmjjDAzFS1QQyJJZUlEf4yxpfCoZ5UYH9.jpg';
const imagePath='work/series-evidence-20261103/cache/'+hash(imageUrl),im=read(imagePath+'.json');
assert.equal(im.status,'captured');assert.equal(hash(fs.readFileSync(imagePath+'.img')),im.sha256);
const imageObservation={id:'special25-shared-image',url:imageUrl,at,kind:'original-image-visual-observation',sourceAt:im.at,sourceSha256:im.sha256,facts:'图片是包装及两张示例卡的合成宣传图；23条占位共用此图，没有各占位独立卡背或单款图对应。',scope:'已实际打开原图观察；仅用于否定共享图片可区分23个占位的假设，不据角色图案命名占位。'};
write(dir+'/web-observations.json',[observation,imageObservation]);
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),all=[];
for(const key of ['wafer2','special25']){
 const targets=read(priv+'/'+key+'-targets.json'),rows=[];
 for(const t of targets){
  const i=originals.get(t.id);assert.ok(i);
  const identityBinding=Object.fromEntries(['isbn','jan','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null]));identityBinding.images=i.images??null;identityBinding.offerUrls=[...new Set(i.offers.map(o=>o.url))].sort();
  const r={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding};
  if(i.editorial||i.locked||i.manualFields?.length||i.summary){rows.push({...r,status:'protected',reason:'已有简介、认可或人工字段保留'});continue}
  if(key==='wafer2'){
   assert.ok(i.evidence.some(e=>e.url===source2.source.url));
   if(i.id==='family-7eedbda2253761c7edd2d11f20c052fc'){
    rows.push({...r,status:'supported',source:source2.source,additionalSources:[mirror2.source],officialTitle:'Fate/Grand Orderウエハース2',scope:'官方第2弹系列目录；逻辑父级，不是零售整盒或齐款套装',summary:'BANDAI《Fate/Grand Order》威化卡第2弹，2018年3月13日发售，全25种，含24种普通公开款及1种隐藏款。卡片采用金属光泽印刷；本条为系列目录，各张卡片独立收录，不代表整套实物。',notes:'官方名单与BANDAI商品总目录相互核对；保留各成员与个人状态；隐藏款只按官方“シークレット”记录，不猜名称。'});
   }else{
    const m=i.member.match(/^No\.(\d{2}) (.+)$/);assert.ok(m);const f=byNumber.get(+m[1]);assert.ok(f);assert.equal(m[2],f.name);assert.equal(i.title,'Fate/Grand Orderウエハース2 '+i.member);assert.ok(i.evidence.some(e=>e.field==='官方款式'&&e.value===i.member&&e.method==='官方文字编号名单'));
    rows.push({...r,status:'supported',source:source2.source,additionalSources:[mirror2.source],officialTitle:'Fate/Grand Orderウエハース2 / No.'+m[1]+' '+f.rarity+' '+f.name,number:f.number,rarity:f.rarity,officialName:f.name,scope:'官方文字清单的编号、角色/职阶与既有官方款式证据逐项一致；不是按图片顺序猜测',summary:'BANDAI《Fate/Grand Order》威化卡第2弹的单张塑料卡，官方目录No.'+m[1]+'，'+f.rarity+'级，款式为'+f.name+'。该弹于2018年3月13日发售，卡面采用金属光泽印刷，背面刊载从者资料。',notes:'只写官方目录编号、稀有度和单卡共同规格；不把包装JAN写作单卡JAN，不承诺附食品或整盒齐款。官方姓名拼写照录，原名及图片保持不变。'});
   }
  }else if(i.id==='family-8e4b4adbe3dcce7d1e332975779f4332'){
   assert.ok(i.evidence.some(e=>e.url===source25.source.url&&e.field==='系列整理'));
   rows.push({...r,status:'supported',source:source25.source,additionalSources:[mirror25.source],officialTitle:'Fate/Grand Order ツインウエハース 特別弾 2025',scope:'官方2025特别弹系列目录；仅确认系列规格，不将24种目录顺序赋予旧匿名占位',summary:'BANDAI《Fate/Grand Order》双威化特别弹2025，2025年1月6日发售，全24种金属光泽塑料卡，采用全息箔和全息效果。原包装每包含1张卡与2枚巧克力威化；本条为系列目录，不代表24张齐款套装。',notes:'原包装数量不是二手单卡附属品承诺；系列目录不充当实物套装，包装编号不转写单卡JAN；旧匿名成员保持待查。'});
  }else{
   assert.match(i.member,/^待补款式 \d{2}$/);assert.ok(i.description.includes('并非已核实的印刷卡号'));assert.equal(i.image,imageUrl);assert.deepEqual(i.images,[imageUrl]);assert.equal(i.offers.length,0);assert.equal(i.evidence.length,1);assert.equal(i.evidence[0].field,'发行席位');assert.equal(i.evidence[0].method,'按官方款数预留；不推测角色或在售状态');
   rows.push({...r,status:'pending',reason:'仅由官方总款数建立的本地占位；没有真实卡号、角色或独立图片/挂牌。23个占位共用同一宣传图，不能绑定零售ST/SST清单。',needed:'旧占位ID到实际印刷卡号的独立历史对应；若原本无对应，需另行形成保留历史映射的占位整理方案，不能以相同序号自动命名。',placeholderNumber:+i.member.match(/\d+$/)[0],originalEvidence:{...i.evidence[0]},officialSource:source25.source,retailerObservation:{id:observation.id,sha256:hash(JSON.stringify(observation))},imageObservation:{id:imageObservation.id,sha256:hash(JSON.stringify(imageObservation))},recheckRule:'已取得实际零售卡号清单，缺的是旧占位身份映射；重复抓总目录不能消除此缺口。'});
  }
 }
 assert.equal(rows.length,24);write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
assert.equal(all.filter(r=>r.status==='supported').length,25);assert.equal(all.filter(r=>r.status==='pending').length,23);assert.equal(all.filter(r=>r.status==='protected').length,0);
const present=all.filter(r=>r.number).map(r=>r.number);
write(dir+'/official-facts.json',{at,wafer2:{source:source2.source,corroboration:mirror2.source,releaseDate:'2018-03-13',totalTypes:25,regularLineup:lineup,secretLabel:'シークレット',cardMaterial:'plastic',finish:'metallic printing',scope:'目录编号逐项匹配，不声称已检查每张卡背。',targetSingles:23,targetFamily:1,notInCurrentTargets:lineup.filter(f=>!present.includes(f.number)).map(f=>({number:f.number,name:f.name})),notInTargetsRule:'No.23酒呑童子及隐藏款不在本轮24条候选内，未新建或重新归类。'},special25:{source:source25.source,corroboration:mirror25.source,releaseDate:'2025-01-06',totalTypes:24,originalPack:{cards:1,wafers:2},finish:'holographic foil and hologram effect',targetPlaceholders:23,targetFamily:1,retailerObservation:{id:observation.id,sha256:hash(JSON.stringify(observation))},scope:'实际卡号清单与旧占位绑定是两件事；没有独立映射，所有占位保持待查。'}});
console.log(JSON.stringify({reviewed:48,supported:25,pending:23,protected:0}));

