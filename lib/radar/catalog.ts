import {currentEditorial} from './editorial';
import type {Item} from './types';
import {isWafer,waferFacts} from './collection-facts';
export const publisherNames=['角川書店','KADOKAWA','エンターブレイン','FOX出版','宙出版','講談社','スタジオDNA','学習研究社','集英社','小学館','一迅社','宝島社','芳文社','ホビージャパン'];
export const makerNames:Record<string,string>={'グッドスマイルカンパニー':'Good Smile Company','GOOD SMILE COMPANY':'Good Smile Company','マックスファクトリー':'Max Factory','MAX FACTORY':'Max Factory','アルター':'ALTER','ALTER':'ALTER','BANDAI SPIRITS':'万代 BANDAI','バンダイ':'万代 BANDAI','BANDAI':'万代 BANDAI','コトブキヤ':'寿屋 KOTOBUKIYA','KOTOBUKIYA':'寿屋 KOTOBUKIYA','アニプレックス':'ANIPLEX','ANIPLEX':'ANIPLEX'};
export const canonicalBrand=(s:string)=>/^(角川書店|kadokawa)$/i.test(s)?'KADOKAWA':/^(?:type[\s-]?moon(?: books)?|タイプムーン(?:ブックス)?)$/i.test(s)?'TYPE-MOON':/^(バンダイ|bandai(?: spirits)?)$/i.test(s)?'万代 BANDAI':/^(コトブキヤ|寿屋|kotobukiya)$/i.test(s)?'寿屋 KOTOBUKIYA':s.trim();
export type Extra={name:string;status:'included'|'absent'|'only'};
export function manualField(item:Item,key:string){const edits=item.evidence.filter(e=>/人工整理|批量整理/.test(e.field));return !!item.locked&&(edits.length?edits.some(e=>e.value.split('、').includes(key)):true);}
export function offerExtras(title:string):Extra[]{const out:Extra[]=[];
 for(const m of title.normalize('NFKC').matchAll(/[([]([^()\[\]]{1,100}?)(付き|付属|付|欠品|欠|なし|無し|無|のみ)[)\]]/g)){
  const name=m[1].replace(/^状態[:：]\s*/,'').trim();if(!name||!/(特典|付録|付属品|エア[・\s]?カリバーン|CD|DVD|BD|ポストカード|しおり|ブロマイド|帯|箱)/i.test(name))continue;
  out.push({name,status:/欠|なし|無し|無/.test(m[2])?'absent':m[2]==='のみ'?'only':'included'});
 }
 for(const m of title.normalize('NFKC').matchAll(/(?:^|\s|[)）])(付属品|付録)(付き|付|欠品|欠|なし|無し|無)(?=\S|$)/g))out.push({name:m[1],status:/欠|なし|無し|無/.test(m[2])?'absent':'included'});
 return out.filter((e,n,a)=>a.findIndex(x=>x.name===e.name&&x.status===e.status)===n);
}
export function stripOfferDecorations(title:string){return title.normalize('NFKC')
 .replace(/^\[(?:ランク\s*[A-D][+-]?|状態[:：][^\]]+|(?:破損品|箱欠品|箱破損|付属品欠品|経年劣化あり|難あり|塗装剥げ|未開封)(?:[/・][^\]]+)?)\]\s*/i,'')
 .replace(/\((?:状態|condition)[:：][^)]{1,500}\)/gi,'')
 .replace(/[([]([^()\[\]]{1,100}?)(付き|付属|付|欠品|欠|なし|無し|無)[)\]]/g,(whole,name)=>/(特典|付録|付属品|エア[・\s]?カリバーン|CD|DVD|BD|ポストカード|しおり|ブロマイド|帯|箱)/i.test(name)?'':whole)
 .replace(/[（(【\[]?(?:帯[付付き有欠無なし]+|特典[付付き有欠無なし]+|付録欠|完品)[）)】\]]?/g,'')
 .replace(/^(?:付属品|付録)(?:付き|付|欠品|欠|なし|無し|無)[)）]?\s*/,'').trim();}
