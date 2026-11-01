import {classify as v3,normal,hash,roman} from '../recognition/core.mjs';
export {normal,hash};
export function productTitle(value){return normal(value)
 .replace(/^(?:[a-z]\d+-\d+-\d+|\d{7,})\s+/i,'')
 .replace(/【(?:中古|新品[^】]*|未開封[^】]*|[\d,]+円[^】]*|国内正規品[^】]*|送料無料|特価)[^】]*】/g,'')
 .replace(/[《〈]?(?:発売済・在庫品|在庫切れ)[》〉]?/g,'')
 .replace(/^[★☆\s]*(?:未完[)）]|不備有[)）]|ランク[A-Z][)）]|アニメDVD\s*)/,'')
 .replace(/[\[（(](?:本体[A-Z]|状態[:：]|破損品|箱説なし|ランク[A-Z])[^\]）)]*[\]）)]/g,'')
 .replace(/(?:新品未開封|新品・未開封|未開封品|未開封|開封済み|開封済|未使用に近い|未使用|送料無料|送料込|ジャンク|未検品|箱無し|箱なし)/g,'')
 .replace(/^\s*(?:\[FIG\]|【BOX】|★|☆)+/,'').replace(/\s*【管[^】]+】/g,'')
 .replace(/\s+[A-Z0-9]+(?:[-/]\w+){2,}\s*$/,'').replace(/(?:中古|美品|新品)[！!]?/g,' ').replace(/^[\s★☆]+|[\s★☆]+$/g,'')
 .replace(/^(?:アニメDVD\s*)?(?:ランク[A-Z]|不備有|未完)[)）]\s*/,'').replace(/(?:状態難|パーツ破損あり)[)）]?/g,'')
 .replace(/[（(][^()（）]*欠品[^()（）]*[)）]/g,'').replace(/^\d{7,}\s+|^[A-Z]{2}-\d+\s+/,'').replace(/\s+\d{3}$/,'').replace(/\s+/g,' ').trim();}
