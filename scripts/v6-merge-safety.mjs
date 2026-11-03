import assert from 'node:assert/strict';
export const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function safeMerge(state,pair,r){
 const from=state.items.find(i=>i.id===pair.fromId),to=state.items.find(i=>i.id===pair.toId);assert.ok(from&&to&&!from.archivedInto&&!to.archivedInto);
 if(from.origin==='doujin'||to.origin==='doujin')throw Error('doujin-excluded');
 const {manualField}=r.get('catalog');for(const k of new Set([...Object.keys(from),...Object.keys(to)]))if((manualField(from,k)||manualField(to,k))&&stable(from[k])!==stable(to[k]))throw Error('manual-field:'+k);
 if(from.quantity&&to.quantity)throw Error('two-owned-quantities');
 const out=r.get('maintenance').mergeProducts(state,from.id,to.id),snapshot=JSON.parse(out.archived.mergeSnapshot);
 assert.equal(stable(snapshot.target),stable(to));const archived={...out.archived};delete archived.archivedInto;delete archived.mergeSnapshot;assert.equal(stable(archived),stable(from));
 // The current offer is allowed to coalesce observations; both original item
 // records, all offer history and original relationship quantities stay in the
 // reversible merge archive. Never regard coalescing as a fresh stock check.
 const mapped=state.relations.map(e=>({...e,fromId:e.fromId===from.id?to.id:e.fromId,toId:e.toId===from.id?to.id:e.toId}));
 for(const e of mapped){if(e.fromId===e.toId)throw Error('self-relation');const matches=mapped.filter(x=>x.fromId===e.fromId&&x.toId===e.toId&&x.kind===e.kind);if(matches.some(x=>x.quantity!==e.quantity))throw Error('relationship-quantity-conflict');}
 for(const e of mapped)assert.ok(out.relations.some(x=>x.fromId===e.fromId&&x.toId===e.toId&&x.kind===e.kind&&x.quantity===e.quantity));
 const {currentEditorial,editorialBasis}=r.get('editorial');if(currentEditorial(to)&&(editorialBasis(out.merged)!==editorialBasis(to)||out.merged.image!==to.image))throw Error('accepted-target-facts-would-change');
 return {...out,from,to};
}
export function verifyMerge(before,actual,pair,r){const expected=safeMerge(before,pair,r),byId=new Map(actual.items.map(i=>[i.id,i])),a=byId.get(pair.fromId),b=byId.get(pair.toId);assert.equal(a.archivedInto,pair.toId);const snap=JSON.parse(a.mergeSnapshot);assert.equal(stable(snap.target),stable(expected.to));const original={...a};delete original.archivedInto;delete original.mergeSnapshot;assert.equal(stable(original),stable(expected.from));
 const stripTime=i=>({...i,evidence:i.evidence.map(e=>e.field==='合并商品'?{...e,at:''}:e)});assert.equal(stable(stripTime(b)),stable(stripTime(expected.merged)));assert.equal(stable(actual.relations.sort((x,y)=>x.id.localeCompare(y.id))),stable(expected.relations.sort((x,y)=>x.id.localeCompare(y.id))));return {archiveVerified:true,relations:actual.relations.length,offers:b.offers.length};}
