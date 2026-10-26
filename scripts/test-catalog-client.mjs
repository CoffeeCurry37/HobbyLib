import assert from 'node:assert/strict';import {loadRadar} from './load-radar.mjs';
const radar=loadRadar(),{readCatalogue}=radar.get('catalog-client'),original=globalThis.fetch;
const meta=()=>({items:[],archived:[],relations:[],scans:[],notices:[],prefs:{identityMigrated:0},catalog:{counts:{main:2,doujin:1,archive:0},loaded:[]}});
let calls=[],seen=[],fail=false;
globalThis.fetch=async(url,options)=>{calls.push({url,options});assert.ok(!options.method||options.method==='GET','opening must never write');if(url.includes('catalogMeta'))return Response.json(meta());if(url.includes('doujin'))return Response.json({items:[{id:'d'}],next:null});if(url.endsWith('after='))return Response.json({items:[{id:'a'}],next:'a'});if(fail)throw Error('simulated page outage');return Response.json({items:[{id:'b'}],next:null});};
try{
 const state=await readCatalogue(['main','doujin'],()=>{},s=>seen.push(s));assert.equal(seen[0].items.length,1);assert.equal(seen[0].prefs.identityMigrated,0);assert.equal(seen[0].catalog.reading,true);assert.equal(state.items.length,3);assert.equal(state.catalog.reading,false);assert.deepEqual(state.catalog.loaded,['main','doujin']);assert.ok(calls.every(c=>c.url.startsWith('/api/radar?catalog')));
 fail=true;seen=[];await assert.rejects(readCatalogue(['main'],()=>{},s=>seen.push(s)),/simulated/);assert.equal(seen.at(-1).items.length,1);assert.equal(seen.at(-1).catalog.reading,false);assert.deepEqual(seen.at(-1).catalog.loaded,[]);
 globalThis.fetch=async url=>Response.json(url.includes('catalogMeta')?meta():{items:[],next:null});await assert.rejects(readCatalogue(),/未返回商品/);
 globalThis.fetch=async url=>Response.json(url.includes('catalogMeta')?meta():{items:[{id:'a'}],next:'a'});await assert.rejects(readCatalogue(),/分页没有前进/);
 console.log('PASS: incomplete migration loads immediately; no opening writes; progressive display; failed page preserves data; empty and stalled pages report an error.');
}finally{globalThis.fetch=original;radar.close();}
