import {publicationNumber,toyPolicy} from '../../lib/radar/catalogue-policy.mjs';
// Canonical semantic identities are resolved before paths; no sample-number rules.
import {classify as previous,productTitle,normal,hash,researchTrigger as oldTrigger} from '../recognition-v4/rules.mjs';
export {normal,hash};
export const token=t=>normal(t).toLowerCase().replace(/[\s「」『』【】〔〕()（）\[\]・!！/：:._~～-]/g,'');
const works=[['FGO',/Fate\s*\/?\s*Grand\s*Order|\bFGO\b|フェイトグランドオーダー/i,'Fate/Grand Order'],['Fate/EXTELLA LINK',/EXTELLA\s*LINK/i],['Fate/EXTELLA',/EXTELLA/i],['Fate/EXTRA Record',/EXTRA\s*Record/i],['Fate/EXTRA CCC',/EXTRA\s*CCC|エクストラ\s*CCC/i],['Fate/EXTRA',/EXTRA|エクストラ/i],['Fate/stay night',/stay\s*night|ステイナイト/i],['Fate/Zero',/Fate\s*\/\s*Zero/i],['Fate/Apocrypha',/Apocrypha|アポクリファ/i],['Fate/kaleid liner',/kaleid|プリズマ/i],['Fate/strange Fake',/strange\s*Fake/i],['Fate/Samurai Remnant',/Samurai\s*Remnant|サムライレムナント/i],['Fate/hollow ataraxia',/hollow\s*at[ar]+xia/i],['Fate/Prototype',/Prototype|蒼銀|プロトタイプ/i],['Fate/Lost Einherjar',/Lost Einherjar|アスラウグ/i],['Fate/unlimited codes',/unlimited\s*codes|アンリミテッドコード/i],['Fate/tiger colosseum',/タイガーころしあむ/i],['ロード・エルメロイII世の事件簿',/エルメロイ/]];
export function workOf(p){const t=normal(p.identity?.work);if(/WINX|なのは|多IP/.test(t))return t;const fromIdentity=works.find(x=>x[1].test(t));if(fromIdentity?.[0]==='Fate/EXTELLA'&&/EXTELLA\s*LINK/i.test(p.title))return 'Fate/EXTELLA LINK';if(fromIdentity)return fromIdentity[2]||fromIdentity[0];const fromTitle=works.find(x=>x[1].test(p.title));return fromTitle?.[2]||fromTitle?.[0]||'Fate 综合';}
export function workPath(work){if(/WINX|なのは/.test(work))return ['其他收藏',work];if(/多IP/.test(work))return ['其他收藏','多IP商品'];if(/EXTRA|EXTELLA/.test(work))return ['TYPE-MOON','Fate/EXTRA',...(work==='Fate/EXTRA'?[]:[work])];return ['TYPE-MOON',work==='Fate/Grand Order'?'FGO':work];}
const makers=[['Max Factory',/max\s*factory|マックスファクトリー/i],['Good Smile Company',/good\s*smile|グッドスマイル|^GSC$/i],['ORANGE ROUGE',/オランジュ・ルージュ|orange\s*rouge/i],['BANDAI SPIRITS',/bandai\s*spirits|バンプレスト|banpresto/i],['BANDAI',/bandai|バンダイ|万代/i],['KOTOBUKIYA',/コトブキヤ|kotobukiya/i],['ANIPLEX',/アニプレックス|aniplex/i],['ALTER',/アルター|alter/i],['FuRyu',/フリュー|furyu/i],['SEGA',/セガ|sega/i],['VOLKS',/ボークス|volks/i],['Our Treasure',/アワートレジャー|our\s*treasure/i],['KADOKAWA',/kadokawa/i],['AMAKUNI',/amakuni|アマクニ/i],['Easy Eight',/イージーエイト|easy\s*eight/i],['HOBBY STOCK',/ホビーストック|hobby\s*stock/i],['カーテン魂',/カーテン魂|key-th/i],['ATFES',/アトフェス|atfes/i],['うどん工房',/うどん工房/],['LEGS',/レッグス|^legs$/i]];
export const makerOf=t=>makers.find(x=>x[1].test(normal(t)))?.[0]||normal(t)||'厂商待确认';
export function cleanTitle(t){return productTitle(t).replace(/^<<[^>]+>>\s*/,'').replace(/^【FGO\s*Fes\.?\s*\d{4}】\s*/i,'').replace(/^【(?:ボックス|パック)】\s*/,'').trim();}
export function classify(raw){const c=previous(raw),t=normal(raw.title);if(c.major==='周边'&&/turas\s*r[ée]alta|SE\.RA\.PH|新宿幻[霊灵]事件/i.test(t)&&/\d+\s*(?:[～~-]\s*\d+)?[巻卷]/.test(t)){c.major='书籍';c.subtype='漫画';c.identity={...c.identity,major:c.major,subtype:c.subtype};}if(/ガレージキット|レジンキット|キャラグミン|\bGK\b/i.test(t)){c.excludedFromExperiment=false;c.major='玩具';c.subtype='GK';c.mode=/まとめ|\d+種セット/.test(t)?'temporary':'permanent';c.identity={...c.identity,major:c.major,subtype:c.subtype};}return c;}
export function normalizeLegacyCategory(p,raw){
 const knownMajor=(p.path||[]).find(x=>['书籍','卡片','大周边','周边','音像','玩具','游戏'].includes(x));
 if(/^(漫画|小说|杂志|设定资料集|画集|书籍)$/.test(p.type))p.identity.major='书籍';
 else if(/威化/.test(p.type)){p.identity.major='卡片';p.type='威化卡片';}
 else if(/入场特典卡|角色肖像卡/.test(p.type))p.identity.major='卡片';
 else if(/游戏店铺特典|数字特典/.test(p.type))p.identity.major='游戏';
 else if(!p.identity.major)p.identity.major=knownMajor||classify(raw||{title:p.title}).major;
 if(p.identity.major==='书籍'&&/卖家组套|卖家拼套/.test(p.type))p.type=classify(raw||{title:p.title}).subtype;
 if(p.identity.major==='卡片'&&/威化|ウエハース/.test(p.title))p.type='威化卡片';
 return p;
}
export function eventOf(p){const t=normal([p.title,...(p.eventMembership||[]),...(p.path||[])].join(' '));if(/星見[の回廊見回廊]/.test(t))return 'FGO展 星見の回廊';if(/最終再臨|最终再临|Servant Art Chronicle/i.test(t))return 'Servant Art Chronicle 最終再臨展';const fes=t.match(/F(?:GO\s*)?es\.?\s*(20\d{2})/i);if(fes)return 'FGO Fes.'+fes[1];if(/サテライト|卫星/.test(t))return 'カルデア・サテライトステーション'+(t.match(/20\d{2}/)?.[0]?' '+t.match(/20\d{2}/)[0]:'');if(/ワダアルコ展/.test(t))return 'ワダアルコ展';const com=t.match(/(?:Comiket|コミケ|コミックマーケット)\s*(\d+)/i);if(com)return 'Comiket '+com[1];if(/OVER THE SAME SKY/.test(t))return 'OVER THE SAME SKY';return null;}
export function lineOf(p){
 const t=normal(p.title),work=workOf(p),major=p.identity?.major,type=p.type;
 if(p.seriesKey&&p.seriesLabel)return {key:p.seriesKey,label:p.seriesLabel,parent:p.seriesParent||null,batch:p.seriesBatch||null};
 if(major==='卡片'&&/威化|ウエハース/.test(t+' '+type)){const wave=p.identity.wave||Number(t.match(/(?:第|ウエハース|威化)\s*(\d+)/)?.[1]);return {key:wave?'wafer'+wave:'wafer-unspecified',label:'威化卡片',parent:'威化卡片',batch:wave?'第'+wave+'弹':null};}
 if(/ぴくりる/.test(t)){const batch=Number(t.match(/vol\.?\s*(\d+)/i)?.[1])||null;const kind=/アクリルスタンド/.test(t)?'アクリルスタンド':/缶キーホルダー/.test(t)?'缶キーホルダー':'トレーディング缶バッジ';return {key:'pikuriru:'+token(work)+':'+token(kind)+(batch?':'+batch:''),label:'ぴくりる! '+kind,parent:'ぴくりる! '+kind,batch:batch?'vol.'+batch:null};}
 if(major==='书籍'){
  for(const [re,key,label] of [[/SE\.RA\.PH|深海[電电][脳脑][楽乐]土/i,'seraph','深海電脳楽土 SE.RA.PH'],[/新宿幻[霊灵]事件/,'shinjuku','新宿幻霊事件'],[/turas\s*r[ée]alta/i,'turas','turas réalta'],[/カルデアエース/,'chaldea-ace','カルデアエース'],[/Grand\s*Order\s*material|^FGO\s*material/i,'material','FGO material']])if(re.test(t))return {key,label};
 }
 if(major==='游戏'&&/游戏软件|ゲーム/.test(type))return {key:'game:'+work,label:work};
 if(/オーロラアクリルカード/.test(t)&&work==='Fate/strange Fake')return {key:'fsf:atfes:aurora-cards',label:'ATFES オーロラアクリルカード'};
 if(/Cafe\s*ver/i.test(t)&&work==='Fate/strange Fake')return {key:'fsf:cafe:'+token(type),label:'Cafe ver. '+type};
 if(/ミニキャラ/.test(t)&&work==='Fate/strange Fake'){const kind=/缶バッジ/.test(t)?'缶バッジ':/アクリルスタンド/.test(t)?'アクリルスタンド':type;return {key:'fsf:curtain:mini:'+token(kind),label:'カーテン魂 ミニキャラ '+kind};}
 // A quoted product-line name is stronger than a character prefix or a BOX wrapper.
 let label=t.match(/「([^」]+)」/)?.[1]||'';label=label.replace(/^【[^】]+】\s*/,'');
 const named=/トレーディング|コレクション|ぴくりる|グリッター|宝具|チケットライク|vol\.?\s*\d+|第\d+弾/i;
 if(!named.test(label)&&named.test(t)){label=cleanTitle(t).replace(/^(?:全\d+種セット|【ボックス】|【パック】)\s*/,'').replace(/\s*\d+個入り(?:1?BOX)?/i,'').replace(/\s*[（(]?(?:BOX|1PCS)[)）]?/i,'');}
 if(named.test(label))return {key:'line:'+token(work)+':'+token(label),label:label.replace(/^Fate\s*\/\s*Grand\s*Order\s*/i,'').slice(0,110)};
 const numbered=publicationNumber(t,major);if(numbered)return {key:'publication:'+token(work)+':'+token(numbered.line),label:numbered.line};
 if((major==='书籍'||major==='音像')&&/VOL\.?\s*\d+|第?\d+\s*(?:[～~-]\s*\d+)?巻|[（(]\d+[)）]/i.test(t)){const label=cleanTitle(t).replace(/\s*(?:VOL\.?\s*\d+|第?\d+\s*(?:[～~-]\s*\d+)?巻|[（(]\d+[)）])(?:セット)?/ig,'').replace(/\s+\/\s+[^/]+$/,'').trim();return {key:'publication:'+token(work)+':'+token(label),label};}
 if(['周边','大周边','卡片'].includes(major)&&/アクリル|缶バッジ|キーホルダー|ラバーストラップ|タペストリー/.test(t)){
  const quoted=t.match(/「([^」]+)」/)?.[1];if(quoted&&token(quoted)!==token(work)&&quoted.length>work.length+3)return {key:'goods:'+token(work)+':'+token(type)+':'+token(quoted),label:quoted+' '+type};
 }
 return null;
}
export function scopeOf(p){if(p.scope)return p.scope;const t=normal(p.title);if(p.mode==='temporary')return 'seller-lot';if(p.catalogueLevel==='variant-group'||p.catalogueLevel==='award-group')return 'lineup';if(/【ボックス】|\bBOX\b|ボックス|個入り1?BOX/i.test(t)&&p.identity?.major!=='游戏')return 'official-box';if(/【パック】|1PCS|ランダム.*パック/i.test(t))return 'blind-pack';if(p.identity?.major==='游戏'&&p.type==='游戏软件')return 'game-edition';if(/セット/.test(t)&&p.origin?.startsWith('series-expansion')&&p.mode==='permanent')return 'official-set';return 'single';}
export function toyRoute(p,raw){const t=normal(p.title),facts=raw?.facts||{};let maker=makerOf(facts.manufacturer||facts.brand||p.manufacturer||p.identity.manufacturer),line;
 const figure=classify({title:t,categoryLabel:raw?.categoryLabel||'',facts});let type=p.type==='GK'||figure.subtype==='GK'?'GK':/figma|ねんどろいど|粘土人|人偶服装|おようふく/i.test(t+' '+p.type)?'可动':/ぬい|毛绒|もちもち/.test(t+' '+p.type)?'毛绒':'静态';
 if(/figma/i.test(t)){maker='Max Factory';line='figma';}
 else if(/ねんどろいど|粘土人|人偶服装/.test(t+' '+p.type)){if(maker==='ORANGE ROUGE')p.manufacturerBrand='ORANGE ROUGE';maker='Good Smile Company';line='粘土人';}
 else {const known=makers.find(x=>x[1].test(t));if(maker==='厂商待确认'&&known)maker=known[0];
  for(const [re,name,m] of [[/ぬーどるストッパー/,'ぬーどるストッパー','FuRyu'],[/Luminasta/i,'Luminasta','SEGA'],[/ConoFig/i,'ConoFig','ANIPLEX'],[/KDcolle/i,'KDcolle','KADOKAWA'],[/キャラグミン/,'キャラグミン','VOLKS'],[/Summer Queens/i,'Summer Queens','Our Treasure'],[/POP UP PARADE/i,'POP UP PARADE',null],[/SMILE 600/i,'SMILE 600','Good Smile Company'],[/一番くじ|一番赏/,'一番赏',null],[/もちもちマスコット/,'もちもちマスコット',null]])if(re.test(t)){line=name;if(m)maker=m;break;}
  if(line==='一番赏'&&maker==='厂商待确认')maker='BANDAI SPIRITS';
 }
 p.manufacturer=maker;p.toySeries=line||null;return ['TYPE-MOON','Fate 综合','玩具',type,maker,line||'未标注产品线'];
}
const typeNames={'缶バッジ':'徽章','タペストリー':'挂画','アクリルスタンド':'亚克力立牌','ラバーストラップ':'橡胶挂件','ラバーチャーム':'橡胶挂件','ポスター':'海报','ポーチ':'收纳包','卡片':'其他卡片','其他周边':'其他周边'};
export function route(p,raw){const work=workOf(p),major=p.identity.major;const base=workPath(work),event=eventOf(p),line=lineOf(p);p.identity.work=work;p.scope=scopeOf(p);p.seriesKey=line?.key||null;p.seriesLabel=line?.label||null;p.seriesParent=line?.parent||null;p.seriesBatch=line?.batch||null;
 if(major==='玩具'&&/WINX/.test(work)){p.path=toyPolicy(p,work);return p;}
 if(major==='玩具'&&!/WINX|なのは/.test(work)){p.path=toyRoute(p,raw);if(event)p.eventMembership=[...new Set([...(p.eventMembership||[]),event])];return p;}
 let type=typeNames[p.type]||p.type||'其他商品';if(major==='游戏'){p.path=[...base,'游戏',p.type==='游戏软件'?'发行版本':/特典|コード|挂画/.test(p.type)?'特典':p.type];return p;}
 let path=[...base];if(event)path.push('展会与活动',event);
 else if(/一番くじ/.test(p.title)||p.identity.campaign){path.push('一番赏',p.identity.campaign||p.seriesResearch?.familyLabel||'场次待确认');}
 if(major==='大周边')path.push('周边','大周边',type);else path.push(major==='书籍'?'书籍':major||'周边',type);
 if(line&&!['game-edition'].includes(p.scope)){path.push(line.parent||line.label);if(line.batch)path.push(line.batch);}
 p.path=path.filter((x,i,a)=>x&&!a.slice(0,i).includes(x));return p;
}
export const scopeLabel={single:'单品','game-edition':'发行版本','official-box':'官方盒装','blind-pack':'官方随机包','official-set':'官方套装',lineup:'款式与奖项总览','seller-lot':'临时组合'};
export function makeTree(products){
 const visible=products.filter(p=>p.visible);
 // Every family has homogeneous leaf scopes, including families containing both submodules and direct items.
 const paths=new Map();for(const p of visible){const k=JSON.stringify(p.path);if(!paths.has(k))paths.set(k,{path:[...p.path],scopes:new Set()});paths.get(k).scopes.add(p.scope);}
 const decisions=new Map([...paths].map(([k,v])=>[k,v.scopes.size>1||[...paths.values()].some(a=>a.path.length>v.path.length&&v.path.every((x,i)=>a.path[i]===x))]));
 for(const p of visible)if(decisions.get(JSON.stringify(p.path)))p.path.push(scopeLabel[p.scope]||'单品');
 const tree=new Map();for(const root of ['TYPE-MOON','变形金刚','机器人/模型','其他收藏','待归档','同人'])tree.set(hash(root).slice(0,16),{id:hash(root).slice(0,16),title:root,path:[root],parentId:null,productIds:[],directProductIds:[]});
 for(const p of visible)for(let i=1;i<=p.path.length;i++){const path=p.path.slice(0,i),id=hash(path.join(' / ')).slice(0,16);if(!tree.has(id))tree.set(id,{id,title:path.at(-1),path,parentId:i>1?hash(path.slice(0,-1).join(' / ')).slice(0,16):null,productIds:[],directProductIds:[]});tree.get(id).productIds.push(p.id);if(i===p.path.length)tree.get(id).directProductIds.push(p.id);}
 for(const m of tree.values())m.kind=[...tree.values()].some(c=>c.parentId===m.id)?'branch':'leaf';return [...tree.values()];
}
export function researchTrigger(raw,c=classify(raw)){if(c.excludedFromExperiment)return null;const p={title:raw.title,type:c.subtype,identity:c.identity,mode:c.mode,path:[]};if(c.subtype==='GK')return {key:'image:'+hash(raw.title).slice(0,16),label:cleanTitle(raw.title),kind:'image-only',query:cleanTitle(raw.title)+' 画像',required:['images'],seriesExpansion:false};const line=lineOf(p),event=eventOf(p),old=oldTrigger(raw,c);
 if(event)return {...old,key:'event:'+token(event),label:event,kind:'event-catalogue',query:event+' グッズ 一覧 公式',required:['members','scope','images']};
 if(line&&c.major!=='玩具')return {...old,key:line.key,label:line.label+(line.batch?' '+line.batch:''),kind:c.major==='游戏'?'game-editions':c.major==='书籍'?'book-volumes':'collectible-lineup',query:line.label+(line.batch?' '+line.batch:'')+' 商品一覧 特典 公式',required:['members','scope','images']};return old;
}
