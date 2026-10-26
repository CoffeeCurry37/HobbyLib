import{readFileSync,writeFileSync}from'node:fs';
import{loadRadar}from'./load-radar.mjs';
const[oldPath,newPath]=process.argv.slice(2),old=JSON.parse(readFileSync(oldPath)),modern=JSON.parse(readFileSync(newPath)),radar=loadRadar(),{cleanProductTitle}=radar.get('catalog');
const normal=s=>s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
const variant=t=>cleanProductTitle(t).split('「一番くじ')[0].replace(/^(?:トレーディングフィギュア|フィギュア|ポスター\([^)]*\)|カレンダー|グラス\([^)]*\)|ブックカバー・しおり\([^)]*\)|バッジ・ピンズ\([^)]*\)|ストラップ\([^)]*\)|ポストカード\([^)]*\))\s*/,'').replace(/^\[(?:ランク\s*[A-D]|破損品|箱欠品)[^\]]*\]\s*/,'').trim();
const out=[];
for(const e of old.events){const campaign={id:'fate2014-'+e.part,name:e.title,url:e.releaseDateSources.find(u=>u.includes('suruga-ya.jp'))||e.releaseDateSources[0],releaseDate:e.releaseDate,partial:false,prizes:[]};
 for(const p of old.prizes.filter(p=>p.part===e.part)){
  const singles=p.sourceProducts.filter(s=>s.id!==p.sourceSetId&&!/^全\d+種セット/.test(variant(s.title))),seen=new Set(),unique=singles.filter(s=>{const key=normal(variant(s.title));if(seen.has(key))return false;seen.add(key);return true;});
  const names=p.variantCount===1?[p.name]:p.setMembers.length?p.setMembers:unique.map(s=>variant(s.title));
  if(!names.length&&p.variantCount===1)names.push(p.name);
  const members=names.map((name,n)=>{const key=normal(name.replace(/\(Fate\/[^)]*\)/g,'')),matches=p.variantCount===1?singles:singles.filter(s=>normal(variant(s.title)).includes(key));const source=matches[0];return {slot:n+1,name,image:source?.imageUrl||(p.variantCount===1?p.imageUrl:''),urls:matches.map(s=>s.url)};});
  const mapped=new Set(members.flatMap(m=>m.urls));const unmatched=unique.filter(s=>!mapped.has(s.url));
  if(unmatched.length)console.log(JSON.stringify({campaign:campaign.id,award:p.award,unmatched:unmatched.map(s=>({id:s.id,title:variant(s.title)}))}));
  campaign.prizes.push({award:p.award,title:p.name,count:p.variantCount,packPieces:p.packPieceCount||1,category:p.catalogueCategory==='books'?'画集':p.catalogueCategory==='figures'?'フィギュア':'グッズ',image:p.imageUrl,images:[p.imageUrl,...p.gallery.map(g=>g.url)].filter((u,n,a)=>u&&a.indexOf(u)===n).slice(0,12),imageRole:p.imageRole,sourceUrl:p.countSourceUrls[0]||campaign.url,members,sourceProducts:p.sourceProducts.map(s=>({id:s.id,url:s.url,title:s.title,image:s.imageUrl,category:s.productCategory,full:s.id===p.sourceSetId,slot:members.find(m=>m.urls.includes(s.url))?.slot}))});
 }
 out.push(campaign);
}
for(const e of modern.campaigns)out.push({id:e.id,name:e.name,url:e.url,releaseDate:e.releaseDate.replaceAll('/','-'),partial:e.id==='fate29',prizes:e.prizes.map(p=>({award:p.award,title:p.title,count:p.count,packPieces:1,category:/フィギュア/.test(p.title)?'フィギュア':'グッズ',image:p.images[0]||'',images:p.images.slice(0,12),imageRole:'award_reference',sourceUrl:e.url,description:p.description,members:p.count===1||p.award==='ラストワン賞'?[{slot:1,name:p.title,image:p.images[0]||'',urls:[]}]:p.count===2&&/岸波白野[（(]男\/女[)）]/.test(p.title)?['男','女'].map((gender,n)=>({slot:n+1,name:p.title.replace(/[（(]男\/女[)）]/,'（'+gender+'）'),image:'',urls:[]})):[],sourceProducts:[]}))});
writeFileSync('lib/radar/kuji-catalogue.json',JSON.stringify({version:1,capturedAt:new Date().toISOString(),campaigns:out},null,2));console.log(JSON.stringify({campaigns:out.length,awards:out.reduce((n,e)=>n+e.prizes.length,0),knownMembers:out.flatMap(e=>e.prizes).reduce((n,p)=>n+p.members.length,0)}));radar.close();