export function isDoujin(raw){const t=normal(raw.title),f=raw.facts||{};return f.origin==='doujin'||/同人誌|同人グッズ|同人漫画|同人作品/.test(t+' '+raw.categoryLabel)||/^(?:OrangeMaru|METAJAN|ANIMAL SERVICE|自宅vacation)\s*\(/.test(t)||/Scarlet Agents|サンシャインクリエイション|うどん工房.*(?:WF|WHF)/.test(t);}
export function classify(raw){const c=v3(raw),t=normal(raw.title),cat=normal(raw.categoryLabel||raw.facts?.category),desc=normal(raw.description);c.excludedFromExperiment=isDoujin(raw);if(c.excludedFromExperiment){c.major='同人';c.mode='out-of-scope';c.path=['同人'];return c;}
 const works=[[/WINX SAGA/i,'FATE: THE WINX SAGA'],[/フェイト・テスタロッサ/,'魔法少女リリカルなのは'],[/Samurai Remnant|サムライレムナント/i,'Fate/Samurai Remnant'],[/EXTRA\s*Record/i,'Fate/EXTRA Record'],[/(?:エクストラ|EXTRA)\s*CCC/i,'Fate/EXTRA CCC'],[/Fate\s+EXTRA|フェイト.*エクストラ/i,'Fate/EXTRA'],[/hollow\s*(?:ataraxia|atraxia)/i,'Fate/hollow ataraxia'],[/[Uu]nlimited\s*[Cc]odes|アンリミテッドコード/,'Fate/unlimited codes'],[/タイガーころしあむ/,'Fate/tiger colosseum'],[/プリズマ|kaleid/i,'Fate/kaleid liner'],[/Prototype|蒼銀|プロトタイプ/i,'Fate/Prototype'],[/エルメロイ/,'ロード・エルメロイII世の事件簿']];c.work=works.find(([re])=>re.test(t))?.[1]||c.work;
 if(/\bCD\b|^CD\s|Drama CD|Original Soundtrack/i.test(t)||/CD >|CD$/.test(cat)){c.major='音像';c.subtype='CD';}
 else if(/DVD|Blu.?ray|\bBD\b/i.test(cat)||/^(?:アニメ)?(?:DVD|BD)\b|Blu-ray Disc|DVD-SET/i.test(t)){c.major='音像';c.subtype=/Blu.?ray|\bBD\b/i.test(t+' '+cat)?'Blu-ray':'DVD';}
 else if(/コミック単行本|コミック|小説|書籍|画集|ムック|ホビー誌/.test(cat)&&!/コミック[、,]アニメ/.test(cat)){c.major='书籍';c.subtype=/小説/.test(cat)?'小说':/コミック/.test(cat)?'漫画':/エース|ホビー誌|ムック/.test(t+' '+cat)?'杂志':'设定资料集';}
 else if(/ソフト|ゲームソフト/.test(cat)){c.major='游戏';c.subtype='游戏软件';}
 else if(/ハード/.test(cat)){c.major='游戏';c.subtype='游戏主机与配件';}
 if(/カルデアエース/.test(t)){c.major='书籍';c.subtype='杂志';}
 if(/SE\.RA\.PH|新宿幻霊事件/.test(t)&&/巻|コミック/.test(t+' '+cat)){c.major='书籍';c.subtype='漫画';}
 if(/おようふく/.test(t)){c.major='玩具';c.subtype='人偶服装';}
 if(c.major==='书籍'&&/コミックアラカルト.*特典.*カード/.test(t)){c.major='卡片';c.subtype='书店特典卡';}
 // Most specific source category outranks broad navigation and bundled accessories.
 if(/ゲームソフト|(?:PSP|PS2|PS4|Vita|スイッチ)ソフト/.test(cat)){c.major='游戏';c.subtype='游戏软件';if(!/プロダクトコード|衣装.*コード/.test(t))c.mode='permanent';}
 if(/Blu.?ray|アニメDVD|BDソフト/.test(cat)||(/(?:DVD|Blu-ray)\s*$/.test(t)&&!/^CD /.test(t))){c.major='音像';c.subtype=/Blu.?ray|BDソフト/.test(cat+' '+t)?'Blu-ray':'DVD';}
 if(/コミックス.*巻|コミックス.*カバー/.test(desc)&&/書籍/.test(cat)){c.major='书籍';c.subtype='漫画';}
 if(/漫画版/.test(t)){c.major='书籍';c.subtype='漫画';c.mode='review';}
 if(/エルメロイ.*巻.*セット/.test(t)){c.major='书籍';c.subtype='小说';}
 if(/コミック[、,]アニメ/.test(cat)&&/ポスター/.test(t)){c.major='周边';c.subtype='ポスター';}
 if(/Luminasta|ちびきゅんキャラ|SMILE 600|PVC製塗装済完成品/.test(t)){c.major='玩具';c.subtype='静态手办';}
 if(/Fate\s+Grand\s*Order/i.test(t))c.work='Fate/Grand Order';
 if(/Fate.song material/.test(t))c.work='Fate 系列';
 if(/ポストカード|イラストカード|チケットライク|チケット風カード|編成画面風カード|テレホンカード|スリーブコレクション/.test(t)){c.major='卡片';c.subtype=/スリーブ/.test(t)?'卡套':/テレホン/.test(t)?'电话卡':'卡片';}
 if(/CANバッジ/.test(t)){c.major='周边';c.subtype='缶バッジ';}
 if(/ぬいぐるみ|もちもちマスコット/.test(t)){c.major='玩具';c.subtype='毛绒玩具';}
 const media=t+' '+cat;c.identity={...c.identity,work:c.work,major:c.major,subtype:c.subtype,
 platform:/スイッチ2|Switch\s*2/.test(media)?'Switch 2':/PS5|PlayStation.?5/.test(media)?'PS5':/PS2|PlayStation.?2/.test(media)?'PS2':/3DS/.test(media)?'3DS':c.identity.platform};
 if(c.major==='游戏'&&c.subtype==='游戏软件'){c.identity.edition=/TREASURE BOX/i.test(t)?'TREASURE BOX':/Virgin/i.test(t)?'TYPE-MOON Virgin':/タイプムーンボックス/i.test(t)?'TYPE-MOON BOX':/MEGAMORI/i.test(t)?'MEGAMORI BOX':/特盛/.test(t)?'特盛限定版':/Collectors Edition/i.test(t)?'Collectors Edition':/extra edition/i.test(t)?'extra edition':/Best|廉価/i.test(t)?'Best':/限定版/.test(t)?(c.identity.edition==='通常版'?'限定版':c.identity.edition):c.identity.edition;}
 c.identity.volume ||= c.major==='书籍'&&c.mode!=='temporary'?Number(t.match(/(?:第)?(\d+)巻|[（(](\d+)[)）]/)?.slice(1).find(Boolean))||null:null;
 c.title=productTitle(t);c.missing=[...new Set([...c.missing,...(t.match(/[\[（(]?(?:状態[:：])?[^\]）)(]{0,30}(?:欠品|状態難|破損)[^\]）)(]{0,20}/g)||[])])];
 if(/まとめ|全\d+(?:種|巻|BOX)セット|[1１]\s*[～~–-]\s*\d+\s*巻.*セット|(?:[2-9]|[1-9]\d+)\s*(?:個|枚|種|本|BOX).*セット/.test(t))c.mode='temporary';
 if(/同梱品|特典のみ|ソフト単品/.test(t+' '+desc)&&!/(?:全\d+(?:種|巻)|\d+～\d+巻)セット/.test(t))c.mode='excluded';
 if(/[A-Z]{2,}賞.*セット|缶バッジ.*セット.*アクリルキーホルダー/.test(t))c.mode='temporary';
 if(/本編\+特典DISCのみ|付録[)）]/.test(t))c.mode='excluded';
 // Number of postcards in an official prize is a fixed product, unlike seller-assembled full-lineup sets.
 if(/アソート.*ポストカード\d+枚セット.*一番くじ/.test(t))c.mode='permanent';
 c.campaign=t.match(/「(一番くじ[^」]+)」/)?.[1]||null;
 if(c.major==='玩具'&&!/一番くじ/.test(t))c.path=['TYPE-MOON','Fate','Fate 综合','玩具',c.subtype,raw.facts?.manufacturer||raw.facts?.brand||'厂商待确认'];
 if(/WINX SAGA/.test(c.work))c.path=['其他收藏',c.work,c.major,c.subtype];
 else if(c.major==='书籍'||c.major==='音像')c.path=['TYPE-MOON',c.work==='Fate/Grand Order'?'FGO':'Fate',c.work,c.major,c.subtype];
 else if(c.major==='游戏')c.path=['TYPE-MOON','Fate',c.work,c.major,c.subtype];
 return c;}