// TYPE-MOON展 and TYPE-MOONエース are names, not publisher prefixes.
export function cleanProductTitle(title:string){let name=stripOfferDecorations(title).replace(/【(?:事後通販|大阪通販|受注販売|再販受付|\d{4}年\d{1,2}月(?:上旬|中旬|下旬)?(?:より)?(?:順次)?お届け(?:予定)?)】\s*/g,'').replace(/<<[^>]*>>/g,' ').replace(/\((?:箱入|中古|未開封)\)/g,'').replace(/^\s*[■★]?(?:未完)?[)）]\s*/,'').trim();
 const dvdSet=/^アニメDVD\s+Fate\s*\/\s*stay\s+night\s+SET\s+\d+(?=\s|$|[([])/i.test(name);
 const prefixes=['週刊少年マガジンKC','少年マガジンKC','講談社コミックス','カドカワコミックスA','角川コミックス・エース','電撃コミックスNEXT','星海社コミックス','IDコミックス/DNAメディアコミックス','IDコミックス/4コマKINGSぱれっとコミックス',...publisherNames,...Object.keys(makerNames),'アニメBlu-ray Disc','アニメBlu-ray','アニメDVD','アニメCD','アニメムック','パンフレット','ライトノベル(文庫)','ライトノベル','攻略本','コミック','漫画'];
 for(let n=0;n<8;n++){const before=name;for(const prefix of prefixes)if(name.toLowerCase().startsWith(prefix.toLowerCase())){name=name.slice(prefix.length).trim();break;}
  name=name.replace(/^(?:(?:TYPE[\s-]?MOON(?:\s+BOOKS)?|タイプムーン)\s*(?:\([^)]{1,80}\)\s*)?)+(?=[「『【]?(?:Fate|月姫|空の境界|魔法使い|MELTY|Return|ロード|ファイヤー|武内崇|奈須きのこ))/i,'').replace(/^不備有[)）]\s*/,'').replace(/^ランク\s*[A-D](?:\s*[:：)）-])?\s*/i,'').replace(/^(?:付属品|付録)(?:付き|付|欠品|欠|なし|無し|無)[)）]?\s*/,'').trim();if(before===name)break;
 }if(/^(?:カワグチタケシ|渡れい|たけのこ星人|タスクオーナ|森井しづき|真じろう|西出ケンゴロー|石田あきら|平野稜二|磨伸映一郎|アンソロジー|中谷)\s+/.test(name)&&/Fate|フェイト|氷室の天地|帝都聖杯奇譚/.test(name))name=name.replace(/^(?:カワグチタケシ|渡れい|たけのこ星人|タスクオーナ|森井しづき|真じろう|西出ケンゴロー|石田あきら|平野稜二|磨伸映一郎|アンソロジー|中谷)\s+(?:!!\))?/,'');if(dvdSet)name=name.replace(/^(Fate\s*\/\s*stay\s+night)\s+SET\s+(\d+)/i,'$1 DVD-SET $2');name=name.replace(/^(?:(?:武内崇|奈須きのこ|三田誠|成田良悟)[・\s]+)+(?=.*(?:Fate|月姫|空の境界|ロード))/i,'');return name.replace(/^「([^」]+)」\s*$/,'$1').replace(/^『([^』]+)』\s*$/,'$1').replace(/\s+/g,' ').trim();}
