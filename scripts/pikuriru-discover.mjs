import {cached,clean,write} from './four-series-common.mjs';
const p=cached('https://www.hobbystock.jp/sp/sm/fgo/?m=1054-html');
const rows=[...p.body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:new URL(clean(m[1]),p.source.url).href,title:clean(m[2].replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ')})).filter(x=>/アクリルスタンド vol\.[56]/.test(x.title)&&x.url.includes('/item/view/'));
write('work/series-evidence-20261111/pikuriru/index-products.json',rows);
write('work/series-evidence-20261111/pikuriru/detail-capture.json',[...new Set(rows.map(r=>r.url))].map(url=>({url,kind:'html'})));
console.log(JSON.stringify(rows,null,2));
const b=cached('https://www.hobbystock.jp/item/view/hso-ccg-00015313').body;
console.log('JAN contexts', [...b.matchAll(/.{0,70}(?:4580822\d{6}|gtin13|JAN|商品コード).{0,120}/g)].map(m=>m[0]));
console.log('jsonld',b.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]?.slice(0,1800));

