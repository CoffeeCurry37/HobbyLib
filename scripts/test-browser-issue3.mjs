// Real Chromium QA against a disposable, complete standalone preview database.
// PLAYWRIGHT_MODULE points at an installed module; no browser/dependency install.
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRadar} from './load-radar.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const root=resolve('work/issue-3');mkdirSync(root,{recursive:true});const dir=mkdtempSync(root+'/browser-');
const source=new DatabaseSync('work/editorial-005/review.sqlite',{readOnly:true});await backup(source,dir+'/radar.sqlite');source.close();
const r=loadRadar(),db=r.get('sqlite').openDatabase(dir+'/radar.sqlite'),fixture=r.get('sqlite').openDatabase(':memory:');
const {withDatabase,saveItems,savePrefs,stateFor}=r.get('store'),{ingest}=r.get('service'),{createItem}=r.get('engine'),{DEFAULT_PREFS}=r.get('types');
const url='https://www.suruga-ya.jp/product/detail/QA_BROWSER_1';
const offer=(n,price)=>({id:'qa-listing',source:'QA isolated fixture',url,price,currency:'JPY',condition:'中古',availability:'available',bonus:'unknown',observedAt:new Date(Date.now()-60000+n*1000).toISOString(),history:[]});
let reviewId;
try{
 for(const table of ['items','relations','preferences','notices','scans'])db.raw.prepare('UPDATE '+table+' SET user_id=? WHERE user_id=?').run('owner','local-audit');
 const prefs=JSON.parse(db.raw.prepare('SELECT data FROM preferences WHERE user_id=?').get('owner').data);prefs.monitor={enabled:false,intervalMinutes:60,urls:[]};db.raw.prepare('UPDATE preferences SET data=? WHERE user_id=?').run(JSON.stringify(prefs),'owner');
 await withDatabase(fixture,async()=>{
  const base={...createItem('QA Browser Chronicle 1巻','Isolated QA only',undefined,DEFAULT_PREFS),id:'qa-browser-formal',category:'小説',productLine:'QA Browser Chronicle',wave:'1',notes:'QA original note',offers:[offer(0,1000)]};
  await saveItems('owner',[base]);await savePrefs('owner',{...DEFAULT_PREFS,autoLink:false,autoEnrich:false});
  for(const [volume,n,price] of [[2,1,800],[1,2,500]])await ingest('owner',await stateFor('owner'),[{title:`QA Browser Chronicle ${volume}巻`,description:'Isolated QA only',image:'',facts:{category:'小説',productLine:base.productLine,wave:String(volume)},offer:offer(n,price)}],false,true);
  const state=await stateFor('owner');reviewId=state.items.find(x=>x.identityReview).id;
  for(const item of state.items)db.raw.prepare('INSERT INTO items VALUES(?,?,?,?)').run('owner',item.id,JSON.stringify(item),new Date().toISOString());
 });
}finally{fixture.close();db.close();r.close();}
const port=8093,base=`http://127.0.0.1:${port}`,password=randomBytes(32).toString('hex'),log=openSync(dir+'/server.log','w');
const server=spawn(process.execPath,['dist-standalone/server/server.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port),RADAR_ORIGIN:base,RADAR_PASSWORD:password,RADAR_DATA_DIR:dir},stdio:['ignore',log,log]});
const manifest=JSON.parse(readFileSync('lib/radar/editorial-manifest.json'));const ids=manifest.ids;
const diffs=JSON.parse(readFileSync('research/editorial-20261021/batch-005/diffs.json'));
const checks=[],consoleErrors=[];let browser;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 for(let n=0;n<80;n++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(n===79)throw Error('preview did not start');await pause(250);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>consoleErrors.push(e.message));
 assert.equal((await context.request.post(base+'/login',{form:{password},headers:{Origin:base}})).status(),200);
 const get=async id=>(await context.request.get(base+'/api/radar?item='+encodeURIComponent(id))).json();
 const post=async body=>context.request.post(base+'/api/radar',{data:body,headers:{Origin:base}});
 const open=async id=>{await page.goto(base+'/?item='+encodeURIComponent(id));await page.getByRole('button',{name:'编辑资料',exact:true}).waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='编辑资料')?.disabled);};
 const check=async(name,run)=>{try{await run();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}await page.screenshot({path:dir+'/'+checks.length+'.png',fullPage:true});console.log(JSON.stringify(checks.at(-1)));};
 await check('real detail summary, tags and catalogue-reference imageRole',async()=>{
  await open(ids[483]);const d=diffs.find(d=>d.ordinal===484);assert.equal(await page.locator('.record-information > .record-description').textContent(),d.fields.summary);
  assert.deepEqual(await page.locator('.record-tags span').allTextContents(),d.fields.tags);
  await page.getByText('系列发行参考图 · 单款实拍待确认',{exact:true}).waitFor();
 });
 await check('Prototype novel/manga parents keep their distinct members',async()=>{
  await open(ids[483]);for(let n=485;n<490;n++)assert.equal(await page.locator(`.record-member[href="/?item=${ids[n]}"]`).count(),1);
  await open(ids[484]);for(let n=485;n<490;n++)assert.equal(await page.locator(`.record-member[href="/?item=${ids[n]}"]`).count(),0);
  assert.ok(await page.locator('.record-member').count()>0);
 });
 await check('stale edit: real 409, persistent prompt, reload preserves newer user note',async()=>{
  await open(ids[485]);await page.getByRole('button',{name:'编辑资料',exact:true}).click();await page.getByLabel('一句话简介',{exact:true}).fill('QA draft retained on conflict');
  const record=await get(ids[485]);assert.equal((await post({action:'update-item',id:record.item.id,expectedVersion:record.version,patch:{notes:'QA concurrent note'}})).status(),200);
  const response=page.waitForResponse(res=>res.url().endsWith('/api/radar')&&res.request().method()==='POST');await page.getByRole('button',{name:'保存修改',exact:true}).click();assert.equal((await response).status(),409);
  await page.getByRole('button',{name:'重新读取',exact:true}).waitFor({timeout:3000});assert.equal(await page.getByLabel('一句话简介',{exact:true}).inputValue(),'QA draft retained on conflict');
  await page.getByRole('button',{name:'重新读取',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.record-notes')?.textContent==='QA concurrent note');
 });
 await check('review candidate selection, conflict reload, and successful resolution keep observations',async()=>{
  await open(reviewId);await page.getByLabel('拟关联的正式商品').selectOption('qa-browser-formal');await page.getByRole('button',{name:'读取候选资料'}).click();await page.getByLabel('核对结论').fill('QA: latest observation matches volume one; keep conflicting observation');
  const target=await get('qa-browser-formal');assert.equal((await post({action:'update-item',id:target.item.id,expectedVersion:target.version,patch:{notes:'QA concurrent target note'}})).status(),200);
  const rejected=page.waitForResponse(res=>res.url().endsWith('/api/radar')&&res.request().method()==='POST');await page.getByRole('button',{name:'确认解除，保留全部观测'}).click();assert.equal((await rejected).status(),409);
  await page.getByRole('button',{name:'重新读取',exact:true}).waitFor({timeout:3000});assert.equal((await get(reviewId)).item.identityReview.status,'open');
  await page.getByRole('button',{name:'重新读取',exact:true}).click();await page.getByRole('button',{name:'编辑资料',exact:true}).waitFor();await page.getByLabel('拟关联的正式商品').selectOption('qa-browser-formal');await page.getByRole('button',{name:'读取候选资料'}).click();await page.getByLabel('核对结论').fill('QA: latest observation matches volume one; keep conflicting observation');
  const resolved=page.waitForResponse(res=>res.url().endsWith('/api/radar')&&res.request().method()==='POST');await page.getByRole('button',{name:'确认解除，保留全部观测'}).click();assert.equal((await resolved).status(),200);await page.getByRole('heading',{name:'挂牌身份复查 · 已解除'}).waitFor();
  const saved=(await get(reviewId)).item.identityReview;assert.equal(saved.observations.length,2);assert.equal(saved.resolutions.length,1);assert.equal((await get('qa-browser-formal')).item.notes,'QA concurrent target note');
 });
 await check('mobile 390px and 320px details fit viewport and edit controls work',async()=>{
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await open(ids[485]);const dimensions=await page.evaluate(()=>({width:innerWidth,body:document.body.scrollWidth,document:document.documentElement.scrollWidth}));assert.ok(dimensions.body<=width&&dimensions.document<=width,JSON.stringify(dimensions));await page.getByRole('button',{name:'编辑资料',exact:true}).click();await page.locator('.record-editor label').filter({hasText:/^个人备注/}).locator('textarea').waitFor();const edited=await page.evaluate(()=>({width:innerWidth,body:document.body.scrollWidth,document:document.documentElement.scrollWidth}));assert.ok(edited.body<=width&&edited.document<=width,JSON.stringify(edited));await page.screenshot({path:dir+'/mobile-'+width+'.png',fullPage:true});}
 });
 assert.deepEqual(consoleErrors,[]);
}catch(e){checks.push({name:'browser infrastructure/runtime',pass:false,error:e.message});}
finally{
 if(browser)await browser.close();server.kill('SIGTERM');await Promise.race([new Promise(resolve=>server.once('exit',resolve)),pause(5000)]);if(server.exitCode===null)server.kill('SIGKILL');closeSync(log);
 const report={at:new Date().toISOString(),pass:checks.length===5&&checks.every(c=>c.pass),browser:'installed Chromium / Playwright; real DOM and real local HTTP API',preview:'complete isolated copy plus two explicitly labelled QA fixtures',productionTouched:false,checks,consoleErrors,privateArtifacts:dir,serverStopped:true};writeFileSync('docs/reports/issue-3/browser-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,privateArtifacts:dir}));if(!report.pass)process.exitCode=1;
}
