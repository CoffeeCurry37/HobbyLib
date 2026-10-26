import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../standalone/sqlite';
import {createScheduler} from '../standalone/scheduler';
import {withDatabase,stateFor,savePrefs} from '../lib/radar/store';
import {postAction,getStateResponse} from '../lib/radar/service';
import {DEFAULT_PREFS} from '../lib/radar/types';

const root=mkdtempSync(join(tmpdir(),'radar-integration-'));const filename=join(root,'radar.sqlite');let database=openDatabase(filename);
const origin='http://localhost:8080';const source='https://order.mandarake.co.jp/order/listPage/list?keyword=test';
const action=async(body:any)=>withDatabase(database,async()=>{const r=await postAction(new Request(origin+'/api/radar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),'owner','standalone');const d=await r.json() as any;assert.equal(r.ok,true,d.error);return d;});
const state=()=>withDatabase(database,()=>stateFor('owner'));
let scheduler:ReturnType<typeof createScheduler>|undefined;const realFetch=globalThis.fetch;
try{
 const base=await action({action:'create-item',item:{title:'月姫 設定資料集 第1巻',kind:'base',ownership:'owned',artists:['画師A']}});
 const bonus=await action({action:'create-item',item:{title:'月姫 設定資料集 第1巻 購入特典 ポストカード',kind:'bonus',ownership:'missing'}});
 const linked=await action({action:'auto-link'});assert.equal(linked.linked,1);assert.equal(linked.state.items.find((i:any)=>i.id===bonus.id).ownership,'missing');
 await action({action:'unlink',id:linked.state.relations[0].id});assert.equal((await action({action:'auto-link'})).linked,0);
 await action({action:'update-item',id:base.id,patch:{artists:['画師A'],circle:'サークルA'}});assert.ok((await state()).items.find(i=>i.id===base.id)!.tags.includes('画师/作者:画師A'));
 database.close();database=openDatabase(filename);assert.equal((await state()).items.find(i=>i.id===base.id)!.ownership,'owned');
 console.log('PASS: ownership, creator tags, dismissed links and restart persistence');

 const backup=await withDatabase(database,async()=>await (await getStateResponse(new Request(origin+'/api/radar?export=1'),'owner','standalone')).json());
 database.close();database=openDatabase(join(root,'restored.sqlite'));const restored=await action({action:'restore-backup',backup});assert.equal(restored.count,2);assert.equal(restored.state.items.find((i:any)=>i.id===base.id).ownership,'owned');assert.equal(restored.state.prefs.monitor.enabled,false);
 const rejected=await withDatabase(database,()=>postAction(new Request(origin+'/api/radar',{method:'POST',body:JSON.stringify({action:'restore-backup',backup})}),'owner','standalone'));assert.equal(rejected.status,400);assert.equal((await state()).items.length,2);
 console.log('PASS: complete backup transfer and protection from overwrite');

 await withDatabase(database,()=>savePrefs('owner',{...DEFAULT_PREFS,alertThreshold:70,rules:[{id:'allow-test',keyword:'監視テスト',type:'allow',priority:90}],monitor:{enabled:true,intervalMinutes:15,urls:[source]}}));
 const requests:string[]=[];
 globalThis.fetch=async(input:any)=>{const url=String(input);requests.push(url);const second=url.includes('page=2');const id=second?'200':'100';return new Response(`<div class="item"><a href="/order/detailPage/item?itemCode=${id}">監視テスト 本 ${id}</a><div class="price">500円</div><p>在庫あり</p></div>${second?'':'<a rel="next" href="/order/listPage/list?page=2">次へ</a>'}`,{headers:{'Content-Type':'text/html'}});};
 const exclusive=async<T>(fn:()=>Promise<T>)=>fn();scheduler=createScheduler(database,origin,exclusive);const now=Date.now();await scheduler.tick(now);assert.equal(requests.length,1);assert.match(String(scheduler.status()[0].cursor),/page=2/);assert.equal((await state()).notices.length,0);
 scheduler.stop();database.close();database=openDatabase(join(root,'restored.sqlite'));
 // Move the previous observation outside the rate-limit window without waiting during the test.
 for(const row of database.raw.prepare('SELECT id,data FROM scans').all() as any[]){const scan=JSON.parse(row.data);scan.at=new Date(now-60000).toISOString();database.raw.prepare('UPDATE scans SET data=? WHERE id=?').run(JSON.stringify(scan),row.id);}
 scheduler=createScheduler(database,origin,exclusive);await scheduler.tick(now+16000);assert.equal(requests.length,2);assert.match(requests[1],/page=2/);assert.equal(scheduler.status()[0].cursor,null);assert.equal((await state()).notices.length,0);
 console.log('PASS: worker runs without a page, saves cursor, resumes after restart; unverified list observations do not create notices');

 for(const row of database.raw.prepare('SELECT id,data FROM scans').all() as any[]){const scan=JSON.parse(row.data);scan.at=new Date(now-60000).toISOString();database.raw.prepare('UPDATE scans SET data=? WHERE id=?').run(JSON.stringify(scan),row.id);}
 globalThis.fetch=async()=>new Response('<h1>あなたは18歳以上ですか</h1><button>はい</button>');await scheduler.tick(now+16*60000);assert.equal(scheduler.status()[0].paused,'age_verification');const failedCount=(await state()).scans.length;await scheduler.tick(now+40*60000);assert.equal((await state()).scans.length,failedCount);
 console.log('PASS: an actual age gate pauses the source instead of repeated retries');
}finally{globalThis.fetch=realFetch;scheduler?.stop();database.close();rmSync(root,{recursive:true,force:true});}
