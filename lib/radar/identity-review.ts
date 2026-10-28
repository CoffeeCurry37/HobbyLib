import type {Item,MatchDecision} from './types';
import {identityInput,decisionHash} from './match-decision';
import {offerKey,updateOffer,isIdentityReview} from './identity';

// A review item is an observation case, never an authoritative identity target.
export function listingReview(items:Item[],candidate:Item){
 const keys=new Set(candidate.offers.map(offerKey).filter(Boolean));
 return items.filter(i=>!i.archivedInto&&isIdentityReview(i)&&i.offers.some(o=>keys.has(offerKey(o)))).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))[0];
}
export function retainReview(previous:Item|undefined,candidate:Item,decision:MatchDecision):Item{
 const observation={id:decisionHash({identity:identityInput(candidate),offers:candidate.offers}),identity:identityInput(candidate),offers:structuredClone(candidate.offers),decision};
 const observations=[...(previous?.identityReview?.observations||[])];
 // Upgrade legacy quarantine in place without throwing away its first evidence.
 if(previous&&!previous.identityReview&&previous.matchDecision)observations.push({id:decisionHash({identity:identityInput(previous),offers:previous.offers}),identity:identityInput(previous),offers:structuredClone(previous.offers),decision:previous.matchDecision});
 if(!observations.some(o=>o.id===observation.id))observations.push(observation);
 const offers=[...(previous?.offers||[])];for(const incoming of candidate.offers){const n=offers.findIndex(o=>offerKey(incoming)?offerKey(o)===offerKey(incoming):o.source===incoming.source&&o.id===incoming.id&&o.url===incoming.url);if(n<0)offers.push(incoming);else offers[n]=updateOffer(offers[n],incoming);}
 return {...(previous||candidate),id:previous?.id||'review-'+decisionHash(decision.sourceKey||identityInput(candidate)).slice(0,32),provisional:true,review:true,offers,matchDecision:decision,identityReview:{status:'open',sourceKeys:[...new Set([...(previous?.identityReview?.sourceKeys||[]),...decision.sourceKeys])],observations,resolutions:previous?.identityReview?.resolutions||[]}};
}
