import {createHash} from 'node:crypto';
import catalogue from './lot-visual-catalogue.json';
import {relayImage} from './image-source';
import {listingKey,canonicalItem} from './identity';
import {kujiKey} from './kuji-key';
import type {Item,State,Relation} from './types';
import type {Parsed} from './collector';
import {relationKey} from './relations';

// Only a confirmed photograph with the same bytes may create membership.
// New or changed photographs stay in the review queue; runtime has no AI service.
export async function recognizeLotPhoto(p:Parsed){
 const known=catalogue.photos.find(x=>listingKey(x.sourceUrl)===listingKey(p.offer.url)&&x.image===p.image);if(!known)return null;
 try{const r=await relayImage(p.image);if(!r.ok)return null;const digest=createHash('sha256').update(new Uint8Array(await r.arrayBuffer())).digest('hex');return digest===known.sha256?known:null;}catch{return null;}
}
export function recognizedLot(item:Item,photo:NonNullable<Awaited<ReturnType<typeof recognizeLotPhoto>>>):Item{
 return {...item,kind:'set',setMode:'lot',saleForm:'seller_lot',provisional:false,imageRole:'lot_photo',bucket:'normal',tags:[...new Set([...item.tags,'实拍已核对','卖家拼套'])].slice(0,50),evidence:[...item.evidence,{field:'图片确认成员',value:JSON.stringify({members:photo.members,sha256:photo.sha256,note:photo.note}),url:photo.sourceUrl,at:new Date().toISOString(),method:photo.method+'；录入时再次核对图片 SHA-256'}].slice(-150)};
}
export function lotImageRelations(state:State){
 const links:Relation[]=[],existing=new Set(state.relations.map(relationKey));
 for(const lot of state.items.filter(i=>i.kind==='set'&&i.imageRole==='lot_photo')){const evidence=lot.evidence.filter(e=>e.field==='图片确认成员').at(-1);if(!evidence)continue;try{const members=JSON.parse(evidence.value).members;if(!Array.isArray(members))continue;
  for(const m of members.slice(0,100)){const options=state.items.filter(i=>{const k=kujiKey(i);return i.id!==lot.id&&i.kind!=='set'&&!!k&&k.campaign===m.campaignId&&k.award===m.award&&!k.group&&k.variant==='slot:'+m.slot;});if(!options.length)continue;const member=canonicalItem(options),r:Relation={id:'lot-photo-'+lot.id+'-'+member.id,fromId:lot.id,toId:member.id,kind:'contains',quantity:Math.min(999,Math.max(1,Number(m.quantity)||1))},key=relationKey(r);if(existing.has(key)||state.prefs.dismissedRelations.includes(key))continue;existing.add(key);links.push(r);}
 }catch{/* Invalid or incomplete evidence cannot create links. */}}
 return links;
}
