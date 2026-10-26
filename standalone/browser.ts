import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {capturePage} from '../lib/radar/capture';
import {safeUrl,fetchPublic,parseHtml,checkInteraction,SourceInteractionError} from '../lib/radar/collector';
export function browserAssistant(directory:string){
 const contexts=new Map<string,any>();let enabled=process.env.RADAR_BROWSER==='1';
 const shops:Record<string,string>={Mandarake:'https://order.mandarake.co.jp/order/',骏河屋:'https://www.suruga-ya.jp/',Mercari:'https://jp.mercari.com/',Yahoo:'https://shopping.yahoo.co.jp/'};
 async function context(key:string,headless:boolean){if(contexts.has(key))return contexts.get(key);let pw:any;try{const name='playwright';pw=await import(/* @vite-ignore */ name);}catch{throw new Error('尚未安装浏览器组件。请运行独立包中的 SETUP-BROWSER，再启动浏览器模式。');}const dir=join(directory,'browser-profiles',key);mkdirSync(dir,{recursive:true,mode:0o700});const ctx=await pw.chromium.launchPersistentContext(dir,{headless});if(key.startsWith('public-'))await ctx.route('**/*',async(route:any)=>{const req=route.request();if(req.isNavigationRequest()&&req.frame()===req.frame().page().mainFrame()){try{safeUrl(req.url());}catch{await route.abort();return;}}await route.continue();});contexts.set(key,ctx);ctx.on('close',()=>contexts.delete(key));return ctx;}
 async function open(shop:string){if(!shops[shop])throw new Error('未知平台');const ctx=await context('account-'+shop,false);const page=ctx.pages()[0]||await ctx.newPage();await page.goto(shops[shop],{waitUntil:'domcontentloaded',timeout:30000});return{message:'已在运行程序的电脑打开商店。请自行登录、完成验证，然后打开购买记录或愿望清单；登录会话保存在本机独立配置中。'};}
 async function capture(shop:string,kind:'purchases'|'wishlist'|'catalog'){
  if(!['purchases','wishlist','catalog'].includes(kind))throw new Error('请选择读取类型');const ctx=contexts.get('account-'+shop);if(!ctx)throw new Error('请先打开该平台的本机登录浏览器');const pages=ctx.pages(),page=pages.at(-1);if(!page)throw new Error('浏览器已关闭');
  const allowed:Record<string,string[]>={Mandarake:['order.mandarake.co.jp'],骏河屋:['www.suruga-ya.jp'],Mercari:['jp.mercari.com'],Yahoo:['shopping.yahoo.co.jp','auctions.yahoo.co.jp','store.shopping.yahoo.co.jp']};if(!allowed[shop]?.includes(new URL(page.url()).hostname))throw new Error('请先完成登录并回到商店商品列表，当前页不采集');
  const body=await page.locator('body').innerText();checkInteraction(body,page.url());return page.evaluate(capturePage,kind);
 }
 async function read(url:string){safeUrl(url);if(!enabled)return fetchPublic(url);
  // Anonymous browser for public monitoring. Account sessions are never reused for anonymous scans.
  const host=new URL(url).hostname;if(!/mandarake|mercari|suruga-ya|yahoo/.test(host))return fetchPublic(url);
  const ctx=await context('public-'+host,true),page=await ctx.newPage();try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});safeUrl(page.url());checkInteraction(await page.content(),page.url());if(response&&!response.ok())throw new Error(`来源返回 HTTP ${response.status()}`);
   for(let i=0;i<4;i++){const html=await page.content();checkInteraction(html,page.url());const p=parseHtml(html,page.url());if(p.products.length&&!p.needsBrowser)return{text:html,url:page.url()};await page.waitForTimeout(1200);}
   const html=await page.content();checkInteraction(html,page.url());if(!parseHtml(html,page.url()).products.length)throw new SourceInteractionError('browser_required',url,'浏览器未返回商品内容。请在原站核对或手动采集当前页。');return{text:html,url:page.url()};
  }finally{await page.close();}
 }
 return {open,capture,read,status:()=>({enabled,open:[...contexts.keys()].filter(x=>x.startsWith('account-')).map(x=>x.slice(8))}),close:async()=>{await Promise.all([...contexts.values()].map(x=>x.close()));contexts.clear();}};
}
