import type {Item,Kuji} from './types';
import catalogue from './kuji-catalogue.json';
export const KUJI_CAMPAIGNS=catalogue.campaigns;
const normal=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'').replace(/fategrandorder/g,'fgo');
const campaignNames=KUJI_CAMPAIGNS.map(c=>({campaign:c,name:normal(c.name)}));
type RecordLike=Pick<Item,'title'>&Partial<Pick<Item,'kuji'|'offers'>>;
const sourceProducts=new Map(KUJI_CAMPAIGNS.flatMap(c=>c.prizes.flatMap(p=>p.sourceProducts.map(s=>[s.id,{campaign:c,prize:p,source:s}] as const))));
export function resolveKuji(item:RecordLike){
 if(item.kuji){const campaign=KUJI_CAMPAIGNS.find(c=>c.id===item.kuji!.campaignId),prize=campaign?.prizes.find(p=>p.award===item.kuji!.award);if(campaign&&prize)return {campaign,prize,full:!!item.kuji.catalogueGroup,slot:item.kuji.slot};}
 for(const o of item.offers||[]){const code=o.url.match(/^https:\/\/www\.suruga-ya\.jp\/product\/(?:detail|other)\/(\d+)(?:$|[?#])/)?.[1],known=code&&sourceProducts.get(code);if(known)return {...known,full:known.source.full,slot:known.source.slot};}
 if(!/一番くじ/.test(item.title))return null;
 const t=normal(item.title),campaign=campaignNames.find(c=>t.includes(c.name))?.campaign;
 if(!campaign)return null;const mentions=[...item.title.normalize('NFKC').matchAll(/(?:^|[^A-Za-z])([A-Z](?:-\d+)?賞)|ラストワン賞|ダブルチャンスキャンペーン/g)];if(new Set(mentions.map(m=>m[1]||m[0])).size>1)return null;const award=mentions[0],grade=award?.[1]||award?.[0],prize=campaign.prizes.find(p=>p.award===grade);
 if(!prize)return null;const full=/全\s*\d+\s*種.*セット|コンプリート|フルコンプ/.test(item.title.normalize('NFKC'));
 const matches=prize.members.filter(m=>t.includes(normal(m.name)));
 return {campaign,prize,full,slot:prize.count===1?1:matches.length===1?matches[0].slot:undefined};
}
export function kujiFacts(item:RecordLike):{kuji:Kuji;releaseDate:string;year:string}|null{
 const r=resolveKuji(item);if(!r)return null;
 return {kuji:{campaignId:r.campaign.id,campaign:r.campaign.name,award:r.prize.award,count:r.prize.count,catalogueGroup:r.full,...(r.slot?{slot:r.slot}:{})},releaseDate:r.campaign.releaseDate,year:r.campaign.releaseDate.slice(0,4)};
}
export function kujiKey(item:RecordLike){
 const known=resolveKuji(item);if(known)return {campaign:known.campaign.id,award:known.prize.award,variant:known.slot?'slot:'+known.slot:'',group:known.full,known:true,count:known.prize.count};
 if(item.kuji)return {campaign:normal(item.kuji.campaign),award:item.kuji.award,variant:item.kuji.slot?'slot:'+item.kuji.slot:'',group:!!item.kuji.catalogueGroup,known:false,count:item.kuji.count||0};
 const s=item.title.normalize('NFKC'),start=s.indexOf('一番くじ');if(start<0)return null;
 const end=s.lastIndexOf('」'),award=s.match(/(?:^|[^A-Za-z])([A-Z](?:-\d+)?賞)|ラストワン賞|ダブルチャンスキャンペーン/);if(!award)return null;
 const grade=award[1]||award[0],campaign=s.slice(start,end>start?end:award.index),variant=s.slice(0,start).replace(/[「『]$/,'')+' '+s.slice(end>start?end+1:(award.index||0)+award[0].length);
 return {campaign:normal(campaign),award:grade,variant:normal(variant.replace(/[A-Z](?:-\d+)?賞|ラストワン賞|ダブルチャンスキャンペーン/g,'')),group:/全\s*\d+\s*種.*セット|コンプリート|フルコンプ/.test(s),known:false,count:0};
}
export function kujiIdentity(item:Item){const k=kujiKey(item);return k?.known&&(k.group||k.count===1||k.variant)?['kuji:'+k.campaign+':'+k.award+':'+(k.group?'all':k.variant||'single')]:[];}
