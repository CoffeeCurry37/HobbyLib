import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/cards',priv='work/series-evidence-20261105/cards';
const groups=read(dir+'/order.json'),visual=read(dir+'/visual-review.json'),obs=read(dir+'/web-observations.json');
const at=new Date().toISOString(),norm=u=>{const x=new URL(u);return x.origin+x.pathname};
const originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const imageSources=[];
for(const k of ['ticket','sticker'])for(const url of visual[k].reviewedImages){
 const stem='work/series-evidence-20261103/cache/'+hash(url),m=read(stem+'.json');
 assert.equal(m.status,'captured');assert.equal(hash(fs.readFileSync(stem+'.img')),m.sha256);
 imageSources.push({url,at:m.at,sha256:m.sha256,bytes:m.bytes});
}
const facts=groups.map(g=>({...g,source:cached(g.source).source,normal:20,secret:2,total:22}));
facts[0].spec={cardMillimetres:[150,76],sheetsPerPack:1,box:{packs:20,observation:'ticket-retail-box'},excluded:'零售PET及80×205×0.7mm不写入；两种包装示意不等于每包两枚；日期不一致不补日期。'};
facts[1].spec={maximumMillimetres:[59,86],matteCoating:true,sheetsPerPack:1,twoSheetSource:cached('https://bandai-lifestyle.jp/products/details.php?detail=4582769993466000').source,excluded:'两个零售包装编号没有独立JAN/内容绑定；不按同系列名称或价格推定包装版本。'};
write(dir+'/facts.json',{at,groups:facts,imageSources,observations:obs.map(o=>({id:o.id,kind:o.kind,sha256:hash(JSON.stringify(o)),hashScope:'JSON observation, not original HTML'}))});
for(const g of groups){
 const key=g.key,targets=read(priv+'/'+key+'-targets.json'),rows=[];
 assert.equal(targets.length,24);
 for(const t of targets){
  assert.equal(t.productLine,g.label);
  const urls=[...new Set(t.sourceUrls.map(norm))];assert.equal(urls.length,1);
  const url=urls[0],code=url.split('/').at(-1),old=originals.get(t.id);
  assert.ok(old&&old.title===t.title);
  const binding={url,code,retainedTitle:t.title,knownAt:t.evidence.filter(e=>e.url&&norm(e.url)===url).map(e=>e.at).sort()[0],offerUrls:[...new Set(old.offers.map(o=>norm(o.url)))].sort()};
  assert.ok(binding.offerUrls.includes(url));
  let r={itemId:t.id,groupId:g.groupId,title:t.title,productLine:t.productLine,retailerBinding:binding,source:cached(g.source).source,officialTitle:g.label,sourceRole:'official-series-specification-with-retained-retailer-identity',status:'pending'};
  if(old.editorial||old.manualFields?.length||old.locked||old.summary){rows.push({...r,status:'protected',reason:'保留已有认可、人工或简介资料'});continue;}
  if(/シークレット/.test(t.title)){
   r.reason=key==='ticket'?'官方款式图仅有两个隐藏占位；匿名零售编号尚不能绑定具体图案。':'官方第6图展示两款台词图案，但没有与零售シークレット1/2编号的可靠对应。';
   r.sourcesChecked=[g.source,...visual[key].reviewedImages,url];rows.push(r);continue;
  }
  if(key==='sticker'&&/【パック】|【ボックス】/.test(t.title)){
   r.reason='已确认官方一枚装和两枚装同款式，但当前零售编号无可读取的独立JAN或包装数量证据；不能选择任一规格。';
   r.sourcesChecked=[g.source,facts[1].spec.twoSheetSource.url,url,'https://www.amiami.jp/top/detail/detail?gcode=GOODS-04812265'];rows.push(r);continue;
  }
  const member=t.title.split(' 「')[0],match=visual[key].normalMembers.filter(v=>v.member===member);
  if(match.length===1){
   r.member=member;r.visualMatch={image:visual[key].reviewedImages[2],visibleName:match[0].visibleName,displaySlot:match[0].slot};
   r.scope='单款：留存零售编号及完整款名，与官方普通款图中的名称、图案唯一对应；非当前库存或逐件零售图核验';
   r.summary=key==='ticket'?'万代「Fate/Grand Order チケットライクコレクション」中的「'+member+'」普通款。票券造型全彩迷你海报，官方尺寸150×76毫米。系列共22款（20款普通、2款隐藏）；本条为指定单款。':'万代「Fate/Grand Order モバイルステッカーコレクション Vol.2」中的「'+member+'」普通款。模切贴纸，表面为哑光涂层；该系列尺寸最大约59×86毫米，具体大小随图案变化。本条为指定单款。';
   r.notes=key==='ticket'?'只采用官方尺寸；未采用零售冲突尺寸或PET材质。单款不套用随机包或整盒配置。':'款名及图案对应官方普通款；最大尺寸不等于每款实际尺寸。单款不套用一枚装或两枚装的包装规格。';
   r.observationIds=[key==='ticket'?'ticket-retail-pack':'sticker-retail-set'];
  }else if(key==='ticket'&&code==='892791808'){
   r.scope='随机单包：独立零售编号与官方单包规格';r.summary='万代「Fate/Grand Order チケットライクコレクション」随机单包，每包1枚票券造型全彩迷你海报，尺寸150×76毫米。系列共22款（20款普通、2款隐藏），内容随机，非指定款或齐款套装。';
   r.observationIds=['ticket-retail-pack'];r.notes='单包1枚由官方页确认；不把两种外袋图理解为两枚入。';r.second=url;
  }else if(key==='ticket'&&code==='892907169'){
   r.scope='整盒：零售892907169明确20包，官方证明每包1枚';r.summary='万代「Fate/Grand Order チケットライクコレクション」整盒商品。零售说明为每盒20包；官方单包规格为1枚、尺寸150×76毫米。系列共22款（20款普通、2款隐藏），随机封入，整盒不保证集齐全部款式。';
   r.observationIds=['ticket-retail-box','ticket-hlj-box'];r.notes='盒数来自独立零售BOX说明，单卡尺寸及每包1枚来自厂商；不宣称齐款。';r.second=url;
  }else if(key==='sticker'&&code==='859278818'){
   r.scope='零售全22种组合：以该零售编号正文的完整组合清单为证，不认作厂商固定套装';
   r.summary='零售商列出的「Fate/Grand Order モバイルステッカーコレクション Vol.2」全22种组合，清单含20款普通贴纸及2款隐藏贴纸。系列采用模切设计，最大约59×86毫米，表面为哑光涂层，隐藏款有特别烫箔。此条为零售齐款组合，不等同于厂商随机包或整盒。';
   r.observationIds=['sticker-retail-set'];r.notes='组合范围有零售正文及清单；隐藏款只按匿名清单计数，不写图案身份；不宣称官方固定套装。';r.second=url;
  }else throw Error('No unique match '+t.title);
  r.status='supported';r.observationSources=r.observationIds.map(id=>{const o=obs.find(x=>x.id===id);assert.ok(o);return{id,url:o.url,kind:o.kind,sha256:hash(JSON.stringify(o))}});
  rows.push(r);
 }
 assert.equal(rows.filter(r=>r.status==='supported').length,key==='ticket'?22:20);
 write(dir+'/cases-'+key+'.json',{at,groupId:g.groupId,reviewed:24,rows});
}
console.log(JSON.stringify({reviewed:48,supported:42,pending:6,productionApplied:0}));

