import {currentEditorial} from './editorial';
import type {Item} from './types';
import {manualField,bookMedium} from './catalog';
import {sourceCategory} from './source-category';
import {primaryMedium,goodsType} from './product-features';
import {gameHardware,standaloneExtra} from './product-object';
export const PRODUCT_CLASSES=['书籍','游戏','影像','周边','大型周边','卡片','玩具','同人'] as const;
export type ProductClass=typeof PRODUCT_CLASSES[number];
export function productClass(item:Item):ProductClass{
 if(item.majorClass&&(item.catalogueGroup||currentEditorial(item)||manualField(item,'majorClass')))return item.majorClass;
 if(item.origin==='doujin'||sourceCategory(item).type==='doujin'&&item.origin!=='commercial')return '同人';
 if(gameHardware(item))return '大型周边';
 const medium=primaryMedium(item);if(medium==='book')return '书籍';if(medium==='game')return '游戏';if(medium==='music'||medium==='video')return '影像';
 const t=item.title.normalize('NFKC'),goods=goodsType(item);
 if(sourceCategory(item).type==='card')return '卡片';
 if(['静态手办','可动手办','盒蛋 / 食玩','模型'].includes(goods)||['figure','model'].includes(sourceCategory(item).type))return '玩具';
 if(/タペストリー|掛け軸|複製(?:原画|画)|キャラファイングラフ|プリモアート|キャンバスアート|額装|等身大(?:パネル|スタンド)|(?:B[12]|A[12]|大判|等身大).*(?:ポスター|アートボード)|(?:ポスター|アートボード).*(?:B[12]|A[12]|大判|等身大)/i.test(t))return '大型周边';
 if(!/カード(?:スリーブ|ケース|ホルダー)|カード入れ|パスケース|カード収納|メモリーカード|(?:micro)?SDカード|グラフィックカード/i.test(t)&&(/カード|ポストカード|ブロマイド|トレカ|TCG|集换式|集換式|ヴァイス|Lycee|セイントグラフ|ウエハース|ウェハース/i.test(t)||goods==='卡片'))return '卡片';
 return '周边';
}
export function productSubtype(item:Item){if(currentEditorial(item)&&item.productType)return item.productType;const c=productClass(item),source=sourceCategory(item),t=item.title.normalize('NFKC');
 if(c==='书籍'){if(/図録|图录/.test(t))return '展会图录';if(source.type==='magazine'||/TYPE[\s-]?MOONエース/.test(t))return '杂志';if(source.type==='art'||/画集|illustration|art ?book|ART WORKS|原画集/i.test(t))return '画集';if(/設定|设定|material|マテリアル|読本|月姫想本|Compilation|Fantasm/i.test(t))return '设定集';if(source.type==='comic'||bookMedium(item)==='manga')return '漫画';if(source.type==='novel'||bookMedium(item)==='novel')return '小说';return '其他书籍';}
 if(c==='影像'){if(primaryMedium(item)==='music')return /sound.?drama|drama.?CD|ドラマCD/i.test(t)?'广播剧 / Drama CD':/サウンドトラック|Soundtrack|\bOST\b/i.test(t)?'原声 / OST':'音乐 / CD';if(/THE STAGE|舞台|コンサート|Concert|ライブ/i.test(t))return '舞台 / 演出';return /劇場|Heaven[’'s ]*Feel|空の境界|雪下の誓い|Licht/i.test(t)?'剧场版':'TV / OVA';}
 if(c==='游戏')return '游戏';if(c==='玩具'){if(/ガレージキット|garage kit|\bGK\b|レジンキット|树脂/i.test(t))return '树脂 / GK';if(/プライズ|景品|ぬーどるストッパー|Q\s*posket|スーパープレミアム|SPM|ちょこのせ/i.test(t))return '景品手办';return goodsType(item)||'其他玩具';}
 if(c==='大型周边')return gameHardware(item)?'联名硬件':/タペストリー|掛け軸/i.test(t)?'挂画':'复制原画 / 大型展示';
 if(c==='卡片')return /ウエハース|ウェハース/i.test(t)?'威化卡片':/Arcade|アーケード/i.test(t)?'FGO Arcade 卡片':/ヴァイス|Weiss|Wei[ßs]s/i.test(t)?'Weiß Schwarz':/Lycee/i.test(t)?'Lycee':goodsType(item)==='卡片'?'明信片 / 图卡':'其他卡片';
 return goodsType(item)||'其他周边';
}
