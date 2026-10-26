// Small, non-executing HTML reader. It never evaluates scripts or imports page state.
export type Element={tag:string;attrs:Record<string,string>;children:(Element|string)[];parent?:Element};
export const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&(yen|times|ldquo|rdquo|lsquo|rsquo|hellip|ndash|mdash);/g,(_,n)=>({yen:'¥',times:'×',ldquo:'“',rdquo:'”',lsquo:'‘',rsquo:'’',hellip:'…',ndash:'–',mdash:'—'}[n as string]||'')).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v<=0x10ffff?String.fromCodePoint(v):'';});
export function attrs(s:string){const d:Record<string,string>={};for(const m of s.matchAll(/([^\s=<>/'"]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))d[m[1].toLowerCase()]=decode(m[2]??m[3]??m[4]);return d;}
export function readHtml(html:string):Element{
 const root:Element={tag:'root',attrs:{},children:[]},stack=[root];
 const re=/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/gi;
 for(const m of html.matchAll(re)){const s=m[0];if(s.startsWith('<!--')||s.startsWith('<!')||m[1])continue;
  if(s.startsWith('</')){const tag=s.match(/^<\/([\w:-]+)/)?.[1].toLowerCase();const i=stack.map(x=>x.tag).lastIndexOf(tag||'');if(i>0)stack.length=i;continue;}
  if(s.startsWith('<')){const tag=s.match(/^<([\w:-]+)/)?.[1].toLowerCase();if(!tag)continue;
   if(['li','p','tr','td','th','dt','dd'].includes(tag)&&stack.at(-1)?.tag===tag)stack.pop();
   const node:Element={tag,attrs:attrs(s.slice(tag.length+1)),children:[],parent:stack.at(-1)};stack.at(-1)!.children.push(node);
   if(!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)&&!s.endsWith('/>'))stack.push(node);
  }else stack.at(-1)!.children.push(decode(s));
 }return root;
}
export const text=(n:Element|undefined):string=>n?n.children.map(x=>typeof x==='string'?x:text(x)).join(' ').replace(/\s+/g,' ').trim():'';
export const hasClass=(n:Element,name:string)=>(n.attrs.class||'').split(/\s+/).includes(name);
export function all(n:Element,match:(n:Element)=>boolean):Element[]{const out:Element[]=[];function visit(x:Element){if(match(x))out.push(x);for(const c of x.children)if(typeof c!=='string')visit(c);}visit(n);return out;}
export function first(n:Element,match:(n:Element)=>boolean):Element|undefined{if(match(n))return n;for(const c of n.children)if(typeof c!=='string'){const found=first(c,match);if(found)return found;}}
export const cls=(n:Element,name:string)=>first(n,x=>hasClass(x,name));
export const tag=(n:Element,name:string)=>first(n,x=>x.tag===name);
export const attr=(n:Element,k:string,v:string)=>first(n,x=>x.attrs[k]===v);
export function tableFields(n:Element){const values:Record<string,string>={};for(const row of all(n,x=>x.tag==='tr')){const cells=row.children.filter((x):x is Element=>typeof x!=='string'&&['th','td'].includes(x.tag));if(cells.length===2)values[text(cells[0])]=text(cells[1]);}return values;}
export function structuredProducts(html:string):any[]{const out:any[]=[];for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{const j=JSON.parse(m[1]);const nodes=(Array.isArray(j)?j:[j]).flatMap(x=>x['@graph']||x);out.push(...nodes.filter(x=>x['@type']==='Product'));}catch{}return out;}
