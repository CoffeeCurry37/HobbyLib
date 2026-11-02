import {token,normal,cleanTitle,workOf,scopeOf} from './taxonomy.mjs';
export const memberName=p=>p.memberName||normal(p.title).match(/^([^「]+)「/)?.[1]?.replace(/\(ミニキャラ\)\s*(?:アクリルスタンド|缶バッジ)\s*$/,'').replace(/\s+Cafe\s*ver\.\s*アクリルカード\s*$/i,'').trim()||null;
export function gameEdition(p){let edition=p.identity.edition;const t=normal(p.title);if(/PORTABLE/i.test(t)&&!(/PORTABLE/i.test(edition||'')))edition='PORTABLE'+(edition&&edition!=='通常版'?' '+edition:/Best|ベスト/i.test(t)?' Best':'');else if(/限定版/.test(t)&&(!edition||edition==='通常版'))edition='限定版';return edition;}
export function gameKey(p){if(p.identity.major!=='游戏'||p.type!=='游戏软件'||p.mode!=='permanent')return null;const i=p.identity,edition=gameEdition(p);if(!edition)return null;return [workOf(p),edition,i.region||'JP',/下载|digital|download/i.test(i.medium||p.title)?'下载':'实体'].map(token).join('|');}
function comparableTitle(p){return token(cleanTitle(p.title).replace(/^(?:TVアニメ)?[『「]?Fate\s*\/\s*Grand\s*Order[』」]?/i,'FGO').replace(/^\[Fate\/strange Fake\]/,'Fate/strange Fake'));}
function compatible(p,q){const a=p.identity,b=q.identity;for(const k of ['work','edition','region','volume','wave','cardNumber','className','award','medium'])if(a[k]&&b[k]&&token(a[k])!==token(b[k]))return false;return true;}
export function sameProduct(p,q){
 if(p.mode!=='permanent'||q.mode!=='permanent'||!p.visible||!q.visible)return null;
 if(workOf(p)!==workOf(q)||scopeOf(p)!==scopeOf(q))return null;
 const g=gameKey(p);if(g&&g===gameKey(q))return 'same-game-edition-platform-variants';
 if(!compatible(p,q))return null;
 if(p.identityKey===q.identityKey)return 'same-canonical-key';
 if(p.identity.officialSku&&p.identity.officialSku===q.identity.officialSku)return 'same-official-sku';
 if(p.type!==q.type)return null;
 if(p.seriesKey&&p.seriesKey===q.seriesKey){
  if(p.identity.major==='书籍'&&p.identity.volume&&p.identity.volume===q.identity.volume)return 'same-publication-volume';
  if(['official-box','blind-pack'].includes(p.scope)&&p.identity.major!=='游戏')return 'same-line-and-package-scope';
  if(p.memberName&&q.memberName&&token(p.memberName)===token(q.memberName))return 'same-official-line-and-member';
 }
 if(comparableTitle(p)===comparableTitle(q)&&comparableTitle(p).length>8)return 'same-normalized-product-title';
 // Shared lineup images never establish identity alone, nor across conflicting edition/wave/character scopes.
 return null;
}
export function mergeProducts(products){const aliases={},log=[],result=[];
 for(const p of products){let q,reason;for(const other of result){const r=sameProduct(other,p);if(r){q=other;reason=r;break;}}if(!q){result.push(p);continue;}
  const before={id:q.id,sampleIds:[...q.sampleIds]},incoming={id:p.id,sampleIds:[...p.sampleIds]};aliases[p.id]=q.id;
  const union=(a,b,fn=x=>JSON.stringify(x))=>[...new Map([...a,...b].map(x=>[fn(x),x])).values()];
  q.sourceIdentities=union(q.sourceIdentities||[{identityKey:q.identityKey,identity:structuredClone(q.identity)}],p.sourceIdentities||[{identityKey:p.identityKey,identity:structuredClone(p.identity)}]);
  q.sampleIds=union(q.sampleIds,p.sampleIds);q.offers=union(q.offers,p.offers,x=>x.sampleId||JSON.stringify(x));q.sources=union(q.sources,p.sources);q.images=union(q.images,p.images,x=>x.url+JSON.stringify(x.crop||null));q.links=union(q.links,p.links);q.tags=union(q.tags,p.tags);q.characters=union(q.characters,p.characters);q.variants=union(q.variants,p.variants);q.eventMembership=union(q.eventMembership||[],p.eventMembership||[]);q.existingCatalogueRefs=union(q.existingCatalogueRefs||[],p.existingCatalogueRefs||[]);
  if(p.origin==='series-expansion-v5'||p.identity.officialSku){for(const key of ['title','summary','scope','manufacturer','releaseDate','specification','contents','boxContents','memberNames','bonusInformation','completion','seriesKey','seriesLabel','seriesParent','seriesBatch'])if(p[key]!=null)q[key]=p[key];q.identity={...q.identity,...Object.fromEntries(Object.entries(p.identity).filter(([,v])=>v!=null))};}
  log.push({target:before,incoming,reason,productionApplied:false});
 }
 for(const p of result){p.links=p.links.map(l=>({...l,id:aliases[l.id]||l.id})).filter(l=>l.id!==p.id);if(gameKey(p)){const identities=[p.identity,...(p.sourceIdentities||[]).map(x=>x.identity),...p.offers.map(o=>o.variantIdentity).filter(Boolean)];for(const i of identities)if(i.platform&&!p.variants.some(v=>v.platform===i.platform&&v.jan===i.jan))p.variants.push({platform:i.platform,jan:i.jan||null,region:i.region||'JP',medium:i.medium||'实体'});p.identity.platform=null;p.identity.jan=null;}}
 return {products:result,aliases,log};
}
