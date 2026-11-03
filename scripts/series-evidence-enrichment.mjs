// Conservative field supplement: only an absent summary and two source facts.
import fs from 'node:fs';import crypto from 'node:crypto';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir='research/series-evidence-20261103';
const decode=s=>String(s||'').replaceAll('&amp;','&').replaceAll('&quot;','"').replace(/&(?:ldquo|rdquo);/g,'"').replaceAll('&nbsp;',' ');
const norm=s=>decode(s).normalize('NFKC').toLowerCase().replace(/[\s“”"]/g,'');
const detailCache=new Map();
const detailFor=m=>{if(!detailCache.has(m.sku))detailCache.set(m.sku,JSON.parse(fs.readFileSync(dir+'/details/'+m.sku+'.json')));return detailCache.get(m.sku);};
const events=new Map(JSON.parse(fs.readFileSync(dir+'/catalogue-summary.json')).catalogues.map(c=>[c.groupId,c.event]));
export function proposedSummary(match){
 const d=detailFor(match),event=events.get(match.groupId),name=match.officialTitle.replace(/\s*\/\s*Fate\/Grand Order.*$/,'').replace(/^【FGO Fes\.\s*20\d{2}】\s*/,'').replace(/^【大阪通販】\s*/,'').trim();
 let summary=`《${event}》相关的「${name}」。`;
 if(/単品[・\s]*[・]?ランダム封入/.test(name))summary+='此规格为随机单包，不能视为完整套装。';
 else if(/コンプリートセット/.test(name))summary+='此规格为官方完整套装，与随机单包分别记录。';
 else {
  const spec=d.specification||'',rawSize=spec.match(/サイズ[:：]\s*([^\n]+)/)?.[1]?.trim(),rawMaterial=spec.match(/(?:材質|素材)[:：]\s*([^\n]+)/)?.[1]?.trim();
  // A group's first size can belong to another character/component. Only a
  // single unqualified dimension is shared; omit variant/component tables.
  const size=rawSize&&/^(?:約)?(?:[AB][0-7]|[HWDΦφ0-9.×x\s()cm㎜]+)$/.test(rawSize.normalize('NFKC'))?rawSize:null;
  const material=rawMaterial&&rawMaterial.length<65&&!/[…:：]/.test(rawMaterial)?rawMaterial:null;
  if(size&&material)summary+=`规格为${size}；材质：${material}。`;
  else if(size)summary+=`规格为${size}。`;
  else if(material)summary+=`材质：${material}。`;
 }
 if(summary.length>500)throw Error('Summary exceeds reviewed field limit');
 return summary;
}
export function supplement(item,match,at){
 if(!item||item.id!==match.itemId)return {skip:'missing-target'};
 if(item.editorial||item.locked||item.archivedInto||item.origin==='doujin')return {skip:'protected-target'};
 if(item.summary)return {skip:'existing-summary-preserved'};
 // Binding is checked again on the fresh record before every write.
 if(norm(item.title)!==norm(match.title))return {skip:'target-title-changed'};
 const obs=(item.offers||[]).filter(o=>/^https:\/\/online\.aniplex\.co\.jp\//.test(o.url));
 if(!obs.length||obs.some(o=>o.url!==match.sourceUrl||(o.variant&&o.variant!==match.variantId)))return {skip:'official-source-key-changed-or-conflicting'};
 if((item.evidence?.length||0)>148)return {skip:'evidence-capacity-protected'};
 const d=detailFor(match);if(d.source.sha256!==match.sourceSha256)throw Error('Evidence changed after matching');
 const summary=proposedSummary(match);
 const facts=[{field:'官方商品身份',value:`${match.sku} / ${match.variantId||'single'} / ${match.officialTitle}; SHA-256 ${match.sourceSha256}`,url:match.sourceUrl,at:match.sourceAt,method:'官方同页商品号、规格编号与完整款式名对应；不代表图像或全资料已核实'},
 {field:'summary',value:summary,url:match.sourceUrl,at,method:'series-evidence-20261103：依据官方款式名及规格补齐空白简介；原文/人工资料保留'}];
 return {item:{...item,summary,evidence:[...item.evidence,...facts]}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/series-evidence-enrichment.mjs')){
 const s=JSON.parse(fs.readFileSync('work/v6/production-after.json')),byId=new Map(s.items.map(i=>[i.id,i])),rank=new Map(JSON.parse(fs.readFileSync(dir+'/queue-index.json')).groups.map((g,n)=>[g.id,n])),matches=JSON.parse(fs.readFileSync(dir+'/identity-matches.json')).matches.filter(m=>m.status==='official-identity-supported').sort((a,b)=>rank.get(a.groupId)-rank.get(b.groupId)||a.itemId.localeCompare(b.itemId)),at=new Date().toISOString(),changes=[],skipped=[];
 for(const m of matches){const old=byId.get(m.itemId),result=supplement(old,m,at);if(result.skip){skipped.push({id:m.itemId,reason:result.skip});continue;}changes.push({item:result.item,expectedVersion:hash(JSON.stringify(old)),match:m});}
 fs.writeFileSync('work/series-evidence-20261103/proposed-changes.json',JSON.stringify(changes));
 fs.writeFileSync(dir+'/proposed-supplements.json',JSON.stringify({at,state:'prepared-from-local-snapshot-not-applied',changes:changes.map(c=>({itemId:c.item.id,sourceUrl:c.match.sourceUrl,sku:c.match.sku,variantId:c.match.variantId,summary:c.item.summary,changedFields:['summary','evidence'],fullProductVerified:false})),skipped},null,2)+'\n');
 console.log(JSON.stringify({prepared:changes.length,skipped:skipped.length,sample:changes.slice(0,5).map(c=>({title:c.item.title,summary:c.item.summary}))}));
}

