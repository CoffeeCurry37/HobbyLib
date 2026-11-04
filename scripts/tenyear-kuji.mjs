import assert from 'node:assert/strict';
import {read,write,hash,cached,clean,targetRows} from './four-series-common.mjs';
const dir='research/series-evidence-20261104/tenyear-aj';
const wave=Number(process.argv[2]);assert.ok([1,2].includes(wave));
const order=read(dir+'/order.json'),config=order[wave===2?0:1],registry=read('lib/radar/kuji-catalogue.json');
const campaign=registry.campaigns.find(c=>c.id==='fate2014-'+wave), all=targetRows().filter(i=>i.groupId===config.groupId);
const norm=s=>clean(s||'').normalize('NFKC').toLowerCase().replace(/[\s‐–—―−-]/g,'');
const toText=b=>clean(b.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')).normalize('NFKC');
const cleanURL=u=>u?.includes('suruga-ya.jp/product/detail/')?u.split('?')[0]:u;
const facts=read(dir+'/grade-facts-'+wave+'.json'),catalogue=cached(facts.url),context=cached(facts.context);
const article=norm(toText(catalogue.body));
assert.ok(norm(toText(context.body)).includes(norm(facts.contextAnchor)));
const rosters=wave===2?read(dir+'/second-rosters.json'):read(dir+'/first-rosters.json');
for(const g of Object.values(facts.grades)) for(const anchor of g.anchors||[]) assert.ok(article.includes(norm(anchor)),anchor);
const rows=[];
for(const t of all){
 const base={itemId:t.id,groupId:t.groupId,title:t.title};
 const put=(status,more)=>rows.push({...base,status,...more});
 if(t.editorial||t.locked||t.manualFields?.length||t.summary){put('protected',{});continue}
 const title=norm(t.title),series=norm(campaign.name);
 if(!title.includes(series)){put('pending',{reason:'campaign-title-or-release-not-exact'});continue}
 const tail=title.replace(series,'');
 if(!tail&&t.id.startsWith('family-')){
  put('supported',{scope:'同期系列资料',source:context.source,second:catalogue.source.url,officialTitle:campaign.name,
   summary:facts.family});continue;
 }
 const grades=[...tail.matchAll(/ラストワン賞|[a-izs]賞/g)].map(m=>m[0]==='ラストワン賞'?m[0]:m[0].toUpperCase());
 if(grades.length!==1){put('pending',{reason:'award-not-unique'});continue}
 const award=grades[0],p=campaign.prizes.find(x=>x.award===award),f=facts.grades[award],key=award.replace('賞','');
 if(!p||!f){put('pending',{award,reason:'award-without-specific-source'});continue}
 const targetUrls=t.sourceUrls.map(cleanURL);
 const linked=p.sourceProducts.filter(v=>targetUrls.includes(cleanURL(v.url)) && norm(v.title).includes(norm(award)) && norm(v.title).includes(series));
 const set=tail.match(/全(\d+)種セット/), index=t.id.startsWith('kuji-group-'+campaign.id+'-')&&tail.includes('赏级档案');
 const roster=rosters[key], label=rosters[key]?.members||[], group=Boolean(index);
 let scope,member,ref;
 if(set){
   const full=linked.find(v=>v.full && norm(v.title).includes('全'+set[1]+'種セット'));
   if(+set[1]===p.count && full){
    scope='零售全款组合';member=p.title;ref=full.url;
   }
 }else if(group && norm(p.title).split('フィギュア')[0] && tail.includes(norm(p.title))){
   scope='奖级档案';member=p.title;
 }else{
   const localWords=tail.replace(norm(award),'').replace(/[「」]/g,'');
   const byTitle=p.members.filter(v=>localWords.includes(norm(v.name)));
   const direct=linked.filter(v=>!v.full);
   const slots=[...new Set(direct.map(v=>v.slot).filter(Number.isInteger))];
   const explicit=p.members.filter(m=>m.urls.some(u=>targetUrls.includes(cleanURL(u))));
   if(slots.length<=1 && explicit.length===1 && (!slots.length||slots[0]===explicit[0].slot)){
    const m=explicit[0];
    if(byTitle.some(v=>v.slot===m.slot) || direct.some(v=>norm(v.title).includes(norm(t.title))) || p.count===1){
     scope='同期奖级及留存商品号';member=m.name;ref=direct[0]?.url||m.urls[0];
    }
   }
   if(!scope && label.length){
    const name=label.filter(v=>localWords.includes(norm(v))).sort((a,b)=>norm(b).length-norm(a).length)[0];
    const exactShape=name&&(localWords===norm(name)||localWords.includes(norm(name)+'プレミアムアートグラス')||localWords.includes(norm(name)+'きゅんキャラ'));
    if(exactShape){scope='零售成员清单及完整款名';member=name;ref=roster.url;}
   }
   if(!scope&&wave===2&&award==='I賞'&&tail.includes('プロトタイプセイバー納刀')&&targetUrls.some(u=>u.includes('FIGURE-049131-R'))){
    scope='独立商品号及纳刀限定';member='セイバー（プロトタイプ／納刀）';ref='https://www.amiami.jp/top/detail/detail?gcode=FIGURE-049131-R';
   }
 }
 if(!scope){put('pending',{award,reason:'no-unique-member-or-package-binding',reviewedSources:[catalogue.source.url,p.sourceUrl]});continue}
 const lead=scope==='零售全款组合'?'零售记录合列了'+award+'「'+member+'」的全部 '+p.count+' 款。':scope==='奖级档案'?'本页汇总'+award+'「'+member+'」。':'本件对应'+award+'「'+member+'」。';
 const secondary=ref||f.second||p.sourceProducts.find(v=>!v.full)?.url||facts.context;
 put('supported',{scope,award,officialTitle:p.title,member,source:catalogue.source,second:secondary,contextSource:context.source.url,
  archivedRetail:linked.map(v=>({url:v.url,title:v.title,itemCode:v.id})),knownAt:registry.capturedAt,summary:lead+f.fact});
}
assert.equal(rows.length,config.candidates);write(dir+'/kuji-'+wave+'.json',{campaign:campaign.name,coverage:rows.length,source:catalogue.source,rows});
console.log(JSON.stringify({ready:rows.filter(r=>r.status==='supported').length,held:rows.filter(r=>r.status!=='supported').map(r=>[r.itemId,r.reason])}));
