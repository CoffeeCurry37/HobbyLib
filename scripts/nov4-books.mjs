import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached,clean,targetRows,parent} from './four-series-common.mjs';
import {supplement} from './nov4-plan.mjs';
const out='research/series-evidence-20261104/books',priv='work/series-evidence-20261104/books';
assert.ok(!fs.existsSync(priv+'/apply-receipts.jsonl'),'Use the existing closed checkpoint');
const material='series-532136185275f3fb', elm='series-559546cccd31fa68';
const old=read('work/v6/production-after.json'),byId=new Map(old.items.map(i=>[i.id,i]));
const generic=cached('https://typemoon.com/book/typemoonbooks');
const original=cached('https://www.typemoon.com/products/tmbooks/elmelloi/index.html');
const volumeList=cached('https://typemoon.com/news/2025/7l_yus');
const latest=cached('https://typemoon.com/news/2026/zpXN1-');
const text=s=>clean(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).normalize('NFKC').replace(/\s+/g,' ').trim();
const key=s=>text(s).replace(/\s/g,'').toLowerCase();
const roman=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
const novelList=[...original.body.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m=>text(m[1])).filter(s=>s.includes('事件簿')).map(s=>s.match(/事件簿\s*(\d+)\s*(case\..+)$/i)).filter(Boolean);
assert.equal(novelList.length,10);
const volumes=new Map();
const volumeText=text(volumeList.body);
for(const m of volumeText.matchAll(/「Fate\/Grand Order material\s*([IVX]+)」\s*●収録サーヴァント\s*(.*?)\s*\(掲載順\)/g)){
 const names=m[2].split(/\s+\/\s+/);
 assert.ok(names.length>1);
 volumes.set(roman.indexOf(m[1]),{title:'Fate/Grand Order material '+m[1],sample:names.slice(0,2),source:volumeList.source});
}
assert.equal(volumes.size,20);
const cut=text(latest.body).split(/◎「\s*Fate\/Grand Order material XXI\s*」/)[1];
assert.ok(cut?.includes('2026年8月16日')&&cut.includes('B5変形')&&cut.includes('雨の魔女トネリコ'));
volumes.set(21,{title:'Fate/Grand Order material XXI',source:latest.source,sample:['雨の魔女トネリコ','アルトリア・キャスター']});
const archive=[],rows=[];
for(const t of targetRows().filter(i=>i.groupId===material||i.groupId===elm)){
 const item=byId.get(t.id),base={itemId:t.id,title:t.title,groupId:t.groupId};
 const push=(status,data)=>rows.push({...base,status,...data});
 if(item.editorial||item.locked||item.manualFields?.length||item.summary||item.archivedInto||item.origin==='doujin'){push('protected',{});continue}
 if(t.groupId===material){
  if(t.id.startsWith('family-')&&item.publisher==='TYPE-MOON'){
   push('supported',{scope:'publisher-series-index',officialTitle:'Fate/Grand Order material',source:generic.source,second:latest.source.url,summary:'TYPE-MOON BOOKS 的《Fate/Grand Order material》设定资料集按卷收录从者设定。出版社另为第 XXI 卷发布了新刊公告，该卷收录雨之魔女托内莉可等从者，并附 NPC 设定图。'});continue;
  }
  const m=t.title.normalize('NFKC').match(/^Fate\/Grand Order material\s*([IVX]+|\d+)(?:\s+(\d+))?(?=\s|\(|\[|$)/i);
  const v=m&&(/^\d+$/.test(m[1])?+m[1]:roman.indexOf(m[1].toUpperCase())),record=volumes.get(v);
  if(!record||(m[2]&&+m[2]!==v)||/セット|電子版|特典のみ/.test(t.title)){push('pending',{reason:'volume-or-sale-scope-unclear'});continue}
  push('supported',{scope:'publisher-volume-contents',officialTitle:record.title,source:record.source,
   summary:'《'+record.title+'》是 TYPE-MOON BOOKS 系列第 '+v+' 卷。出版社的本卷收录清单以「'+record.sample.join('」和「')+'」开头。'+(v===21?'该卷于 2026 年 8 月 16 日发行，为 B5 变形开本、全彩印刷。':'')});continue;
 }
 const urls=[...new Set(t.sourceUrls.filter(u=>/^https:\/\/www\.kadokawa\.co\.jp\/product\/\d+\/$/.test(u)))];
 if(t.isbn&&urls.length===1){
  const p=cached(urls[0]),body=p.body, heading=text(body.match(/<h1[^>]+itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
  const code=body.match(/<dd[^>]+itemprop="isbn"[^>]*>\s*(\d{13})\s*<\/dd>/)?.[1],titleTag=text(body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
  const pages=Number(body.match(/itemprop="numberOfPages"[^>]*>\s*(\d+)/)?.[1]);
  const format=text(body.match(/<dd class="detail-edition-text">([^<]+)/)?.[1]||'');
  const isManga=titleTag.includes('[角川コミックス・エース]')&&titleTag.includes('東冬'),isNovel=titleTag.includes('[角川文庫]')&&titleTag.includes('三田誠');
  if(code!==t.isbn||!heading.includes('事件簿')||!(isManga||isNovel)||!pages||!format){push('pending',{reason:'publisher-edition-or-isbn-not-confirmed',detail:urls[0]});continue}
  archive.push({isbn:code,heading,format,pages,scope:isManga?'manga':'novel-bunko',source:p.source});
  push('supported',{scope:isManga?'manga-isbn':'bunko-isbn',officialTitle:heading,source:p.source,
   summary:'「'+heading+'」是'+(isManga?'由东冬作画的角川 Comics Ace 漫画版':'三田诚所著的角川文库小说版')+'，'+format+'，共 '+pages+' 页。此版 ISBN 为 '+code+'。'});continue;
 }
 if(t.id.startsWith('family-')&&item.publisher==='KADOKAWA'&&item.category==='コミック'){
  const url=targetRows().find(x=>x.groupId===elm&&x.isbn==='9784041070536').sourceUrls.find(u=>u.startsWith('https://www.kadokawa.co.jp/'));
  const source=cached(url);assert.ok(text(source.body.match(/<title>(.*?)<\/title>/)[1]).includes('角川コミックス・エース'));
  push('supported',{scope:'publisher-manga-index',officialTitle:'ロード・エルメロイII世の事件簿',source:source.source,
   summary:'这个目录汇总角川 Comics Ace 出版、东冬作画的《埃尔梅罗Ⅱ世事件簿》漫画版。首卷的出版社书号为 9784041070536，各卷以自己的 ISBN 区分。'});continue;
 }
 const m=t.title.normalize('NFKC').match(/事件簿\s*(\d+)/),entry=m&&novelList.find(v=>+v[1]===+m[1]);
 const originalEdition=/TYPE-MOON BOOKS/i.test(t.title)||(/TYPE-MOON/i.test(t.title)&&/三田誠/.test(t.title))||(/TYPE-MOON\s*[(（]三田誠/.test(t.description||'')&&item.publisher==='TYPE-MOON');
 const retailBinding=t.sourceUrls.find(u=>u==='https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-007886');
 const confirmedThird=retailBinding && +m?.[1]===3 && item.offers.some(o=>o.url===retailBinding && key(o.listingTitle||'').includes(key('case.双貌塔イゼルマ(下)')) && /TYPE-MOON BOOKS/i.test(o.listingTitle||''));
 if(entry&&(originalEdition||confirmedThird)){
  const side=t.title.match(/[(（](上|中|下)[)）]|(上|下)巻/);
  if(side&&!entry[2].includes(side[1]||side[2])){push('pending',{reason:'volume-side-conflict'});continue}
  push('supported',{scope:'original-novel-edition',officialTitle:'ロード・エルメロイII世の事件簿 '+entry[1]+' '+entry[2],source:original.source,...(confirmedThird?{second:retailBinding,notes:'原零售商品编号 MED-BOOK-007886 对应 TYPE-MOON BOOKS 第三卷下篇，JAN 4560158370340；出版社确认卷名。'}:{}),
   summary:'TYPE-MOON BOOKS 原版小说第 '+entry[1]+' 卷为「'+entry[2]+'」，由三田诚撰文、坂本みねぢ绘制插画，采用四六判开本。'});continue;
 }
 push('pending',{reason:'insufficient-original-edition-or-volume-binding'});
}
assert.equal(rows.length,67);
write(out+'/cases.json',rows);write(out+'/editions.json',{kadokawa:archive,material:[...volumes.values()],originalNovels:novelList.map(m=>({volume:+m[1],name:m[2],source:original.source}))});
const priorIds=new Set(['','/historical-events','/four-series'].map(p=>parent+p).concat('work/series-evidence-20261104').flatMap(p=>fs.readFileSync(p+'/apply-receipts.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(r=>r.status==='verified').flatMap(r=>r.ids)));
const at=new Date().toISOString(),changes=[];
for(const m of rows.filter(r=>r.status==='supported')){assert.ok(!priorIds.has(m.itemId));const item=byId.get(m.itemId),v=supplement(item,m,at);assert.ok(v.item);changes.push({item:v.item,expectedVersion:hash(JSON.stringify(item)),match:m})}
write(priv+'/proposed-changes.json',changes);
console.log(JSON.stringify({prepared:changes.length,summary:[...Map.groupBy(rows,r=>r.groupId)].map(([g,r])=>[g,r.length,r.filter(i=>i.status==='supported').length]),other:rows.filter(i=>i.status!=='supported').map(i=>i.title)}));
