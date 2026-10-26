import {currentEditorial} from './editorial';
import {canonicalBrand,applyTitleCatalogue,catalogueKeywords,manualField} from './catalog';
import {Item,ProductFacts,EMPTY_FACTS,Evidence} from './types';
import {repairClassification} from './classification';

export type Metadata=Partial<ProductFacts & Pick<Item,'catalogueKey'|'cardNumber'|'kuji'|'brand'|'series'|'year'|'isbn'|'msrp'|'category'|'productLine'|'wave'|'member'|'event'|'saleForm'>>;
export const textOnly=(s:string)=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const names=(s:string)=>[...new Set(s.split(/[,、;；\n]|\s+\/\s+/).map(x=>x.trim()).filter(Boolean))].slice(0,15);
const valueName=(v:any):string=>typeof v==='string'?v:typeof v?.name==='string'?v.name:'';

// Only explicit source labels or Product JSON-LD are facts. A seller is not a manufacturer.
export function extractMetadata(html:string):Metadata{
 const facts:Metadata={};
 const pairs:[string,string][]=[];
 for(const m of html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi))pairs.push([textOnly(m[1]),textOnly(m[2])]);
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(x=>textOnly(x[1]));for(let i=0;i+1<cells.length;i+=2)pairs.push([cells[i],cells[i+1]]);
 }
 // Plain descriptions can have labelled lines, but never infer fields from a site's navigation.
 const lines=html.replace(/<br\s*\/?\s*>|<\/(?:p|li)>/gi,'\n').split('\n');
 for(const line of lines){const m=textOnly(line).match(/^(メーカー|ブランド名|キャラクター名|キャラ名|サークル名|サークル|作家名|作者|イラストレーター|画師|原作名|作品名|発売元\/販売元|発売日|発行日|参考価格|定価|JANコード|ISBN)\s*[:：]\s*(.{1,180})$/);if(m)pairs.push([m[1],m[2]]);}
 const release=html.match(/<p\b[^>]*class=["'][^"']*salesStartDate__txt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1];if(release)pairs.push(['発売日',textOnly(release)]);
 for(const [rawLabel,rawValue] of pairs){const label=rawLabel.replace(/[\s：:]/g,''),value=rawValue.slice(0,300).normalize('NFKC').trim();if(!value||/^(未定|不明|なし|-|—)$/.test(value))continue;
  if(/^(メーカー|メーカー名|製造元|発売元|発売元\/販売元)$/.test(label))facts.manufacturer=value;
  if(label==='出版社'){facts.publisher=value;facts.brand=canonicalBrand(value);}
  if(/^(ブランド|ブランド名)$/.test(label))facts.brand=value;
  if(/^(キャラクター|キャラクター名|キャラ名)$/.test(label))facts.characters=names(value);
  if(/^(サークル|サークル名)$/.test(label)){facts.circle=value;facts.origin='doujin';}
  if(/^(作家|作家名|作者|著者|イラスト|イラストレーター|画師)$/.test(label))facts.artists=names(value);
  if(/^(原作|原作名|作品名|シリーズ名|元ネタ)$/.test(label))facts.series=value;
  if(/^(対象|対象性別|向け)$/.test(label))facts.audience=/女性/.test(value)?'female':/男性/.test(value)?'male':'unknown';
  if(/^(年齢制限|対象年齢)$/.test(label))facts.ageRating=/18|成人|アダルト/.test(value)?'r18':/なし|全年齢|一般/.test(value)?'all':'unknown';
  if(/^(商品シリーズ|製品シリーズ|シリーズ)$/.test(label))facts.productLine=value;
  if(/^(弾|第何弾|巻号|巻数)$/.test(label))facts.wave=value.replace(/^第\s*|\s*[弾巻号]$/g,'');
  if(/^(発売日|発売時期|発売予定日|発行日|販売開始日)$/.test(label)){facts.releaseDate=value;const y=value.match(/(?:19|20)\d{2}/)?.[0]||value.match(/^(\d{2})年/)?.[1];if(y)facts.year=y.length===2?(Number(y)>=80?'19':'20')+y:y;}
  if(/^(参考価格|定価|メーカー希望小売価格|販売当時価格)$/.test(label)){const amount=value.match(/(?:[¥￥]\s*)?([\d,]+)\s*円|[¥￥]\s*([\d,]+)/);if(amount)facts.msrp=Number((amount[1]||amount[2]).replaceAll(',',''));}
  if(/^(JAN|JANコード|商品コード\(JAN\))$/.test(label)){const n=value.replace(/[-\s]/g,'');if(/^\d{8}$|^\d{13}$/.test(n))facts.jan=n;}
  if(/^ISBN(?:コード)?$/.test(label)){const n=value.replace(/[-\s]/g,'');if(/^\d{10}$|^\d{13}$/.test(n))facts.isbn=n;}
 }
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{
  const json=JSON.parse(m[1]);const nodes=(Array.isArray(json)?json:[json]).flatMap((x:any)=>x['@graph']||x);
  // A list containing several products cannot supply facts for a single target item.
  const products=nodes.filter((n:any)=>n['@type']==='Product');if(products.length!==1)continue;const n=products[0];
  if(valueName(n.brand))facts.brand=canonicalBrand(valueName(n.brand).slice(0,300));
  if(valueName(n.manufacturer))facts.manufacturer=valueName(n.manufacturer).slice(0,300);
  if(n.gtin13&&/^\d{13}$/.test(String(n.gtin13)))facts.jan=String(n.gtin13);
  if(n.isbn&&/^\d{10}$|^\d{13}$/.test(String(n.isbn)))facts.isbn=String(n.isbn);
  if(n.releaseDate&&/^\d{4}-\d{2}/.test(String(n.releaseDate))){facts.releaseDate=String(n.releaseDate);facts.year=String(n.releaseDate).slice(0,4);}
 }catch{}
 if(facts.origin!=='doujin'&&facts.manufacturer)facts.origin='commercial';
 return facts;
}

export function metadataTags(facts:Metadata){return [...new Set([
 ...(facts.brand?[`品牌:${facts.brand}`]:[]),...(facts.productLine?[`产品线:${facts.productLine}`]:[]),...(facts.publisher?[`出版社:${facts.publisher}`]:[]),...(facts.manufacturer?[`厂家:${facts.manufacturer}`]:[]),...(facts.circle?[`社团:${facts.circle}`]:[]),
 ...(facts.series?[`作品:${facts.series}`]:[]),...(facts.category?[`类别:${facts.category}`]:[]),...(facts.year?[`发售年:${facts.year}`]:[]),...(facts.artists||[]).map(x=>`画师/作者:${x}`),...(facts.characters||[]).map(x=>`角色:${x}`)
 ])].filter(x=>x.length<=60);}

export function extractProductKeywords(html:string){const keywords:string[]=[];
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{
  const json=JSON.parse(m[1]),nodes=(Array.isArray(json)?json:[json]).flatMap((x:any)=>x['@graph']||x),products=nodes.filter((n:any)=>n['@type']==='Product');if(products.length!==1)continue;
  const values=Array.isArray(products[0].keywords)?products[0].keywords:[products[0].keywords];for(const v of values)if(typeof v==='string')keywords.push(...v.split(/[,、;；]/).map(x=>x.trim()).filter(x=>x.length>1&&x.length<=60));
 }catch{}return [...new Set(keywords)].slice(0,30);
}

export function applyMetadata(item:Item,facts:Metadata,url:string,mode:'empty'|'confirmed'='empty'):Item{
 if(currentEditorial(item)&&mode==='empty')return item;
 const updated={...EMPTY_FACTS,...item}, evidence:Evidence[]=[];
 for(const [key,value] of Object.entries(facts)){
  if(value===undefined||value===null||value===''||(Array.isArray(value)&&!value.length))continue;
  const old=(updated as any)[key];const vacant=old==null||old===''||old==='unknown'||(Array.isArray(old)&&!old.length);
  const inferredBrand=key==='brand'&&!manualField(item,key)&&!item.evidence.some(e=>e.field==='brand');
  const inferredCategory=key==='category'&&!manualField(item,key);
  const explicitAdult=key==='ageRating'&&value==='r18';
  const applied=mode==='confirmed'||(!manualField(item,key)&&(vacant||inferredBrand||inferredCategory||explicitAdult));
  if(applied)(updated as any)[key]=value;
  const factValue=Array.isArray(value)?value.join('、'):String(value);
  if(!item.evidence.some(e=>e.field===key&&e.value===factValue&&e.url===url))evidence.push({field:key,value:factValue,url,at:new Date().toISOString(),method:applied?'来源明确字段；保留出处':'来源候选；保留已有字段'});
 }
 updated.tags=manualField(item,'tags')?item.tags:[...new Set([...item.tags,...metadataTags(updated),...catalogueKeywords(updated)])].slice(0,50);
 updated.evidence=[...item.evidence,...evidence].slice(-100);
 if(updated.bucket==='junk'&&/書籍|本|同人誌|画集|雑誌/.test(updated.category))updated.bucket='normal';
 return repairClassification(applyTitleCatalogue(updated));
}
