import assert from 'node:assert/strict';
import {pub,read,write,sources,targetRows,hash} from './four-series-common.mjs';
const n=Number(process.argv[2]);
assert.ok(n===2||n===3);
const campaign=read(pub+'/prizes-'+n+'.json');
const roster=read(pub+'/retailer-'+n+'.json');
const normalize=s=>s.normalize('NFKC').replace(/[\s~〜～「」]/g,'').replaceAll('〖','【').replaceAll('〗','】').replaceAll('アルターエゴ/','エゴ/').toLowerCase();
const campaignName=normalize(campaign.name);
const awards=new Map(campaign.awards.map(a=>[a.award,a]));
const result=[];
for(const i of targetRows().filter(r=>r.groupId===sources[n].groupId)){
 const row={itemId:i.id,groupId:i.groupId,title:i.title};
 const pending=reason=>result.push({...row,status:'pending',reason});
 if(i.editorial||i.manualFields?.length||i.locked||i.summary){result.push({...row,status:'protected'});continue}
 const title=normalize(i.title);
 if(!title.includes(campaignName)){pending('target-series-text-not-exact');continue}
 const tail=title.replace(campaignName,'');
 if(!tail && i.id.startsWith('family-')){
  result.push({...row,status:'supported',scope:'campaign-index',source:campaign.source,officialTitle:campaign.name,
   proof:'official-campaign-index',summary:'本记录汇集「'+campaign.name+'」的官方奖项，普通奖和最后一抽奖分别列出。'});continue;
 }
 const grades=[...tail.matchAll(/ラストワン賞|[a-z]賞/g)].map(m=>m[0]==='ラストワン賞'?m[0]:m[0].toUpperCase());
 if(grades.length!==1 || !awards.has(grades[0])){pending('award-not-unique');continue}
 const a=awards.get(grades[0]);row.award=a.award;row.awardSource=campaign.source.url;row.officialAwardTitle=a.title;
 const set=/セット|まとめ|ロット|一式|コンプ|[0-9]+点|[0-9]+個/.test(tail);
 const group=i.id.startsWith('kuji-group-')&&tail.includes('赏级档案');
 if(set || (i.kind==='set'&&!group)){pending('set-or-lot-scope-requires-its-own-proof');continue}
 const cleaned=tail.replace(normalize(a.award),'');
 let scope, member, secondary;
 const completeTitle=cleaned.includes(normalize(a.title));
 if(group&&completeTitle){scope='award-index';}
 else if(!group&&a.count===1){
  const keywords=a.title.split(/\s+/).filter(w=>w!=='フィギュア');
  if(keywords.every(k=>cleaned.includes(normalize(k))) && (completeTitle||/フィギュア|ぬいジェニック|gracemaster/i.test(cleaned))){
   scope='official-single';member=a.title;
  }
 }else if(!group&&a.title.includes('岸波白野（男/女）')){
  const options=['男','女'].filter(g=>cleaned.includes(normalize(a.title.replace('男/女',g)).split('ぬいジェニック')[0])&&cleaned.includes('ぬいジェニック'));
  if(options.length===1){scope='official-labelled-choice';member=a.title.replace('男/女',options[0]);}
 }
 if(!scope&&!group&&roster[a.award]&&cleaned.includes(normalize(a.title))){
  const character=cleaned.replace(normalize(a.title),'');
  const list=roster[a.award];
  const matched=list.members.filter(m=>normalize(m)===character);
  if(matched.length===1){
   scope='official-award-retailer-member';member=matched[0];secondary={url:list.url,at:list.accessedAt,role:list.sourceRole,
    factSha256:hash(JSON.stringify(list.members)),member};
  }
 }
 if(!scope){pending('award-confirmed-member-or-edition-needs-separate-proof');continue}
 const size=a.specifications.find(s=>s.includes('サイズ'))?.replace(/^■サイズ[：:]\s*/,'');
 const sizeText=size?'官网标注的尺寸为「'+size+'」。':'';
 const choice=a.specifications.join('').includes('選べない')?'领取时不能自选款式。':a.specifications.join('').includes('選べる')?'可选择款式。':'';
 const label=scope==='award-index'?'本记录为「'+a.award+' '+a.title+'」的奖级档案。':scope==='official-award-retailer-member'?'「'+member+'」是'+a.award+'「'+a.title+'」中的一款。':'本件为'+a.award+'「'+member+'」。';
 const summary=label+'本奖级共 '+a.count+' 款。'+choice+sizeText;
 result.push({...row,status:'supported',scope,officialTitle:a.title,member:member||null,source:campaign.source,
  ...(secondary?{secondary}:{}),proof:scope,summary});
}
assert.equal(result.length,sources[n].snapshotItems);
const counts=Object.fromEntries([...Map.groupBy(result,r=>r.scope||r.reason||r.status)].map(([k,v])=>[k,v.length]));
write(pub+'/items-'+n+'.json',{series:campaign.name,source:campaign.source,counts,rows:result});
console.log(JSON.stringify(counts));
