import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,cached,clean,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261114/melty-capsule',priv='work/series-evidence-20261114/melty-capsule',at=new Date().toISOString();assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const snapshot=read('work/v6/production-after.json'),originals=new Map(snapshot.items.map(i=>[i.id,i]));
const norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim(),strip=s=>norm(clean(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')));
const books=read(priv+'/book-facts.json').map(({url})=>{
 const {body:b,source}=cached(url),data=JSON.parse(b.match(/window\.item\s*=\s*(\{[^\r\n]+\});/)[1]);
 const title=strip(b.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),volume=Number(title.match(/\((\d+)\)/)?.[1]),isbn=b.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],pages=Number(b.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1]),format=strip(b.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
 assert.equal(data.item_code,new URL(url).pathname.split('/').filter(Boolean).at(-1));assert.equal(norm(data.disp_title),title);assert.equal(data.isbn_13,isbn);assert.equal(data.page_num,pages);assert.equal(format,'B6変形判');assert.equal(data.togo_item_kbn,1);assert.equal(data.product_form,5);assert.equal(data.jan,'');assert.ok(!data.magazine_jan);
 const start=b.indexOf('id="book-title-sp"'),end=b.indexOf('同じシリーズ',start),body=strip(b.slice(start,end>start?end:start+20000));assert.ok(body.includes('紙書籍'));
 const credits=strip(data.author_name1);assert.ok(credits.includes('桐嶋 たける')&&credits.includes('TYPE-MOON'));assert.equal(credits.includes('フランスパン'),![1,3].includes(volume));assert.ok(strip(b.match(/<title>([\s\S]*?)<\/title>/)[1]).includes('角川コミックス・エース'));
 return{source,officialTitle:title,volume,isbn,pages,format,releaseDate:data.release_date,credits,label:'角川コミックス・エース',medium:'paper',scope:'本商品纸本DOM及window.item交叉核对；不借用关联电子版日期或署名，不推定具体印次。'};
}).sort((a,b)=>a.volume-b.volume);assert.deepEqual(books.map(f=>f.volume),[1,2,3,4,5,6,7,8,9]);
const cap=cached('https://anime.elmelloi.com/news/?id=51244'),start=cap.body.indexOf('商品名：ロード・エルメロイⅡ世の事件簿-魔眼蒐集列車Grace note-缶バッジコレクション');assert.ok(start>0);
const segment=strip(cap.body.slice(start,start+1100)).replace(/\s+/g,'');for(const x of ['2019年9月','直径約57mm','カプセル筐体での販売','ノーマル9種','シークレット1種','株式会社ホビーストック'])assert.ok(segment.includes(x),x);
const imageUrl='https://anime.elmelloi.com/news/SYS/CONTENTS/2019072518071212234182/w776',receipt=fs.readFileSync(priv+'/image-capture.receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).find(r=>r.url===imageUrl);assert.equal(receipt.status,'captured');assert.equal(hash(fs.readFileSync('work/series-evidence-20261103/cache/'+receipt.file)),receipt.sha256);assert.ok([...cap.body.matchAll(/src="([^"]+)"/g)].some(m=>new URL(m[1],cap.source.url).href===imageUrl));
const observation={id:'capsule-official-lineup',url:imageUrl,at,sourceAt:receipt.at,sourceSha256:receipt.sha256,kind:'visual-observation-of-official-linked-image',facts:{ordinaryDesignsShown:9,hiddenPlaceholder:'绿色圆形问号',ordinaryLayout:[3,4,2],scope:'上排3张同角色画面、中排2+2张同角色画面、下排2张画面及问号；没有日文A/B/C标签，隐藏款没有公开实图。不按布局或编号推断原款号。'}};
write(dir+'/web-observations.json',[observation]);const imageObservation={id:observation.id,url:imageUrl,sha256:hash(JSON.stringify(observation))};
write(dir+'/official-facts.json',{at,books,capsule:{source:cap.source,manufacturer:'株式会社ホビーストック',releaseWindow:'2019年9月',diameterMm:57,ordinaryTypes:9,hiddenTypes:1,totalTypes:10,salesMethod:'capsule-machine',material:null,scope:'仅同公告缶バッジコレクション段及实链合图；不采用其他商品参数，不推定9月30日、材质、隐藏身份或厂家BOX。'},fullProductVerified:0,fullSeriesVerified:0});
const bind=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
const notes='仅补空简介和两条出处；保留原名、ISBN/JAN、描述、图片、旧证据、认可、个人字段、挂牌历史和全部关系。',fields=[];
const melty=read(priv+'/melty-targets.json').map(t=>{
 const i=originals.get(t.id),base={itemId:i.id,groupId:t.groupId,title:i.title,identityBinding:bind(i),status:'supported',sourceRole:'publisher',notes};assert.ok(!i.editorial&&!i.summary&&!i.locked&&!i.manualFields?.length);assert.equal(i.jan,'');
 if(i.id.startsWith('family-')){
  assert.ok(i.description.includes('同出版社、同媒介版本'));const childIds=snapshot.relations.filter(r=>r.fromId===i.id&&r.kind==='contains').map(r=>r.toId);assert.equal(childIds.length,9);assert.ok(childIds.every(id=>read(priv+'/melty-targets.json').some(t=>t.id===id)));
  return{...base,source:books[0].source,additionalSources:[books.at(-1).source],officialTitle:i.title,recordKind:'logical-series',childIds,scope:'原逻辑父级与9个纸本单卷关系核对；首尾卷官方书目佐证作品和版本，不认定实体套装',summary:'《MELTY BLOOD》纸本漫画系列目录，由桐嶋たける绘制，TYPE-MOON原作，官方书目列入角川コミックス・エース。现有目录关联第1至9卷，各卷独立出版并有独立ISBN；本条为单卷组织目录，不表示实体套装或已拥有整套。'};
 }
 const f=books.find(f=>f.isbn===i.isbn);assert.ok(f);assert.equal(Number(norm(i.title).match(/\((\d+)\)/)?.[1]),f.volume);assert.ok(i.evidence.some(e=>e.url===f.source.url));
 return{...base,source:f.source,officialTitle:f.officialTitle,officialIsbn:f.isbn,volume:f.volume,recordKind:'publisher-bound-volume',identityMatch:'原卷号、ISBN和官方URL与当前纸本书目精确一致',scope:'本卷纸本书目：卷号、ISBN、作者、B6变形判、页数及日期逐项核对；不采用电子版字段',summary:'《MELTY BLOOD》第'+f.volume+'卷纸本漫画，由桐嶋たける绘制，TYPE-MOON原作，角川コミックス・エース出版。出版社标注B6变形判、'+f.pages+'页，ISBN '+f.isbn+'，纸本发售日为'+f.releaseDate+'；具体印次不作推定。'};
});
const capsule=read(priv+'/capsule-targets.json').map(t=>{
 const i=originals.get(t.id);assert.ok(!i.editorial&&!i.summary&&!i.locked&&!i.manualFields?.length);assert.equal(i.jan,'');assert.equal(i.isbn,'');assert.ok(i.description.includes('ホビーストック'));assert.ok(i.title.includes('缶バッジコレクション'));
 const recordKind=i.title.startsWith('全10種セット')?'retailer-complete-set':i.title.startsWith('【シークレット】')?'hidden-single':'single',variantPending=recordKind==='single'&&/ [ABC] /u.test(i.title);
 const detail=recordKind==='retailer-complete-set'?'本条保留原零售全10种套组范围；实际封装、隐藏款实物及附属内容仍待核，不视为厂家原封BOX。':recordKind==='hidden-single'?'官方确认含1种隐藏款，但公开图以问号代替；本条隐藏款的具体角色和图案继续待查。':variantPending?'原A/B/C款号保留；官方合图没有对应标签，具体画面对照继续待查。':'本条保留原目录所列单款身份，未重新命名或变更角色。';
 const pendingFields=recordKind==='retailer-complete-set'?['零售全10种套组实际封装及附属内容','隐藏款实物内容','套组专属条码']:recordKind==='hidden-single'?['隐藏款具体角色及图案']:variantPending?['原A/B/C款号对应的具体画面']:[];
 if(pendingFields.length)fields.push({itemId:i.id,title:i.title,fields:pendingFields,reason:recordKind==='retailer-complete-set'?'系列全10种不证明原零售套组封装与附属；同编号原详情和图片不可读。':recordKind==='hidden-single'?'官方仅确认隐藏1款且合图为问号，没有角色或图案证据。':'官方合图没有A/B/C标记，同编号原图不可读；不按排列或编号推断对应。',needed:'取得相同零售编号可读详情/原图或明确绑定的实物与官方包装资料。',appliedSafeSummary:false});
 return{itemId:i.id,groupId:t.groupId,title:i.title,status:'supported',recordKind,variantPending,identityBinding:bind(i),source:cap.source,sourceRole:'anime-official',officialTitle:'ロード・エルメロイⅡ世の事件簿-魔眼蒐集列車Grace note-缶バッジコレクション',imageObservation,identityMatch:'原作品、产品线和HOBBY STOCK厂商与官方一致；仅补与原款号/隐藏身份/零售包装无关的系列共通事实',scope:'动画官方同商品公告：直径约57mm、胶囊机销售、普通9款加隐藏1款、2019年9月；不补材质/具体日/厂家BOX',summary:'HOBBY STOCK《ロード・エルメロイII世の事件簿 -魔眼蒐集列車 Grace note-》徽章收藏系列，官方标注直径约57mm、通过胶囊机销售，共10款（普通9款及隐藏1款），发售期为2019年9月。'+detail,notes};
});
assert.equal(melty.length,10);assert.equal(capsule.length,10);assert.equal(capsule.filter(x=>x.variantPending).length,6);assert.equal(fields.length,8);
write(dir+'/cases-melty.json',{at,rows:melty});write(dir+'/cases-capsule.json',{at,rows:capsule});write(dir+'/pending.json',[]);
write(dir+'/field-pending.json',{at,items:fields,scopeCounts:{abcVariant:6,hiddenIdentity:1,retailSet:1,distinctRecords:8},note:'20条可补明确支持的书目/系列共通事实；徽章8条仍有字段缺口，不计完整核实。9普通款与原8具名单款不是同一统计范围，不补造缺失单款。全部历史未决项保留。'});
console.log(JSON.stringify({reviewed:20,ready:20,wholePending:0,fieldPending:8,books:9,logicalDirectories:1,abcVariant:6,hiddenIdentity:1,retailSet:1}));
