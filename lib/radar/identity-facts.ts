import type {Item} from './types';
import {canonicalBrand,cleanProductTitle,manualField} from './catalog';
// Publisher succession: https://www.kadokawa.co.jp/topics/6247/
export function bookPublisher(item:Item){
 const value=canonicalBrand(item.publisher||item.brand).replace(/ BOOKS$/i,'');
 return /^(?:エンターブレイン|アスキー[・･]メディアワークス)(?:\s*[/／]\s*KADOKAWA)?$/i.test(value)?'KADOKAWA':value;
}
export const literalProductName=(title:string)=>cleanProductTitle(title).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
export const normalizedCode=(code:string)=>code.normalize('NFKC').replace(/[\s-]/g,'').toUpperCase();
export function validGtin(raw:string){const code=normalizedCode(raw);return /^(?:\d{8}|\d{13})$/.test(code)&&[...code].reduce((n,d,i)=>n+Number(d)*((code.length-1-i)%2?3:1),0)%10===0;}
export function physicalBookCode(item:Item){
 for(const raw of [item.isbn,item.jan]){const code=normalizedCode(raw);
  if(/^97[89]\d{10}$/.test(code)&&validGtin(code))return code;
  if(/^\d{9}[\dX]$/.test(code)&&[...code].reduce((n,d,i)=>n+(d==='X'?10:Number(d))*(10-i),0)%11===0){const prefix='978'+code.slice(0,9),check=(10-[...prefix].reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0)%10)%10;return prefix+check;}
 }return '';
}
const key=(s:string)=>s.normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const cleanCircle=(s:string)=>s.normalize('NFKC').replace(/^[Cc]\d{2,3}\s+/,'').replace(/[、,]\s*(?:JAN|ISBN)\s*[:：].*$/i,'').trim();
export function doujinCredits(item:Item){
 const circles=new Set<string>(),artists=new Set((item.artists||[]).filter(Boolean).map(key));
 const add=(s:string)=>{const c=cleanCircle(s);if(c&&!/^(?:NULL|NU|不明|アンソロジー|[AB]\d(?:判)?|\d+P)$/i.test(c))circles.add(c);};add(item.circle||'');
 if(item.origin==='doujin')for(const offer of item.offers){
  const title=(offer.listingTitle||'').normalize('NFKC');
  if(offer.source==='Mandarake'){const m=title.match(/^(.{1,80}?)\s+\(([^)]{1,100})\)\s+\S/);if(m){add(m[1]);m[2].split(/[、,]/).forEach(s=>artists.add(key(s)));}}
  if(offer.source==='骏河屋'){const parts=title.split(/\s+\/\s+/);while(parts.length>3&&/^(?:[AB]\d(?:判)?|\d+P|\d+ページ)$/i.test(parts.at(-1)!))parts.pop();if(parts.length===3){add(parts[2]);parts[1].split(/[、,]/).forEach(s=>artists.add(key(s)));}}
 }
 return {circles:[...circles],artists};
}
export function sameCircle(a:Item,b:Item){
 if(a.circle&&b.circle&&key(a.circle)===key(b.circle))return true;
 if(manualField(a,'circle')||manualField(b,'circle'))return false;
 const left=doujinCredits(a),right=doujinCredits(b);
 if(![...left.artists].some(artist=>right.artists.has(artist)))return false;
 const normalized=(s:string)=>key(cleanCircle(s).replace(/\([ァ-ヶー・\sA-Za-z0-9]+\)$/,''));
 return left.circles.some(c=>right.circles.some(d=>normalized(c)===normalized(d)));
}
export function explicitAgeRating(item:Item):'all'|'r18'|''{
 if(manualField(item,'ageRating'))return item.ageRating==='r18'?'r18':item.ageRating==='all'?'all':'';
 const facts=item.evidence.filter(e=>['ageRating','category','来源分类','来源分類'].includes(e.field));
 if(facts.some(e=>e.field==='ageRating'&&e.value==='r18'||/18禁|18歳|R[ -]?18|成人向/i.test(e.value)))return 'r18';
 if(facts.some(e=>e.field==='ageRating'&&e.value==='all'||/全年齢|一般同人誌/.test(e.value)))return 'all';
 return /18禁|R[ -]?18|成人向/i.test(item.title)?'r18':/全年齢版|一般向け版/.test(item.title)?'all':'';
}
