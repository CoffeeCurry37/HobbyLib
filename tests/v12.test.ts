import assert from 'node:assert/strict';
import {createItem} from '../lib/radar/engine';import {DEFAULT_PREFS,Item} from '../lib/radar/types';import {repairClassification} from '../lib/radar/classification';import {productClass,PRODUCT_CLASSES} from '../lib/radar/product-class';import {inferredPath,buildCatalogue} from '../lib/radar/taxonomy';import {categoryType} from '../lib/radar/source-category';import {primaryMedium,saleForm} from '../lib/radar/product-features';import {sameProduct} from '../lib/radar/identity';
import {mergeProducts} from '../lib/radar/maintenance';import {findProduct} from '../lib/radar/identity';import {exactMergePlan} from '../lib/radar/duplicate-groups';
import {applyTitleCatalogue} from '../lib/radar/catalog';import {makeOffer} from '../lib/radar/collector';
const item=(title:string,category='',source=''):Item=>repairClassification({...createItem(title,'',undefined,DEFAULT_PREFS),category,evidence:source?[{field:'来源分类',value:source,url:'https://www.amiami.jp/top/detail/detail?gcode=TEST',at:'2026-10-06T00:00:00.000Z',method:'原站商品分类'}]:[]});
for(const [raw,expected] of [['キャラクターグッズ > 一般ゲーム系','goods'],['キャラクターグッズ > 美少女系 > ゲーム原作系','goods'],['書籍・ソフトウェア > 書籍 > ゲームソフト関連','book'],['ゲームミュージックCD','music'],['映像ソフト','video'],['PS4ソフト','game']] as const)assert.equal(categoryType(raw),expected);
assert.equal(categoryType('Windowsソフト DVD-ROM'),'game');
for(const [title,cat,source,expected] of [
 ['Fate/EXTRA material','ゲームソフト','書籍・ソフトウェア > 書籍 > ゲームソフト関連','书籍'],
 ['Fate/stay night [UBW] Blu-ray Disc BOX','映像ソフト','','影像'],
 ['Fate/Grand Order Original Soundtrack VIII','ゲームソフト','ゲームミュージックCD','影像'],
 ['Fate/strange Fake アクリルスタンド','ゲームソフト','キャラクターグッズ > 一般ゲーム系','周边'],
 ['Fate/EXTELLA REGALIA BOX','ゲームソフト','','游戏'],
 ['PlayStation 4 Fate/EXTELLA Edition 本体','ゲームソフト','','大型周边'],
 ['Fate/Grand Order 缶バッジ','グッズ','','周边'],['Fate/stay night ポストカード','グッズ','','卡片'],
 ['Fate/Grand Order 1/7 フィギュア','グッズ','','玩具'],['Fate/EXTRA B2タペストリー','グッズ','','大型周边'],
 ['Fate/stay night BD購入特典 タペストリー','映像ソフト','','大型周边'],
 ['【あみあみ限定特典】BD Fate/stay night Blu-ray BOX','映像ソフト','','影像'],
 ['Fate/EXTRA Record＜PlayStation 5＞','グッズ','','游戏']
 ] as const){const i=item(title,cat,source);assert.equal(productClass(i),expected,title);assert.equal(i.tags.filter(t=>PRODUCT_CLASSES.includes(t as any)).length,1);assert.ok(inferredPath(i).includes(expected));}
