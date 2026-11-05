import fs from 'node:fs';
import assert from 'node:assert/strict';
import {read,write,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261104/kyomaf',priv='work/series-evidence-20261104/kyomaf';
const bindings=read(priv+'/visual-reviewed.json').map(v=>{
 const plan=read(priv+'/'+v.year+'-images.json').filter(p=>p.itemId===v.itemId);
 const images=plan.map(p=>{
  const base='work/series-evidence-20261103/cache/'+hash(p.url),meta=read(base+'.json');
  assert.equal(meta.status,'captured');assert.equal(hash(fs.readFileSync(base+'.img')),meta.sha256);
  return {role:p.role,url:p.url,sha256:meta.sha256,at:meta.at};
 });
 assert.equal(images.length,2);
 return {...v,reviewedImage:images.find(i=>i.role==='retailer').url,images};
});
write(dir+'/visual-bindings.json',bindings);console.log(JSON.stringify({bindings:bindings.length}));

