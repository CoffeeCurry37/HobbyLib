import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached,targetRows,parent,pub as previous} from './four-series-common.mjs';
export const out='research/series-evidence-20261104';
export const priv4='work/series-evidence-20261104';
const original=read(previous+'/resume.json').outstanding;
assert.equal(original.length,19);
const targets=new Map(targetRows().map(r=>[r.id,r]));
const imagePlan=read(priv4+'/images.json'),extra=read(priv4+'/additional-images.json');
function asset(url){
 const key=hash(url);
 const data=read(parent+'/cache/'+key+'.json');
 assert.equal(data.status,'captured');
 assert.equal(hash(fs.readFileSync(parent+'/cache/'+key+'.img')),data.sha256);
 return {url,sha256:data.sha256,at:data.at};
}
// Indices refer to the frozen 19-case list, the original grade gallery and the retailer stock photo.
const bindings=new Map([[2,'H5'],[3,'G1'],[4,'G4'],[5,'H1'],[6,'G6'],[7,'G2'],[8,'G10'],[9,'G3'],[10,'G7'],[12,'H2'],[15,'G9'],[16,'G8'],[17,'H4']]);
const rows=original.map((o,i)=>{
 const t=targets.get(o.id);assert.equal(o.title,t.title);
 const grade=o.award||'I賞',late=i===18;
 const c=read(previous+'/prizes-'+(late?3:2)+'.json');
 const a=c.awards.find(v=>v.award===grade);assert.ok(a);
 const base={itemId:o.id,groupId:o.groupId,title:t.title,source:c.source,award:grade,officialTitle:a.title};
 const seller=t.sourceUrls.find(u=>u.includes('/product/detail/')||u.includes('/auction/'))||t.sourceUrls[0];
 let images=[],summary,reason,scope='单品图案与商品编号',second=seller,notes='';
 if(bindings.has(i)){
  const cell=bindings.get(i), idx=Number(cell.slice(1));
  assert.equal(a.award[0],cell[0]);
  const merchant=asset(t.image),official=asset(a.images[idx]);images=[merchant,official];
  const identity=t.title.split('「一番くじ')[0].trim();
  summary=grade==='G賞'?'这是 G 赏「'+identity+'」画板。骏河屋编号图与万代该幅单品图的构图一致；官网标注板高约 15 厘米，附纸质展示支架。':
   '这是 H 赏「'+identity+'」。骏河屋单品图与万代的造型及配件相符，本赏级共有五种橡胶周边可选。';
  notes='核对零售库存编号、奖级、构图及实物外形。图库位置仅作定位，不是官方款式编号。';
 }else if(i===0){
  second='https://www.suruga-ya.jp/product/detail/561618841?tenpo_cd=400371';scope='奖级档案与零售全款组合';
  summary='E 赏的岸波白野毛绒挂件分男、女两款，各约 12 厘米，抽到 E 赏时可择一。骏河屋编号 561618841 将两款合列为零售组合。';
  notes='零售单列男女两款，与万代可选的两种设计逐一相符。';
 }else if(i===1){
  images=[asset(extra.find(r=>r.i===1).url),asset(a.images[0])];scope='奖级档案与零售全款组合';
  summary='G 赏共有十幅画板，单次领取不能自选。骏河屋编号 561618853 的全款组合图可逐幅对应万代总览中的十幅图案。';
  notes='已将库存编号图上的十幅构图与万代总览比对，零售组合与抽奖领取单位分别记录。';
 }else if(i===11||i===13){
  const raw=extra.filter(r=>r.i===i);images=raw.map(r=>asset(r.url));scope='原卖家拼套';
  summary=i===11?'这是原卖家组合的 11 款 I 赏亚克力立牌。原挂牌照片分三排展示 3、4、4 件，各件图案不同。万代将整个 I 赏列为 13 款，其中两款为隐藏款。':'这是原卖家组合的 7 件 I 赏亚克力立牌。挂牌全景和分组照片显示四种图案，数量为 2、2、2、1；此处的七件包含重复款。';
  notes='核对原挂牌标题与同一挂牌保存的照片，只确认该卖家组合的件数与展示范围。';assert.equal(t.kind,'set');
 }else if(i===18){
  images=[asset(t.image),asset(a.images[0])];second='https://jp.mercari.com/shops/product/2JWm9waa4KVXBaTQfybtiA';
  summary='这款 H 赏立牌是泳装造型的 Avenger／克洛伊。骏河屋编号 561019202 的单品图与官网总览第二排左侧的发色、墨镜和服装相符；官方标示全长约 4 厘米。';
  notes='另对照骏河屋全十款清单，泳装造型仅对应一款。';
 }else{
  assert.equal(i,14);images=[asset(extra.find(r=>r.i===14).url),asset(a.images[3])];
  reason='相同库存图与官方图均有珠链，但万代奖级说明将ルギマート图案称为杯垫，零售页称为挂件。仍缺能确认产品用途的包装或单品说明。';
  return {...base,status:'pending',reason,second:'https://www.suruga-ya.jp/kaitori/kaitori_detail/561618856',images};
 }
 return {...base,status:'supported',scope,summary,second,images,notes};
});
write(out+'/prize-recheck.json',{previous:'9523fab6d0f5b4e73893fd3f0bb97388291f1d05',checked:19,rows});
console.log(rows.filter(r=>r.status==='supported').length+' ready / '+rows.filter(r=>r.status==='pending').length+' pending');
