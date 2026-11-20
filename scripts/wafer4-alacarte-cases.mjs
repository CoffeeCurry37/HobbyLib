import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261120/wafer4-alacarte',priv='work/series-evidence-20261120/wafer4-alacarte',at=new Date().toISOString();assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const snapshot=read('work/v6/production-after.json'),originals=new Map(snapshot.items.map(i=>[i.id,i])),norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim(),strip=s=>norm(clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ')));
const roman=['I','II','III','IV','V','VI','VII','VIII'];
const books=read(priv+'/books.json').map(({url},n)=>{
 const {body:b,source}=cached(url),data=JSON.parse(b.match(/window\.item\s*=\s*(\{[^\r\n]+\});/)[1]),title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)[1]),format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)[1]),credits=strip(data.author_name1);
 assert.equal(data.item_code,new URL(url).pathname.split('/').filter(Boolean).at(-1));assert.equal(norm(data.disp_title),title);assert.equal(data.isbn_13,isbn);assert.equal(data.page_num,pages);assert.equal(format,'B6変形判');assert.equal(data.togo_item_kbn,1);assert.equal(data.product_form,5);assert.ok(title.endsWith(roman[n])&&!/PLUS/.test(title));assert.ok(credits.includes('TYPE-MOON')&&credits.includes('コンプエース編集部'));assert.ok(b.includes('紙書籍'));
 return{source,officialTitle:title,volume:n+1,isbn,pages,format,releaseDate:data.release_date,credits,label:'角川コミックス・エース',medium:'paper',scope:'纸本DOM和window.item交叉核对；这里的ISBN是出版社书目事实，原零售ID与实物条码绑定未完成，不填原ISBN/JAN。'};
});
const bandai=cached('https://www.bandai.co.jp/candy/products/2018/4549660252245000.html');for(const s of ['全25種','12種','8種','4種','メタリック','ホロ加工'])assert.ok(bandai.body.includes(s));
const imageReceipts=['images','original-images'].flatMap(k=>fs.readFileSync(priv+'/'+k+'.receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='captured'));
for(const r of imageReceipts)assert.equal(hash(fs.readFileSync('work/series-evidence-20261103/cache/'+r.file)),r.sha256);
const officialImages=read(priv+'/images.json').map(({url})=>{const r=imageReceipts.find(r=>r.url===url);assert.ok(r&&bandai.body.includes(url));return{url,at:r.at,sha256:r.sha256};});
const lineup=[
{number:1,name:'シュヴァリエ・デオン',rarity:'N',image:3,position:'上左'},
{number:2,name:'ランスロット',rarity:'N',image:3,position:'上中'},
{number:8,name:'トーマス・エジソン',rarity:'N',image:4,position:'上中'},
{number:9,name:'カーミラ',rarity:'N',image:4,position:'上右'},
{number:11,name:'ベオウルフ',rarity:'N',image:4,position:'下中'},
{number:12,name:'エルドラドのバーサーカー',rarity:'N',image:4,position:'下右'},
{number:15,name:'清姫',rarity:'R',image:5,position:'下左'},
{number:19,name:'織田信長',rarity:'R',image:6,position:'下左'},
{number:21,name:'アルトリア・ペンドラゴン',rarity:'SR',image:7,position:'上左'}
];
const observations=[{id:'wafer4-official-numbered-lineup',url:officialImages[8].url,at,kind:'visual-observation-of-official-linked-image',sourceAt:officialImages[8].at,sourceSha256:officialImages[8].sha256,facts:{totalTypes:25,secretShown:false,numberedCardsShown:24,targets:lineup.map(({image,position,...r})=>r),scope:'官方合图直接印No.01至No.25；目标9张均为具名图款。使用印出的编号及图面匹配，未借本地席位顺序。No.25黑框没有揭示角色。'}},
{id:'alacarte1-rakuten-date',url:'https://books.rakuten.co.jp/rb/13605613/',at,kind:'public-web-text-observation',sourceRole:'retailer',facts:{volume:1,isbn:'9784041040928',retailerDate:'2016-03-08頃',publisherDate:'2016-03-10',pages:148,scope:'同ISBN出版社与楽天日期差异；该URL不是原駿河屋管理编号的条码证明。'}}];
const retailFacts=[[2,'503091298','2016-05-21'],[3,'503092528','2016-08-24'],[4,'503094165','2016-11-26'],[5,'503095015','2017-01-26'],[6,'503096846','2017-04-26']];
for(const [volume,code,date]of retailFacts)observations.push({id:'alacarte-retailer-'+volume,url:volume===5?'https://www.suruga-ya.com/ja/product/'+code:'https://www.suruga-ya.jp/product/detail/'+code,at,kind:'public-web-text-observation',sourceRole:'retailer',facts:{volume,code,title:'Fate/Grand Order コミックアラカルト('+volume+')',category:'B6コミック',publisher:'角川書店/KADOKAWA',date,isbnShown:false,scope:'可读网页观察与原管理编号、卷号、纸本分类、出版社对应；正文未列ISBN。'}}); 
for(const o of observations)o.hashMeaning='观察JSON哈希，不是原HTML哈希';
const ref=id=>{const o=observations.find(o=>o.id===id);assert.ok(o);return{id,url:o.url,sha256:hash(JSON.stringify(o))}};
const binding=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
const notes='只补空简介与两条出处；原名、ISBN/JAN、图片、旧证据、认可、个人字段、挂牌历史、关系和偏好保留。',fields=[];
const cards=read(priv+'/wafer4-targets.json').map(t=>{
 const i=originals.get(t.id);assert.ok(!i.summary&&!i.editorial&&!i.locked&&!i.manualFields?.length);assert.equal(i.isbn,'');assert.equal(i.jan,'');assert.ok(i.title.includes('4弾')&&i.title.includes('2439037'));
 const num=Number(i.title.match(/ (\d+)$/)[1]),f=lineup.find(f=>f.number===num);assert.ok(f&&i.title.includes(f.name));assert.ok(i.evidence.some(e=>e.url===bandai.source.url));
 const r=imageReceipts.find(r=>r.url===i.image);assert.ok(r);const id='wafer4-original-image-'+num;
 observations.push({id,url:i.image,at,kind:'visual-comparison-of-original-listing-and-official-image',sourceAt:r.at,sourceSha256:r.sha256,officialImage:officialImages[f.image],hashMeaning:'观察JSON哈希，不是原图字节哈希',facts:{number:num,name:f.name,officialPosition:f.position,result:'原零售小图的人物、姿势、服饰、背景及边框与厂家对应图一致',scope:'原小图均为正面，未声称看过原实物卡背；编号另以原具名标题加官方印号清单绑定，不能据图片判断当前品相或包装完整。'}});
 return{itemId:i.id,groupId:t.groupId,title:i.title,status:'supported',recordKind:'named-single-card',identityBinding:binding(i),source:bandai.source,sourceRole:'manufacturer',officialTitle:'Fate/Grand Orderウエハース4 / No.'+String(num).padStart(2,'0')+' '+f.rarity+' '+f.name,number:num,rarity:f.rarity,officialName:f.name,imageObservation:ref(id),lineupObservation:ref('wafer4-official-numbered-lineup'),second:officialImages[8].url,identityMatch:'原具名标题的第4弹/2439037、卡号、人物与官方印号清单相符；原零售卡面逐张对照厂家图',scope:'官方具名卡号、稀有度及原卡面一致；不涉及另一个匿名第4弹分组，不将包装JAN作为单卡JAN',summary:'BANDAI《Fate/Grand Order》威化卡第4弹的单张塑料卡，官方目录No.'+String(num).padStart(2,'0')+'，'+f.rarity+'级，人物为'+f.name+'。该弹于2018年8月13日发售，卡面采用金属光泽印刷，背面刊载从者资料；本条记录单卡，不承诺附威化食品或原包装。',notes};
});
const volumes=read(priv+'/alacarte-targets.json').map(t=>{
 const i=originals.get(t.id),base={itemId:i.id,groupId:t.groupId,title:i.title,status:'supported',identityBinding:binding(i),sourceRole:'publisher',notes};assert.ok(!i.summary&&!i.editorial&&!i.locked&&!i.manualFields?.length);assert.equal(i.isbn,'');assert.equal(i.jan,'');
 if(i.id.startsWith('family-')){const childIds=snapshot.relations.filter(r=>r.fromId===i.id&&r.kind==='contains').map(r=>r.toId);assert.equal(childIds.length,8);assert.ok(childIds.every(id=>read(priv+'/alacarte-targets.json').some(t=>t.id===id)));return{...base,recordKind:'logical-series',source:books[0].source,additionalSources:[books[7].source],officialTitle:i.title,childIds,scope:'原逻辑目录组织现有第1至8卷；不宣称系列仅8卷、完结或实体齐套；PLUS!和电子版分开',summary:'《Fate/Grand Order コミックアラカルト》纸本漫画选集目录，TYPE-MOON原作、コンプエース編集部编，列入角川コミックス・エース。现有目录关联第1至8卷；本条用于组织独立单卷，不表示系列仅有8卷、已经完结或拥有整套。'};}
 const volume=Number(i.title.match(/\((\d+)\)$/)[1]),f=books[volume-1],url=i.offers[0].url,code=new URL(url).pathname.split('/').at(-1);
 assert.equal(i.title,'Fate/Grand Order コミックアラカルト('+volume+')');assert.ok(i.evidence.some(e=>e.field==='brand'&&e.value==='角川書店/KADOKAWA'&&e.url===url));assert.ok(i.evidence.some(e=>e.field==='category'&&e.value==='B6コミック'&&e.url===url));assert.ok(i.image.includes('shinaban='+code));
 const dateConflict=[1,2,3,6].includes(volume),originalDate=i.evidence.find(e=>e.field==='releaseDate').value.replaceAll('/','-');
 if(volume!==1)assert.equal(originalDate!==f.releaseDate,dateConflict);else assert.equal(originalDate,f.releaseDate);
 const retail=retailFacts.find(r=>r[0]===volume);if(retail)assert.equal(retail[1],code);
 const field={itemId:i.id,title:i.title,fields:['原管理编号与实物ISBN/条码的独立绑定','具体印次'],publisherSource:f.source,retailerCode:code,reason:'原ISBN/JAN为空，原图片不可读；已核原管理编号、卷号、纸本分类及出版社，但尚无同编号条码或实物封面交叉证据。暂不把出版社ISBN填到原记录或新简介。',needed:'同管理编号的可读书号信息或实物封面/版权页；保留原ISBN/JAN为空。',appliedSafeSummary:false};
 if(dateConflict){field.fields.push('发售日期');field.dateComparison={publisher:f.releaseDate,originalRetailer:originalDate,...(volume===1?{rakuten:'2016-03-08頃',observation:ref('alacarte1-rakuten-date')}:{} )};field.reason+=' 日期存在来源差异，简介不补发售日期。';}
 fields.push(field);
 return{...base,recordKind:'retailer-volume-safe-scope',source:f.source,officialTitle:f.officialTitle,volume,retailerCode:code,dateConflict,isbnBindingPending:true,...(retail?{retailerObservation:ref('alacarte-retailer-'+volume)}:{}),...(volume===1?{dateObservation:ref('alacarte1-rakuten-date')}:{}),identityMatch:'原编号绑定的卷号、纸本B6分类、角川出版社及系列名与出版社罗马卷号书目对应；书号与印次另保留待查',scope:'仅补明确的卷目、纸本类型、编辑方和对应出版社规格；原标题无PLUS!，不借用电子版；未独立绑定ISBN，不新增书号',summary:'《Fate/Grand Order コミックアラカルト》第'+volume+'卷纸本漫画选集，TYPE-MOON原作、コンプエース編集部编，列入角川コミックス・エース。对应出版社书目标注B6变形判、'+f.pages+'页。'+(dateConflict?'发售日期因来源差异暂不补写。':'出版社纸本发售日为'+f.releaseDate+'。')+'原零售记录的书号和具体印次仍待独立核对。'};
});
assert.equal(cards.length,9);assert.equal(volumes.length,9);assert.equal(fields.length,8);assert.equal(volumes.filter(r=>r.dateConflict).length,4);
write(dir+'/web-observations.json',observations);
write(dir+'/official-facts.json',{at,wafer4:{source:bandai.source,releaseDate:'2018-08-13',totalTypes:25,rarities:{N:12,R:8,SR:4,secret:1},officialImages,lineup,targetSingles:9,originalImagesCompared:9,scope:'包装单份含卡1张/威化1片不是二手单卡附食品保证；未核No.25隐藏角色，也未处理另组匿名占位。'},books,fullProductVerified:0,fullSeriesVerified:0});
write(dir+'/cases-wafer4.json',{at,rows:cards});write(dir+'/cases-alacarte.json',{at,rows:volumes});write(dir+'/field-pending.json',{at,items:fields,scopeCounts:{retailerIsbnAndPrinting:8,bookDate:4,distinctRecords:8},note:'18条可补安全说明；8卷原零售书号/印次仍待独立绑定，其中1/2/3/6卷日期有差异。均不计完整核实。'});write(dir+'/pending.json',[]);
console.log(JSON.stringify({reviewed:18,ready:18,wholePending:0,fieldPending:8,datePending:4,originalCardImagesCompared:9,publisherPaperVolumes:8,logicalDirectories:1}));
