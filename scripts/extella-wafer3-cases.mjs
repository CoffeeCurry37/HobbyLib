import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261110/extella-wafer3',priv='work/series-evidence-20261110/extella-wafer3',at=new Date().toISOString();
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Already applied; do not rebuild');
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const strip=s=>clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
const src=n=>cached('https://www.marv.jp/titles/cs/'+n+'/');
const spec=cached('https://fate-extella.jp/spec/index.html');
const celebration=cached('https://celebration.fate-extella.jp/?utm_source=corp&utm_medium=officialSite&utm_campaign=newRelease');
const na=cached('https://xseedgames.com/games/fateextella-the-umbral-star/');
const eu=cached('https://www.xseedgames.com/2017/04/13/xseed-games-sets-sights-on-nintendo-switch-version-for-fateextella-the-umbral-star/');
assert.ok(strip(na.body).includes('January 17, 2017'));
assert.ok(strip(eu.body).includes('Europe and Australia on July 21, 2017'));
for(const s of ['えくすてらっち','キャラファイングラフ','Fate/EXTELLA LINK','33種','3種'])assert.ok(celebration.body.includes(s));
const observations=[
 {id:'eu-retailer-binding',url:'https://www.suruga-ya.jp/kaitori/search_buy?category=20038&search_word=Fate',at,kind:'public-web-text-observation',facts:{code:'109004053',jan:'5060540770011',platform:'Nintendo Switch',region:'EU',title:'Fate extella The Umbral Star'},scope:'零售回收目录的身份对应，不作实时库存或官方规格来源'},
 {id:'na-retailer-binding',url:'https://www.suruga-ya.jp/kaitori/kaitori_detail/105007013',at,kind:'public-web-text-observation',facts:{code:'105007013',jan:'0859716006055',model:'PCSE-00928',platform:'PSVita',region:'North America',publisher:'Xseed'},scope:'零售回收详情的身份对应，不作实时库存或官方规格来源'},
 {id:'unreadable-listings',at,kind:'public-web-access-observation',urls:['https://auctions.yahoo.co.jp/jp/auction/m1244214540','https://auctions.yahoo.co.jp/jp/auction/r1244419300','https://auctions.yahoo.co.jp/jp/auction/w1246649967','https://www.suruga-ya.jp/product/detail/209000021','https://www.suruga-ya.jp/product/detail/109004053','https://www.suruga-ya.jp/product/detail/105007013'],result:'网页工具无法读取；三条拍卖编号检索未取得独立对应详情。',scope:'访问失败不等于结束、售出或商品身份不存在；不修改挂牌状态'}
].map(o=>({...o,hashMeaning:'观察JSON哈希，不是原HTML哈希'}));
write(dir+'/web-observations.json',observations);
const binding=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
const maps=new Map();
function put(id,n,platform,date,summary,extra={}){
 const p=src(n),text=strip(p.body),main=text.slice(text.indexOf('発売日'),text.indexOf('関連タイトル'));
 assert.ok(main.includes('発売日：'+date)&&main.includes(platform),n+': platform/date');
 maps.set(id,{source:p.source,additionalSources:[],officialTitle:text.match(/^(.+?) - マーベラス/)?.[1]||'Fate/EXTELLA',platform,releaseDate:date.replaceAll('/','-'),summary,...extra});
}
const fixedNote='仅补官方版本说明；二手缺件、原名、旧描述、JAN、图片、挂牌和所有关系保留。原配不承诺当前挂牌齐全或下载码可用；不改认可状态。';
put('5860adb1-13d2-42e6-9c2b-cf6109336d4a','711','PlayStation 4','2016/11/10','《Fate/EXTELLA》PS4版 REGALIA BOX，2016年11月10日发售。官方原配为PS4游戏、ワダアルコ绘制收纳盒、《Fate/EXTELLA material》及尼禄“束縛の花嫁衣装”兑换码。二手缺件与代码状态以各挂牌记录为准。',{expectedJan:'4535506302540',expectedCategory:'PS4ソフト',additionalSources:[spec.source]});
put('source-92943227ca3edcf56cc0876e4fab9c95','712','PSVita','2016/11/10','《Fate/EXTELLA》PS Vita版 REGALIA BOX，2016年11月10日发售。官方原配为PS Vita游戏、ワダアルコ绘制收纳盒、《Fate/EXTELLA material》及吉尔伽美什服装兑换码。二手缺件与代码状态以各挂牌记录为准。',{expectedJan:'4535506302557',expectedCategory:'PSVITAソフト',additionalSources:[spec.source],notes:fixedNote+' 本轮以Vita专页712及原JAN/分类补证，不把旧PS4来源711当作Vita证据。'});
for(const id of ['e514fc7c-0f5d-49c3-8c80-6c635c84c79f','source-df27e40bfec555310d76293163ebd082'])put(id,'715','PSVita','2016/11/10','《Fate/EXTELLA》VELBER BOX，2016年11月10日发售。官方原配包含PS4与PS Vita两份游戏、ワダアルコ绘制收纳盒、《Fate/EXTELLA material》、Saber Bride鼠标垫，以及尼禄和吉尔伽美什服装兑换码。此处说明原始配置，保留各二手挂牌的缺件与代码状态。',{expectedJan:'4535506302588',additionalSources:[spec.source],scope:'双平台官方原配；零售归在某一平台不代表原套装仅有该平台。缺PS4游戏的挂牌仍保持缺件，不改变关系。'});
for(const [id,n,p,d,j,c] of [
 ['source-c058bb7427eedc21bc50926eec9ad3ad','713','PlayStation 4','2016/11/10','4535506302564','PS4ソフト'],
 ['source-4944cd6506cf1882558c9626a736fd90','714','PSVita','2016/11/10','4535506302571','PSVITAソフト'],
 ['source-2e0fef6c61ceaa2c0bc9d4501e7b9fc1','9027','Nintendo Switch','2017/07/20','4535506302656','ニンテンドースイッチソフト']
])put(id,n,p,d,'Marvelous《Fate/EXTELLA》日本发行的'+p+'通常版游戏，'+d.replace('/','年').replace('/','月')+'日发售，类型为高速从者动作游戏。此版本的游戏本体与限定盒附属品分别收录。',{expectedJan:j,expectedCategory:c});
for(const [id,n,p,d,j,c] of [
 ['source-ea9a64526473936a67bde793b4dc425b','9161','PlayStation 4','2018/01/11','4535506302748','PS4ソフト'],
 ['source-d2c986fd1219a09dc0a23a1034e87076','9157','PSVita','2018/01/11','4535506302755','PSVITAソフト'],
 ['source-6c622374746f0c6d0484025f38149450','9479','Nintendo Switch','2018/12/20','','ニンテンドースイッチソフト']
])put(id,n,p,d,'Marvelous《Fate/EXTELLA》'+p+'版 Best Collection，'+d.replace('/','年').replace('/','月')+'日发售的再版游戏，类型为高速从者动作游戏。',{expectedJan:j,expectedCategory:c});
put('source-9d381d8f543e1d6cdd961f532937271c','9025','Nintendo Switch','2017/07/20','《Fate/EXTELLA》Nintendo Switch版 LIMITED BOX，2017年7月20日发售。官方原配包含Switch游戏、ワダアルコ绘制收纳盒及其设计的“ネロとおでかけポーチ”收纳包。二手附属品状态保留在各挂牌记录中。',{expectedCategory:'ニンテンドースイッチソフト'});
for(const [id,n,p] of [['source-09df383fc33dfe57a856f80c6ae438d1','9927','Nintendo Switch'],['source-bb4712a111fa560467b5f6fe8b0dbe3d','9929','PlayStation 4']])put(id,n,p,'2021/02/11','Fate/EXTRA十周年纪念商品《Fate/EXTELLA Celebration BOX》'+p+'版，2021年2月11日发售。官方原配含该平台《EXTELLA》与《EXTELLA LINK》两款游戏、えくすてらっち电子宠物、A5画框画、纪念收纳盒及LINK尼禄新娘服装兑换码。二手缺件与代码状态以各挂牌记录为准。',{expectedCategory:p==='Nintendo Switch'?'ニンテンドースイッチソフト':'PS4ソフト',additionalSources:[celebration.source],notes:fixedNote+' Celebration确实同捆LINK；不是将LINK单独游戏混为EXTELLA本体。两平台DLC收录方式不同，不互相套用。'});
for(const [id,n,p,d,extra] of [
 ['family-0183ff00ef87ca388a6e47040ebba2fe','713','PlayStation 4','2016/11/10',['711','9161','9929']],
 ['family-0f262895efbf6ddfd6959cacecc8e1b4','9027','Nintendo Switch','2017/07/20',['9025','9479','9927']],
 ['family-247976461de98daf5176ebb4e6a5c3e0','714','PSVita','2016/11/10',['712','9157']]
])put(id,n,p,d,'《Fate/EXTELLA》的'+p+'平台版本目录，收录该平台游戏的不同发行版本。各版本的发售批次、限定盒与附属内容分别保留；本条为目录，不代表一件实物或齐套商品。',{additionalSources:extra.map(n=>src(n).source),scope:'平台逻辑目录；不把跨版本目录当成实物套装或把首发日期套给所有成员'});
for(const [id,p] of [['game-member-15m8kc5','PlayStation Vita'],['game-member-1uv75td','PlayStation 4']]){
 const i=originals.get(id);assert.ok(i.evidence.some(e=>e.field==='套装成员'&&e.url===src('715').source.url));
 maps.set(id,{source:src('715').source,additionalSources:[spec.source],officialTitle:'Fate/EXTELLA VELBER BOX / '+p+' 游戏组件',platform:p,summary:'《Fate/EXTELLA》'+p+'版游戏本体组件，为官方VELBER BOX原配内容之一。此条记录游戏组件本身，收纳盒、资料集及其他特典另行保留，不据此推定二手套装内容齐全。',scope:'既有套装成员证据与官方VELBER配置对应；不赋通常版包装JAN或单独零售版本身份'});
}
put('source-e821878efa15202c5c1ebd0cf67bf1c3','9027','Nintendo Switch','2017/07/20','Marvelous《Fate/EXTELLA》的Nintendo Switch游戏记录，属于高速从者动作游戏。此处仅补已由原来源分类确认的平台和游戏类型，具体包装版本与附属品仍以原挂牌资料为准。',{expectedCategory:'ニンテンドースイッチソフト',scope:'原零售分类与发售日匹配官方Switch版；不根据209编号前缀推断版本，不添加通常版或完整包装结论'});
maps.set('source-9624fc8353e0a4d821790e6e37369a30',{source:eu.source,additionalSources:[],officialTitle:'Fate/EXTELLA: The Umbral Star / Europe / Nintendo Switch',expectedJan:'5060540770011',expectedCategory:'ニンテンドースイッチソフト',platform:'Nintendo Switch',summary:'《Fate/EXTELLA: The Umbral Star》欧洲发行的Nintendo Switch版游戏。发行商公告列出欧洲版于2017年7月21日推出；原零售目录的地区、平台与商品条码相符。具体语言、包装附属品与运行条件不作额外推定。',retailerObservation:{id:observations[0].id,sha256:hash(JSON.stringify(observations[0]))},second:observations[0].url,scope:'欧洲Switch发行公告与零售条码/平台双重绑定；不使用日本或北美发售日'});
maps.set('source-cd4bff27b3e072861e745a2614b02d67',{source:na.source,additionalSources:[],officialTitle:'Fate/EXTELLA: The Umbral Star / North America / PlayStation Vita',expectedJan:'0859716006055',expectedCategory:'PSVITAソフト',platform:'PSVita',summary:'XSEED发行的《Fate/EXTELLA: The Umbral Star》北美PS Vita版游戏，官方列出的PS Vita发售日为2017年1月17日。原零售目录将该条码对应至北美PS Vita商品；不将海外限定套装的附属品套用到本条。',retailerObservation:{id:observations[1].id,sha256:hash(JSON.stringify(observations[1]))},second:observations[1].url,scope:'北美发行商资料与零售条码/地区/平台一致；不推定Noble Phantasm Edition配置'});
assert.equal(maps.size,21);
const pending=new Map([
 ['source-98baf5aff1cb6624110b5133246b9b6e',['原拍卖标题只确认PS4，未明确通常版、Best或其他包装；现页及编号检索未取得可独立核对详情。','原拍卖图文、封面版本标志或包装条码。']],
 ['source-9c344c34604df07f84d62f5cb2f78101',['原标题混合EXTELLA、LINK、Realta Nua及hollow ataraxia多款游戏，不能当作官方EXTELLA套装；未取得各实物/版本证据。','原拍卖的完整照片、组合清单及各游戏版本。']],
 ['source-a3ccc05d6d923083d2c9803d38d96e0c',['标题提及Switch Celebration BOX，但仅有规则标签与拍卖摘要，没有条码或独立实物身份资料；页面不可读。','原拍卖详情或独立包装/条码照片，将此拍卖ID与官方限定盒绑定。']]
]);
const games=read(priv+'/extella-targets.json').map(t=>{
 const i=originals.get(t.id),r={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:binding(i)};
 assert.ok(!i.summary&&!i.editorial&&!i.locked&&!i.manualFields?.length);
 if(pending.has(i.id)){const [reason,needed]=pending.get(i.id);return {...r,status:'pending',reason,needed,recheckRule:'取得独立身份资料后再查；访问失败不改挂牌状态',observationId:'unreadable-listings'};}
 const m=maps.get(i.id);assert.ok(m,i.id);
 if(m.expectedJan!==undefined)assert.equal(i.jan,m.expectedJan);
 if(m.expectedCategory)assert.ok(i.evidence.some(e=>e.field==='category'&&e.value===m.expectedCategory),i.id);
 const identityEvidence=[...new Map(i.evidence.filter(e=>['category','来源分类','jan','releaseDate','套装成员','系列整理'].includes(e.field)).map(e=>[e.field+'|'+e.value,e])).values()];
 return {...r,status:'supported',scope:'官方版本专页与既有平台分类、条码或版本目录身份逐条对应',notes:fixedNote,...m,identityEvidence};
});
write(dir+'/cases-extella.json',{at,rows:games});
const w=cached('https://www.bandai.co.jp/candy/products/2018/4549660251392000.html'),mirror=cached('https://www.bandai.co.jp/catalog/item.php?jan_cd=4549660251392000');
const parse=p=>[...p.body.matchAll(/(\d+)．(N|R|SR|SSR)\s+([^<]+)<br\s*\/?>/g)].map(m=>({number:+m[1],rarity:m[2],name:clean(m[3])}));
const lineup=parse(w);assert.equal(lineup.length,25);assert.deepEqual(parse(mirror),lineup);
const normalize=s=>s.normalize('NFKC');
assert.ok(w.body.includes('全25種')&&w.body.includes('プラカード1枚')&&w.body.includes('メタリック'));
const cards=read(priv+'/wafer3-targets.json').map(t=>{
 const i=originals.get(t.id),r={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:binding(i),status:'supported',source:w.source,additionalSources:[mirror.source],notes:'官方目录编号及稀有度逐项核对；不把包装JAN当单卡JAN，不增加未在候选中的卡片，不承诺附威化食品或整盒齐款。原名及所有图片保留。'};
 assert.ok(!i.summary&&!i.editorial&&!i.locked&&!i.manualFields?.length);
 assert.ok(i.evidence.some(e=>e.url===w.source.url));
 if(i.id.startsWith('family-'))return {...r,officialTitle:'Fate/Grand Orderウエハース3',scope:'官方第3弹系列目录；逻辑父级，不是零售整盒或齐款套装',summary:'BANDAI《Fate/Grand Order》威化卡第3弹，2018年6月5日发售，全25种塑料卡，包含1种SSR隐藏款。卡面采用金属光泽印刷，背面刊载从者资料；本条为系列目录，不代表25张齐款套装。'};
 const m=i.member.match(/^No\.(\d{2}) (.+)$/);assert.ok(m);const f=lineup.find(f=>f.number===+m[1]);assert.ok(f);assert.equal(normalize(m[2]),normalize(f.name));assert.equal(i.title,'Fate/Grand Orderウエハース3 '+i.member);
 if(f.number===25){assert.equal(f.name,'シークレット');assert.equal(f.rarity,'SSR');assert.ok(i.description.includes('角色信息仍待核对'));return {...r,officialTitle:'Fate/Grand Orderウエハース3 / No.25 SSR シークレット',number:25,rarity:'SSR',officialName:f.name,scope:'既有No.25隐藏款席位与官方唯一No.25 SSR隐藏款对应；只确认目录标签，角色身份未核实',summary:'BANDAI《Fate/Grand Order》威化卡第3弹的No.25隐藏款，官方目录标记为SSR“シークレット”。该弹于2018年6月5日发售；本条仅确认目录编号与稀有度，隐藏角色身份仍待核对。',unresolvedFields:['secretCharacterIdentity'],recheckRule:'需有实际卡背编号与角色对应的独立证据；不能按同弹人物或宣传图猜名'};}
 assert.ok(i.evidence.some(e=>e.field==='官方款式'&&normalize(e.value)===normalize(i.member)));
 return {...r,officialTitle:'Fate/Grand Orderウエハース3 / No.'+m[1]+' '+f.rarity+' '+f.name,number:f.number,rarity:f.rarity,officialName:f.name,scope:'官方文字目录编号、角色/职阶与原官方款式一致；仅统一标点用于比对，原数据不改名',summary:'BANDAI《Fate/Grand Order》威化卡第3弹的单张塑料卡，官方目录No.'+m[1]+'，'+f.rarity+'级，款式为'+f.name+'。该弹于2018年6月5日发售，卡面采用金属光泽印刷，背面刊载从者资料。'};
});
assert.equal(cards.length,17);write(dir+'/cases-wafer3.json',{at,rows:cards});
write(dir+'/official-facts.json',{at,extella:{reviewed:24,supported:21,pending:3,scope:'21条仅补有明确身份绑定的版本、平台、组件或逻辑目录。三条拍卖保留待查。',celebrationSource:celebration.source,celebrationCaution:'EXTELLA与LINK是官方同捆的不同游戏；PS4为衣装代码，Switch部分衣装预先收录。缺件/代码不作可用承诺。',regaliaCaution:'PS4用711、Vita用712；原旧证据不删。VELBER原配为双平台，不从零售分类推断单平台。'},wafer3:{source:w.source,corroboration:mirror.source,releaseDate:'2018-06-05',totalTypes:25,lineup,targetSingles:16,targetFamily:1,secretCharacterPending:true,scope:'15个有名角色、1个官方SSR隐藏款标签、1个目录。隐藏角色仍待查；未创建其余成员，不声称看过每张卡背。'}});
console.log(JSON.stringify({reviewed:41,supported:38,pending:3,additionalUnresolvedFields:1,protected:0}));

