import crypto from 'node:crypto';
export function officialPlan(items,prefs,r){
 const {officialReleases,officialRelease,applyOfficialRelease,babyloniaVolume,mediaFormat}=r.get('official-v6'),{createItem}=r.get('engine'),{manualField}=r.get('catalog');
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,28),splits=[],unresolved=[],out=[];
 const key=u=>String(u||'').replace('/product/other/','/product/detail/');
 const format=(i,o)=>{const text=[o.listingTitle||'',...i.evidence.filter(e=>['category','来源分类'].includes(e.field)&&key(e.url)===key(o.url)).map(e=>e.value)].join(' '),bd=/Blu[- ]?ray|ブルーレイ|\bBD\b/i.test(text),dvd=/DVD/i.test(text);return bd===dvd?'':bd?'Blu-ray':'DVD';};
 for(const i of items){const n=babyloniaVolume(i);if(!n||mediaFormat(i)||!i.offers.length){out.push(applyOfficialRelease(i));continue;}
  const groups=new Map();for(const o of i.offers){const f=format(i,o);if(!groups.has(f))groups.set(f,[]);groups.get(f).push(o);}
  if(groups.size<2){out.push(i);continue;}
  if(groups.has('')||i.ownership!=='unknown'||i.quantity||i.notes||i.rating||i.watchlisted||i.locked||i.editorial){unresolved.push({id:i.id,reason:'mixed-media-needs-personal-or-source-review'});out.push(i);continue;}
  const primary=format(i,i.offers[0]);for(const [f,offers]of groups){const release=officialReleases.find(x=>x.family==='babylonia-tv'&&x.volume===n&&x.format===f);if(!release)throw Error('No official split target');
   const id=f===primary?i.id:'v6-media-'+hash(i.id+':'+f),evidence=i.evidence.filter(e=>!['category','来源分类'].includes(e.field)||offers.some(o=>key(o.url)===key(e.url)));
   let next={...i,id,offers,category:release.category,evidence,aliases:f===primary?i.aliases:[i.title],...(f===primary?{}:{createdAt:new Date().toISOString(),ownership:'unknown',quantity:0,priority:0,rating:null,notes:'',watchlisted:false,locked:false})};delete next.matchDecision;delete next.identityReview;
   next=applyOfficialRelease(next,release);out.push(next);splits.push({fromId:i.id,toId:id,format:f,offerKeys:offers.map(o=>o.url)});
  }
 }
 const existing=new Set(out.map(i=>officialRelease(i)?.key).filter(Boolean));
 for(const release of officialReleases)if(!existing.has(release.key)){const base=createItem(release.title,'',undefined,prefs),next=applyOfficialRelease({...base,id:'v6-release-'+hash(release.key),kind:'base',origin:'commercial',category:release.category,offers:[],ownership:'unknown',quantity:0},release);out.push(next);}
 return {items:out,splits,unresolved};
}
