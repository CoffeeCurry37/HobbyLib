import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash,cached,targetRows,parent,clean} from './four-series-common.mjs';
const out='research/series-evidence-20261104', priv='work/series-evidence-20261104';
const groups=read(out+'/sources.json'), targets=targetRows();
const norm=s=>clean(s).normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const plain=s=>clean(s.replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' '));
const catalogues=[], cases=[];
const rosters=read(out+'/retailer-checklists.json');
for(const f of read(priv+'/rosters.json')){
 const key=parent+'/cache/'+hash(f.url), meta=read(key+'.json'), bytes=fs.readFileSync(key+'.html');
 assert.equal(hash(bytes),meta.sha256);
 const charset=bytes.toString('latin1').match(/charset\s*=\s*["']?([^"'\s;>]+)/i)?.[1]||'utf-8';
 const body=new TextDecoder(charset).decode(bytes);
 const part=body.split('英語名：').at(-1).split('キャラクター：')[0];
 const members=[...new Map([...part.matchAll(/(?:^|<br\s*\/?>)\s*(\d+)\.([^<\n]+)(?=<br)/gi)].map(m=>[+m[1],clean(m[2])])).entries()].map(([number,name])=>({number,name}));
 if(members.length)rosters.push({groupId:f.groupId,source:f.url,sha256:meta.sha256,at:meta.at,rows:members});
}
write(out+'/catalogue-rosters.json',rosters);
const catalogueEntries=[];
for(const g of groups.filter(g=>g.type==='event')){
 const {body,source}=cached(g.url), tiles=[...body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)];
 assert.equal(tiles.length,Number(body.match(/(\d+)\s*件の結果/)?.[1]));
 const seen=new Set();
 for(const [tile] of tiles){
  const url=new URL(clean(tile.match(/href="([^"]+\.html)"/)[1]),g.url).href;
  assert.ok(!seen.has(url));seen.add(url);catalogueEntries.push({groupId:g.groupId,url,source});
 }
}
const pages=new Map();
function detail(url){
 if(pages.has(url))return pages.get(url);
 const {body,source}=cached(url),sku=new URL(url).pathname.slice(1,-5);
 const product=[...body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{
  try {const v=JSON.parse(m[1]);return Array.isArray(v)?v:v['@graph']||[v];}catch{return []}
 }).find(v=>v['@type']==='Product');
 assert.equal(product?.sku,sku);
 const variants=[...body.matchAll(/<li\b[^>]*data-attr-id="([^"]+)"[^>]*data-attr-url="[^"]*"[^>]*data-attr-value="([^"]+)"/g)].map(m=>({id:m[1],label:clean(m[2])}));
 const section=plain((body.split(/<span>商品(?:内容|概要)<\/span>/)[1]||'').split(/<!-- ご注意 -->|■関連サイト|<\/section>/)[0]).slice(0,2300);
 const p={url,sku,title:clean(product.name),source,variants,section};pages.set(url,p);return p;
}
function eventCase(g,t){
 const obs=t.officialObservations||[], urls=[...new Set(obs.map(o=>o.url))];
 if(urls.length!==1||!catalogueEntries.some(e=>e.groupId===g.groupId&&e.url===urls[0]))return {reason:'no-single-official-catalogue-item'};
 const p=detail(urls[0]);const v=p.variants.filter(v=>norm(v.label)===norm(t.title)&&obs.every(o=>o.variant===v.id&&(!o.listingTitle||norm(o.listingTitle)===norm(v.label))));
 if(v.length!==1)return {reason:'ambiguous-official-variant-or-title',detail:p.url};
 const label=v[0].label;
 const years=[...label.matchAll(/(?:AJ|Anime\s*Japan)\s*(20\d{2})/ig)].map(m=>+m[1]);
 if(years.some(y=>y!==g.year))return {reason:'sales-year-on-variant-differs-from-local-series',detail:p.url,targetLabel:label,catalogue:g.url};
 const content=p.section.replace(/\s+/g,' ').trim();
 const short=label.replace(/\s*\/\s*Fate\/Grand Order\s*$/,'');
 const facts=[];
 if(/コンプリート(?:BOX|セット)/i.test(label))facts.push('这一规格为完整套装');
 else if(/単品.*ランダム|ランダム封入/.test(label))facts.push('这一规格为随机单包');
 if(/【再販】|【復刻】/.test(p.title))facts.push('官方将本销售批次标为再贩或复刻');
 if(/概念礼装のイラストを使用/.test(content))facts.push('采用概念礼装插画');
 if(/個セット/.test(p.title)&&/3個セット|３個セット/.test(content))facts.push('一组内含三枚');
 const artist=content.match(/(?:^|[！!。\s])([^！!。\s/]{1,16})さん描き下ろしのイラスト/);
 if(artist&&!/さん描き下ろし[\s\S]*さん描き下ろし/.test(content))facts.push('采用'+artist[1]+'为活动新绘的插画');
 const material=p.section.match(/(?:材質|素材)[:：]\s*([^\n※■]{1,52})(?:\n|※|■|$)/)?.[1]?.trim();
 if(material && /^[\p{Script=Katakana}ー、・A-Za-z％%0-9 ]+$/u.test(material))facts.push('材质为'+material);
 const specific={
  itemSvfwOEri15:['W400×H300×D100mm','仿照特诺奇蒂特兰携带的透明手提包设计，宽 400、高 300、厚 100 毫米'],
  itemSvfwOEri14:['容量：500ml','透明瓶以好感度量表为图案，容量为 500 毫升'],
  itemSvfwOEri16:['宙を泳ぐBBコスモ','使用 BB Cosmo 在空中游动的插画制成立体变图挂件'],
  itemAfpWUADO07:['本体中段の穴に台座を設置','底座也可装在立牌中段，使角色呈坐姿展示'],
  itemAfpWUADO13:['約W44×H42mm','以《Iron Rose》的 CD 封面为造型，约宽 44、高 42 毫米']
 }[p.sku];
 if(specific){assert.ok(norm(content).includes(norm(specific[0])));facts.push(specific[1]);}
 assert.ok(facts.length,'Missing item-specific source fact: '+p.sku);
 const materialTerms={'アクリル':'亚克力','ポリエステル':'聚酯纤维','シングルスエード':'单面麂皮绒面料','PP':'聚丙烯（PP）'};
 for(let j=0;j<facts.length;j++)if(facts[j].startsWith('材质为'))facts[j]='材质为'+(materialTerms[facts[j].slice(3)]||facts[j].slice(3));
 return {status:'supported',scope:'official-event-variant',sku:p.sku,variantId:v[0].id,source:p.source,officialTitle:label,second:g.url,
  summary:'AnimeJapan '+g.year+' 的「'+short+'」。'+facts.join('，')+'。'};
}
for(const g of groups){
 const members=targets.filter(t=>t.groupId===g.groupId);assert.equal(members.length,g.coverage);
 let official,name,pack,total,checklist=[];
 if(g.type==='wafer'){
  const {body,source}=cached(g.url);official=source;name=clean(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)[1]).split('｜')[0];
  const html=body.split(/<body\b/i)[1],start=html.indexOf('●');assert.ok(start>=0);
  const lines=plain(html.slice(start,start+12000).split(/\(C\)|©|&copy;|※画像/)[0]).normalize('NFKC').split('\n').map(s=>s.trim()).filter(Boolean);
  const count=lines[0].match(/全(\d+)種(?:\s*\+\s*(\d+)種)?/);assert.ok(count,name);total=+count[1]+Number(count[2]||0);
  const secret=Number(lines[0].match(/シークレット\s*(\d+)種/)?.[1]||0);
  const food=lines.find(s=>s.startsWith('●')&&s.includes('ウエハース')&&!s.includes('全'));assert.ok(food,name);
  const label=lines[0].includes('シール')?'金属光泽贴纸':lines[0].includes('ホログラム')?'全息塑料卡':lines[0].includes('メタ')?'金属光泽卡':'塑料卡';
  const flavor=food.includes('バニラクリーム')?'香草奶油威化':food.includes('ココアクリーム')?'可可奶油威化':food.includes('チョコ')?'巧克力威化':'威化';
  const single=/1枚/.test(lines[0]);
  pack='系列共有 '+total+' 款'+(secret?'，含 '+secret+' 款隐藏款':'')+'。原包装含'+(single?'一张':'')+label+'和'+(food.includes('2個')?'两块':'一块')+flavor+'。';
  if(g.label==='第1弹')checklist=lines.map(l=>l.match(/^(\d+)\.\s*(N|R|S)\s+(.+)$/)).filter(Boolean).map(m=>({number:+m[1],rarity:m[2],name:m[3].trim()}));
  if(g.label==='第1弹')assert.equal(checklist.length,25);
  catalogues.push({groupId:g.groupId,officialTitle:name,source,total,secret:secret||null,pack,checklist,lotCountLine:lines[0],food});
 }
 for(const t of members){
  const row={groupId:g.groupId,itemId:t.id,title:t.title};
  if(t.editorial||t.manualFields?.length||t.locked||t.summary){cases.push({...row,status:'protected'});continue}
  if(g.type==='event'){const match=eventCase(g,t);cases.push({...row,status:'pending',...match});continue}
  const base={...row,officialTitle:name,source:official};
  if(t.id.startsWith('family-')&&norm(t.title)===norm(name)){cases.push({...base,status:'supported',scope:'wafer-family',summary:'万代「'+name+'」系列档案。'+pack});continue}
  if(t.title.includes('待补款式')){cases.push({...row,status:'pending',reason:'internal-placeholder-has-no-printed-identity',official:g.url});continue}
  const first=t.title.match(/No\.\s*(\d+)\s+(.+)$/i);
  const direct=first&&checklist.find(c=>c.number===+first[1]&&norm(c.name)===norm(first[2]));
  if(direct){cases.push({...base,status:'supported',scope:'official-number-and-name',summary:'万代首弹清单的第 '+direct.number+' 项为「'+direct.name+'」，稀有度 '+direct.rarity+'。这张卡属于共 25 款的塑料卡系列。'});continue}
  const title=t.title.normalize('NFKC');
  const card=title.match(/\/(\d{7})\s+(.+?)(?:【([A-Z]+)】)?\s+(\d+)$/);
  const reissue=g.label==='第復刻スペシャル 1弹'&&title.match(/SP(\d+)\s+(.+?)\s*\/FGO$/);
  const num=card?+card[4]:reissue?+reissue[1]:null;
  const localName=card?.[2]||reissue?.[2],rarity=card?.[3]||(reissue?'SP':null);
  let found, conflict=false;
  const cleanName=s=>norm(s).replace(/[〔【]/g,'[').replace(/[〕】]/g,']');
  for(const list of rosters.filter(r=>r.groupId===g.groupId)){
   const member=list.rows.find(r=>r.number===num);if(!member||!localName)continue;
   const tail=member.name.match(/\(([A-Z]+)\)$/),level=member.rarity||tail?.[1];
   const term=tail?member.name.slice(0,tail.index):member.name;
   if(![term,term.split('/').slice(1).join('/')].some(v=>cleanName(v)===cleanName(localName)))continue;
   if(rarity&&level!==rarity){conflict=true;continue}
   found={list,member,level};break;
  }
  if(found){const {list,member,level}=found;cases.push({...base,status:'supported',scope:'official-series-retailer-number-and-name',second:list.source,
    summary:'「'+name+'」中的「'+localName+'」。零售目录将其列为 '+(member.code||'')+num+(level?'，标记为 '+level:'')+'。'+pack.split('。')[0]+'。'});continue}
  cases.push({...row,status:'pending',reason:conflict?'rarity-conflict':num?'name-number-or-edition-needs-proof':'retail-lot-or-series-context-only',official:g.url});
 }
}
write(out+'/wafer-catalogues.json',catalogues);
write(out+'/event-sources.json',catalogueEntries);
write(out+'/new-cases.json',cases);
for(const g of groups){const s=cases.filter(r=>r.groupId===g.groupId);console.log(g.label,s.length,s.filter(r=>r.status==='supported').length,s.filter(r=>r.status==='protected').length);}
