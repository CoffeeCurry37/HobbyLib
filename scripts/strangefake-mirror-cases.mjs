import fs from 'node:fs';import assert from 'node:assert/strict';import {read,write,hash,cached,clean} from './four-series-common.mjs';
const dir='research/series-evidence-20261113/strangefake-mirror',priv='work/series-evidence-20261113/strangefake-mirror',at=new Date().toISOString();assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'));
const badges=cached('https://www.ensky.co.jp/item/31780.html'),mirror=cached('https://anime.elmelloi.com/news/?id=51121'),strip=s=>clean(s.replace(/<[^>]+>/g,' ')).replace(/\s+/g,'');
const badgeBody=strip(badges.body);for(const w of ['全9種類','1箱：カンバッジ1個入り','1BOX9箱入り','1BOXで全種類揃います','H58×W58×D3mm','ブリキ、紙、PET','4970381927332'])assert.ok(badgeBody.includes(w),w);
const start=mirror.body.indexOf('商品名：トレーディングミラーチャーム'),mirrorBody=strip(mirror.body.slice(start,start+1700));assert.ok(start>0);for(const w of ['2019年9月下旬','65×65','最大サイズ','アクリル','ボールチェーン','10種','株式会社カナリア'])assert.ok(mirrorBody.includes(w),w);
const receipts=fs.readFileSync(priv+'/image-capture.receipts.jsonl','utf8').trim().split('\n').map(JSON.parse);
assert.equal(receipts.length,4);for(const r of receipts){assert.equal(r.status,'captured');assert.equal(hash(fs.readFileSync('work/series-evidence-20261103/cache/'+r.file)),r.sha256);}
const observations=receipts.map(r=>({id:r.url.includes('201907')?'mirror-official-lineup':r.url.includes('a49a3')?'badges-official-poster':r.url.includes('157f0')?'badges-official-saber':'badges-official-lineup',url:r.url,at,sourceAt:r.at,sourceSha256:r.sha256,kind:'visual-observation-of-official-linked-image',facts:r.url.includes('201907')?{typesShown:10,reverseMirrorShown:true,ballChainsShown:true,visibleEnglishNames:['Lord El-Melloi II','Gray','Add','Reines El-Melloi Archisorte','Flat Escardos','Svin Glascheit'],scope:'图示同角色多款和双人/四人画面；没有日文A/B标记，不按排列顺序指定原A/B。'}:r.url.includes('157f0')?{scope:'单张红底王冠/披风Saber设计近图；不作为其余单款的原零售图。'}:{typesShown:9,visibleNameBands:['SABER','ARCHER','LANCER','FRANCESCA PRELATI'],scope:'5个装饰背景款和4个名字带款；名字带明确为FRANCESCA PRELATI，不是原目录的フラット・エスカルドス。仅记录看得见的文字，未改原名。'}}));
write(dir+'/web-observations.json',observations);
const imageRef=id=>{const o=observations.find(o=>o.id===id);return{id:o.id,url:o.url,sha256:hash(JSON.stringify(o))};};
write(dir+'/official-facts.json',{at,facts:[{key:'badges',source:badges.source,sourceRole:'manufacturer',manufacturer:'エンスカイ',types:9,size:'约H58×W58×D3mm',materials:['马口铁','纸','PET'],singleBoxCount:1,boxContainsSingleBoxes:9,boxCompletesSet:true,boxProductCode:'4970381927332',scope:'产品页规格仅作用于该系列；BOX商品码不写入原空JAN，原零售单包/全套与厂家BOX区分。海报为2026年7月预告，不推定7月30日为官方实际日期。'},{key:'mirror',source:mirror.source,sourceRole:'anime-official',manufacturer:'株式会社カナリア',types:10,size:'约65×65mm（最大尺寸）',material:'亚克力',ballChain:true,reverseMirrorShown:true,releaseWindow:'2019年9月下旬',scope:'只取镜面挂件段落，排除同公告的立牌/钥匙扣/卡套尺寸。最大尺寸不是每款精确长宽；无官方A/B映射或本页BOX封入说明。'}],fullProductVerified:0,fullSeriesVerified:0});
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i])),fields=[],all=[];
const bind=i=>({...Object.fromEntries(['isbn','jan','platform','edition','productLine','wave','member','image','catalogueKey','catalogueGroupType'].map(k=>[k,i[k]??null])),images:i.images??null,offerUrls:[...new Set(i.offers.map(o=>o.url))].sort()});
for(const [n,key] of ['badges','mirror'].entries()){
 const rows=read(priv+'/'+key+'-targets.json').map(t=>{
  const i=originals.get(t.id);assert.ok(!i.editorial&&!i.summary&&!i.locked&&!i.manualFields?.length);assert.equal(i.jan,'');assert.equal(i.isbn,'');assert.ok(i.description.includes(n?'カナリア':'エンスカイ'));
  const recordKind=i.title.startsWith('全')?'retailer-complete-set':i.title.startsWith('【パック】')?'pack':n&&i.id==='708bf331-0c71-4bed-aa05-7032e8c0f0c7'?'unspecified-package':'single';
  const nameConflict=!n&&i.title.startsWith('フラット・エスカルドス'),variantPending=!!n&&/^(?:ロード・エルメロイII世[AB]|グレイB) /.test(i.title);
  let detail='';
  if(recordKind==='single')detail=nameConflict?'本条原目录名称与官方图中文字存在冲突，角色及图款对应继续待查，原名保留。':variantPending?'本条原A/B标记保留；官方合图未标A/B，具体画面对照继续待查。':'本条保留原目录所列单款身份，未重新命名或变更角色。';
  if(recordKind==='pack')detail='官方单盒为随机1枚。本条原零售目录标作单包，实际封装与专属条码仍待核实，不套用整盒商品码。';
  if(recordKind==='retailer-complete-set')detail='本条保留原零售全'+(n?'10':'9')+'种组合范围，实际封装及附属内容待核，不视为厂家原封BOX。';
  if(recordKind==='unspecified-package')detail='原记录未注明单包或BOX，本次不补封入数量、专属条码或集齐保证，包装层级继续待查。';
  const summary=n?'卡纳莉亚（カナリア）《ロード・エルメロイII世の事件簿 -魔眼蒐集列車 Grace note-》亚克力镜面挂件系列，共10款，背面为镜面并附珠链。动画官方公告标注最大尺寸约65×65mm、发售期为2019年9月下旬。'+detail:'Ensky《TVアニメ Fate/strange Fake》ラメキラ闪粉徽章系列，共9款；官方标注约H58×W58×D3mm，材质为马口铁、纸和PET。'+detail;
  const m={itemId:i.id,groupId:t.groupId,title:i.title,status:'supported',recordKind,nameConflict,variantPending,identityBinding:bind(i),source:n?mirror.source:badges.source,sourceRole:n?'anime-official':'manufacturer',officialTitle:n?'ロード・エルメロイII世の事件簿 -魔眼蒐集列車 Grace note- トレーディングミラーチャーム':'TVアニメ Fate/strange Fake ラメキラカンバッジコレクション',imageObservation:imageRef(n?'mirror-official-lineup':'badges-official-lineup'),summary,scope:n?'动画官方商品公告本挂件段及官方实链合图；最大尺寸65×65mm、亚克力、珠链、10款，排除同页其他商品参数':'Ensky商品页同系列规格和官方实链商品图；只补通用尺寸/材质/款数，单包与BOX规格分别标注',notes:'仅补空简介并追加两条出处；原认可、原名、空ISBN/JAN、图片、个人字段、挂牌历史和关系保留。同编号原详情与原图不可读，不推断包装或按排列确定A/B。'+(nameConflict?'原フラット与官方FRANCESCA PRELATI冲突，只写系列通用事实。':''),identityMatch:nameConflict?'原作品、产品线和厂商一致，但角色名与官方图冲突；只支持系列通用事实':variantPending?'原作品、产品线和厂商一致，同角色在官方图有多款，A/B对应未明确；只补系列共通事实':'原目录作品、产品线和厂商与官方一致；系列通用事实独立于原挂牌状态，保留单款/零售组合类型'};
  const pendingFields=[];
  if(nameConflict)pendingFields.push('原フラット・エスカルドス与官方FRANCESCA PRELATI的角色/图款对应');
  if(variantPending)pendingFields.push('原A/B编号对应的具体画面');
  if(recordKind==='pack')pendingFields.push('原零售单包实物封装','单包专属JAN绑定');
  if(recordKind==='retailer-complete-set')pendingFields.push('零售全种套组实际封装','附属内容及专属条码');
  if(recordKind==='unspecified-package')pendingFields.push('单包/BOX包装层级','封入数量/集齐规则','专属条码');
  if(pendingFields.length)fields.push({itemId:i.id,title:i.title,fields:pendingFields,reason:nameConflict?'官方名字带清晰写FRANCESCA PRELATI，原目录却写フラット；同编号原图不可读，不能据同一系列直接改名。':variantPending?'官方合图无A/B标记，同编号原图不可读；不按布局映射原标签。':'官方系列说明不足以证明该零售编号的实际封装、附件及条码。',needed:'取得相同零售编号可读详情/原图或可明确绑定的实物与官方包装依据。',appliedSafeSummary:false});
  return m;
 });assert.equal(rows.length,11);write(dir+'/cases-'+key+'.json',{at,rows});all.push(...rows);
}
assert.equal(all.length,22);assert.equal(all.filter(x=>x.recordKind==='single').length,18);assert.equal(fields.length,9);
write(dir+'/field-pending.json',{at,items:fields,scopeCounts:{nameConflict:2,abVariant:3,packaging:4,distinctRecords:9},note:'22条均可补系列通用事实，9条仍有具体字段缺口；不将共通规格补充算作完整核实。旧名称、空ISBN/JAN、同编号挂牌和全部历史未决项保留。'});
write(dir+'/pending.json',[]);
console.log(JSON.stringify({reviewed:22,ready:22,wholePending:0,fieldPending:9,nameConflict:2,abVariant:3,packaging:4}));
