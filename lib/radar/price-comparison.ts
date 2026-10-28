import type {Item,Offer} from './types';
import {availableOffers} from './identity';
export function quoteComparison(item:Item,now=Date.now()){
 const current=availableOffers(item,now),groups=new Map<string,Offer[]>();
 for(const offer of current){
  const key=JSON.stringify([offer.priceKind||'unknown',item.saleForm||item.kind,offer.condition||'unknown',offer.bonus,offer.extras||[],offer.priceBasis||'unspecified']);
  if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(offer);
 }
 return {identityStatus:item.matchDecision?.status||(item.provisional?'unconfirmed':'legacy-unrated'),currency:'JPY',groups:[...groups.values()].map(offers=>({offers:offers.map(o=>({id:o.id,price:o.price,observedAt:o.observedAt,verifiedAt:o.verifiedAt,priceKind:o.priceKind||'unknown',condition:o.condition,bonus:o.bonus,extras:o.extras||[],priceBasis:o.priceBasis||'unspecified'})),lowestAsk:offers[0].priceKind==='ask'&&!item.provisional?Math.min(...offers.map(o=>o.price!)):null,saleScope:item.kind==='set'?'whole-set':'single-item',comparable:offers.every(o=>o.priceKind==='ask'&&o.priceBasis==='tax_included'&&!!o.condition&&o.bonus!=='unknown')&&!item.provisional})),unknownFees:['domesticShipping','proxyService','internationalShipping','applicableTaxes'],landedCost:null,exchangeRate:null,limitations:['JPY asking prices only, not completed sales or fair market value','Different condition/accessory/tax groups are not interchangeable','Auction bids and whole-set totals are not single-item fixed prices','Unknown fees are not zero']};
}
