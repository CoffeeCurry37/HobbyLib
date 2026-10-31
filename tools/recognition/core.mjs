import {createHash} from 'node:crypto';
export const normal=s=>String(s||'').normalize('NFKC').replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
export const hash=s=>createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
export const roman=s=>{s=normal(s).toUpperCase();if(/^\d+$/.test(s))return Number(s);if(!/^[IVXL]+$/.test(s))return null;const v={I:1,V:5,X:10,L:50};return [...s].reduce((n,c,i)=>n+(v[c]<(v[s[i+1]]||0)?-v[c]:v[c]),0);};
export function classify(raw){
 const title=normal(raw.title),description=normal(raw.description),category=normal(raw.categoryLabel||raw.facts?.category),facts=raw.facts||{},t=title+' '+description;
 const reasons=[],knownWorks=[[/Fate\s*\/\s*EXTELLA\s+LINK/i,'Fate/EXTELLA LINK'],[/Fate\s*\/\s*EXTELLA/i,'Fate/EXTELLA'],[/Fate\s*\/\s*EXTRA\s+Record/i,'Fate/EXTRA Record'],[/Fate\s*\/\s*EXTRA\s+CCC/i,'Fate/EXTRA CCC'],[/Fate\s*\/\s*EXTRA/i,'Fate/EXTRA'],[/Fate\s*\/\s*Grand\s*Order|\bFGO\b|フェイトグランドオーダー/i,'Fate/Grand Order'],[/Fate\s*\/\s*stay\s*night/i,'Fate/stay night'],[/Fate\s*\/\s*strange\s*Fake/i,'Fate/strange Fake'],[/Fate\s*\/\s*Apocrypha/i,'Fate/Apocrypha'],[/Fate\s*\/\s*hollow\s*ataraxia/i,'Fate/hollow ataraxia'],[/Fate\s*\/\s*Zero/i,'Fate/Zero'],[/タイガーころしあむ/,'Fate/tiger colosseum'],[/Lost Einherjar|アスラウグ/i,'Fate/Lost Einherjar']];
 let work=knownWorks.find(([re])=>re.test(title))?.[1]||knownWorks.find(([re])=>re.test(description))?.[1]||normal(facts.series)||'作品待确认';
 const mixed=/まとめ|大量|拼包|まとめ売り/.test(title)&&/(?:オーバーロード|艦これ|ホロライブ|まどか)/.test(title);
 if(mixed)work='多IP混合';
 const doujin=facts.origin==='doujin'||/同人誌|同人漫画|同人作品/.test(category)||/^(?:OrangeMaru|METAJAN)\s*\(/.test(title);
 let major='周边',subtype='其他周边';
 if(doujin){major='同人';subtype='同人誌';reasons.push('来源/社团指向同人，不因material一词归入官方资料集');}
 else if(/映像|DVD|Blu.?ray|BDソフト|アニメ レンタル/.test(category)||/^-?BD\b|^-?DVD\b|MOONLIGHT\/LOSTROOM/i.test(title)){major='音像';subtype=/Blu.?ray|BD/i.test(category)?'Blu-ray':'DVD';reasons.push('来源主媒介为音像');}
 else if(/本体|トップカバー|コントローラ/.test(title)&&/PlayStation|PS4|PS Vita|Vita/.test(title)){major='游戏';subtype='游戏主机与配件';reasons.push('硬件本体/面板不是游戏软件');}
 else if(/書籍|コミック|小説|画集|設定資料|BOOK/i.test(category)||/material\s*[IVXⅠ-Ⅻ]+|カルデアエース|ビジュアルガイド|ALBUM|アスラウグ|SE\.RA\.PH.*巻/i.test(title)){major='书籍';subtype=/コミック|SE\.RA\.PH|turas/i.test(title+' '+category)?'漫画':/アスラウグ|小説/.test(title+' '+category)?'小说':/エース/.test(title)?'杂志':'设定资料集';reasons.push('标题和来源书籍分类');}
 else if(/ラバーストラップ|缶バッジ|ポーチ|ディスプレイステージ|アクリルスタンド|ラバーチャーム|色紙|ポスター|タペストリー/.test(title)){major=/B[12]|特大/.test(title)?'大周边':'周边';subtype=(title.match(/ラバーストラップ|缶バッジ|ポーチ|ディスプレイステージ|アクリルスタンド|ラバーチャーム|色紙|ポスター|タペストリー/)||['其他周边'])[0];reasons.push('商品名明确的实体类型优先于抽样层标签');}
 else if(/ウエハース|アクリルカード|コレクションカード|学生証|ブロマイド|ポートレイト|トレカ/.test(title+' '+category)){major='卡片';subtype=/ウエハース/.test(title)?'威化卡片':/学生証/.test(title)?'入场特典卡':/ブロマイド|ポートレイト/.test(title)?'角色肖像卡':'卡片';}
 else if(/フィギュア|figma|ねんどろいど|粘土人/i.test(title+' '+category)){major='玩具';subtype=/figma|ねんどろいど|粘土人/i.test(title)?'可动手办':'静态手办';}
 else if(/(?:PS4|Vita|PSP|スイッチ|ゲーム)ソフト/.test(category)||/^Fate\/(?:EXTRA|EXTELLA)/i.test(title)){major='游戏';subtype='游戏软件';}
 if(/Animation Material/.test(title)&&/映像|DVD|Blu.?ray/.test(category)){major='音像';subtype=/DVD/.test(category)?'DVD':'Blu-ray';}
 const sellerSet=/まとめ売り|まとめ|拼包|[1１]\s*[～~–-]\s*\d+\s*巻.*セット|単巻全\d+巻セット|全\d+種セット|2種セット/.test(title);
 const fixedPart=/同梱特典になります|同梱.*(?:のみ|単品)|特典のみ/.test(description)&&!sellerSet;
 let mode=fixedPart?'excluded':sellerSet?'temporary':'permanent';
 if(/コード|プロダクトコード/.test(title)&&!/BOX/.test(title))mode='temporary';
 if(title.includes('ディスプレイステージ')&&!/販売|単品/.test(description))mode='review';
 const platform=/PS4|PlayStation.?4/i.test(title+' '+category)?'PS4':/Vita|PSV/.test(title+' '+category)?'PS Vita':/Switch|スイッチ/.test(title+' '+category)?'Switch':/PSP/.test(title+' '+category)?'PSP':null;
 const region=/北米|North American|Fleeting Glory/i.test(title)?'NA':'JP';
 const edition=/Celebration BOX/i.test(title)?'CELEBRATION BOX':/VELBER BOX/i.test(title)?'VELBER BOX':/REGALIA BOX/i.test(title)?'REGALIA BOX':/LIMITED BOX/i.test(title)?'LIMITED BOX':/プレミアム限定版/.test(title)?'PREMIUM':/BEST|Best Collection/i.test(title)?'Best Collection':/LIMITED EDITION/i.test(title)?'LIMITED EDITION':/通常版/.test(title)||subtype==='游戏软件'?'通常版':null;
 const volumeMatch=title.match(/(?:Grand Order material|カルデアエース(?: VOL\.?)?)\s*([IVXLⅠ-Ⅻ\d]+)/i);
 const volume=volumeMatch?roman(volumeMatch[1]):null;
 const wave=title.match(/ウエハース\s*(\d+)/)?.[1]||title.match(/(\d+)弾\/24|24\d+\/(\d+)弾/)?.slice(1).find(Boolean)||null;
 const event=title.match(/Fes\.?\s*(20\d{2})/)?.[1]||null;
 const kuji=title.includes('一番くじ'),campaign=title.match(/「(一番くじ[^」]+)」/)?.[1],award=title.match(/([A-Z])賞/)?.[1];
 const character=title.match(/^([^「]+)\s「/)?.[1]?.replace(/\s*(?:ラバーストラップ.*|学生証|アクリルカード.*|Cafe ver\..*)$/,'').trim()||null;
 const identity={work,major,subtype,edition,region,platform,volume,wave:wave?Number(wave):null,jan:facts.jan||null,isbn:facts.isbn||null,campaign:campaign||null,award:award||null};
 let path;
 if(doujin)path=['同人',(facts.audience==='male'?'男性向':facts.audience==='female'?'女性向':'受众 / 分级待确认')+(facts.ageRating==='r18'?' R18':''),work,facts.circle||title.match(/^(.+?)\s*\(/)?.[1]||'社团待确认','同人誌'];
 else if(mixed)path=['其他收藏','多IP混合','临时拼包'];
 else if(kuji)path=['TYPE-MOON','Fate','Fate 综合','一番赏',campaign||'活动待确认',major,subtype];
 else if(major==='玩具')path=['TYPE-MOON','Fate','Fate 综合','玩具',subtype,facts.manufacturer||facts.brand||'厂商待确认'];
 else if(work==='Fate/Grand Order')path=['TYPE-MOON','FGO',event?'展会与活动':'FGO 综合',...(event?['FGO Fes.'+event]:[]),major,subtype];
 else if(work.startsWith('Fate'))path=['TYPE-MOON','Fate',work,major,subtype];
 else path=['待归档',work,major];
 path=path.filter((x,i)=>i===0||x!==path[i-1]);
 return {work,major,subtype,mode,identity,path,character,event,campaign,award,missing:(title.match(/状態[:：]([^)]*)/)?.[1]||'').split(/[、,]/).filter(Boolean),reasons};
}
export function familyKey(raw,c=classify(raw)){
 const t=normal(raw.title);
 if(c.major==='书籍'&&c.work==='Fate/Grand Order'&&/Grand Order material\s*[IVX\d]/i.test(t))return 'fgo-material';
 if(/ウエハース/.test(t)&&c.identity.wave)return 'fgo-wafer-'+c.identity.wave;
 if(c.major==='游戏'&&c.subtype==='游戏软件')return c.work==='Fate/EXTELLA LINK'?'extella-link':c.work==='Fate/EXTELLA'?'extella':hash(c.work).slice(0,16);
 if(c.campaign)return 'kuji-'+hash(c.campaign).slice(0,16);
 if(/学生証/.test(t)&&c.event)return 'fes-student-'+c.event;
 if(/SE\.RA\.PH/.test(t))return 'fgo-seraph';
 return 'line-'+hash(c.path.join('/')+'|'+(t.match(/「([^」]+)」/)?.[1]||c.subtype)).slice(0,16);
}
export function conflict(a,b){return ['work','major','edition','region','platform','volume','wave','cardNumber','className','jan','isbn','campaign','award'].filter(k=>a[k]!=null&&b[k]!=null&&String(a[k])!==String(b[k]));}
export function researchJobs(samples,knownFamilies=[]){
 const jobs=new Map(),known=new Set(knownFamilies.map(x=>x.familyKey));for(const sample of samples){const c=classify(sample.raw),key=familyKey(sample.raw,c);if(!jobs.has(key))jobs.set(key,{id:'research-'+hash(key).slice(0,16),familyKey:key,sampleIds:[],reuse:known.has(key),queries:[c.work+' '+(c.identity.wave?'ウエハース'+c.identity.wave:c.major==='书籍'?'書籍 シリーズ':c.major==='游戏'?'製品情報 限定版':'商品')],imageQueries:[normal(sample.title)+' 商品画像'],decision:'evidence-before-add'});jobs.get(key).sampleIds.push(sample.id);}return [...jobs.values()];
}
export function mergePermanent(catalogue,incoming){
 const byKey=new Map(catalogue.map(p=>[p.identityKey,p])),result=[...catalogue],actions=[];
 for(const p of incoming){if(p.mode!=='permanent'||!p.sources?.length||!p.identityKey)throw Error('Permanent catalogue requires scoped identity and evidence');const old=byKey.get(p.identityKey);if(old){if(conflict(old.identity||{},p.identity||{}).length)throw Error('Identity conflict on same catalogue key');old.images=[...new Map([...(old.images||[]),...(p.images||[])].map(x=>[x.url,x])).values()];old.sources=[...new Set([...old.sources,...p.sources])];actions.push({action:'reuse',id:old.id});}else{result.push(p);byKey.set(p.identityKey,p);actions.push({action:'create-permanent',id:p.id});}}return {products:result,actions};
}
