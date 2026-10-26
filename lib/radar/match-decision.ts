import {createHash} from 'node:crypto';
import type {Item,MatchDecision} from './types';
import {evaluateProduct,IDENTITY_RULE_VERSION,offerKey,productIndex,sharedListing,canonicalItem,strongestProductMatches,sameProduct} from './identity';
import {normalizedCode,physicalBookCode,validGtin,explicitAgeRating} from './identity-facts';
import {assortmentCard} from './collection-facts';
import {kujiKey} from './kuji-key';

const stable=(v:unknown):unknown=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):v;
export const decisionHash=(v:unknown)=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
// No personal notes, ownership, preferences, images or prices enter identity evidence.
export function identityInput(i:Item){
 const fields=['title','aliases','category','majorClass','productType','productLine','wave','member','isbn','jan','publisher','brand','manufacturer','circle','artists','origin','ageRating','series','event','kind','saleForm','catalogueGroup','catalogueGroupType','catalogueKey','cardNumber','kuji','locked'] as const;
 return {...Object.fromEntries(fields.map(k=>[k,i[k]])),evidence:i.evidence.filter(e=>['category','来源分类','ageRating','人工整理','批量整理'].includes(e.field)).map(({field,value,url,method})=>({field,value,url,method})),offers:i.offers.map(o=>({source:o.source,url:o.url,sourceKey:offerKey(o)||null,productKey:o.productKey,variant:o.variant,listingTitle:o.listingTitle,jan:o.jan,isbn:o.isbn}))};
}
export function matchDecision(items:Item[],candidate:Item,index=productIndex(items)):MatchDecision{
 const result=evaluateProduct(items,candidate,index),inputFingerprint=decisionHash(identityInput(candidate));
 const observedAt=candidate.offers.map(o=>o.observedAt).filter(Boolean).sort().at(-1)||candidate.createdAt;
 const sourceKeys=[...new Set(candidate.offers.map(offerKey).filter(Boolean))].sort();
 const evidence=candidate.offers.map(o=>({kind:'listing',raw:o.url,value:offerKey(o)||'',source:o.source,url:o.url,scope:'listing',valid:!!offerKey(o)}));
 for(const field of ['isbn','jan'] as const)if(candidate[field])evidence.push({kind:field,raw:candidate[field],value:normalizedCode(candidate[field]),source:candidate.evidence.find(e=>e.field===field)?.method||'unattributed',url:candidate.evidence.find(e=>e.field===field)?.url||'',scope:field==='isbn'||physicalBookCode(candidate)===normalizedCode(candidate[field])?'physical-edition':kujiKey(candidate)||assortmentCard(candidate)?'assortment':'release',valid:field==='isbn'?!!physicalBookCode({...candidate,jan:''}):validGtin(candidate.jan)});
 if(candidate.origin==='doujin'&&candidate.ageRating)evidence.push({kind:'ageRating',raw:candidate.ageRating,value:explicitAgeRating(candidate)||candidate.ageRating,source:'classification',url:'',scope:explicitAgeRating(candidate)?'source-confirmed':'default-policy',valid:!!explicitAgeRating(candidate)});
 if(result.target)evidence.push({kind:'match-rule',raw:result.matchReason,value:result.reasonCodes[0],source:'rule-'+IDENTITY_RULE_VERSION,url:'',scope:'identity',valid:true});
 const confidenceTier=result.target?(sharedListing(result.target,candidate)?'listing':physicalBookCode(candidate)&&physicalBookCode(candidate)===physicalBookCode(result.target)?'identifier':'composite'):'insufficient';
 const body={inputFingerprint,rulesVersion:IDENTITY_RULE_VERSION,sourceKey:sourceKeys[0]||null,sourceKeys,status:result.status,targetItemId:result.target?.id,candidateIds:result.candidateIds,evidence,conflicts:result.conflicts,reasonCodes:result.reasonCodes,confidenceTier,observedAt};
 return {...body,confidenceTier:confidenceTier as MatchDecision['confidenceTier'],decisionId:decisionHash(body)};
}
// Frozen routing of rule 21, ONLY for offline/explicit shadow comparison. Its
// unsafe listing shortcut can never be used to write a product.
export function shadowDecision(items:Item[],candidate:Item,index=productIndex(items)){
 const active=index.lookup(candidate),listing=active.filter(i=>sharedListing(i,candidate));
 const matches=strongestProductMatches(candidate,active.filter(i=>sameProduct(i,candidate)));
 const oldTarget=listing.length?canonicalItem(listing):matches.length&&matches.every(i=>i.id===matches[0].id||sameProduct(i,matches[0]))?canonicalItem(matches):undefined;
 const decision=matchDecision(items,candidate,index);
 return {decision,baseline:'rule-21-routing-with-current-conflict-predicate',legacyTargetId:oldTarget?.id||null,changed:(oldTarget?.id||null)!==(decision.targetItemId||null)};
}
