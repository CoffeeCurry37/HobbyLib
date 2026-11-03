// Shared, browser-safe catalogue policy. A research signal never creates an unverified release.
export const POLICY_VERSION = 6;
export const compact = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
export function nonTypeMoonWork(title) {
 const t=String(title||'').normalize('NFKC');
 if(/WINX\s*SAGA|ウィンクス.*サーガ/i.test(t))return 'FATE: THE WINX SAGA';
 // A character called Fate is not the TYPE-MOON franchise.
 if(/リリカルなのは|\bNanoha\b|フェイト[・\s]*テスタロッサ|Fate\s*Testarossa|フェイト[・\s]*T[・.\s]*ハラオウン/i.test(t))return '魔法少女リリカルなのは';
 return '';
}
export function canonicalWork(value, title = '') {
 const t = String(title || value || '').normalize('NFKC');
 const other=nonTypeMoonWork(t);if(other)return other;
 const works = [[/EXTELLA\s*LINK/i,'Fate/EXTELLA LINK'],[/EXTELLA/i,'Fate/EXTELLA'],[/EXTRA\s*Record/i,'Fate/EXTRA Record'],[/EXTRA\s*CCC|エクストラ\s*CCC/i,'Fate/EXTRA CCC'],[/Fate\s*\/?\s*EXTRA|フェイト.*エクストラ/i,'Fate/EXTRA'],[/Fate\s*\/?\s*Grand\s*Order|\bFGO\b/i,'Fate/Grand Order'],[/Fate\s*\/?\s*stay\s*night|ステイナイト/i,'Fate/stay night'],[/Fate\s*\/?\s*Zero/i,'Fate/Zero'],[/Apocrypha|アポクリファ/i,'Fate/Apocrypha'],[/kaleid|プリズマ.*イリヤ/i,'Fate/kaleid liner'],[/strange\s*Fake/i,'Fate/strange Fake'],[/Samurai\s*Remnant|サムライレムナント/i,'Fate/Samurai Remnant'],[/hollow\s*ataraxia/i,'Fate/hollow ataraxia']];
 const hit=works.find(([re])=>re.test(t));if(hit)return hit[1];
 const known=works.find(([re])=>re.test(String(value)));if(known)return known[1];
 return /^(?:『?Fate』?(?:[\s/]*シリーズ|系列|综合)?|FGO综合)$/i.test(String(value).trim())?'Fate 综合':value||'';
}
export function canonicalMaker(s) {
 const aliases=[[/max\s*factory|マックスファクトリー/i,'Max Factory'],[/good\s*smile|グッドスマイル|^GSC$/i,'Good Smile Company'],[/bandai\s*spirits|バンプレスト|banpresto/i,'BANDAI SPIRITS'],[/bandai|バンダイ|万代/i,'BANDAI'],[/kotobukiya|コトブキヤ|寿屋/i,'KOTOBUKIYA'],[/aniplex|アニプレックス/i,'ANIPLEX'],[/alter|アルター/i,'ALTER'],[/furyu|フリュー/i,'FuRyu'],[/sega|セガ/i,'SEGA'],[/volks|ボークス/i,'VOLKS'],[/orange\s*rouge|オランジュ/i,'ORANGE ROUGE']];
 return aliases.find(([re])=>re.test(s||''))?.[1]||s||'厂商待确认';
}
export function publicationNumber(title, major) {
 if(!['书籍','音像','影像'].includes(major))return null;
 let t=String(title).normalize('NFKC').trim();
 if(/\d\s*\/\s*\d|\bPS[1-5]\b|\b3DS\b|\d+\s*(?:円|日元|個|枚|点|種|本セット)|(?:19|20)\d{2}/i.test(t))return null;
 t=t.replace(/\s*\[(?:完全生産限定版|初回限定版|初回生産限定版|通常版|限定版|特装版)\]\s*$/i,'').replace(/\s*\((?:完全生産限定版|初回限定版|通常版)\)\s*$/i,'').trim();
 const range=t.match(/^(.*?)\s*(?:第|vol\.?\s*)?(\d{1,3})\s*[~～〜-]\s*(\d{1,3})\s*[巻卷]?\s*(?:セット|set)$/i);
 if(range&&range[1].trim().length>=3)return {line:range[1].trim(),number:null,range:[+range[2],+range[3]]};
 const m=t.match(/^(.*?)\s*(?:\(\s*(\d{1,3})\s*\)|(?:第|vol\.?\s*)(\d{1,3})\s*[巻卷号]?|(\d{1,3})\s*[巻卷号]|\s+(\d{1,3}))$/i);
 if(!m||m[1].trim().length<3)return null;const number=Number(m.slice(2).find(Boolean));if(!number||number>999)return null;
 return {line:m[1].trim(),number,range:null};
}
export function canonicalLine(value) {
 const t=String(value||'').normalize('NFKC');
 if(/SE\.RA\.PH|深海[電电][脳脑][楽乐]土/i.test(t))return '深海電脳楽土 SE.RA.PH';
 if(/新宿幻[霊灵]事件/.test(t))return '新宿幻霊事件';
 if(/turas\s*r[ée]alta/i.test(t))return 'turas réalta';
 if(/Grand\s*Order\s*material|^FGO\s*material/i.test(t))return 'FGO material';
 if(/カルデアエース/.test(t))return 'カルデアエース';
 
 return t.trim();
}
export function lineSignal(item, major, subtype) {
 const t=String(item.title||'').normalize('NFKC');
 if(/ガレージキット|レジンキット|キャラグミン|\bGK\b/i.test(t))return {kind:'image-only',label:t,seriesExpansion:false};
 if(item.origin==='doujin'||major==='同人')return null;
 if(/ぴくりる/.test(t)){const n=t.match(/vol\.?\s*(\d+)/i)?.[1];const kind=/アクリルスタンド/.test(t)?'アクリルスタンド':/缶キーホルダー/.test(t)?'缶キーホルダー':'トレーディング缶バッジ';return {kind:'collectible-lineup',label:'ぴくりる! '+kind,parent:'ぴくりる! '+kind,batch:n?'vol.'+n:'',seriesExpansion:true};}
 if(/ウエハース|ウェハース|威化/.test(t)){const n=item.wave||t.match(/(?:ウエハース|ウェハース|第)\s*(\d+)/)?.[1];return {kind:'collectible-lineup',label:'威化卡片',parent:'威化卡片',batch:n?'第'+n+'弹':'',seriesExpansion:true};}
 if(major==='书籍'||major==='影像'||major==='音像'){
  const n=publicationNumber(t,major),line=/絶対魔獣戦線バビロニア/.test(t)?'絶対魔獣戦線バビロニア':canonicalLine(item.productLine||n?.line||t);
  if(n||line!==t||/漫画|コミック|杂志/.test(subtype||''))return {kind:major==='书籍'?'book-volumes':'media-volumes',label:line,number:n?.number||null,seriesExpansion:true};
 }
 if(major==='游戏')return {kind:'game-editions',label:canonicalWork(item.series,t),seriesExpansion:true};
 if(item.kuji||/一番くじ|一番赏|一番賞/.test(t))return {kind:'prize-lineup',label:item.kuji?.campaign||item.productLine||t,seriesExpansion:true};
 if(major==='玩具')return null;
 const quoted=t.match(/「([^」]+)」/)?.[1],named=/トレーディング|コレクション|グリッター|チケットライク|ミニキャラ|Cafe\s*ver|オーロラアクリル|vol\.?\s*\d+/i;
 if(named.test(t)){const line=quoted&&named.test(quoted)?quoted:t.replace(/^【(?:ボックス|パック)】\s*/,'').replace(/^全\d+種セット\s*/,'').replace(/\s*\d+個入り.*$/i,'');return {kind:'collectible-lineup',label:line,seriesExpansion:true};}
 return null;
}
export function toyPolicy(item, work) {
 const t=String(item.title||''),kind=/ガレージキット|レジンキット|キャラグミン|\bGK\b/i.test(t)?'GK':/figma|ねんどろいど|粘土人|おようふく|人偶服装/i.test(t)?'可动':'静态';
 let maker=canonicalMaker(item.manufacturer||item.brand),line='';
 if(/TYPE[ -]?MOON|型月|品牌待整理|作品待确认/i.test(maker))maker='厂商待确认';
 if(/figma/i.test(t)){maker='Max Factory';line='figma';}
 else if(/ねんどろいど|粘土人|おようふく|人偶服装/i.test(t)){maker='Good Smile Company';line='粘土人';}
 else for(const [re,label,brand]of [[/Q\s*posket/i,'Q posket','BANDAI SPIRITS'],[/ConoFig/i,'ConoFig','ANIPLEX'],[/Luminasta/i,'Luminasta','SEGA'],[/ぬーどるストッパー/,'ぬーどるストッパー','FuRyu'],[/POP UP PARADE/i,'POP UP PARADE',''],[/KDcolle/i,'KDcolle','KADOKAWA'],[/キャラグミン/,'キャラグミン','VOLKS'],[/Summer Queens/i,'Summer Queens','Our Treasure']])if(re.test(t)){line=label;if(brand)maker=brand;break;}
 if(!line&&item.productLine&&!/Fate|Grand Order|FGO|型月/.test(item.productLine))line=item.productLine;
 const fate=!/WINX/i.test(work)&&/^Fate|^FGO|エルメロイ/i.test(work);
 return [...(fate?['TYPE-MOON','Fate 综合']:['其他收藏',work||'作品待确认']),'玩具',kind,maker,line||'未标注产品线'];
}
export function scopeLabel(item) {
 if(item.catalogueGroup||item.kuji?.catalogueGroup)return '系列总览';
 if(item.saleForm==='seller_lot'||item.setMode==='lot')return '临时组合';
 if(item.kind==='bonus')return '特典';
 if(/【ボックス】|\bBOX\b|個入り.*BOX/i.test(item.title)&&item.majorClass!=='游戏')return '官方盒装';
 if(item.kind==='set')return '官方套装';
 return '单品';
}
