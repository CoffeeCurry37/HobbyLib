import {z} from 'zod';
import {Item,State} from './types';
import {createItem} from './engine';
import {safeUrl,makeOffer} from './collector';
import {findProduct,listingKey} from './identity';
export const accountRowsSchema=z.array(z.object({title:z.string().trim().min(2).max(300),url:z.string().max(2000).default(''),quantity:z.number().int().min(1).max(999).default(1),recordId:z.string().max(150).default(''),status:z.string().max(100).default('待核对')})).max(500);
export type AccountRow=z.infer<typeof accountRowsSchema>[number];
export const cancelled=(s:string)=>/cancel|キャンセル|取消|退款|refund|返品|未決済|支払い待ち|発送待ち|取引中|pending/i.test(s);
export function accountCandidate(row:AccountRow,state:State){const url=row.url?safeUrl(row.url).href:'';if(url&&!['Mandarake','骏河屋','Mercari','Yahoo 拍卖','Yahoo 购物'].includes(makeOffer(url,'',null).source))throw new Error('账号记录只支持四个指定平台');return createItem(row.title,'',url?makeOffer(url,'账号记录；不代表当前在售',null):undefined,state.prefs);}
export async function rowKey(row:AccountRow){const value=[row.recordId,row.url?listingKey(row.url):'',row.title.normalize('NFKC'),row.quantity].join('|');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function previewAccounts(rows:AccountRow[],state:State){return Promise.all(rows.map(async(row,index)=>{const found=findProduct(state.items,accountCandidate(row,state));return {...row,index,key:await rowKey(row),itemId:found?.item.id||'',reason:found?.reason||'尚未精确匹配；可选库内条目或新建',excluded:cancelled(row.status),ambiguousQuantity:!row.recordId};}));}
export async function applyAccounts(rows:AccountRow[],selections:{index:number;itemId?:string;confirmedPurchase?:boolean}[],kind:'purchases'|'wishlist',state:State){
 const changed=new Map<string,Item>();let added=0,matched=0,skipped=0;const seen=new Set<number>();
 for(const selection of selections){if(seen.has(selection.index))continue;seen.add(selection.index);const row=rows[selection.index];if(!row)throw new Error('导入选择无效');if(cancelled(row.status)){skipped++;continue;}if(kind==='purchases'&&!selection.confirmedPurchase)throw new Error('请确认所选记录确为已完成购买；未付款和取消订单不能标记拥有');
  const candidate=accountCandidate(row,state),automatic=findProduct(state.items,candidate);let item=selection.itemId?state.items.find(i=>i.id===selection.itemId):automatic?.item;
  if(selection.itemId&&!item)throw new Error('所选商品已不存在，请重新预览');
  if(!item){item=candidate;state.items.push(item);added++;}else matched++;
  const key=await rowKey(row),field=kind==='purchases'?'购买记录':'愿望清单';if(item.evidence.some(e=>e.field===field&&e.value===key)){skipped++;continue;}
  item={...item};if(kind==='wishlist')item.watchlisted=true;else {item.ownership='owned';item.quantity=Math.max(item.quantity,row.quantity);}
  // Without a reliable order-line ID, quantities are maxima, not sums. A repeated export cannot double holdings.
  item.evidence=[...item.evidence,{field,value:key,url:row.url,at:new Date().toISOString(),method:kind==='wishlist'?'用户预览确认；加入商品白名单':'用户确认已完成购买；只标记此条目，数量取较大值，不推断特典或套装组件'}].slice(-150);
  state.items[state.items.findIndex(i=>i.id===item!.id)]=item;changed.set(item.id,item);
 }return {items:[...changed.values()],added,matched,skipped};
}
