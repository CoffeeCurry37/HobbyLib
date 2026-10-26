import {extraMaterialMaster} from './catalog';
import type {Item,Relation,State} from './types';
const norm=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/type[ -]?moon/g,'').replace(/[「」『』【】“”"']/g,'').replace(/\s+/g,' ').trim();
const compact=(s:string)=>s.replace(/[^\p{L}\p{N}]/gu,'');
const grams=(s:string)=>new Set(Array.from({length:Math.max(0,s.length-1)},(_,i)=>s.slice(i,i+2)));
const numbers=(s:string)=>[...s.matchAll(/\d+/g)].map(x=>x[0]).join(',');
const bonusMarker=/(?:連動購入|購入|店舗|予約|入場者)?特典(?:のみ|単品|単体)?|bonus\s*only/;
function stem(item:Item){let s=norm(item.title);if(item.kind==='bonus')s=s.split(bonusMarker)[0];else s=s.replace(/(?:特典(?:付き|付属|欠|なし|無)|with bonus|without bonus).*$/,'');return compact(s.replace(/\((?:箱入|帯付|帯付き|中古|未開封)\)/g,''));}
function conflicts(a:Item,b:Item){const out:string[]=[];const at=norm(a.title),bt=norm(b.title);
 if(a.series&&b.series&&compact(a.series)!==compact(b.series))out.push('系列字段不同');
 const an=numbers(at.split(bonusMarker)[0]),bn=numbers(bt.split(bonusMarker)[0]);if(an&&bn&&an!==bn)out.push('卷号或标题年份不同');
 const ae=at.match(/初版|再版|復刻|限定版|通常版/)?.[0],be=bt.match(/初版|再版|復刻|限定版|通常版/)?.[0];if(ae&&be&&ae!==be)out.push('版本不同');
 if(a.circle&&b.circle&&a.circle!==b.circle)out.push('社团不同');
 return out;
}
export type Suggestion={id:string;title:string;reason:string;similarity:number;kind:Relation['kind'];fromId:string;toId:string;automatic:boolean;conflicts:string[]};
export const relationKey=(r:Pick<Relation,'fromId'|'toId'|'kind'>)=>`${r.kind}:${r.fromId}:${r.toId}`;
const bundledFamily=(bonus:Item)=>/Fate\s*\/\s*EXTRA\s+material\s+WADARCO\s+Illustrations/i.test(bonus.title);
export function suggestMatches(item:Item,items:Item[]):Suggestion[]{
 const title=compact(norm(item.title)),a=grams(title);
 const result=items.filter(x=>x.id!==item.id&&!!x.demo===!!item.demo).map(other=>{
  const b=grams(compact(norm(other.title))),overlap=[...a].filter(x=>b.has(x)).length;
  let similarity=2*overlap/Math.max(1,a.size+b.size);const issues=conflicts(item,other);
  const isBonus=(item.kind==='bonus')!==(other.kind==='bonus');const base=item.kind==='bonus'?other:item,bonus=item.kind==='bonus'?item:other;
  const st=stem(base),bt=stem(bonus);
  if(isBonus&&st.length>=8&&bt.length>=8){const sa=grams(st),sb=grams(bt);similarity=Math.max(similarity,.9*2*[...sa].filter(x=>sb.has(x)).length/Math.max(1,sa.size+sb.size));}
  // Auto-link only a unique explicit bonus whose complete parent title survives stripping.
  // Franchise-only matches, unknown base kinds, sets, and edition/volume gaps stay suggestions.
  const bundled=isBonus&&!!extraMaterialMaster(base.title)&&/Fate\s*\/\s*EXTRA\s+material\s+WADARCO\s+Illustrations/i.test(bonus.title);
  const exact=isBonus&&base.kind==='base'&&(bundled||st.length>=8&&st===bt&&bonusMarker.test(norm(bonus.title)));
  if(exact)similarity=Math.max(similarity,.98);
  const sameCode=!!item.isbn&&item.isbn===other.isbn;if(sameCode)similarity=Math.max(similarity,.9);
  const partial=isBonus&&st.length>=8&&bt.includes(st)&&bonusMarker.test(norm(bonus.title));
  if(partial)similarity=Math.max(similarity,.78);
  const reason=issues.length?`需核对：${issues.join('、')}`:exact?'特典标题明确指向完整本体名称；卷号和版本一致':sameCode?'ISBN 相同；仍需核对版本、成色和特典组合':isBonus?'本体与特典名称相近；需要确认所属版本':'标题相近，建议作为相关版本；不会自动合并';
  return{id:other.id,title:other.title,reason,similarity,kind:isBonus?'bonus' as const:'related' as const,fromId:isBonus?base.id:item.id,toId:isBonus?bonus.id:other.id,automatic:exact&&!issues.length,conflicts:issues};
 }).filter(x=>x.similarity>=.45).sort((a,b)=>b.similarity-a.similarity).slice(0,8);
 // Even equally titled listings from different stores may be different editions. Require one parent.
 for(const r of result)if(r.automatic){const bonus=items.find(x=>x.id===r.toId)!;const candidates=items.filter(x=>x.kind==='base'&&!!x.demo===!!bonus.demo&&(bundledFamily(bonus)?!!extraMaterialMaster(x.title):stem(x)===stem(bonus))&&!conflicts(x,bonus).length);if(candidates.length!==1){r.automatic=false;r.reason='同名本体候选不唯一，请确认具体版本';}}
 return result;
}
export function automaticRelations(state:Pick<State,'items'|'relations'|'prefs'>):Relation[]{
 if(!state.prefs.autoLink)return[];const out:Relation[]=[],parents=new Map<string,Item[]>(),extraParents:Item[]=[],linked=new Set(state.relations.filter(r=>r.kind==='bonus').map(r=>r.toId)),dismissed=new Set(state.prefs.dismissedRelations);
 for(const item of state.items)if(item.kind==='base'&&!item.provisional&&!item.demo){const key=stem(item);if(!parents.has(key))parents.set(key,[]);parents.get(key)!.push(item);if(extraMaterialMaster(item.title))extraParents.push(item);}
 for(const item of state.items)if(item.kind==='bonus'&&!item.provisional&&!item.demo&&!linked.has(item.id)){
  const bundled=bundledFamily(item),key=stem(item);if(!bundled&&(key.length<8||!bonusMarker.test(norm(item.title))))continue;
  const candidates=(bundled?extraParents:parents.get(key)||[]).filter(parent=>!conflicts(parent,item).length);if(candidates.length!==1)continue;
  const relation={id:'auto-'+crypto.randomUUID(),fromId:candidates[0].id,toId:item.id,kind:'bonus' as const,quantity:1};if(dismissed.has(relationKey(relation)))continue;out.push(relation);linked.add(item.id);
 }
 return out;
}
