import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261120/wafer3-wafer12',priv='work/series-evidence-20261120/wafer3-wafer12',at=new Date().toISOString();assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),norm=s=>s.normalize('NFKC').replace(/[･・]/g,'').replace(/[【〔\[]/g,'(').replace(/[】〕\]]/g,')').replace(/\s+/g,'');
const configs=[
{key:'wafer3',wave:3,edition:'2435058',url:'https://www.bandai.co.jp/candy/products/2018/4549660251392000.html',releaseDate:'2018-06-05',totalTypes:25,rarities:{N:12,R:8,SR:4,SSR:1},lineupIndex:7,lineup:[
{number:2,name:'トリスタン',class:'アーチャー',rarity:'N',image:2,position:'上中'},
{number:4,name:'宝蔵院胤舜',class:'ランサー',rarity:'N',image:2,position:'下左'},
{number:7,name:'ハンス・クリスチャン・アンデルセン',class:'キャスター',rarity:'N',image:3,position:'上左'},
{number:10,name:'不夜城のアサシン',class:'アサシン',rarity:'N',image:3,position:'下左'},
{number:11,name:'坂田金時',class:'バーサーカー',rarity:'N',image:3,position:'下中'},
{number:14,name:'新宿のアーチャー',class:'アーチャー',rarity:'R',image:4,position:'上右'},
{number:15,name:'ブリュンヒルデ',class:'ランサー',rarity:'R',image:4,position:'下左'},
{number:21,name:'ネロ・クラウディウス[ブライド]',class:'セイバー',rarity:'SR',image:6,position:'上左'},
{number:23,name:'レオナルド・ダ・ヴィンチ',class:'キャスター',rarity:'SR',image:6,position:'下左'}]},
{key:'wafer12',wave:12,edition:'2671918',url:'https://www.bandai.co.jp/candy/products/2023/4549660958338000.html',releaseDate:'2023-07-31',totalTypes:30,rarities:{N:10,R:8,CR:5,SR:6,SSR:1},lineupIndex:9,lineup:[
{number:1,name:'Hai Bà Trưng',originalName:'徴姉妹',class:'セイバー',rarity:'N',image:2,position:'上左',namePending:true,nameIssue:'原题「徴姉妹」的日文字形须与更清晰的官方文字/原卡背独立核对；只确认官方No.01图款及正面Hai Bà Trưng标字，不据小图重写汉字。'},
{number:5,name:'ヒルド',class:'アサシン',rarity:'N',image:2,position:'下中'},
{number:8,name:'徐福',class:'アルターエゴ',rarity:'N',image:3,position:'上右'},
{number:11,name:'ガレス',class:'セイバー',rarity:'R',image:4,position:'上左'},
{number:12,name:'Dobrynya Nikitich',originalName:'ドプルイニャ・ニキチッチ',class:'ライダー',rarity:'R',image:4,position:'上右',namePending:true,nameIssue:'原题「ドプルイニャ・ニキチッチ」与官方日文表记的プ/ブ字形不一致；官方No.12图款及正面Dobrynya Nikitich标字已对应，原标题不改，待原零售可读详情/卡背核对后决定名称修订。'},
{number:14,name:'武則天',class:'キャスター',rarity:'R',image:4,position:'下右'},
{number:19,name:'アルトリア・ペンドラゴン[オルタ]',class:'セイバー',rarity:'CR',image:6,position:'上左'},
{number:20,name:'アーサー・ペンドラゴン[プロトタイプ]',class:'セイバー',rarity:'CR',image:6,position:'上右'},
{number:24,name:'シャルルマーニュ',class:'セイバー',rarity:'SR',image:7,position:'上左'}]}
];
const imageReceipts=['images','original-images'].flatMap(k=>fs.readFileSync(priv+'/'+k+'.receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='captured'));
assert.equal(imageReceipts.length,36);for(const r of imageReceipts)assert.equal(hash(fs.readFileSync('work/series-evidence-20261103/cache/'+r.file)),r.sha256);
const observations=[],facts=[],fields=[];
const binding=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
const ref=id=>{const o=observations.find(o=>o.id===id);assert.ok(o);return{id,url:o.url,sha256:hash(JSON.stringify(o))}};
for(const c of configs){
 const page=cached(c.url),targets=read(priv+'/'+c.key+'-targets.json'),groupId=targets[0].groupId;
 assert.ok(page.body.includes('ウエハース'+c.wave));assert.ok(page.body.includes('全'+c.totalTypes+'種')&&page.body.includes('メタリック'));assert.ok(page.body.includes(c.wave===3?'2018年6月5日':'2023年7月31日'));
 if(c.wave===3){const lines=[...page.body.matchAll(/(\d+)．(N|R|SR|SSR)\s+([^<]+)<br\s*\/?>/g)].map(m=>({number:Number(m[1]),rarity:m[2],name:clean(m[3])}));for(const f of c.lineup){const a=lines.find(x=>x.number===f.number);assert.ok(a);assert.equal(a.rarity,f.rarity);assert.equal(norm(a.name),norm(f.class+'/'+f.name));}}
 const officialImages=read(priv+'/images.json').filter(r=>r.groupId===groupId).map(({url})=>{const r=imageReceipts.find(r=>r.url===url);assert.ok(r&&page.body.includes(url));return{url,at:r.at,sha256:r.sha256}});
 assert.equal(officialImages.length,c.wave===3?8:10);const line=officialImages[c.lineupIndex],lineId=c.key+'-official-numbered-lineup';
 observations.push({id:lineId,url:line.url,at,kind:'visual-observation-of-official-linked-image',sourceAt:line.at,sourceSha256:line.sha256,hashMeaning:'观察JSON哈希，不是原图字节哈希',facts:{totalTypes:c.totalTypes,secretShown:false,numberedCardsShown:c.totalTypes-1,targets:c.lineup.map(({image,position,nameIssue,...r})=>r),scope:'按官方印出的No.编号、稀有度分区及图款对应；不是本地记录序号。黑框隐藏卡没有揭示角色。名称字形未确认处仅记可读正面罗马字，不改原标题。'}});
 const rows=targets.map(t=>{
 const i=originals.get(t.id);assert.ok(!i.summary&&!i.editorial&&!i.locked&&!i.manualFields?.length);assert.equal(i.isbn,'');assert.equal(i.jan,'');assert.ok(i.title.includes(c.wave+'弾')&&i.title.includes(c.edition));assert.ok(i.evidence.some(e=>e.url===page.source.url));
 const num=Number(i.title.match(/ (\d+)$/)[1]),f=c.lineup.find(f=>f.number===num);assert.ok(f);assert.ok(norm(i.title).includes(norm(f.originalName||f.name)));
 const r=imageReceipts.find(r=>r.url===i.image);assert.ok(r);const id=c.key+'-original-image-'+num;
 observations.push({id,url:i.image,at,kind:'visual-comparison-of-original-listing-and-official-image',sourceAt:r.at,sourceSha256:r.sha256,officialImage:officialImages[f.image],hashMeaning:'观察JSON哈希，不是原图字节哈希',facts:{number:num,name:f.name,officialPosition:f.position,result:'原零售正面的人物、姿势、服饰、背景及边框与官方对应图一致',scope:'原小图均为正面，未声称读过原实物卡背；编号由原具名标题及官方印号清单绑定，不能判断当前品相或包装完整。'}});
 if(f.namePending)fields.push({itemId:i.id,title:i.title,fields:['原人物名称日文字形'],number:num,originalName:f.originalName,officialFrontName:f.name,reason:f.nameIssue,needed:'更清晰官方日文标记以及原零售可读详情/卡背；原标题保持。',imageObservation:ref(id),appliedSafeSummary:false});
 return{itemId:i.id,groupId,title:i.title,status:'supported',recordKind:'named-single-card',identityBinding:binding(i),source:page.source,sourceRole:'manufacturer',officialTitle:'Fate/Grand Order ウエハース'+c.wave+' / No.'+String(num).padStart(2,'0')+' '+f.rarity+' '+f.name,wave:c.wave,number:num,rarity:f.rarity,officialName:f.name,namePending:!!f.namePending,imageObservation:ref(id),lineupObservation:ref(lineId),second:line.url,identityMatch:'原具名标题的弹次/'+c.edition+'、卡号与官方清单相符；原商品正面逐张对照厂家图'+(f.namePending?'；日文名称字形单独待查':''),scope:'仅补明确的卡号、稀有度、图款及系列资料；不跨组归并，不将包装条码当单卡JAN',summary:'BANDAI《Fate/Grand Order》威化卡第'+c.wave+'弹的单张塑料卡，官方目录No.'+String(num).padStart(2,'0')+'，'+f.rarity+'级，'+(f.namePending?'官方正面标字为':'人物为')+f.name+'。该弹于'+c.releaseDate+'发售，卡面采用金属光泽印刷，背面刊载从者资料；本条记录单卡，不承诺附威化食品或原包装。'+(f.namePending?'原人物名称的日文字形继续待查。':''),notes:'只补空简介与两条出处；原名、ISBN/JAN、图片、旧证据、认可、个人字段、挂牌历史、关系和偏好保留。'};
 });assert.equal(rows.length,9);write(dir+'/cases-'+c.key+'.json',{at,rows});
 facts.push({key:c.key,source:page.source,releaseDate:c.releaseDate,totalTypes:c.totalTypes,rarities:c.rarities,officialImages,lineup:c.lineup,targetSingles:9,originalImagesCompared:9,scope:'不涉及此前已补第3弹17条及另组第12弹22条匿名占位；原包装食品内容不保证二手单卡附带，最高稀有工艺不外推全卡。'});
}
assert.equal(fields.length,2);write(dir+'/official-facts.json',{at,series:facts,fullProductVerified:0,fullSeriesVerified:0});write(dir+'/web-observations.json',observations);write(dir+'/pending.json',[]);write(dir+'/field-pending.json',{at,items:fields,scopeCounts:{japaneseNameGlyphs:2,distinctRecords:2},note:'18条图款/卡号等可补；其中2条日文名称字形单独待查，原名保留。均不计完整核实。'});console.log(JSON.stringify({reviewed:18,ready:18,wholePending:0,fieldPending:2,officialImagesViewed:18,originalImagesCompared:18}));
