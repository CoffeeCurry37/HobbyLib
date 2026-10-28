import type {Offer} from './types';
// Event watermark lives with the offer, surviving notification-window truncation,
// read/delete operations and the existing JSON backup format. No external delivery.
export function offerEvent(previous:Offer|undefined,next:Offer){
 if(previous&&Date.parse(next.observedAt)<=Date.parse(previous.observedAt))return null;
 if(next.availability!=='available')return null;
 if(!previous)return 'new_listing' as const;
 if(!previous.verifiedAt&&next.verifiedAt)return previous.lastEvent?.kind==='restock'?'restock' as const:'new_listing' as const;
 if(previous.availability==='sold')return 'restock' as const;
 if(previous.availability==='unknown')return 'new_listing' as const;
 if(previous.price!==null&&next.price!==null&&next.price<previous.price&&previous.priceKind===next.priceKind&&previous.priceBasis===next.priceBasis)return 'price_drop' as const;
 return null;
}
export function recordOfferEvent(previous:Offer|undefined,next:Offer):Offer{
 const kind=offerEvent(previous,next),changed=!!kind||!previous||previous.price!==next.price||previous.availability!==next.availability;
 const sequence=(previous?.eventSequence||0)+(changed?1:0);
 return {...next,eventSequence:sequence,lastEvent:kind?{kind,at:next.observedAt,sequence}:previous?.lastEvent};
}
export const eventKey=(itemId:string,offer:Offer)=>offer.lastEvent?['market-v1',itemId,offer.source,offer.id,offer.lastEvent.sequence,offer.lastEvent.kind].join(':'):null;
