import fs from 'node:fs';import crypto from 'node:crypto';import {gzipSync,gunzipSync} from 'node:zlib';import assert from 'node:assert/strict';
const dir='research/series-evidence-20261103',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--unpack')){
 const bundle=JSON.parse(gunzipSync(fs.readFileSync(dir+'/evidence-bundle.json.gz')));for(const [name,data]of Object.entries(bundle.files)){assert.ok(/^(?:details\/item[A-Za-z0-9]+\.json|identity-matches\.json|unresolved\.json|proposed-supplements\.json)$/.test(name));fs.mkdirSync(dir+'/details',{recursive:true});fs.writeFileSync(dir+'/'+name,JSON.stringify(data,null,2)+'\n');}console.log(JSON.stringify({unpacked:Object.keys(bundle.files).length}));
}else{
 const files={};for(const n of fs.readdirSync(dir+'/details').filter(n=>/^item[A-Za-z0-9]+\.json$/.test(n)))files['details/'+n]=JSON.parse(fs.readFileSync(dir+'/details/'+n));for(const n of ['identity-matches.json','unresolved.json','proposed-supplements.json'])files[n]=JSON.parse(fs.readFileSync(dir+'/'+n));
 function check(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){assert.ok(!['notes','ownership','quantity','priority','rating','offers','prefs','token','dispatch','authorization','ownerId'].includes(k),'Private field in public bundle: '+k);check(x);}}check(files);
 const content=Buffer.from(JSON.stringify({version:1,scope:'Public official catalogue facts, proposed non-personal fields, and opaque product IDs only.',files})),gz=gzipSync(content,{level:9});assert.deepEqual(gunzipSync(gz),content);fs.writeFileSync(dir+'/evidence-bundle.json.gz',gz);
 const summary={at:new Date().toISOString(),files:Object.keys(files).length,uncompressedBytes:content.length,compressedBytes:gz.length,sha256:hash(gz),contentSha256:hash(content),privateFieldsPresent:false};fs.writeFileSync(dir+'/bundle-manifest.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
}

