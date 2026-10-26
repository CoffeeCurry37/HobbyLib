import {Item,State} from './types';
import {readSource} from './reader';
import {parseHtml} from './collector';
import {createItem} from './engine';
import {applyMetadata,extractMetadata,Metadata} from './metadata';
import {sameProduct,productName} from './identity';
import {manualField} from './catalog';
import bookReleases from './book-release-catalogue.json';
// Search-derived catalogue facts checked on 2026-09-28; these are MSRP/release facts, never live offers.
const verified:{title:string;url:string;facts:Metadata}[]=[
 {title:'月姫想本',url:'https://www.suruga-ya.jp/product/detail/185200517',facts:{brand:'TYPE-MOON',publisher:'TYPE-MOON',releaseDate:'2021/12/30',year:'2021',msrp:1500,category:'書籍'}},
 {title:'Fate/EXTRA material WADARCO Illustrations',url:'https://www.suruga-ya.jp/product/detail/185131336',facts:{brand:'TYPE-MOON',publisher:'TYPE-MOON',releaseDate:'2013/08/16',year:'2013',category:'書籍'}}
];
const verifiedNames=verified.map(v=>({...v,name:productName(v.title)})),bookNames=bookReleases.map(v=>({...v,name:productName(v.title)}));
export function verifiedFacts(item:Item,state:State){let out=item;const name=productName(item.title);for(const v of verifiedNames){if(name!==v.name)continue;const other=createItem(v.title,'',undefined,state.prefs);if(sameProduct(item,other)||(item.kind==='base'&&!item.isbn&&!item.jan))out=applyMetadata(out,v.facts,v.url);}
 for(const v of bookNames){if(name!==v.name)continue;const facts=v.facts as Metadata,other=applyMetadata(createItem(v.title,'',undefined,state.prefs),facts,v.url);if(!sameProduct(item,other))continue;out=applyMetadata(out,facts,v.url);if(v.publicationDate&&!out.evidence.some(e=>e.field==='発行日'&&e.url===v.url))out.evidence=[...out.evidence,{field:'発行日',value:v.publicationDate,url:v.url,at:new Date().toISOString(),method:'书店商品页发行日；与通販発売日分别保存'}].slice(-150);}
 return out;
}
export async function researchItem(item:Item,state:State){
 if(item.bucket==='junk')return {item,message:'低价周边小物跳过深入补全'};
 let out=verifiedFacts(item,state);if(out!==item&&out.image)return{item:out,message:'已填入有来源的目录资料；不变更挂牌价格'};
 if(/^97[89]\d{10}$/.test(item.isbn)){
  const url=`https://api.openbd.jp/v1/get?isbn=${item.isbn}`,data=JSON.parse((await readSource(url)).text)?.[0]?.summary;
  if(data){const raw=String(data.pubdate||''),facts:Metadata={isbn:item.isbn,year:raw.slice(0,4),publisher:String(data.publisher||'')};if(/^\d{8}$/.test(raw))facts.releaseDate=raw.slice(0,4)+'/'+raw.slice(4,6)+'/'+raw.slice(6);out=applyMetadata(out,facts,url);return{item:out,message:'已通过 ISBN 精确补全书目资料'};}
 }
 // At most one search and one exact matching detail page per action. No fuzzy match writes facts.
 const url='https://www.suruga-ya.jp/search?category=700&search_word='+encodeURIComponent(item.title);
 const page=await readSource(url),found=parseHtml(page.text,page.url).products.filter(p=>sameProduct(item,{...createItem(p.title,p.description,p.offer,state.prefs),...p.facts}));
 if(found.length!==1)return {item:out,message:found.length?'多个版本符合条件，请在来源页预览确认':'未找到名称、卷号、版本完全对应的来源；保持待核对'};
 const detail=await readSource(found[0].offer.url),parsed=parseHtml(detail.text,detail.url).products;
 const p=parsed.find(p=>sameProduct(item,{...createItem(p.title,p.description,p.offer,state.prefs),...p.facts}));if(!p)throw new Error('详情与搜索记录不一致，未写入资料');
 out=applyMetadata(out,{...p.facts,...extractMetadata(detail.text)},detail.url);
 if(p.categoryLabel){out.evidence=[...out.evidence,{field:'来源分类',value:p.categoryLabel,url:detail.url,at:new Date().toISOString(),method:'精确匹配商品页的实际分类标签'}].slice(-150);}
 if(p.image&&!manualField(item,'image')){out.image=p.image;out.images=p.images?.slice(0,10);out.evidence=[...out.evidence,{field:'image',value:p.image,url:detail.url,at:new Date().toISOString(),method:'完整名称、卷号、版本与媒介一致的商品图片'}].slice(-150);}
 return{item:out,message:'已自动搜索并补入明确字段和商品图片，保留出处与已有人工资料'};
}
