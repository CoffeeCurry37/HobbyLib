import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync,existsSync,lstatSync} from 'node:fs';
import {resolve, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=resolve(fileURLToPath(new URL('../..',import.meta.url)));
export const REPORT=resolve(ROOT,'research/pilot-300-20261029');
export const DATA=resolve(ROOT,'work/pilot-300');
export const sha=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
export const read=p=>JSON.parse(readFileSync(p,'utf8'));
export const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
export const labels={books:'漫画 / 小说 / 资料集',cards:'卡片 / 随机周边',games:'游戏 / 店铺特典',figures:'手办 / 配件',recent:'2025–2026 活动周边',lots:'拼套 / 缺件 / 信息冲突'};
export function safeDataDir(p=DATA){const base=resolve(ROOT,'work'),dir=resolve(p),rel=relative(base,dir);if(!rel||rel.startsWith('..')||rel.startsWith(sep)||resolve(dir)===ROOT)throw new Error('Data directory must be a child of repository work/');let cursor=base;for(const part of ['',...rel.split(sep)]){if(part)cursor=resolve(cursor,part);if(existsSync(cursor)&&lstatSync(cursor).isSymbolicLink())throw new Error('Data directory may not traverse a link');}mkdirSync(dir,{recursive:true});return dir;}
export function sourceKey(url){const u=new URL(url);if(!['https:','http:'].includes(u.protocol))throw new Error('Invalid source URL');
 if(u.hostname.endsWith('suruga-ya.jp'))return 'suruga:'+u.pathname.replace('/product/other/','/product/detail/');
 if(u.hostname.includes('amiami.jp'))return 'amiami:'+(u.searchParams.get('gcode')||u.searchParams.get('scode')||u.pathname);
 if(u.hostname.includes('mandarake'))return 'mandarake:'+u.searchParams.get('itemCode');
 if(u.hostname==='online.aniplex.co.jp')return 'aniplex:'+u.pathname+':'+[...u.searchParams].filter(([k])=>k.endsWith('_variationNo')).map(([,v])=>v).join();
 return u.hostname+u.pathname;
}
export const normalized=t=>t.normalize('NFKC').toLowerCase().replace(/【中古】|\(本体[^)]*\)|《[^》]*》|【送料無料】|\s+/g,'');
export function family(t){const n=normalized(t);
 if(/grandorder.*material|grandordermaterial/.test(n))return 'fgo-material';
 if(/turas.*realta|turas.*réalta/.test(n))return 'turas-realta';
 if(/ウエハース/.test(n))return 'fate-wafers'; // conservative: unknown wave cannot leak into another split
 if(/extella|エクステラ/.test(n))return 'extella';
 if(/fes\.?2025/.test(n))return 'fgo-fes-2025';
 if(/fes\.?2026/.test(n))return 'fgo-fes-2026';
 if(/マシュ.*私服/.test(n))return 'mash-casual-doll';
 if(/アルトリア.*英霊正装/.test(n))return 'artoria-formal';
 if(/figma.*ランサー.*アルトリア/.test(n))return 'artoria-lancer-figma';
 const kuji=t.match(/「(一番くじ[^」]+)」/);if(kuji)return 'kuji:'+normalized(kuji[1]);
 return null;
}
