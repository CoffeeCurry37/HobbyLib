import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{join,resolve}from'node:path';
import{loadRadar}from'./load-radar.mjs';

// Bounded anonymous official-page research. Rarity-group numbers are never card numbers.
const folder=resolve(process.argv[2]||'../capture-v14/official');mkdirSync(folder,{recursive:true});
const radar=loadRadar(),{fetchPublic}=radar.get('collector'),{readHtml,all,cls,tag,text,structuredProducts}=radar.get('html');
const lines=n=>n?n.children.map(x=>typeof x==='string'?x:(['br','p','div','li','tr'].includes(x.tag)?'\n':'')+lines(x)).join('').replace(/[\t ]+/g,' ').replace(/\n\s*\n/g,'\n').trim():'';
async function page(name,url){const p=join(folder,name+'.html');if(existsSync(p))return readFileSync(p,'utf8');const r=await fetchPublic(url);writeFileSync(p,r.text);await new Promise(r=>setTimeout(r,400));return r.text;}
const roots=await Promise.all([page('bandai-index','https://www.bandai.co.jp/candy/characters/character300/index.html'),page('bandai-index-20','https://www.bandai.co.jp/candy/characters/character300/index.html?__offset=20'),page('aurora','https://online.aniplex.co.jp/itemAIMSoiDF08.html'),page('postcards','https://online.aniplex.co.jp/itemAIMSoiDF33.html')]);
const links=[...new Set(roots.slice(0,2).flatMap(h=>all(readHtml(h),n=>n.tag==='a'&&/\/candy\/products\/\d{4}\/\d+\.html/.test(n.attrs.href||'')&&/Grand Order.*ウエハース/.test(text(n))&&!/カードファイル|再販/.test(text(n))).map(n=>new URL(n.attrs.href,'https://www.bandai.co.jp').href)))];
writeFileSync(join(folder,'official-product-urls.json'),JSON.stringify(links,null,2));console.log(JSON.stringify({indices:2,bandaiUrls:links.length}));
const waferWaves=[];
for(const url of links){
 const id=url.match(/(\d+)\.html/)[1],html=await page('bandai-'+id,url),doc=readHtml(html),product=structuredProducts(html)[0];
 if(!product?.name)throw Error('Missing official Bandai product: '+url);
 const title=product.name.normalize('NFKC'),normal=lines(cls(doc,'post')).normalize('NFKC');
 const countMatch=normal.match(/全\s*(\d+)\s*種(?:\s*\+\s*(\d+)\s*種)?/);if(!countMatch)throw Error('Missing official lineup count: '+url);
 // A literal "+1種" adds a secret; "うちシークレット1種" is already inclusive.
 const count=Number(countMatch[1])+Number(countMatch[2]||0);
 const releaseRow=all(doc,n=>n.tag==='tr').find(n=>text(tag(n,'th'))==='発売日');
 const date=text(releaseRow).replace(/\s/g,'').match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/);if(!date)throw Error('Missing official release date: '+url);
 const releaseDate=date[1]+'-'+date[2].padStart(2,'0')+'-'+date[3].padStart(2,'0');
 const wave=/にふぉるめーしょん/.test(title)?'にふぉるめーしょん':/復刻スペシャル/.test(title)?'復刻スペシャル '+(title.match(/復刻スペシャル\s*(\d+)/)?.[1]||'1'):/バビロニア/.test(title)?'バビロニア '+(title.match(/ウエハース\s*(\d+)/)?.[1]||'1'):/ツイン/.test(title)?'特別弾 '+releaseDate.slice(0,4):(title.match(/ウエハース\s*(\d+)/)?.[1]||'1');
 const images=[...new Set((Array.isArray(product.image)?product.image:[product.image]).filter(Boolean))].slice(0,10);
 const members=normal.split('\n').flatMap(line=>{
  const m=line.trim().match(/^(\d{1,2})[.．]\s*(.+)$/);if(!m)return [];
  const label=m[2].trim();if(/\d+\s*種/.test(label))return [];
  const number=String(Number(m[1])).padStart(2,'0'),rarity=label.match(/^([A-Z]+)\s+/)?.[1]||'',name=label.replace(/^[A-Z]+\s+/,'').trim();if(Number(number)>count)throw Error('Member exceeds official count: '+url);
  const character=name.replace(/^(?:セイバー|アーチャー|ランサー|ライダー|キャスター|アサシン|バーサーカー|ルーラー|アヴェンジャー|アルターエゴ)\s*[\/／]\s*/,'');
  return[{number,name,...(rarity?{rarity}:{}),...(/シークレット/.test(name)?{}:{characters:[character]}),sourceUrl:url}];
 });
 const secretCount=Number(countMatch[2]||normal.match(/うちシークレット\s*(\d+)\s*種/)?.[1]||members.filter(m=>/シークレット/.test(m.name)).length||0);
 waferWaves.push({key:'fgo-wafer:'+id,title,productLine:'Fate/Grand Order ウエハース',wave,releaseDate,image:images[0]||'',images,url,count,countEvidence:countMatch[0],...(secretCount?{secretCount}:{}),members,description:`万代官方威化卡目录：共 ${count} 种${secretCount?`（已包含 ${secretCount} 款隐藏款，不重复加计）`:''}，首发 ${releaseDate}。${members.length?'官方文字列出各款编号；隐藏款名称以官方公开信息为准。':'官方已公布总种数；未提供逐款文字编号的卡面保留待核对占位，不据图片顺序推定卡号。'}`});
}
const event='Fate/Grand Order展 -星見の回廊-';
function aniplexBase(html,item){
 const url='https://online.aniplex.co.jp/'+item+'.html',doc=readHtml(html),gallery=cls(doc,'product__images');
 const images=[...new Set(all(gallery||doc,n=>n.tag==='img').map(n=>n.attrs.src).filter(s=>s&&!/\/(?:r_\d+|r_comp)\.jpg(?:\?|$)/i.test(s)).map(s=>new URL(s,url).href))].slice(0,10);
 const variants=all(doc,n=>n.tag==='li'&&!!n.attrs['data-attr-id']&&!!n.attrs['data-attr-value']).map(n=>({number:n.attrs['data-attr-id'],name:n.attrs['data-attr-value'],image:new URL(tag(n,'img')?.attrs.src||images[0],url).href}));
 if(!images.length)throw Error('No real product gallery: '+item);return{url,images,image:images[0],variants};
}
const aurora=aniplexBase(roots[2],'itemAIMSoiDF08'),postcard=aniplexBase(roots[3],'itemAIMSoiDF33');
if(aurora.variants.length!==2||postcard.variants.length!==35)throw Error('Official variant count changed; review required');
const auroraNames=['ジークフリート','バーヴァン・シー','アルトリア・ペンドラゴン','太公望','マーリン','酒呑童子','リリス','始皇帝','ジャンヌ・ダルク〔オルタ〕','スーパーバニヤン','ゴールデンBB','アビゲイル・ウィリアムズ','オベロン','スペース・エレシュキガル'];
const auroraMembers=auroraNames.map((name,i)=>({number:String(i+1).padStart(2,'0'),name,characters:[name],...(name==='リリス'?{urls:['https://auctions.yahoo.co.jp/jp/auction/s1242557559']}:{}),evidence:'官方整款图片逐款核对，2026-10-15；编号仅为本地展示顺序，不是官方卡号。'}));
const postcardMembers=postcard.variants.map(v=>{
 const known=v.number==='003'?{name:'千子村正',characters:['千子村正'],urls:['https://www.suruga-ya.jp/product/detail/892631500']}:v.number==='033'?{name:'マシュ・キリエライト',characters:['マシュ・キリエライト'],urls:['https://www.suruga-ya.jp/product/detail/892631530']}:{};
 return{number:v.number,name:known.name||'款式 '+Number(v.number)+'（角色待核对）',image:v.image,...known,...(known.name?{evidence:'2026-10-15 比对 Aniplex 对应款式卡面与骏河屋商品图片，编号和画面一致。'}:{})};
});
const families=[
 {key:'fgo-exhibition-2026:aurora',aniplexId:'itemAIMSoiDF08',title:event+' オーロラカードコレクション',productLine:'オーロラカードコレクション',event,wave:'2026',releaseDate:'2026-08-14',image:aurora.image,images:aurora.images,url:aurora.url,count:14,members:auroraMembers,variants:{'001':'pack','002':'box'},numbering:'local',description:'展览后期发售的 14 款极光卡。随机单包与完整盒装属于同一系列的两种销售规格；成员编号仅用于本地展示。官网网售的 2027 年 3 月发货时间与最初发售日期分别记录。',sources:[aurora.url,'https://exhibition.fate-go.jp/goods/']},
 {key:'fgo-exhibition-2026:postcard',aniplexId:'itemAIMSoiDF33',title:event+' ゲームスチルポストカード',productLine:'ゲームスチルポストカード',event,wave:'2026',releaseDate:'2026-07-17',image:postcard.image,images:postcard.images,url:postcard.url,count:35,members:postcardMembers,numbering:'official',description:'展览游戏画面明信片，共 35 款，可选择款式。保留 Aniplex 官方款式编号与卡面；已核对 003 千子村正、033 玛修，其余角色名称待核对。官网网售的 2027 年 3 月发货时间不是首发日期。',sources:[postcard.url,'https://exhibition.fate-go.jp/goods/']}
];
writeFileSync('lib/radar/collection-catalogue.json',JSON.stringify({waferWaves,families},null,2)+'\n');
const report={at:new Date().toISOString(),waferWaves:waferWaves.length,waferSlots:waferWaves.reduce((n,w)=>n+w.count,0),officialNamedWaferSlots:waferWaves.reduce((n,w)=>n+w.members.length,0),families:families.length,familySlots:families.reduce((n,f)=>n+f.count,0),postcardNamed:postcardMembers.filter(m=>m.characters).length,auroraNamed:auroraMembers.length,files:'lib/radar/collection-catalogue.json',notes:['未把稀有度数量行解释为卡号。','复刻1全31種+1種、复刻2全32種+1種，明确加计隐藏款；うち不重复加。','图片不超过10张；排除随机包/整盒文字占位图。','明信片只核对并映射官方003与033，其余保留独立卡面占位。','Aurora 本地序号不能用于跨站官方卡号匹配。','Yahoo混合打包 j1245034569 未作为 Lilith 单卡匹配来源。']};
writeFileSync(join(folder,'official-registry-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));radar.close();
