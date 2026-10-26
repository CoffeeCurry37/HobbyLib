import type {Item} from './types';
import {manualField} from './catalog';

export type CategoryType='doujin'|'comic'|'novel'|'art'|'magazine'|'book'|'music'|'video'|'game'|'figure'|'model'|'card'|'goods'|'';
export function categoryType(raw:string):CategoryType{
 const original=raw.normalize('NFKC'),comicGoods=/コミック、アニメグッズ/.test(original);
 const s=original.replace(/コミック、アニメグッズ|映像・音楽ソフト|CD、DVD|アニメ・漫画系書籍|漫画・アニメ|書籍・ソフトウェア|一般ゲーム系|ゲーム原作系|ゲームソフト関連|本、雑誌(?=\s*[>\/])/g,'');
 if(/同人誌|\bdoujin(?:shi)?\b/i.test(s))return 'doujin';
 // A CD category may contain the genre “anime/comic”; the medium is its parent.
 if(/音楽(?:CD|ソフト)?|ミュージックCD|アニメ系CD|サウンドトラック|(?:^|[>\/\s])CD(?:$|[>\/\s])|\bmusic\b|\bsoundtrack\b/i.test(s))return 'music';
 if(!/映像ソフト/.test(s)&&/DVD-ROM|Windows.*ソフト|(?:PC|パソコン)ゲーム|アダルトゲーム/i.test(s))return 'game';
 if(/映像ソフト|Blu[- ]?ray|ブルーレイ|\bDVD\b|^BD$|\bvideo\b/i.test(s))return 'video';
 if(/プラモデル|\bmodel kits?\b|模型/i.test(s))return 'model';
 if(!/カード(?:スリーブ|ケース|ホルダー)|カード入れ/.test(s)&&/トレーディングカード|トレカ|TCG|マジックザギャザリング|ヴァイスシュヴァルツ|Lycee|カードゲーム|\b(?:trading|collectible) cards?\b|^カード$/i.test(s))return 'card';
 if(/アクリル(?:フィギュア|スタンド)|ストラップ|ポスター|タペストリー|缶バッジ|キーホルダー|しおり|グラス|クリアファイル|カレンダー|カード|ぬいぐるみ/i.test(s))return 'goods';
 if(/フィギュア|\bfigures?\b|\btoys?\b|食玩/i.test(s))return 'figure';
 if(/コミック|漫画|\bcomics?\b|\bmanga\b/i.test(s))return 'comic';
 if(/小説|ライトノベル|文庫|\bnovels?\b/i.test(s))return 'novel';
 if(/画集|\bart\s*books?\b/i.test(s))return 'art';
 if(/雑誌|\bmagazines?\b/i.test(s))return 'magazine';
 if(/書籍|ムック|本・雑誌|\bbooks?\b/i.test(s))return 'book';
 if(/グッズ|雑貨|周辺|周边|\bgoods\b|\bmerchandise\b|\baccessories\b/i.test(s))return 'goods';
 if(/ゲーム機|本体|周辺機器|コントローラ|(?:PS[1-5P]|PSVita|PS Vita|ニンテンドー|Nintendo|ゲーム|XBOX).*ハード|\bhardware\b/i.test(s))return 'goods';
 if(/ゲームソフト|DVD-ROM|\bvideo game\b|\bgame software\b|(?:PS[1-5P]|PSVita|PS Vita|ニンテンドー|Nintendo|プレイステーション|PlayStation|ドリームキャスト|セガサターン|ゲームボーイ|ワンダースワン|(?:^|[\s>\/])(?:DS|3DS|GBA|WS|PC)|パソコン|XBOX).*ソフト|^(?:ゲーム|game)$/i.test(s))return 'game';
 if(comicGoods)return 'goods';
 return '';
}
export function sourceCategory(item:Pick<Item,'category'>&Partial<Pick<Item,'evidence'|'tags'|'locked'>>){
 if(item.locked&&manualField({...item,evidence:item.evidence||[]} as Item,'category'))return {value:item.category,type:categoryType(item.category),explicit:true};
 const candidates=(item.evidence||[]).filter(e=>(e.field==='category'||e.field==='来源分类')&&!!e.url&&/^https:\/\//.test(e.url)&&/来源|商品|原站/.test(e.method)&&categoryType(e.value));
 candidates.sort((a,b)=>{
  const score=(e:typeof a)=>e.field==='来源分类'?100:/^(?:グッズ|書籍|books?|goods)$/i.test(e.value)?1:5;
  return score(b)-score(a)||b.at.localeCompare(a.at);
 });
 const exactTag=(item.evidence||[]).filter(e=>e.field==='来源关键词').flatMap(e=>e.value.split('、')).concat((item.tags||[]).filter(t=>/^(?:book|comic|manga|novel)$/i.test(t))).find(t=>/^(?:book|comic|manga|novel|figure|toy|同人誌)$/i.test(t));
 const value=candidates[0]?.value||exactTag||item.category;
 return {value,type:categoryType(value),explicit:!!candidates.length||!!exactTag};
}
export const normalizedCategories:Record<Exclude<CategoryType,''>,string>={doujin:'同人誌',comic:'コミック',novel:'小説',art:'画集',magazine:'雑誌',book:'書籍',music:'音楽CD',video:'映像ソフト',game:'ゲームソフト',figure:'フィギュア',model:'プラモデル',card:'カード',goods:'グッズ'};
