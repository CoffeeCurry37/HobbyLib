# 完整逐项前后对照

以下为拟应用的公开商品字段；个人字段、报价与原始description保留。生产applied 0。

## #80 · family-bd1e9d29d163cfb06f93cbe07b7b0c30

catalogueGroup=true 保留，contains 为逻辑成员；不表示可购买的十册套装。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| category | "漫画系列目录" | "コミック" |
| publisher | "KADOKAWA" | "エンターブレイン" |
| productType | "漫画系列目录" | "漫画选集系列目录" |
| summary | "Enterbrain／KADOKAWA 出版的《Fate/stay night》商业漫画 Anthology 系列目录，当前关联第 1 至 10 卷，封面采用第 1 卷参考图。" | "Enterbrain「マジキューコミックス」《Fate/stay night》日文漫画选集的逻辑目录，按第1至第10卷组织独立单册。目录图采用第一卷的书影，各卷ISBN和挂牌分别保留。" |
| tags | ["Fate/stay night", "漫画", "Anthology", "商业漫画选集", "Enterbrain", "KADOKAWA", "系列目录"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス", "系列目录"] |

来源：[1](https://www.kadokawa.co.jp/product/200700002632/) / [2](https://www.kadokawa.co.jp/product/200700002943/) / [3](https://jp.mercari.com/shops/product/mrP7SaCHPn5D6CVnoegqNJ)

未解决：无（隔离完成关系修订后）

expectedVersion: `a29fb56d5d02c60e15736fa5abd162c1505cad7424554c131daa6ffa3d0f3fe7`

## #81 · member-17vmdp9

原始ISBN 9784757717954 与第1卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック1》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第1卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 1" | "第1卷" |
| image | "" | "https://assets.mercari-shops-static.com/-/large/plain/WWSMRtZgDAuJfFEUGQLxfi.jpg@jpg" |
| imageRole | null | "product" |

来源：[1](https://www.kadokawa.co.jp/product/200700002632/) / [2](https://mottainaihonpo.com/shop/Item/bkui3105mblgqcfc)

未解决：无（隔离完成关系修订后）

expectedVersion: `b8970d395a8eff92715bdc3acc78687988f09448c10b5b8c3edbf3986ad65b84`

## #82 · member-1q1tmhj

原始ISBN 9784757723528 与第10卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック10》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第10卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 10" | "第10卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002943/) / [2](https://item.rakuten.co.jp/comicset/4757723520/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `5b8d4e9ec6d43ec1caabb5d4b2666510147c2682d6a281ba39148a287e0da33a`

## #83 · member-171nkmc

原始ISBN 9784757718425 与第2卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック2》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第2卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 2" | "第2卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002647/) / [2](https://www.honyaclub.com/shop/goods/goods.aspx?goods=11979716)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `8529f59e1794af0f23766b72fb7fd66967d8f3fbe5124fc4f5891cd693182486`

## #84 · member-17bn6bb

原始ISBN 9784757719422 与第3卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック3》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第3卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。本卷书目记载150页。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 3" | "第3卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002704/) / [2](https://books.rakuten.co.jp/rb/1694636/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `ce2f63b68efbd7e4149d834ebcf7e886bcf7e792dfd47b81a6b3b3a472013d3e`

## #85 · member-16hod8e

原始ISBN 9784757719767 与第4卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック4》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第4卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 4" | "第4卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002717/) / [2](https://jp.mercari.com/shops/product/2ypWsJBAooQgZgtiBBLuCL)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `8451cdff4018a7af41b00a386d9d1c651b3d57bec69f69e43101b942cb4dbd53`

## #86 · member-16rnyxd

原始ISBN 9784757720107 与第5卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック5》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第5卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。本卷书目记载142页。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 5" | "第5卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002742/) / [2](https://books.rakuten.co.jp/rb/1713007/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `ce3b97bffb36cc7d8e40b4f282d58483452d5f5bb20bf44e99b8fbf7e753ff3a`

## #87 · member-15xp5ug

原始ISBN 9784757720633 与第6卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック6》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第6卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 6" | "第6卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002776/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/WR666)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `5018ea4273e35f3d68901b347ecb5790602a3521c4be6650cd127f51cbc3a387`

## #88 · member-167orjf

原始ISBN 9784757721425 与第7卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック7》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第7卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 7" | "第7卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002817/) / [2](https://store.kadokawa.co.jp/shop/g/g200700002817/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `8295d006fa60342e5a2af0c2e620983b6af13d175c10c194997538b2b6af1d83`

## #89 · member-15dpygi

原始ISBN 9784757722118 与第8卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック8》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第8卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 8" | "第8卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002863/) / [2](https://store.kadokawa.co.jp/shop/g/g200700002863/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `bd25e360ef63e0223592d4a2b37f789f5b698467d66015a339ea02af9a9df1b7`

## #90 · member-15npk5h

原始ISBN 9784757722972 与第9卷一一对应；保留日文标题、发布日期及原始description。Enterbrain/エンターブレイン统一为后者；移除重复品类与产品线自动标签，不添加角色或附件。零售按月出版时间不覆盖出版社精确发售日。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| publisher | "KADOKAWA" | "エンターブレイン" |
| summary | "KADOKAWA书目收录的《Fate/stay night アンソロジーコミック9》是漫画选集，收录围绕原作角色创作的商业短篇漫画。" | "Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第9卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。" |
| tags | ["Fate/stay night", "漫画选集", "Fate/stay night アンソロジーコミック", "KADOKAWA", "商业漫画选集", "Enterbrain"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス"] |
| member | "Fate stay night アンソロジーコミック 9" | "第9卷" |

来源：[1](https://www.kadokawa.co.jp/product/200700002906/)

未解决：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `a83de31667c8456619a72ffb22b3122313e057293eb73b0821f0db1f3334b3c0`

## #91 · 8d0ad208-bbb5-4139-97a0-457c57beed04

原Item JAN 9784757723528属于第10卷，不是整套发行编号；仅清除Item聚合编号，Offer及原始来源文本逐字保留。套装图片尚未视觉核实，不能借单册书影声称整套实物齐全。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| series | "Fate" | "Fate/stay night" |
| productLine | "Fate stay night アンソロジーコミック 全10巻セット(ランクB)" | "Fate/stay night アンソロジーコミック" |
| productType | null | "漫画选集卖家套装" |
| summary | null | "骏河屋把Enterbrain版《Fate/stay night アンソロジーコミック》第1至第10卷合售的中古套装；本条原挂牌为ランクB。十册对应独立出版卷次，成色随挂牌保留。" |
| tags | ["书籍", "卖家拼套", "アンソロジー", "コミック", "ランク", "Fate", "品牌:エンターブレイン", "产品线:Fate stay night アンソロジーコミック 全10巻セット(ランクB)", "作品:Fate", "发售年:2005", "出版社:エンターブレイン"] | ["Fate/stay night", "漫画选集", "エンターブレイン", "マジキューコミックス", "卖家拼套"] |
| jan | "9784757723528" | "" |
| wave | null | "1–10" |
| member | "Fate stay night アンソロジーコミック 全10巻セット(ランクB)" | "第1–10卷合售" |
| imageRole | null | "catalogue_reference" |

来源：[1](https://www.suruga-ya.jp/product/detail/WN1316?branch_number=0002) / [2](https://www.kadokawa.co.jp/product/200700002943/)

未解决：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `b74463597db4ca85159ab4ded6b9cd4c34c46084ee08eb595c624a44d61b2139`

## #92 · source-8756a25a5dafc97e8e16cc2dfec8c605

官方小说产品页与标题、作者、插画、卷名对应。骏河屋同人栏是店铺归档，不能覆盖官方作品身份；保留原description及原始挂牌。两个店铺记录暂不合并。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| productType | null | "小说" |
| series | "Fate" | "Fate:Lost Einherjar" |
| productLine | "Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)" | "Fate:Lost Einherjar 極光のアスラウグ" |
| wave | null | "1" |
| member | "Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)" | "第1卷 亜種二連聖杯戦争" |
| summary | null | "TYPE-MOON BOOKS发行、桜井光著、三輪士郎绘制插画的《Fate:Lost Einherjar 極光のアスラウグ》第一卷「亜種二連聖杯戦争」。故事从九世纪北欧延伸到201X年的奥斯陆，阿斯拉乌格与拉格纳作为从者被召唤，卷入二连圣杯战争。" |
| tags | ["书籍", "Lost", "聖杯", "戦争", "書籍", "Fate", "品牌:TYPE-MOON TYPE-MOON BOOKS", "产品线:Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)", "出版社:TYPE-MOON BOOKS", "作品:Fate", "发售年:2022", "零售目录", "TYPE-MOON"] | ["Fate:Lost Einherjar", "小说", "TYPE-MOON BOOKS", "桜井光", "三輪士郎", "アスラウグ", "ラグナル・ロズブローク"] |
| characters | [] | ["アスラウグ", "ラグナル・ロズブローク"] |

来源：[1](https://typemoon.com/products/tmbooks/aslaug/) / [2](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-032171-R)

未解决：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `2fa657efd2643ec7da1d2f4a77ca09e3f99accf9c76035609c5b468dc80fe0c7`

## #93 · source-47ed7d0c0174ad78f2164f35017e288a

官方小说产品页与标题、作者、插画、卷名对应。骏河屋同人栏是店铺归档，不能覆盖官方作品身份；保留原description及原始挂牌。两个店铺记录暂不合并。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| category | "書籍" | "小説" |
| productType | null | "小说" |
| series | "Fate" | "Fate:Lost Einherjar" |
| productLine | "Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争" | "Fate:Lost Einherjar 極光のアスラウグ" |
| publisher | "TYPE-MOON" | "TYPE-MOON BOOKS" |
| wave | null | "1" |
| member | "Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 / 桜井光 / 三輪士郎 / TYPE-MOON" | "第1卷 亜種二連聖杯戦争" |
| summary | null | "TYPE-MOON BOOKS发行、桜井光著、三輪士郎绘制插画的《Fate:Lost Einherjar 極光のアスラウグ》第一卷「亜種二連聖杯戦争」。故事从九世纪北欧延伸到201X年的奥斯陆，阿斯拉乌格与拉格纳作为从者被召唤，卷入二连圣杯战争。" |
| tags | ["书籍", "Lost", "聖杯", "戦争", "桜井", "士郎", "Fate", "同人誌", "品牌:TYPE－MOON", "出版社:TYPE-MOON", "作品:Fate", "发售年:2022", "类别:書籍"] | ["Fate:Lost Einherjar", "小说", "TYPE-MOON BOOKS", "桜井光", "三輪士郎", "アスラウグ", "ラグナル・ロズブローク"] |
| characters | [] | ["アスラウグ", "ラグナル・ロズブローク"] |

来源：[1](https://typemoon.com/products/tmbooks/aslaug/) / [2](https://www.suruga-ya.jp/product/detail/ZHORE256167)

未解决：骏河屋内部编码0400310302762与Amiami发行JAN不同；不移植另一挂牌JAN、不自动合并，待书体/版权页与版本照片确认。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `4e93aec6e55abaa67dd814a533614c50b7fa145a05fc9b8147d7f0cce250b64c`

## #484 · family-c91ba4972ab712e2ca5b67ef3132eeb1

保留catalogueGroup，逻辑contains不代表物理套装；封面为原版第一卷参考图。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说系列目录" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| summary | null | "桜井光著、中原绘制插画的《Fate/Prototype 蒼銀のフラグメンツ》原版单行本小说目录，共五卷，描写《Fate/Prototype》八年前的圣杯战争。此目录组织原版各卷和店铺记录，文库改版与鈴木ツタ漫画版分别编目。" |
| tags | ["系列档案"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "系列目录"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m2990.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321405/321405000240.webp" |

来源：[1](https://www.kadokawa.co.jp/product/321405000240/) / [2](https://www.kadokawa.co.jp/product/321405000241/) / [3](https://www.kadokawa.co.jp/product/321408000209/) / [4](https://www.kadokawa.co.jp/product/321408000210/) / [5](https://www.kadokawa.co.jp/product/321502000137/)

未解决：无（隔离完成关系修订后）

expectedVersion: `fa7faf082e9f1ed81941ed1ce08f6caff0b30c8e58abebf69f68f8ce1f64d8ba`

## #485 · family-ece84739ad4d11735dbc4948fe7edd5f

原图是小说第4卷，替换为已核对的漫画第1卷通常版目录参考图；五条小说contains迁出后context成立。不将特装版和通常版合并。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| productType | null | "漫画系列目录" |
| productLine | "Fate/Prototype 蒼銀のフラグメンツ" | "Fate/Prototype 蒼銀のフラグメンツ 漫画版" |
| summary | null | "鈴木ツタ改编《Fate/Prototype 蒼銀のフラグメンツ》小说的漫画版目录，以沙条爱歌与Saber参与的圣杯战争为故事背景。第一卷通常版与附亚克力立牌的特装版分别保留，原版小说各卷移入小说目录。" |
| tags | ["系列档案"] | ["Fate/Prototype", "漫画", "KADOKAWA", "鈴木ツタ", "系列目录"] |
| image | "https://cdn.kdkw.jp/cover_1000/321408/321408000210.webp" | "https://cdn.kdkw.jp/cover_1000/322404/322404000993.webp" |

来源：[1](https://www.kadokawa.co.jp/product/322404000993/) / [2](https://www.kadokawa.co.jp/product/322404000992/)

未解决：无（隔离完成关系修订后）

expectedVersion: `d694238496af8814db370aa0bb10732a9fdaf060ef9c6eb32beacf275bf86f59`

## #486 · source-9447610c42728f7b86ee5d52ba4486ca

第1卷ISBN 9784041021279 与骏河屋 2M2990逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。 移动逻辑父级 #485→#484 后本批 context 才成立。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| member | "Fate/Prototype 蒼銀のフラグメンツ (1)" | "第1卷（原版单行本）" |
| kind | "unknown" | "base" |
| summary | "KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (1)》是小说，桜井光创作的 Fate/Prototype 前传小说。" | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第1卷。以1991年的圣杯战争为起点，描写沙条爱歌与Saber的契约，以及年幼的绫香所见的姐姐。" |
| tags | ["Fate/Prototype", "小说", "Fate/Prototype 蒼銀のフラグメンツ", "KADOKAWA", "桜井光", "前传"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "沙条愛歌", "沙条綾香", "セイバー"] |
| characters | [] | ["沙条愛歌", "沙条綾香", "セイバー"] |

来源：[1](https://www.kadokawa.co.jp/product/321405000240/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2990)

未解决：无（隔离完成关系修订后）

expectedVersion: `306aaba57b5b2dd5f0d147a052d29ae8d314ad4f0e13512aeccd6415f483d608`

## #487 · source-ad7c3d833749fffd927ae606c8a14513

第2卷ISBN 9784041021286 与骏河屋 2M2991逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。 移动逻辑父级 #485→#484 后本批 context 才成立。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| member | "Fate/Prototype 蒼銀のフラグメンツ (2)" | "第2卷（原版单行本）" |
| kind | "unknown" | "base" |
| summary | "KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (2)》是小说，桜井光创作的 Fate/Prototype 前传小说。" | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第2卷。延续《Fate/Prototype》的前日谭，以交错的阵营心愿推进圣杯战争；本卷官方介绍明确收录中原绘制的全彩插画。" |
| tags | ["Fate/Prototype", "小说", "Fate/Prototype 蒼銀のフラグメンツ", "KADOKAWA", "桜井光", "前传"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传"] |

来源：[1](https://www.kadokawa.co.jp/product/321405000241/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2991)

未解决：无（隔离完成关系修订后）

expectedVersion: `1018553df509008c163abfb821ba6d54c788fc985404f1a46a24a88a81c40074`

## #488 · source-ee54ecbcd5737dd27cc7f4192c7a2040

第3卷ISBN 9784041024522 与骏河屋 2M3447逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。 移动逻辑父级 #485→#484 后本批 context 才成立。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| member | "Fate/Prototype 蒼銀のフラグメンツ (3)" | "第3卷（原版单行本）" |
| kind | "unknown" | "base" |
| summary | "KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (3)》是小说，桜井光创作的 Fate/Prototype 前传小说。" | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第3卷。围绕Assassin的自我矛盾、曾统治世界的Rider，以及试图阻止圣杯战争的Berserker，展开不同从者的参战立场。" |
| tags | ["Fate/Prototype", "小说", "Fate/Prototype 蒼銀のフラグメンツ", "KADOKAWA", "桜井光", "前传"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "アサシン", "ライダー", "バーサーカー"] |
| characters | [] | ["アサシン", "ライダー", "バーサーカー"] |

来源：[1](https://www.kadokawa.co.jp/product/321408000209/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M3447)

未解决：无（隔离完成关系修订后）

expectedVersion: `1c29d828176a1ca7f0f9460762ed9e44b578368a30d0e8573afb72776bfa5777`

## #489 · source-1a19408b2f4ef5af6c71b43dde757f3c

第4卷ISBN 9784041024539 与骏河屋 2M4603逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。 移动逻辑父级 #485→#484 后本批 context 才成立。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| member | "Fate/Prototype 蒼銀のフラグメンツ (4)" | "第4卷（原版单行本）" |
| kind | "unknown" | "base" |
| summary | "KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (4)》是小说，桜井光创作的 Fate/Prototype 前传小说。" | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第4卷。聚焦Archer与御主エルザ・西条的共同作战，以及Lancer受ナイジェル・セイワード灵药支配的困境。" |
| tags | ["Fate/Prototype", "小说", "Fate/Prototype 蒼銀のフラグメンツ", "KADOKAWA", "桜井光", "前传"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "アーチャー", "エルザ・西条", "ランサー", "ナイジェル・セイワード"] |
| characters | [] | ["アーチャー", "エルザ・西条", "ランサー", "ナイジェル・セイワード"] |

来源：[1](https://www.kadokawa.co.jp/product/321408000210/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M4603)

未解决：无（隔离完成关系修订后）

expectedVersion: `cdc52c850591e3eb540b53b300da66f52253d589056b2ca90b284605fc7e6397`

## #490 · source-c2b2e148b7681b82c96330739b270d70

第5卷ISBN 9784041031445 与骏河屋 2M5568逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。店铺旧发售日2017-03-10与官方2017-04-26不同，Item采用官方日，Offer旧日期保留。 移动逻辑父级 #485→#484 后本批 context 才成立。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| member | "Fate/Prototype 蒼銀のフラグメンツ (5)" | "第5卷（原版单行本）" |
| kind | "unknown" | "base" |
| summary | "KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (5)》是小说，桜井光创作的 Fate/Prototype 前传小说。" | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第5卷。五卷原版小说的完结卷，围绕沙条爱歌的愿望与Saber推进圣杯战争的最终局面。" |
| tags | ["Fate/Prototype", "小说", "Fate/Prototype 蒼銀のフラグメンツ", "KADOKAWA", "桜井光", "前传"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "沙条愛歌", "セイバー"] |
| characters | [] | ["沙条愛歌", "セイバー"] |

来源：[1](https://www.kadokawa.co.jp/product/321502000137/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M5568)

未解决：无（隔离完成关系修订后）

expectedVersion: `5fa86480fa1453d2932d4dccf60e1dac17d5c3094093bff138a310521896e48c`

## #493 · source-6507b9cf8cf301dda6981354e1d1e4ab

publisher special edition ISBN + Amiami明确套装内容；保留现有日文原题。附品可独立拥有，但本次未创建立牌Item或推断拥有。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| productType | null | "附特典漫画特装版" |
| productLine | "Fate/Prototype 蒼銀のフラグメンツ" | "Fate/Prototype 蒼銀のフラグメンツ 漫画版" |
| member | "Fate/Prototype 蒼銀のフラグメンツ 1 アクリルスタンド付き特装版 (書籍)[KADOKAWA]《在庫切れ》" | "第1卷 亚克力立牌特装版" |
| summary | null | "鈴木ツタ绘制的《Fate/Prototype 蒼銀のフラグメンツ》漫画第一卷特装版，在漫画书之外附Saber全身亚克力立牌。改编桜井光的前日谭小说，以1991年东京的圣杯战争为舞台；本版ISBN与漫画通常版不同。" |
| tags | ["书籍", "アクリルスタンド", "Prototype", "フラグ", "メンツ", "アクリル", "スタンド", "付き", "書籍", "KADOKAWA", "在庫", "切れ", "TYPE-MOON", "Fate", "奈須きのこ", "特典", "品牌:KADOKAWA", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "出版社:KADOKAWA", "作品:Fate/Prototype", "发售年:2024", "零售目录", "类别:コミック", "画师/作者:鈴木 ツタ", "画师/作者:桜井 光", "画师/作者:イラスト 中原", "画师/作者:ＴＹＰＥ－ＭＯＯＮ", "亚克力立牌", "出版社档案"] | ["Fate/Prototype", "漫画", "KADOKAWA", "鈴木ツタ", "特装版", "アクリルスタンド", "セイバー"] |
| characters | [] | ["セイバー"] |

来源：[1](https://www.kadokawa.co.jp/product/322404000992/) / [2](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-041430)

未解决：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `b537619a9b862a454283d73f7850b547366f9abbdaf611a672ec3295ebbd7166`

## #494 · source-b5830bd4ca18e15655566e1166eb9bee

仅采用原始挂牌明确的合售范围，未把跨作品拼套写成原厂套装。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说卖家拼套" |
| productLine | "Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光" | "Fate/Prototype 蒼銀のフラグメンツ" |
| wave | null | "1–5" |
| member | "Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光" | "苍银第1–5卷与Fate/Labyrinth合售" |
| summary | null | "原拍卖标题将《Fate/Prototype 蒼銀のフラグメンツ》第1至第5卷与《Fate/Labyrinth》一起出售，是跨书目卖家拼套。具体各册版本、书况和附属物仍需原拍卖照片确认。" |
| tags | ["书籍", "卖家拼套", "Fate", "作品:Fate/Prototype"] | ["Fate/Prototype", "Fate/Labyrinth", "小说", "卖家拼套", "桜井光"] |

来源：[1](https://auctions.yahoo.co.jp/jp/auction/u1223034656) / [2](https://www.kadokawa.co.jp/product/321502000137/)

未解决：原拍卖照片未能重新核验，不能确定每册版本与附件；不新建物理组件关系。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。

expectedVersion: `290c2d7e8cf5e68a19f598943595befc1eb12176c39268a962673a826606d8b3`

## #495 · b3c2f3ac-46ad-427b-b106-0ecd3e4bf579

清除误作整套编号的第5卷ISBN；原Offer编号、价格和附件文本保留。现有两款差异是具体未解决问题，不以审计完成替代拆分。

状态：prepared；partial。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说卖家套装" |
| productLine | null | "Fate/Prototype 蒼銀のフラグメンツ" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| jan | "9784041031445" | "" |
| wave | null | "1–5" |
| member | "Fate/Prototype 蒼銀のフラグメンツ 全5巻セット / 桜井光" | "原版第1–5卷合售" |
| summary | null | "《Fate/Prototype 蒼銀のフラグメンツ》原版小说五卷的中古合售记录。现存挂牌包含普通五卷套装与标明附収納BOX的另一款，收纳盒是否随附须以各条挂牌为准。" |
| tags | ["书籍", "卖家拼套", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "特典", "发售年:2017"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "卖家拼套"] |
| imageRole | null | "catalogue_reference" |

来源：[1](https://www.suruga-ya.jp/kaitori/kaitori_detail/2Y1040) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2Y1252) / [3](https://www.kadokawa.co.jp/product/321502000137/)

未解决：同一Item存在普通套装与収納BOX付两类挂牌，需后续带报价迁移回执的拆分决定；本批不挪动或删除报价。；套装参考图尚未视觉核验。

expectedVersion: `f79ebbd28c0b0c54d59b5b64f5a959ec68e0ac72d553f7d20831b82cb20fcf3a`

## #496 · 21bf754b-7370-4f5e-83c4-9adeafdcd83d

第1卷ISBN 9784041021279 与骏河屋 2M2990逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| member | "Fate/Prototype 蒼銀のフラグメンツ(1) / 桜井光" | "第1卷（原版单行本）" |
| isbn | "" | "9784041021279" |
| summary | null | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第1卷。以1991年的圣杯战争为起点，描写沙条爱歌与Saber的契约，以及年幼的绫香所见的姐姐。" |
| tags | ["书籍", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "发售年:2014"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "沙条愛歌", "沙条綾香", "セイバー"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m2990.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321405/321405000240.webp" |
| imageRole | null | "product" |
| characters | [] | ["沙条愛歌", "沙条綾香", "セイバー"] |

来源：[1](https://www.kadokawa.co.jp/product/321405000240/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2990)

未解决：无（隔离完成关系修订后）

expectedVersion: `f597b9ceebda988329e21654ad5a88c46e8f1d253916e8ee7208fe404b70facb`

## #497 · bab8701d-a249-4022-91c9-625d79a100ff

第2卷ISBN 9784041021286 与骏河屋 2M2991逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| member | "Fate/Prototype 蒼銀のフラグメンツ(2) / 桜井光" | "第2卷（原版单行本）" |
| isbn | "" | "9784041021286" |
| summary | null | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第2卷。延续《Fate/Prototype》的前日谭，以交错的阵营心愿推进圣杯战争；本卷官方介绍明确收录中原绘制的全彩插画。" |
| tags | ["书籍", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "发售年:2014"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m2991.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321405/321405000241.webp" |
| imageRole | null | "product" |

来源：[1](https://www.kadokawa.co.jp/product/321405000241/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2991)

未解决：无（隔离完成关系修订后）

expectedVersion: `a3e99b027ebb92ee161eb1ba2848d73548ac04077912648ab3e478e51231eef2`

## #498 · cdab3ad1-68d4-419c-a12c-b3399e72274d

第3卷ISBN 9784041024522 与骏河屋 2M3447逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| member | "Fate/Prototype 蒼銀のフラグメンツ(3) / 桜井光" | "第3卷（原版单行本）" |
| isbn | "" | "9784041024522" |
| summary | null | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第3卷。围绕Assassin的自我矛盾、曾统治世界的Rider，以及试图阻止圣杯战争的Berserker，展开不同从者的参战立场。" |
| tags | ["书籍", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "发售年:2015"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "アサシン", "ライダー", "バーサーカー"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m3447.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321408/321408000209.webp" |
| imageRole | null | "product" |
| characters | [] | ["アサシン", "ライダー", "バーサーカー"] |

来源：[1](https://www.kadokawa.co.jp/product/321408000209/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M3447)

未解决：无（隔离完成关系修订后）

expectedVersion: `0b31b941a96d73d23ecc8de2d453cf15e40cdd77978f16e31b444b92480d0ef0`

## #499 · 2a92ea72-5340-403c-9bc1-71420ee63f9e

第4卷ISBN 9784041024539 与骏河屋 2M4603逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| member | "Fate/Prototype 蒼銀のフラグメンツ(4) / 桜井光" | "第4卷（原版单行本）" |
| isbn | "" | "9784041024539" |
| summary | null | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第4卷。聚焦Archer与御主エルザ・西条的共同作战，以及Lancer受ナイジェル・セイワード灵药支配的困境。" |
| tags | ["书籍", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "发售年:2016"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "アーチャー", "エルザ・西条", "ランサー", "ナイジェル・セイワード"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m4603.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321408/321408000210.webp" |
| imageRole | null | "product" |
| characters | [] | ["アーチャー", "エルザ・西条", "ランサー", "ナイジェル・セイワード"] |

来源：[1](https://www.kadokawa.co.jp/product/321408000210/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M4603)

未解决：无（隔离完成关系修订后）

expectedVersion: `2aa0cd1de617bfcc5b017dda0ae8dd9497f4475c3a3e71e6335f88887ec6434b`

## #500 · 6cd1e115-1669-450d-b042-be02c96cacb6

第5卷ISBN 9784041031445 与骏河屋 2M5568逐项对应。出版社页导航标“コミックス”，正文明确スピンオフノベル；归入小説。保留不同店铺Item，不合并。店铺旧发售日2017-03-10与官方2017-04-26不同，Item采用官方日，Offer旧日期保留。

状态：prepared；五项通过（隔离）。

| 字段 | before | after |
| --- | --- | --- |
| origin | "unknown" | "commercial" |
| productType | null | "小说" |
| publisher | "角川書店/KADOKAWA" | "KADOKAWA" |
| member | "Fate/Prototype 蒼銀のフラグメンツ(5) / 桜井光" | "第5卷（原版单行本）" |
| isbn | "" | "9784041031445" |
| summary | null | "桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第5卷。五卷原版小说的完结卷，围绕沙条爱歌的愿望与Saber推进圣杯战争的最终局面。" |
| tags | ["书籍", "Prototype", "フラグ", "メンツ", "桜井", "Fate", "品牌:角川書店/KADOKAWA", "出版社:角川書店/KADOKAWA", "画师/作者:中原", "产品线:Fate/Prototype 蒼銀のフラグメンツ", "发售年:2017"] | ["Fate/Prototype", "小说", "KADOKAWA", "桜井光", "中原", "前传", "沙条愛歌", "セイバー"] |
| image | "https://cdn.suruga-ya.jp/database/pics_webp/game/2m5568.jpg.webp" | "https://cdn.kdkw.jp/cover_1000/321502/321502000137.webp" |
| imageRole | null | "product" |
| releaseDate | "2017-03-10" | "2017-04-26" |
| characters | [] | ["沙条愛歌", "セイバー"] |

来源：[1](https://www.kadokawa.co.jp/product/321502000137/) / [2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M5568)

未解决：无（隔离完成关系修订后）

expectedVersion: `6a76a0c4d8ed53f9977607ff8b76ac213304dc02e85fc74837944b203b9481e1`

