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
 const set=/セット|まとめ|(?:全|[0-9]+)ロット|^ロット|一式|コンプ|[0-9]+点|[0-9]+個/.test(tail);
 const group=i.id.startsWith('kuji-group-')&&tail.includes('赏级档案');
 const officialPacket=a.title==='ステッカーセット'&&a.specifications.some(s=>s.includes('7枚セット'))&&tail.includes('ステッカーセット')&&(group||tail.endsWith('ステッカーセット(7枚組)')||tail.includes('ステッカーセット(7枚組)g賞'));
 const list=roster[a.award];
 const fullRoster=list?.members.length===a.count && list.sourceRole.includes('set-contents');
 const matchedFullSet=fullRoster && tail.includes('全'+a.count+'種セット') && tail.includes(normalize(a.title));
 const indexOfAward=i.id==='kuji-group-'+(n===2?'fate28':'fate27')+'-'+a.award.replace('賞','');
 const retailSet=i.sourceUrls.some(u=>u.includes('/product/detail/561618886')) && n===2 && a.award==='J賞';
 if(matchedFullSet && (indexOfAward || retailSet)){
  const scope=indexOfAward?'award-index-with-retail-set':'retailer-complete-assortment';
  const summary=(indexOfAward?'本档汇总':'这条零售组合收齐了')+a.award+'「'+a.title+'」的 '+a.count+' 款。万代按奖级公布这 '+a.count+' 款，骏河屋另列了全款组合的内容。';
  result.push({...row,status:'supported',scope,officialTitle:a.title,source:campaign.source,proof:scope,summary,
   secondary:{url:list.url,at:list.accessedAt,role:list.sourceRole,factSha256:hash(JSON.stringify(list.members)),member:'零售组合共 '+a.count+' 款'}});
  continue;
 }
 if((set&&!officialPacket) || (i.kind==='set'&&!group)){pending('set-or-lot-scope-requires-its-own-proof');continue}
 const cleaned=tail.replace(normalize(a.award),'');
 let scope, member, secondary;
 const completeTitle=cleaned.includes(normalize(a.title));
 if(group&&completeTitle){scope='award-index';}
 else if(!group&&a.count===1){
  const keywords=a.title.split(/\s+/).filter(w=>w!=='フィギュア');
  if(keywords.every(k=>cleaned.includes(normalize(k))) && (completeTitle||/フィギュア|ぬいジェニック|ぬいぐるみ|gracemaster/i.test(cleaned))){
   scope='official-single';member=a.title;
  }
 }else if(!group&&a.title.includes('岸波白野（男/女）')){
  const options=['男','女'].filter(g=>cleaned.includes(normalize(a.title.replace('男/女',g)).split('ぬいジェニック')[0])&&cleaned.includes('ぬいジェニック'));
  if(options.length===1){scope='official-labelled-choice';member=a.title.replace('男/女',options[0]);}
 }
 if(!scope&&!group&&roster[a.award]&&cleaned.includes(normalize(a.title))){
  let character=cleaned.replace(normalize(a.title),'');
  if(n===3&&a.award==='J賞') character=character.replace('きゅんキャラいらすとれーしょんず','');
  if(n===3&&a.award==='J賞') character=character.replace(/^【中古】キーホルダー/,'');
  const memberKey=s=>normalize(s).replaceAll('udk-バーゲスト','udkバーゲスト');
  const list=roster[a.award];
  const matched=list.members.filter(m=>memberKey(m)===memberKey(character));
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
 const summary=label+(officialPacket?'官方每份为七张贴纸组合。':'本奖级共 '+a.count+' 款。')+choice+sizeText;
 result.push({...row,status:'supported',scope,officialTitle:a.title,member:member||null,source:campaign.source,
  ...(secondary?{secondary}:{}),proof:scope,summary});
}
assert.equal(result.length,sources[n].snapshotItems);
const counts=Object.fromEntries([...Map.groupBy(result,r=>r.scope||r.reason||r.status)].map(([k,v])=>[k,v.length]));
write(pub+'/items-'+n+'.json',{series:campaign.name,source:campaign.source,counts,rows:result});
console.log(JSON.stringify(counts));