assert.equal(productClass(item('北米版 FATE/EXTRA LIMITED EDITION (国内版本体可)','グッズ','PSPソフト')),'游戏');
assert.equal(productClass(item('Fate/stay night [Realta Nua] メモリーカード8 MB','グッズ','PS2ハード')),'周边');
assert.equal(productClass(item('Fate/Grand Order 本体のみ フィギュア','フィギュア')),'玩具');
assert.equal(productClass(item('Fate/stay night 本体のみ キーホルダー','グッズ')),'周边');
assert.equal(productClass(item('PSPクリアケース [FATE EXTRA](PSP-3000用)','グッズ','PSPハード')),'周边');
assert.equal(productClass(item('PlayStation Vita Fate/EXTELLA Edition Wi-Fiモデル','グッズ','PSVITAハード')),'大型周边');
const prisma=item('DVD Fate/kaleid liner プリズマ☆イリヤ ツヴァイ! 第4巻','映像ソフト');prisma.tags.push('Fate/stay night','Heaven’s Feel');assert.ok(!inferredPath(prisma).includes('Fate/stay night'));assert.ok(inferredPath(prisma).includes('Fate/kaleid liner'));assert.equal(saleForm(prisma),'single');assert.equal(primaryMedium(prisma),'video');
const fa=item('Fate/Apocrypha Blu-ray BOX','映像ソフト'),sf=item('Fate/strange Fake 缶バッジ','グッズ'),tree=buildCatalogue([fa,sf],DEFAULT_PREFS);for(const i of [fa,sf])assert.ok(!tree.ancestors(tree.itemNodes.get(i.id)!).some(n=>n.name==='游戏'));
assert.equal(sameProduct(item('Fate/stay night Blu-ray BOX','映像ソフト'),item('Fate/stay night DVD-BOX','映像ソフト')),null);
assert.equal(sameProduct(item('Fate/EXTELLA','ゲームソフト','PS4ソフト'),item('Fate/EXTELLA','ゲームソフト','PSVITAソフト')),null);
assert.ok(item('Fate/EXTELLA','ゲームソフト','PSVITAソフト').tags.includes('平台:PSVita'));
const prismaGame=item('Fate/kaleid liner プリズマイリヤ[通常版]','ゲームソフト','ニンテンドー3DSソフト');assert.equal(prismaGame.majorClass,'游戏');assert.equal(prismaGame.series,'Fate/kaleid liner');
const mergeBook=item('ロード・エルメロイII世の事件簿 8','小説','小説'),staleBook={...mergeBook,id:'stale-book',tags:['周边']};const repairedMerge=mergeProducts({items:[mergeBook,staleBook],relations:[]} as any,staleBook.id,mergeBook.id).merged;assert.deepEqual(repairedMerge.tags.filter(t=>PRODUCT_CLASSES.includes(t as any)),['书籍']);
const fan=repairClassification({...item('FGO 同人誌 テスト','同人誌'),origin:'doujin' as const,circle:'社团',ageRating:'unknown' as const});assert.equal(fan.majorClass,'同人');assert.equal(fan.ageRating,'all');
const official=repairClassification({...item('Fate/Grand Order material I','同人誌'),origin:'commercial' as const,publisher:'TYPE-MOON BOOKS',circle:''});assert.equal(official.majorClass,'书籍');
const manual={...fa,majorClass:'书籍' as const,locked:true,evidence:[{field:'人工整理',value:'majorClass',url:'',at:'2026-10-06T00:00:00.000Z',method:'人工整理'}]};assert.equal(repairClassification(manual).majorClass,'书籍');
const publisherOffer={...makeOffer('https://www.kodansha.co.jp/comic/products/0000431853','',null,'list'),source:'講談社',isbn:'9784065404822',listingTitle:'Ｆａｔｅ／Ｇｒａｎｄ Ｏｒｄｅｒ－ｔｕｒａｓ ｒｅａｌｔａ－（２３）'};
const retailBook={...item('Fate/Grand Order―turas realta―(23) (書籍)[講談社]《10月予約》','コミック'),isbn:publisherOffer.isbn,productLine:'retail title with preorder text',wave:'',offers:[publisherOffer]};
const numberedBook=applyTitleCatalogue(retailBook);assert.equal(numberedBook.wave,'23');assert.equal(numberedBook.productLine,'Fate/Grand Order-turas realta-');
assert.equal(applyTitleCatalogue({...retailBook,isbn:'9784065404839'}).wave,'');
assert.equal(applyTitleCatalogue({...retailBook,wave:'custom',locked:true,evidence:[{field:'人工整理',value:'wave',url:'',at:'2026-10-06T00:00:00.000Z',method:'人工整理'}]}).wave,'custom');
// A publisher record can match an older title-only record and an ISBN-verified
// retail record even though those two titles do not yet match each other.
const legacy={...item('帝都聖杯奇譚 Fate/type Redline 5','コミック'),id:'legacy-redline',isbn:'',createdAt:'2020-01-01T00:00:00.000Z'},retail={...item('帝都聖杯奇譚 Fate/type Redline(5) (書籍)[KADOKAWA]《在庫切れ》','コミック'),id:'retail-redline',isbn:'9784041143469',createdAt:'2021-01-01T00:00:00.000Z'},publisher={...item('帝都聖杯奇譚 Fate/type Redline(5)','コミック'),id:'publisher-redline',isbn:retail.isbn,createdAt:'2022-01-01T00:00:00.000Z'};
assert.ok(sameProduct(publisher,legacy));assert.ok(sameProduct(publisher,retail));assert.equal(sameProduct(legacy,retail),null);
assert.equal(findProduct([legacy,retail],publisher)?.item.id,retail.id);assert.deepEqual(exactMergePlan([legacy,retail,publisher]),[{fromId:publisher.id,toId:retail.id}]);
publisher.offers=[{...makeOffer('https://www.kadokawa.co.jp/product/322307000481/','',null,'list'),source:'KADOKAWA',isbn:publisher.isbn,listingTitle:publisher.title}];
const joined=mergeProducts({items:[legacy,retail,publisher],relations:[]} as any,publisher.id,retail.id).merged;assert.equal(exactMergePlan([legacy,joined]).length,1);
assert.equal(sameProduct(publisher,{...retail,title:'帝都聖杯奇譚 Fate/type Redline(5) 新装版'}),null);
console.log('PASS v12 major categories, genre vs medium, physical hardware/bonuses, source classes, IP isolation and manual preservation');
