// Category is deliberately unrestricted; sold-out Surugaya entries remain in the catalogue.
export const FATE_SEARCHES=[
 {name:'骏河屋 · Fate 全品类（含售罄）',url:'https://www.suruga-ya.jp/search?category=&search_word=Fate&ck=true&inStock=On',note:'关键词搜索包含无价格售罄条目；也可能命中无关作品，须按商品资料核对。'},
 {name:'骏河屋 · Fate 系列补充',url:'https://www.suruga-ya.jp/search?category=&search_word=&ck=true&inStock=On&series=Fateシリーズ',note:'系列筛选可补充标题未写 Fate 的商品；与关键词结果逐商品归并。'},
 {name:'骏河屋 · Fate フェイト 系列',url:'https://www.suruga-ya.jp/search?category=&search_word=&ck=true&inStock=On&series=Fate%20フェイト',note:'另一来源系列名称；重复挂牌按稳定链接匹配。'},
 {name:'Mandarake · Fate 全品类',url:'https://order.mandarake.co.jp/order/listPage/list?dispCount=240&keyword=Fate&lang=ja&soldOut=1',note:'连续读取全部后续分页；标题未写作品名时保留待整理。不同门店、成色及售罄记录按商品归并。'},
 {name:'骏河屋 · Fate 同人（原作标签）',url:'https://www.suruga-ya.jp/search?category=1100&search_word=&ck=true&inStock=On&subgenre=Fate',note:'使用原作标签补充标题没有 Fate 的同人；有明确 R18 提示才分为成人，否则按一般作品整理。'},
 {name:'骏河屋 · Fate 男性向一般同人',url:'https://www.suruga-ya.jp/search?category=110000&search_word=Fate&ck=true&inStock=On',note:'男性向一般入口；不会把含成人内容的关键词或整站提示当作商品分级。'},
 {name:'骏河屋 · Fate 女性向一般同人',url:'https://www.suruga-ya.jp/search?category=110001&search_word=Fate&ck=true&inStock=On',note:'女性向一般入口（可含 BL）；BL 标签本身不表示 R18。'},
 {name:'Aniplex · Fate 官方目录',url:'https://online.aniplex.co.jp/fateproject',note:'跨 Fate 系列的 CD、书籍、手办及周边；保留商品各款式、发售日期与官方图片，周年商品按活动归档。'},
 {name:'AmiAmi · Fate 手办与玩具',url:'https://slist.amiami.jp/top/search/list?s_keywords=Fate&pagemax=60&s_sortkey=regtimed&s_cate_tag=1',note:'补充各厂商的静态、可动手办及玩具；按原作、厂家、JAN 与版本核对，不将店铺名当厂家。'},
 {name:'AmiAmi · Fate 书籍',url:'https://slist.amiami.jp/top/search/list?s_keywords=Fate&pagemax=60&s_sortkey=regtimed&s_cate_tag=8',note:'漫画、小说、设定与画集；书籍附赠手办仍按主商品归为书籍。'},
 {name:'AmiAmi · Fate CD',url:'https://slist.amiami.jp/top/search/list?s_keywords=Fate&pagemax=60&s_sortkey=regtimed&s_cate_tag=7',note:'音乐、原声和广播 CD；区分限定盘、通常盘、附赠内容与再版，不把 CD 附赠 DVD 改成影像商品。'}
];
