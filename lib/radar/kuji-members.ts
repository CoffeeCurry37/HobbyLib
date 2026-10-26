import type {Item,Relation,State} from './types';
import {createItem} from './engine';
import {canonicalItem,productName} from './identity';
import {manualField} from './catalog';
import {KUJI_CAMPAIGNS,kujiKey,resolveKuji} from './kuji-key';
import {repairClassification} from './classification';
import {relationKey} from './relations';

export function inferKujiMembers(state:State,includeAll=false){
 const items:Item[]=[],relations:Relation[]=[],byPrize=new Map<string,Item[]>(),active=new Set<string>(),existing=new Set(state.relations.map(relationKey));
 for(const i of state.items){if(i.archivedInto||i.demo)continue;const k=kujiKey(i);if(!k?.known)continue;active.add(k.campaign);const key=k.campaign+':'+k.award;let list=byPrize.get(key);if(!list)byPrize.set(key,list=[]);list.push(i);}
 const add=(item:Item)=>{items.push(item);};
 for(const c of KUJI_CAMPAIGNS){if(!includeAll&&!active.has(c.id))continue;
  for(const p of c.prizes){
   const options=byPrize.get(c.id+':'+p.award)||[];
   const full=options.filter(i=>kujiKey(i)?.group),existingGroup=full.length?canonicalItem(full):undefined;
   const title=c.name+' '+p.award+' '+p.title+(p.count>1?' 全'+p.count+'種セット':' 赏级档案');
   const imageNote=p.imageRole==='complete_award_set'?'图片为全赏套图':p.imageRole==='single_prize_variant'||p.count===1?'图片为已确认单款':'图片为赏级参考图；不能据此推断全部单款';
   const description=[`赏级目录：${p.award} ${p.title}。${p.count?'共 '+p.count+' 款。':'官网未标示款数。'}${p.packPieces>1?'每款 '+p.packPieces+' 件，以原发行包为一个成员。':''}`,imageNote+'。抽奖单次价格不记为商品定价。',c.partial?'官网当前仅公开部分赏级；未公开内容保持待补。':'',('description' in p?p.description:''),`来源：${p.sourceUrl}`].filter(Boolean).join('\n');
   let group:Item=existingGroup?{...existingGroup}:createItem(title,description,undefined,state.prefs,p.image);
   group.id=existingGroup?.id||'kuji-group-'+c.id+'-'+p.award.replace('賞','').replace('ラストワン','lastone');
   group.kuji={campaignId:c.id,campaign:c.name,award:p.award,count:p.count,catalogueGroup:true};group.kind='set';group.setMode='permanent';group.bucket='normal';group.provisional=false;
   if(!manualField(group,'category'))group.category=p.category;
   if(!manualField(group,'image')){group.image=p.image;group.images=p.images;group.imageRole=p.imageRole==='complete_award_set'||p.count===1?'product':'award_reference';}
   if(!manualField(group,'description')&&!group.description.includes('赏级目录：'))group.description=(group.description+'\n'+description).trim().slice(0,16000);
   if(!group.releaseDate&&!manualField(group,'releaseDate'))group.releaseDate=c.releaseDate;
   if(!group.year)group.year=c.releaseDate.slice(0,4);
   group.tags=[...new Set([...group.tags,'一番赏',p.award,'赏级档案'])].slice(0,50);
   if(!group.evidence.some(e=>e.field==='赏级目录'&&e.url===p.sourceUrl))group.evidence=[...group.evidence,{field:'赏级目录',value:JSON.stringify({campaign:c.name,award:p.award,variants:p.count||null,packPieces:p.packPieces,imageRole:p.imageRole,partial:c.partial}),url:p.sourceUrl,at:new Date().toISOString(),method:'逐赏核验商品页和发行目录；未公开款式不编造名称'}].slice(-150);
   group=repairClassification(group);
   if(!existingGroup||JSON.stringify(group)!==JSON.stringify(existingGroup))add(group);
   const members=options.filter(i=>!kujiKey(i)?.group&&i.kind!=='set');
   for(const m of p.members){
    const candidates=members.filter(i=>kujiKey(i)?.variant==='slot:'+m.slot||p.count===1||productName(i.title).includes(productName(m.name)));
    let member=candidates.length?canonicalItem(candidates):undefined;
    if(!member){member=createItem(m.name+' 「'+c.name+'」 '+p.award,'来源明确列出的单款。库存、拥有状态和单件报价待核对。',undefined,state.prefs,m.image);member.id='kuji-member-'+c.id+'-'+p.award.replace('賞','').replace('ラストワン','lastone')+'-'+m.slot;member.kuji={campaignId:c.id,campaign:c.name,award:p.award,count:p.count,slot:m.slot};member.kind='base';member.category=p.category;member.origin='commercial';member.releaseDate=c.releaseDate;member.year=c.releaseDate.slice(0,4);member.inferredMember=true;member.bucket='normal';member.evidence=[{field:'套装成员',value:m.name,url:m.urls[0]||p.sourceUrl,at:new Date().toISOString(),method:'发行目录或全赏商品页明确列出的款式；不推定拥有、库存或单件价'}];
     if(!member.image&&p.image){member.image=p.image;member.imageRole='award_reference';member.evidence.push({field:'图片范围',value:'赏级参考图；未确认该款独立图片',url:p.sourceUrl,at:new Date().toISOString(),method:'参考图片明确标示，不冒充单款照片'});}
     member=repairClassification(member);add(member);members.push(member);
    }
   }
   for(const member of members){const r:Relation={id:'kuji-link-'+group.id+'-'+member.id,fromId:group.id,toId:member.id,kind:'contains',quantity:1},key=relationKey(r);if(existing.has(key)||state.prefs.dismissedRelations.includes(key))continue;relations.push(r);existing.add(key);}
  }
 }
 return {items,relations};
}
