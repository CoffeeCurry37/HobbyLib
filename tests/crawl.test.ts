import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {parseHtml} from '../lib/radar/collector';import {advanceCrawl} from '../lib/radar/crawl-queue';import {listingPageKey,searchScope} from '../lib/radar/crawl-progress';
import {withDatabase,stateFor,savePrefs} from '../lib/radar/store';import {withSourceReader} from '../lib/radar/reader';import {postAction} from '../lib/radar/service';import {DEFAULT_PREFS} from '../lib/radar/types';
import {openDatabase} from '../standalone/sqlite';import {createScheduler} from '../standalone/scheduler';
const root='https://www.suruga-ya.jp/search?category=1100&search_word=&ck=true&inStock=On&subgenre=Fate';
const card=(id:string)=>`<div class="item"><a href="https://order.mandarake.co.jp/order/detailPage/item?itemCode=${id}">Fate テスト ${id}</a><div class="price">1,000円</div></div>`;
const facets='<div class="facet-number3"><h2>発売年</h2><ul>'+['[2024,*]','[2022,2023]'].map(y=>`<li><a href="${root}&release_year=${encodeURIComponent(y)}">発売年</a></li>`).join('')+`<li><a href="https://www.suruga-ya.jp/search?release_year=%5B0%2C2020%5D">検索条件を削除</a></li></ul></div>`;
const parsed=parseHtml(facets,root);assert.equal(parsed.partitions.length,2);assert.ok(parsed.partitions.every(u=>new URL(u).searchParams.get('subgenre')==='Fate'));
const first=advanceCrawl(root,{next:root+'&page=2',total:29636,partitions:parsed.partitions},[],[]);assert.equal(first.next,parsed.partitions[0]);assert.deepEqual(first.pending,[parsed.partitions[1]]);
const resumed=advanceCrawl(first.next!,{next:null,total:4000},first.visited,JSON.parse(JSON.stringify(first.pending)));assert.equal(resumed.next,parsed.partitions[1]);
const end=advanceCrawl(resumed.next!,{next:null,total:3000},resumed.visited,resumed.pending);assert.equal(end.next,null);assert.equal(end.pending.length,0);
const md='https://order.mandarake.co.jp/order/listPage/list?keyword=Fate',html=card('101')+card('102')+'<a rel="next" href="?keyword=Fate&page=2">次へ</a>';
assert.equal(listingPageKey(parseHtml(html,md).products),listingPageKey(parseHtml(card('102')+card('101'),md).products));assert.equal(searchScope(md),searchScope(md+'&page=2'));
const temp=mkdtempSync(join(tmpdir(),'radar-crawl-test-')),db=openDatabase(join(temp,'test.sqlite'));let scheduler:ReturnType<typeof createScheduler>|undefined;
const ageScans=()=>{for(const row of db.raw.prepare('SELECT id,data FROM scans').all()){const data=JSON.parse(row.data as string);data.at='2020-01-01T00:00:00.000Z';db.raw.prepare('UPDATE scans SET data=? WHERE id=?').run(JSON.stringify(data),row.id);}};
try{await withDatabase(db,async()=>{
 const call=async(url:string)=>{const r=await postAction(new Request('http://localhost/api/radar',{method:'POST',body:JSON.stringify({action:'scan',url,compact:true})}),'owner','standalone'),data:any=await r.json();assert.equal(r.ok,true,data.error);return data;};
 await withSourceReader(async url=>({text:html,url}),async()=>{await call(md);ageScans();const repeated=await call(md+'&page=2');assert.equal(repeated.incomplete,true);assert.equal(repeated.next,null);assert.equal(repeated.count,0);assert.equal((await stateFor('owner')).items.length,2);});
 await savePrefs('owner',{...DEFAULT_PREFS,monitor:{enabled:true,intervalMinutes:60,urls:[root]}});
 const reader=async(url:string)=>({url,text:url===root?facets+'29636件中 1 - 24件':'終了'});
 await withSourceReader(async url=>{const p=await reader(url);return {...p,text:p.text+`<script type="application/ld+json">{"@type":"Product","name":"Fate queue ${new URL(url).searchParams.get('release_year')||'root'}","url":"https://www.suruga-ya.jp/product/detail/185012345","offers":{"price":1000,"priceCurrency":"JPY"}}</script>`};},async()=>{
  ageScans();scheduler=createScheduler(db,'http://localhost',async fn=>fn());const now=Date.now();await scheduler.tick(now);scheduler.stop();
  let job:any=db.raw.prepare('SELECT * FROM monitor_jobs WHERE url=?').get(root);assert.equal(job.cursor,parsed.partitions[0]);assert.deepEqual(JSON.parse(job.pending),[parsed.partitions[1]]);
  ageScans();scheduler=createScheduler(db,'http://localhost',async fn=>fn());await scheduler.tick(now+16000);scheduler.stop();job=db.raw.prepare('SELECT * FROM monitor_jobs WHERE url=?').get(root);assert.equal(job.cursor,parsed.partitions[1]);assert.deepEqual(JSON.parse(job.pending),[]);
 });
 console.log('PASS official facet constraints, order-independent repeated listing detection, no false completion, persisted partition queue and scheduler restart');
});}finally{scheduler?.stop();db.close();rmSync(temp,{recursive:true,force:true});}
