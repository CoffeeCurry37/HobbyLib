import assert from 'node:assert/strict';
import {pub,priv,read,write,sources,targetRows,cached,clean} from './four-series-common.mjs';
const n=Number(process.argv[2]), key=n===2?'fate28':'fate27';
assert.ok(n===2||n===3);
const campaign=read('lib/radar/kuji-catalogue.json').campaigns.find(c=>c.id===key);
const {body,source}=cached(campaign.url);
const catalogue=[];
for(const section of body.split('<div class="itemColList">').slice(1)){
 const heading=clean(section.match(/<h4 class="name sp">([^<]+)<\/h4>/)?.[1]);
 const prize=campaign.prizes.find(p=>heading===p.award+' '+p.title);
 if(!prize)continue;
 const data=section.match(/<ul class="data">([\s\S]*?)<\/ul>/)?.[1]||'';
 const specifications=[...data.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>clean(m[1].replace(/<[^>]+>/g,'')));
 if(!specifications.length){
  const description=section.match(/<p class="detail">([\s\S]*?)<\/p>/)?.[1]||'';
  specifications.push(...description.split(/<br\s*\/?\s*>/i).map(x=>clean(x.replace(/<[^>]+>/g,''))).filter(x=>/^■(?:全|サイズ)/.test(x)));
 }
 const count=Number(specifications.join('').match(/全(\d+)種/)?.[1]) || (prize.award==='ラストワン賞'?1:null);
 assert.equal(count,prize.count);
 const images=[...new Set([...section.matchAll(/<a data-fancybox="" href="(https:\/\/assets\.1kuji\.com\/uploads\/product_item(?:_sub_image)?\/[^"]+)"/g)].map(m=>m[1]))];
 assert.ok(images.length);
 catalogue.push({award:prize.award,title:prize.title,count,specifications,images,source});
}
assert.equal(catalogue.length,campaign.prizes.length);
write(pub+'/prizes-'+n+'.json',{groupId:sources[n].groupId,name:campaign.name,source,awards:catalogue});
const awardRows=catalogue.filter(g=>g.count>1);
write(priv+'/images-'+n+'.json',awardRows.map(g=>({url:g.images[0],kind:'image',groupId:sources[n].groupId,award:g.award})));
const rows=targetRows().filter(i=>i.groupId===sources[n].groupId);
const urls=[...new Set(rows.flatMap(i=>i.sourceUrls).filter(u=>/^https:\/\/www\.suruga-ya\.jp\/product\/detail\/\d+/.test(u)).map(u=>u.split('?')[0]))];
write(priv+'/retail-'+n+'.json',urls.map(url=>({url,groupId:sources[n].groupId})));
console.log(catalogue.map(a=>[a.award,a.title,a.count,a.specifications]));
