import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir='work/series-evidence-20261103',out='research/series-evidence-20261103',h=u=>crypto.createHash('sha256').update(u).digest('hex');
const clean=s=>s.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replace(/\s+/g,' ').trim();
const groups=JSON.parse(fs.readFileSync(out+'/queue-index.json')).groups;
const roots=JSON.parse(fs.readFileSync(dir+'/official-catalogues.json'));
const labels=['Servant Art Chronicle 最終再臨展','FGO Fes.2025','FGO Fes.2026','FGO展 星見の回廊','FGO Fes.2024','FGO Fes.2023','FGO Fes.2022'];
const catalogues=[],all=[];
for(let i=0;i<roots.length;i++){
 const root=roots[i],group=groups.find(g=>g.label===labels[i]),entries=[],sources=[];let expected;
 for(const page of [...JSON.parse(fs.readFileSync(dir+'/catalogue-pages.json')),...JSON.parse(fs.readFileSync(dir+'/more-pages.json'))].filter(x=>x.url.split('?')[0]===root.url)){
  const body=fs.readFileSync(dir+'/cache/'+h(page.url)+'.html','utf8'),meta=JSON.parse(fs.readFileSync(dir+'/cache/'+h(page.url)+'.json'));
  const count=Number(body.match(/(\d+)\s*件の結果/)?.[1]);assert.ok(count>0);if(expected!==undefined)assert.equal(count,expected);expected=count;sources.push({url:page.url,sha256:meta.sha256,at:meta.at});
  for(const m of body.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)){const b=m[0],href=b.match(/href="([^\"]+\.html)"/)?.[1],title=clean(b.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),img=b.match(/<img[^>]+src="([^"]+)"/)?.[1];assert.ok(href&&title&&img);const url=new URL(href,page.url).href;entries.push({groupId:group.id,event:group.label,sku:url.split('/').at(-1).replace('.html',''),title,url,image:new URL(img,page.url).href,imageRole:'official-catalogue-thumbnail-not-item-verified',catalogueUrl:root.url,cataloguePage:page.url,sourceSha256:meta.sha256});}
 }
 assert.equal(entries.length,expected);assert.equal(new Set(entries.map(e=>e.url)).size,expected);
 catalogues.push({groupId:group.id,event:group.label,root:root.referrer,url:root.url,expected,extracted:entries.length,completeCurrentRetailCatalogue:true,completeEventUniverse:false,localCoverage:group.activeSnapshotCount,sources});all.push(...entries);
}
fs.writeFileSync(out+'/official-catalogues.json',JSON.stringify({at:new Date().toISOString(),scope:'Current Aniplex catalogue membership only; does not cover all historical giveaways or other exhibitors.',catalogues,entries:all},null,2)+'\n');
for(const [name,indexes] of [['chronicle',[0]],['fes2025-2026',[1,2]],['remaining-events',[3,4,5,6]]]){const ids=new Set(indexes.map(i=>catalogues[i].groupId));const plan=[...new Map(all.filter(e=>ids.has(e.groupId)).map(e=>[e.url,{url:e.url,groupId:e.groupId}])).values()];for(let n=0;n<plan.length;n+=350)fs.writeFileSync(dir+'/details-'+name+'-'+(n/350+1)+'.json',JSON.stringify(plan.slice(n,n+350),null,2));}
console.log(JSON.stringify({catalogues:catalogues.map(({event,expected,localCoverage})=>({event,expected,localCoverage})),entries:all.length,uniqueUrls:new Set(all.map(e=>e.url)).size}));

