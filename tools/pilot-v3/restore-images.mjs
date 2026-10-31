// Generate a bounded restoration plan only; never repeat accepted product research.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from '../pilot-workbench/common.mjs';
import {permitted} from '../recognition/capture.mjs';
const model=JSON.parse(readFileSync(resolve(ROOT,'research/pilot-v3-20261030/catalogue-v3.json')));
const images=new Map();
for(const p of model.products)for(const i of p.images||[])if(i.status==='captured'&&i.contentHash){permitted(i.url);images.set(i.url,{id:'restore-image-'+images.size,kind:'image',url:i.url,expectedSha256:i.contentHash});}
const dir=resolve(ROOT,'work/pilot-v3');mkdirSync(dir,{recursive:true});
const plan=[...images.values()];if(plan.length>350)throw Error('Split restoration plan before exceeding request budget');
writeFileSync(resolve(dir,'restore-images.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({planned:plan.length,networkRequests:0,next:'node tools/recognition/capture.mjs work/pilot-v3/restore-images.json'}));