export function researchTrigger(raw,c=classify(raw)){
 if(c.excludedFromExperiment)return null;const t=normal(raw.title),p=productTitle(t);let kind,key,label;
 if(/一番くじ/.test(t)){kind='prize-lineup';label=c.campaign||p.slice(p.indexOf('一番くじ')).replace(/(?:[A-Z]賞|[0-9]+\/).*/,'').trim();key='kuji:'+hash(label).slice(0,16);}
 else if(/Fes\.?\s*20\d\d|コミケ|Comiket|コミックマーケット|星見の回廊|最終再臨展|ワダアルコ展|サテライト|OVER THE SAME SKY|AGF\d{4}/i.test(t)){kind='event-catalogue';label=t.match(/Fes\.?\s*20\d\d|Comiket\s*\d+|コミックマーケット\s*\d+|AGF\d{4}/i)?.[0]||(/星見の回廊/.test(t)?'FGO展 星見の回廊':/最終再臨展/.test(t)?'Servant Art Chronicle 最終再臨展':/ワダアルコ展/.test(t)?'ワダアルコ展':/OVER THE SAME SKY/.test(t)?'OVER THE SAME SKY':'カルデア・サテライトステーション');key='event:'+label;}
 else if(c.major==='书籍'||c.major==='音像'){kind=c.major==='音像'?'media-volumes':c.subtype==='杂志'?'periodical-volumes':'book-volumes';label=p.replace(/(?:\s*[1-9]\d*\s*[～~-]\s*\d+巻|\s*(?:VOL\.?|第)?\s*\d+\s*[巻号]?|\s+[IVXL]+)\s*(?:セット|[（(]|$).*$/i,'').replace(/\s*\/\s*[^/]+$/,'').replace(/[（(]書籍[)）]/,'').trim();if(/カルデアエース/.test(t))label='Fate/Grand Order カルデアエース';if(/SE\.RA\.PH/.test(t))label='FGO 深海電脳楽土 SE.RA.PH';key=kind+':'+label;}
 else if(/ウエハース|トレーディング|ランダム|全\d+種|チケットライク|グリッターCAN|宝具コレクション|スリーブコレクション/.test(t)){kind='collectible-lineup';label=t.match(/「([^」]+)」/)?.[1]||p;key='line:'+label;}
 else if(c.major==='游戏'){kind='game-editions';label=c.work;key='game:'+c.work;}
 else if(c.major==='玩具'){kind='manufacturer-product';label=p;key='figure:'+p;}
 else return null;
 return {key,kind,label,query:label+' '+({ 'prize-lineup':'一番くじ 賞 一覧 公式','event-catalogue':'グッズ 一覧 アニプレックス','book-volumes':'単行本 シリーズ 出版社','periodical-volumes':'バックナンバー 出版社','media-volumes':'商品情報 公式','collectible-lineup':'ラインナップ 全種 公式','game-editions':'製品情報 特典 公式','manufacturer-product':'公式 商品情報 画像'}[kind]),status:'needs-source',required:kind==='prize-lineup'?['awards','images','release']:kind==='manufacturer-product'?['identity','body-images','manufacturer','release','contents']:['members','scope','images']};
}
export function priceEvidence(raw){const o={...raw.offer};o.originalPrice=o.price??null;const known=Number.isFinite(o.price);let reason=known?'saved-offer-price':/各店|marketplace|product\/other/.test(o.shop+' '+o.url+' '+o.stockNote)?'aggregate-no-single-offer':o.availability==='sold'?'sold-snapshot-price-absent':'snapshot-price-absent';if(!known&&reason==='snapshot-price-absent'){const m=normal(raw.description).match(/(?:現在|販売価格|中古価格)\s*[¥￥]?\s*([\d,]+)\s*円/);if(m){o.price=Number(m[1].replaceAll(',',''));reason='recovered-same-snapshot';o.priceRecoveredFrom=m[0];}}
 o.priceStatus=reason;o.priceLabel={'saved-offer-price':'原记录报价','recovered-same-snapshot':'原文恢复报价','aggregate-no-single-offer':'各店汇总页，未保存单店报价','sold-snapshot-price-absent':'已售记录，原快照未含售价','snapshot-price-absent':'原快照未含售价'}[reason];o.listingTitle=raw.title;return o;}
export function productSummary(p){const i=p.identity||{},maker=p.manufacturer||'',name=p.title;if(p.mode==='temporary')return name.replace(/[★☆]/g,'')+'，属于组合出售对象；独立成员保留各自商品页。';if(p.mode==='excluded')return '固定商品的拆出组件，保留来源记录，不新增独立收藏商品。';if(p.mode==='review')return name+'，具体发行范围尚待明确。';if(p.type==='漫画')return '《'+(p.seriesTitle||i.work||name)+'》的漫画'+(i.volume?'第'+i.volume+'卷':'作品')+'。'+(p.author?'漫画作者为'+p.author+'。':'');if(p.type==='杂志')return (i.work||'作品')+'相关官方刊物'+(i.volume?'第'+i.volume+'期':'')+'，内容包括作品资讯、插画或创作资料。';return (maker?maker+'推出的':'')+name+'，类型为'+p.type+'。';}