export function editionVariant(title:string){return title.normalize('NFKC').match(/初回限定版|通常版|初版|改訂版|新装版|限定版|特装版|復刻版/)?.[0]||'';}
// A narrowly documented family: same main volume, different supplied extras.
export function extraMaterialMaster(title:string){return /^Fate\s*\/\s*EXTRA\s+material\s*(?:\[?(?:初回限定版|通常版)\]?)?$/i.test(cleanProductTitle(title))?'Fate/EXTRA material':null;}
export function catalogueTitle(item:Item){return extraMaterialMaster(item.title)||cleanProductTitle(item.title)||item.title;}
export function titleCatalogue(title:string):Partial<Item>{
 const original=stripOfferDecorations(title).replace(/<<[^>]*>>/g,'').trim(),clean=cleanProductTitle(title),facts:Partial<Item>={};
 const maker=Object.entries(makerNames).find(([name])=>original.toLowerCase().startsWith(name.toLowerCase()+' '));if(maker){facts.brand=maker[1];facts.manufacturer=maker[1];facts.origin='commercial';}
 const pub=/^(?:TYPE[\s-]?MOON|タイプムーン)(?:\s|\(|$)/i.test(original)?'TYPE-MOON':publisherNames.find(p=>original.toLowerCase().startsWith(p.toLowerCase()));if(pub){facts.publisher=pub;facts.brand=canonicalBrand(pub);facts.origin='commercial';}
 const patterns:[RegExp,string][]=[[/Fate\s*\/\s*Grand\s*Order\s+material/i,'Fate/Grand Order material'],[/Fate\s*\/\s*complete\s+material/i,'Fate/complete material'],[/Fate\s*Fantasm\s*BOX/i,'Fate Fantasm BOX'],[/Fate\s*Compilation\s*Book/i,'Fate Compilation Book'],[/TYPE[\s-]?MOON\s*エース/i,'TYPE-MOONエース'],[/Fate\s*\/\s*EXTRA\s+material/i,'Fate/EXTRA material'],[/月姫読本\s*Plus\s*Period/i,'月姫読本'],[/月姫想本/,'月姫想本']];
 for(const [re,line] of patterns){const match=clean.match(re);if(!match||line==='TYPE-MOONエース'&&/エディション/.test(clean.slice((match.index||0)+match[0].length)))continue;facts.productLine=line;
  const tail=clean.slice((match.index||0)+match[0].length).trim(),numbered=tail.match(/^(?:vol\.?\s*|第)?([IVX]+|\d{1,3})(?:\s*(?:巻|弾|号))?(?=\s|$|[()])/i);
  if(numbered){facts.wave=String(numberToken(numbered[1])??numbered[1]);}
  facts.member=extraMaterialMaster(clean)||clean;break;
 }if(!facts.productLine){const wave=clean.match(/第\s*(\d+)\s*弾/);if(wave)facts.wave=wave[1];}return facts;
}
export function bookHierarchy(item:Item):Partial<Item>{
 if(item.catalogueGroup||isWafer(item)||/カード|トレカ/.test(item.category))return {};
 // Retail preorder text can follow the volume. Use a publisher's original
 // title only when its physical ISBN identifies this exact edition.
 const book=/書籍|ムック|本|ライトノベル|小説|コミック|漫画|画集|雑誌|パンフレット/.test(item.category);
 const publisher=book&&item.isbn?item.offers.find(o=>['KADOKAWA','講談社'].includes(o.source)&&o.isbn===item.isbn&&o.listingTitle):undefined;
 if(book&&item.isbn&&item.offers.some(o=>['KADOKAWA','講談社'].includes(o.source)&&o.isbn&&o.isbn!==item.isbn))return {};
 const series=cleanProductTitle(item.title),volume=series.match(/(?:\s|\()(\d{1,3})\)?(?:\s*\(書籍\).*|\s*)$/)?.[1];
 if(book&&item.kind!=='bonus'&&volume&&/turas\s*realta/i.test(series))return {productLine:'Fate/Grand Order-turas realta-',wave:volume,member:series};
 if(book&&item.kind!=='bonus'&&volume&&/英霊剣豪七番/.test(series))return {productLine:'Fate/Grand Order -Epic of Remnant- 英霊剣豪七番勝負',wave:volume,member:series};
 const sequence=numberedProduct(item.title)||(publisher?numberedProduct(publisher.listingTitle!):null);if(sequence&&(book||sequence.known)&&item.kind!=='bonus')return {productLine:sequence.line,wave:String(sequence.number),member:cleanProductTitle(item.title)};
 if(item.productLine||!/書籍|ムック|本|ライトノベル|コミック|漫画|画集|雑誌|パンフレット/.test(item.category)||item.kind==='bonus')return {};
 const name=cleanProductTitle(item.title).split(/\s+\/\s+/)[0].trim(),numbered=name.match(/(?:\s+|[（(])(?:第)?(\d{1,3}|上|中|下)(?:巻)?[)）]?$/),wave=numbered?.[1]||item.wave||'',line=numbered?name.slice(0,numbered.index).trim():name;
 return line?{productLine:line.slice(0,300),wave,member:name}:{};
}
export function applyTitleCatalogue(item:Item):Item{if(item.catalogueGroup||currentEditorial(item))return item;const facts={...titleCatalogue(item.title),...waferFacts(item)},out={...item};
 for(const [key,value] of Object.entries(facts))if(value!==undefined&&!manualField(item,key)&&(!(out as any)[key]||['member','wave','productLine','catalogueKey','cardNumber'].includes(key)||key==='origin'&&out.origin==='unknown'))(out as any)[key]=value;
 for(const [key,value] of Object.entries(bookHierarchy(out)))if(value&&!manualField(item,key)) (out as any)[key]=value;
 if(!manualField(item,'member')&&(!out.member||/^\[?(初回限定版|通常版)\]?$/.test(out.member)))out.member=catalogueTitle(out);return out;
}
export function catalogueBrand(i:Item){return canonicalBrand(manualField(i,'brand')&&i.brand?i.brand:i.publisher||i.manufacturer||i.circle||i.brand||'品牌待整理');}
export function cataloguePath(i:Item){return [catalogueBrand(i),i.productLine||'产品线待整理',i.wave?'第 '+i.wave+' 弹 / 卷':'未分弹 / 待整理'];}
export function catalogueKeywords(item:Item){const t=item.title+' '+item.description+' '+item.category,rules:[RegExp,string][]=[[/Fate\s*\/\s*EXTRA|CCC|EXTELLA/i,'Fate/EXTRA'],[/MELTY\s*BLOOD/i,'MELTY BLOOD'],[/真月譚|真月谭/,'月姬 TV'],[/月姫想本|piece of blue glass moon|月姫.*(?:remake|リメイク)/i,'月姬 Remake'],[/TYPE[\s-]?MOON展/i,'TYPE-MOON展'],[/(?:入場|入場者|来場者)特典/,'入场特典'],[/同梱冊子|WADARCO\s*Illustrations/i,'同梱小册子'],[/Blu[-\s]?ray|ブルーレイ|\bBD\b/i,'Blu-ray'],[/\bDVD\b/i,'DVD'],[/トレーディングカード|トレカ|TCG|集換式|集换式/i,'集换式卡牌'],[/トレーディングフィギュア|盒蛋|食玩|カプセル|ガシャポン/i,'盒蛋 / 食玩'],[/図録|展覧会/,'展会资料'],[/設定資料|material/i,'设定集']];return rules.filter(([re])=>re.test(t)).map(([,tag])=>tag);}
// Stock observation and listing dates never become release dates.
export function releaseSortKey(item:Pick<Item,'releaseDate'|'year'>){const m=item.releaseDate.normalize('NFKC').trim().match(/^((?:19|20)\d{2})(?:[-/.年]\s*(\d{1,2})(?:[-/.月]\s*(\d{1,2}))?)?/);if(m){const month=Number(m[2]||1),day=Number(m[3]||1);if(month>=1&&month<=12&&day>=1&&day<=31)return Number(m[1])*10000+month*100+day;}return /^(19|20)\d{2}$/.test(item.year)?Number(item.year)*10000+101:null;}
const releaseTitleCollator=new Intl.Collator('ja',{numeric:true});
export function numberToken(token:string):number|null{const t=token.normalize('NFKC').trim().toUpperCase();if(/^\d{1,4}$/.test(t))return Number(t);if(!/^(?=[IVXLCDM]+$)M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/.test(t))return null;const values:Record<string,number>={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let n=0;for(let i=0;i<t.length;i++)n+=values[t[i]]*((values[t[i+1]]||0)>values[t[i]]?-1:1);return n||null;}
export function numberedProduct(title:string):{line:string;number:number;known:boolean}|null{
 const clean=cleanProductTitle(title).split(/\s+\/\s+/)[0].replace(/\s*\((?:\d{4}年[^)]*|[^)]*コミケ[^)]*)\)\s*$/,'').trim();
 if(/セット|まとめ売り|全\d+巻|[\dIVX]+\s*[~〜～・]\s*[\dIVX]+/i.test(clean))return null;
 const known=clean.match(/^(Fate\s*\/\s*Grand\s*Order\s+material|Fate\s*\/\s*complete\s+material|Fate\s*Fantasm\s*BOX|Fate\s*Compilation\s*Book|TYPE[\s-]?MOON\s*エース)\s*(?:vol\.?\s*|第)?(\d{1,3}|[IVX]+)(?=\s|$|[()巻号])/i);
 if(known){const number=numberToken(known[2]);return number===null?null:{line:titleCatalogue(clean).productLine||known[1],number,known:true};}
 const cases=clean.match(/^(ロード[・\s-]*エルメロイII世の(?:事件簿|冒険)).*?\((\d{1,3})\)\s*$/i);if(cases)return {line:cases[1],number:Number(cases[2]),known:true};
 const novel=clean.match(/^(Fate\s*\/\s*(?:strange\s*Fake|Apocrypha|Zero|Requiem|Prototype[^\d]*?)|ロード[・\s-]*エルメロイII世の(?:事件簿|冒険)|ファイヤーガール)\s*\(?\s*(\d{1,3})(?=\s|$|[)巻.:：])/i);
 if(novel)return {line:novel[1].replace(/\s*\/\s*/g,'/').replace(/strange\s*Fake/i,'strange Fake'),number:Number(novel[2]),known:true};
 const anthology=clean.match(/^(.*(?:アンソロジーコミック|コミックアンソロジー|コミックアラカルト))\s*(\d{1,3})(?:巻)?$/i);
 if(anthology)return {line:anthology[1].trim(),number:Number(anthology[2]),known:/^Fate[\s/]/i.test(anthology[1])};
 const parenthetical=clean.match(/^(.*?)\s*\((\d{1,3})\)$/);if(parenthetical&&parenthetical[1].length>=3)return {line:parenthetical[1].trim(),number:Number(parenthetical[2]),known:/^(?:新装版\s*)?(?:Fate|フェイト)\//i.test(parenthetical[1])};
 const generic=clean.match(/^(.*?)\s+(?:vol\.?\s*|第)?(\d{1,3})(?:巻|号|弾)?(?:\s*\([^)]*\))?$/i);return generic&&generic[1].length>=3?{line:generic[1],number:Number(generic[2]),known:false}:null;
}
export function sequenceKey(item:Item){const n=numberedProduct(item.title);return n?.known?n.line.normalize('NFKC').toLowerCase().replace(/[\s\p{P}]+/gu,'')+':'+n.number:null;}
export function bookMedium(item:Item):'novel'|'manga'|''{const cat=item.category.normalize('NFKC');if(/^(?:小説|ライトノベル(?:\(文庫\))?|文庫|novel)$/i.test(cat))return 'novel';if(/^(?:コミック|漫画|comic|manga)$/i.test(cat))return 'manga';const t=[cat,...item.evidence.filter(e=>e.field==='category'||e.field==='来源分類'||e.field==='来源分类').map(e=>e.value)].join(' '),raw=[item.title,...(item.aliases||[])].join(' ');if(/マガジンKC|講談社コミックス|コミックスA|角川コミックス|電撃コミックス|星海社コミックス|IDコミックス/.test(raw)||/漫画|コミック|comic|manga/i.test(t))return 'manga';if(/小説|ライトノベル|文庫|novel/i.test(t))return 'novel';if(/成田良悟|東出祐一郎|三田誠|虚淵玄/.test(item.title))return 'novel';return '';}
export function sortByNumber<T>(rows:T[],itemOf:(row:T)=>Item,manual=false,withinBoard=false){return rows.map(row=>{const item=itemOf(row),n=numberedProduct(item.title),title=catalogueTitle(item),label=title.match(/(?:\bNo\.?\s*|番号\s*|#)(\d{1,4})|^(\d{1,4})(?=[\s[:：])/i);return {row,item,line:n?.line||item.productLine||title,number:n?.number??numberToken(item.wave||'')??(label?Number(label[1]||label[2]):null),date:releaseSortKey(item),title};}).sort((a,b)=>{
 if(manual){const order=(a.item.manualOrder??Infinity)-(b.item.manualOrder??Infinity);if(order&&!Number.isNaN(order))return order;}
 if(withinBoard){if(a.number!==null||b.number!==null){if(a.number===null)return 1;if(b.number===null)return -1;if(a.number!==b.number)return a.number-b.number;}else if(a.date!==b.date)return a.date===null?1:b.date===null?-1:a.date-b.date;}
 const line=releaseTitleCollator.compare(a.line,b.line);if(line)return line;if(a.number!==null||b.number!==null){if(a.number===null)return 1;if(b.number===null)return -1;if(a.number!==b.number)return a.number-b.number;}
 if(a.date!==b.date)return a.date===null?1:b.date===null?-1:a.date-b.date;return releaseTitleCollator.compare(a.title,b.title)||a.item.id.localeCompare(b.item.id);
 }).map(x=>x.row);}
export function compareRelease(a:Item,b:Item,descending=false){const aa=releaseSortKey(a),bb=releaseSortKey(b);if(aa===null||bb===null)return aa===bb?releaseTitleCollator.compare(catalogueTitle(a),catalogueTitle(b)):aa===null?1:-1;return (descending?bb-aa:aa-bb)||releaseTitleCollator.compare(catalogueTitle(a),catalogueTitle(b));}
export function sortByRelease<T>(rows:T[],itemOf:(row:T)=>Item,descending=false){return rows.map(row=>{const item=itemOf(row);return {row,date:releaseSortKey(item),title:catalogueTitle(item)};}).sort((a,b)=>{if(a.date===null||b.date===null)return a.date===b.date?releaseTitleCollator.compare(a.title,b.title):a.date===null?1:-1;return (descending?b.date-a.date:a.date-b.date)||releaseTitleCollator.compare(a.title,b.title);}).map(x=>x.row);}
