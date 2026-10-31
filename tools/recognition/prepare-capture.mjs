import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,sha} from '../pilot-workbench/common.mjs';
const read=p=>JSON.parse(readFileSync(resolve(ROOT,p),'utf8'));
const plan=[];
for(const n of [5,6])plan.push({id:'wafer'+n+'-retailer-search',url:'https://www.suruga-ya.jp/search?category=&search_word='+encodeURIComponent('Fate/Grand Order ウエハース'+n)+'&ck=true'});
const samples=read('work/pilot-300/samples.json').filter(s=>s.split==='development');
for(const s of samples){if(['P015','P026','P028'].includes(s.id))continue;for(const [i,url]of [...new Set([s.raw.image,...(s.raw.images||[])].filter(Boolean))].entries())plan.push({id:s.id+'-image-'+i,url,kind:'image',sampleId:s.id});}
const url='https://typemoon.com/news/2025/7l_yus',m=read('work/pilot-v3/source-cache/'+sha(url)+'.json');
for(const [i,a]of [...m.body.matchAll(/<img[^>]+src="(http[^\"]+)"/g)].entries()){if(a[1].includes('cache.typemoon.com/images/'))plan.push({id:'material-cover-'+i,url:a[1].replace(/^http:/,'https:'),kind:'image'});}
for(const name of ['extella','extella-link','extella-switch','wafer5','wafer6']){const c=read('work/pilot-300/source-cache/'+name+'.json');for(const [i,a]of [...c.body.matchAll(/(?:src|href)="([^\"]+\.(?:jpg|png)(?:\?[^\"]*)?)"/g)].entries()){const url=new URL(a[1],c.url).href;if(/package_|normal_(ps4|vita|switch)|special_(ps4|vita)_image|published\/bnc_files\/product/.test(url))plan.push({id:name+'-official-'+i,url,kind:'image'});}}
for(const key of ['ps4','swich'])plan.push({id:'celebration-'+key,url:'https://celebration.fate-extella.jp/images/top/prize-'+key+'.jpg',kind:'image'});
const unique=[...new Map(plan.map(p=>[p.url,p])).values()];writeFileSync(resolve(ROOT,'work/pilot-v3/images-plan.json'),JSON.stringify(unique,null,2));console.log(JSON.stringify({requests:unique.length,images:unique.filter(x=>x.kind==='image').length}));
