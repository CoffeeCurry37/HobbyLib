import {read,clean,imageRecord,cached} from './series.mjs';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from '../pilot-workbench/common.mjs';
export function extractImages(c){return [...new Set([...c.body.matchAll(/(?:src|content|href|data-src)=["']([^"']+\.(?:jpg|png|webp)[^"']*)["']/g)].map(m=>new URL(m[1],c.url).href.replace(/^http:/,'https:')).filter(u=>!/(?:logo|icon|favicon|banner|btn|maintenance|\/media\/|no_photo)/i.test(u)))];}
export function enrichKnownImages(products,projection){
 const coverImages=[...products.flatMap(p=>p.images),...projection.items.map(p=>({url:p.facts.image})),...extractImages(read('work/pilot-300/source-cache/turas23.json')).map(url=>({url}))].filter(i=>i.url?.includes('dvs-cover.kodansha.co.jp'));
 const fes=['fes-kama','fes-asclepius','fes-louhi','fes-mat'].map(name=>read('work/pilot-300/source-cache/'+name+'.json'));
 const ext=read('work/pilot-300/source-cache/extella.json'),sw=read('work/pilot-300/source-cache/extella-switch.json'),dx=read('work/pilot-300/source-cache/artoria-dx.json');
 const gameImages=extractImages(ext),switchImages=extractImages(sw);
 for(const p of products){
  if(p.groupId==='wafer14'&&!p.images.length){const w=read('lib/radar/collection-catalogue.json').waferWaves.find(w=>+w.wave===14);p.images.push(imageRecord(w.images.at(-1),'官方同系列总图（不是该角色单卡特写）',w.url));}
  if(existsSync(resolve(ROOT,'work/pilot-v3/image-search-plan.json')))for(const spec of read('work/pilot-v3/image-search-plan.json').filter(s=>p.sampleIds.includes(s.sampleId)&&s.kind==='image')){if(cached(spec.url)?.status==='captured')p.images.push(imageRecord(spec.url,'店铺同一商品编号的目录图',spec.sourceUrl));}
  if(p.sampleIds.includes('P058'))p.images.push(imageRecord('https://www.fate-sn.com/news/SYS/CONTENTS/fd52db5a-cb44-4560-8d3a-9c0c78b25e17/w516','官方视觉指南封面','https://www.fate-sn.com/news/?article_id=58984'));
  if(p.sampleIds.includes('P062')){const c=cached('https://typemoon.com/news/2022/gvfuKG');if(c){const b=c.body.slice(c.body.indexOf('亜種二連聖杯戦争'));const u=b.match(/<img[^>]+src="([^"]+)"/)?.[1];if(u)p.images.push(imageRecord(new URL(u,c.url).href.replace(/^http:/,'https:'),'出版社小说第一卷封面',c.url));}}
  if(p.groupId==='turas'){const url=p.sources.find(u=>/kodansha.co.jp\/comic\/products\//.test(u)),id=url?.split('/').at(-1);if(id)for(const i of coverImages.filter(i=>i.url.includes('/'+id+'/')))p.images.push(imageRecord(i.url,'出版社单卷封面',url));}
  if(p.groupId==='fes2025'&&!p.images.some(i=>i.localPath)){const c=fes.find(c=>p.sources.some(u=>u.split('?')[0]===c.url.split('?')[0]));if(c){const urls=extractImages(c).filter(u=>u.includes('/items/title-H/fgo/'));const image=urls.find(u=>/\d{3}_00\.jpg/.test(u))||urls[0];if(image)p.images.push(imageRecord(image,/fes-[BC]-/.test(p.id)?'官方同系列总图（含多个款式）':'官方商品图',c.url));}}
  if(p.id==='sample-P020'){const u=p.sources.find(u=>/images.goodsmile.info/.test(u));if(u)p.images.push(imageRecord(u,'官方官店特典参考图',p.sources[0]));}
  const pattern={'extella-regular':/package_(?:ps4|psvita)_normal/,'extella-regalia':/package_(?:ps4|psvita)_special/,'extella-velber':/package_ps4psvita_special/}[p.id];if(pattern)p.images.push(...gameImages.filter(u=>pattern.test(u)).map(u=>imageRecord(u,'官方盒装版本图',ext.url)));
  if(p.id==='extella-limited')p.images.push(...switchImages.filter(u=>/limited_img_(?:l|front_l|back_l)\.jpg/.test(u)).map(u=>imageRecord(u,'官方Switch限定盒装',sw.url)));
  if(p.id==='sample-P017')p.images.push(...extractImages(dx).filter(u=>/\/large\//.test(u)).map(u=>imageRecord(u,'官方商品细节',dx.url)));
 }
}
