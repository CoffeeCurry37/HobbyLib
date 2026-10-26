import {canonicalEvent} from './event-name';
import type {Item} from './types';
import {cleanProductTitle} from './catalog';
import {sourceCategory} from './source-category';
import {resolveKuji} from './kuji-key';
import {standaloneExtra,gameHardware} from './product-object';

// Activity names are bounded before any merchandise suffix. A quoted product name is not an event.
export function activityName(item:Pick<Item,'title'|'description'>&{event?:string}){
 const kyomaf=item.title.normalize('NFKC').match(/京まふ\s*((?:19|20)\d{2})/);if(kyomaf)return '京まふ '+kyomaf[1];
 if(item.event)return canonicalEvent(item.event);
 const t=(cleanProductTitle(item.title)+' '+item.description).normalize('NFKC');
 if(/TYPE[\s-]?MOON展/i.test(t)&&/15(?:年|周年)の軌跡/.test(t))return 'TYPE-MOON展 Fate/stay night -15年の軌跡-';
 if(/Servant Art Chronicle|最終再臨展/i.test(t))return 'Fate/Grand Order Servant Art Chronicle -最終再臨展-';
 if(/Fate.*星見の回廊/i.test(t))return 'Fate/Grand Order展 -星見の回廊-';
 const fes=t.match(/(?:Fate\s*\/\s*Grand\s*Order|FGO)\s*Fes\.?\s*((?:19|20)\d{2})/i);
 if(fes){const year=Number(fes[1]),anniversary=year-2015;return canonicalEvent(`Fate/Grand Order Fes. ${year} (${anniversary}周年)`);}
 const anniversary=t.match(/(?:Fate\s*\/\s*Grand\s*Order|FGO)\s*(\d{1,2})(?:st|nd|rd|th)?\s*Anniversary/i);
 if(anniversary){const n=Number(anniversary[1]),suffix=n%100>=11&&n%100<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th';return canonicalEvent(`Fate/Grand Order ${n}${suffix} Anniversary (${2015+n})`);}
 const cm=t.match(/コミックマーケット\s*(\d{2,3})|\bC(\d{2,3})\b/);if(cm)return 'コミックマーケット '+(cm[1]||cm[2]);
 if(/TYPE[\s-]?MOON展/i.test(t))return 'TYPE-MOON展';
 const named=t.match(/[「『]([^」』]{3,100}?(?:展覧会|展示会|フェスティバル|イベント|Festival|展))[」』]/i);return named?.[1]||'';
}
export type SaleForm='single'|'media_bundle'|'game_bundle'|'complete_goods'|'variant_group'|'seller_lot';
// The main medium takes precedence over included discs, toys and retailer bonuses.
export function primaryMedium(item:Pick<Item,'title'|'category'>&Partial<Pick<Item,'kind'|'aliases'|'offers'|'evidence'|'inferredMember'|'locked'>>):'book'|'game'|'music'|'video'|''{
 const t=item.title.normalize('NFKC'),source=sourceCategory(item);
 if(standaloneExtra({title:t,kind:item.kind||'unknown'})||gameHardware(item))return '';
 if(/Fate\s*\/\s*(?:EXTRA Record|stay night REMASTERED|hollow ataraxia REMASTERED)/i.test(t)&&!goodsType(item)&&/PlayStation|Nintendo|PS[45]|Switch|ゲームソフト/i.test(t+' '+item.category))return 'game';
 if(source.explicit){if(['doujin','comic','novel','art','magazine','book'].includes(source.type))return 'book';if(source.type==='game')return 'game';if(source.type==='music')return 'music';if(source.type==='video')return 'video';if(['figure','model','goods','card'].includes(source.type))return '';}
 if(/\((?:書籍|コミック|小説)\)|^アニメムック|Anniversary Book|画集|\bmaterial\b|\bbook\b|読本|小説|コミック|ムック|設定資料/i.test(t))return 'book';
 const original=(item.offers||[]).map(o=>o.listingTitle||'').concat(item.aliases||[]);
 if(original.some(s=>/^(?:【[^】]+】\s*)*(?:アニメ(?:Blu-ray|DVD)|BD\s|DVD\s)/i.test(s)))return 'video';
 if(/^(?:【[^】]+】\s*)*(?:ゲーム|アニメ系|音楽)?CD\b|Original Soundtrack|サウンドトラック|\bOST\b|SOUND DRAMA|Drama CD/i.test(t))return 'music';
 if(/(?:REGALIA|VELBER)\s*BOX/i.test(t)&&/マウスパッド|収納(?:ボックス|BOX)|プロダクトコード/i.test(t))return '';
 // Classify the product department, never words in a related work/genre or alias.
 if(source.type==='music')return 'music';if(source.type==='video')return 'video';if(['doujin','comic','novel','art','magazine','book'].includes(source.type))return 'book';
 if(source.type==='game')return 'game';
 if(/Fate\s*\/\s*EXTELLA.*(?:REGALIA|VELBER) BOX/i.test(t))return 'game';
 if(['figure','model','goods'].includes(source.type))return '';
 if(/Blu[- ]?ray|ブルーレイ|\bDVD\b|\bBD\b/i.test(t)&&!/DVD-ROM/.test(t))return 'video';
 if(/DVD-ROM|(?:PS[345P]|PS Vita|Nintendo Switch).*?(?:ゲーム|限定版)|Fate\/EXTELLA.*(?:REGALIA|VELBER) BOX/i.test(t))return 'game';
 return '';
}
export function saleForm(item:Pick<Item,'title'|'category'|'kind'>&Partial<Pick<Item,'kuji'>>&{description?:string}):SaleForm{
 const prize=resolveKuji(item);
 // A logical award catalogue is not a seller's mixed lot. Unknown variant
 // counts do not assert completeness; published multi-variant groups do.
 if(item.kuji?.catalogueGroup&&prize)return prize.prize.count>1?'complete_goods':'single';
 if(prize&&!prize.full&&prize.prize.packPieces>1&&prize.slot)return 'single';
 const title=cleanProductTitle(item.title).normalize('NFKC'),category=item.category+' '+(item.title.match(/^アニメ(?:DVD|Blu-ray|CD)/i)?.[0]||'');
 if(standaloneExtra(item)||/特典のみ|特典単品|収納BOX.*(?:特典|のみ)|(?:購入|店舗|入場)特典/.test(title)||/(?:REGALIA|VELBER)\s*BOX/i.test(title)&&/収納(?:BOX|ボックス)|material|マウスパッド|プロダクトコード/i.test(title))return 'single';
 const medium=primaryMedium(item);
 if(medium==='game'&&(/Fate\s*\/\s*EXTELLA.*(?:REGALIA|VELBER)\s*BOX/i.test(title)||/ゲーム|ゲームソフト|PlayStation|PS[345]|PS Vita|Nintendo|DVD-ROM/i.test(category+' '+title)&&/限定版|限定BOX|BOX|セット|同梱/i.test(title)))return 'game_bundle';
 if(medium==='book')return /セット|まとめ売り|全\d+巻/i.test(title)||item.kind==='set'?'seller_lot':'single';
 if(medium==='music'||medium==='video')return /BOX|SET|セット|同梱|全\d+巻/i.test(title)?'media_bundle':'single';
 if(!/DVD-ROM|ゲーム|書籍|小冊子|画集|設定|material/i.test(category+' '+title)&&/Blu[-\s]?ray|ブルーレイ|\bBD\b|DVD|映像ソフト/i.test(title+' '+category))return /BOX|SET|セット|同梱|全\d+巻/i.test(title)?'media_bundle':'single';
 if(!medium&&/全\s*\d+\s*種\s*(?:コンプリート)?セット|コンプリートセット|フルコンプ|complete set/i.test(title))return 'complete_goods';
 if(/グッズ|周辺|雑貨|卡片|徽章/.test(category)&&/全\s*\d+\s*種(?:がセット|セット(?:です|[\s。]|$))/.test(item.description||'')&&!/全ての種類が揃うわけ|全種.*保証.*(?:ない|ません)/.test(item.description||''))return 'complete_goods';
 if(/全\s*\d+\s*(?:種|色|サイズ)/.test(title)&&!/セット/.test(title))return 'variant_group';
 if(/セット|まとめ売り|全\d+巻/i.test(title)||item.kind==='set')return 'seller_lot';return 'single';
}
export function goodsType(item:Pick<Item,'title'|'category'>){
 const t=cleanProductTitle(item.title)+' '+item.category;
 if(/プラモデル|model kit/i.test(item.category))return '模型';
 if(/アクリルスタンド|アクリル(?:マスコット|フィギュア|パネル)|アクスタ/.test(t))return '亚克力立牌';
 if(/トレーディングフィギュア|食玩|盒蛋|カプセル|ガシャポン|ガチャ|ねんどろいどぷち|すわらせ隊|PalVerse/i.test(t))return '盒蛋 / 食玩';
 if(/figma|ねんどろいど(?!ぷち)|可動|可动|アクションフィギュア|S\.?H\.?Figuarts|リボルテック|MAFEX/i.test(t))return '可动手办';
 if(/フィギュア|figure|ガレージキット|garage kit|\bGK\b|スタチュー|ソフビ|ドール|ぬーどるストッパー|Q\s*posket|Pinky[:\s]*st|ピンキーストリート|スケール.*(?:塗装|完成品)|一番くじ.*[A-D]賞.*(?:セイバー|ライダー)/i.test(t))return '静态手办';
 if(/プラモデル|model kit|模型|ガンプラ/i.test(t))return '模型';
 if(/キャラカード|ポストカード|ブロマイド|コレクションカード|イラストカード|ポートレイト|フォトカード|カードパック/.test(t))return '卡片';
 if(/缶バッジ|キャラバッジ|アクリルバッジ|バッジ/.test(t))return '徽章';
 if(/クリアファイル|クリアホルダー/.test(t))return '文件夹';
 if(/タペストリー|掛け軸/.test(t))return '挂画';
 if(/キーホルダー|ストラップ|チャーム/.test(t))return '挂件';
 if(/ぬいぐるみ|マスコット/.test(t))return '毛绒 / 玩偶';
 if(/コースター|食器|カップ|マグ|湯のみ|ソーサー/.test(t))return '杯具 / 餐具';
 if(/Tシャツ|シャツ|アパレル|パーカー|衣装/.test(t))return '服饰';
 if(/バッグ|ポーチ|トート/.test(t))return '包袋';
 if(/ポスター|複製画|キャラファイン/.test(t))return '海报 / 复制画';
 return '';
}
export const SALE_FORM_NAMES:Record<SaleForm,string>={single:'单品',media_bundle:'捆绑发售',game_bundle:'游戏套装',complete_goods:'完整周边套装',variant_group:'多款商品',seller_lot:'卖家拼套'};
