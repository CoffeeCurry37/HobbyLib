import type {Item} from './types';
import {sourceCategory} from './source-category';
// A retailer bonus attached to a disc is different from the bonus sold alone.
export function standaloneExtra(item:Pick<Item,'title'|'kind'>){
 const t=item.title.normalize('NFKC');
 if(/特典のみ|特典単品|付録のみ|フィギュア単品|プロダクトコード/.test(t))return true;
 if(/^(?:【[^】]*特典[^】]*】\s*)*(?:【特典】\s*)?(?:BD|DVD|CD)\s/i.test(t)||/特典(?:付|付き|同梱|つき)|付録(?:付|付き|つき)/.test(t))return false;
 return /(?:購入|店舗|入場|来場|全巻|予約)特典|ゲーム特典|(?:BD|DVD|Blu-ray).*?特典.*?(?:タペストリー|ポストカード|ブロマイド|収納|色紙)/i.test(t)||item.kind==='bonus'&&/特典|付録/.test(t);
}
export function gameHardware(item:Pick<Item,'title'|'category'>&Partial<Pick<Item,'evidence'|'tags'|'locked'>>){
 const source=sourceCategory(item),category=source.value.normalize('NFKC');
 if(['book','comic','novel','art','magazine','music','video','figure','model'].includes(source.type)||source.type==='game'&&source.explicit)return false;
 const t=item.title.normalize('NFKC').replace(/\([^)]*国内版本体[^)]*\)/g,'');
 if(/メモリーカード|クリアケース|保護(?:ケース|カバー|フィルム)|ステッカー|収納ケース|充電器|ストラップ/.test(t))return false;
 return /ゲーム機|(?:PlayStation|PS[1-5P]|PS.?Vita|Nintendo Switch|ニンテンドー|ゲームボーイ|XBOX).*(?:本体|コントローラ|Edition|エディション)/i.test(t)&&!/ゲームソフト/.test(t)||/ハード/.test(category)&&/(?:PlayStation|PS[1-5P]|PS.?Vita|ニンテンドー|Nintendo|ゲームボーイ|XBOX).*(?:Edition|エディション|Wi-?Fi|モデル|同梱)/i.test(t);
}
