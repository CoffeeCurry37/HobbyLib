import type {Item} from './types';
import {cleanProductTitle} from './catalog';
const works:[RegExp,string][]=[
 [/Fate\s*\/\s*stay\s*night|フェイト[\/\s]*ステイナイト|Heaven[’'s ]*Feel|Unlimited Blade Works|衛宮さんちの今日のごはん|氷室の天地/i,'Fate/stay night'],
 [/Fate\s*\/\s*hollow\s*at(?:a)?raxia/i,'Fate/hollow ataraxia'],[/Fate\s*\/\s*Zero/i,'Fate/Zero'],
 [/Fate\s*\/\s*Apocrypha/i,'Fate/Apocrypha'],[/Fate\s*\/\s*strange\s*Fake/i,'Fate/strange Fake'],
 [/Fate\s*\/\s*Prototype/i,'Fate/Prototype'],[/Fate\s*(?:\/\s*|\s+)(?:EXTRA|EXTELLA)|フェイト[・\/\s]*エクストラ/i,'Fate/EXTRA'],
 [/Fate\s*\/\s*(?:Grand\s*Order|GO)|\bFGO\b|Fate\s*\/\s*Grand Carnival/i,'Fate/Grand Order'],
 [/Fate\s*\/\s*kaleid|プリズマ[・☆\s]*イリヤ|Prisma[☆\s]*Illya/i,'Fate/kaleid liner'],
 [/Fate\s*\/\s*Samurai|フェイト[\/\s]*サムライ/i,'Fate/Samurai Remnant'],
 [/Fate\s*\/\s*Requiem/i,'Fate/Requiem'],[/Fate\s*\/\s*unlimited\s*codes|フェイト[\/\s]*アンリミテッドコード/i,'Fate/unlimited codes'],
 [/Fate\s*\/\s*tiger\s*colosseum|フェイト[\/\s]*タイガーころしあむ/i,'Fate/tiger colosseum'],
 [/MELTY\s*BLOOD/i,'MELTY BLOOD'],[/月姫|月姬/i,'月姫'],[/空の境界|空之境界|Kara no Kyoukai/i,'空の境界'],
 [/魔法使いの夜|魔法使之夜/i,'魔法使いの夜'],[/ロード[・\s-]*エルメロイ|ファイヤーガール|コハエース|まほうつかいの箱|月の珊瑚|鋼の大地|\bDDD\b/i,'その他 TYPE-MOON']
];
export function titleSeries(raw:string){const s=cleanProductTitle(raw).normalize('NFKC');return works.map(([re,series])=>({match:s.match(re),series})).filter(x=>x.match).sort((a,b)=>(a.match!.index||0)-(b.match!.index||0))[0]?.series||'';}
export function resolvedSeries(item:Pick<Item,'title'|'series'>&Partial<Pick<Item,'aliases'|'offers'>>){
 const title=titleSeries(item.title);if(title)return title;
 const known=titleSeries(item.series);if(known)return known;
 for(const raw of [...(item.offers||[]).map(o=>o.listingTitle||''),...(item.aliases||[])]){const value=titleSeries(raw);if(value)return value;}
 return item.series||'';
}
