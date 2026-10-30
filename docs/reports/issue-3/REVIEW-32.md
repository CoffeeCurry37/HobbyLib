# 32条修订验收清单

> 2026-10-29 接续核对：原生产执行结果来自 PR #4 的 `10bcca30951cd0baa4135a6434deabb08e16ead9`，现同步至 main。本轮重新读取32条，完整记录指纹、原文及Offer/历史全部与成功回执一致，五边正确；没有重复写入。独立记录见 [reconciliation-20261029.json](reconciliation-20261029.json)。

[打开收藏雷达](https://collector-radar.martainjonn.chatgpt.site) · [执行依据 Issue #3](https://github.com/CoffeeCurry37/HobbyLib/issues/3) · [脱敏生产回执](production-20261029.json)

**生产成功 32 / 跳过 0 / 阻断 0 / 失败 0；32 条完整记录逐项读回通过；五条父级关系已原子替换。** 当前32条为 verified 2、partial 30；新增 verified **1**（#80 原本已核实，#81 从partial转为verified）。

应用及读回：2026-10-29（America/Chicago），UTC时间见每项。Site 65 / custom / 原项目及DB保持；运行代码未改变，维护配置启用与关闭使用原已保存版本。维护窗口已关闭。

旧值为本次生产写前完整记录，历史方案与本次基线无字段偏差。#496–500因缺少独立视觉凭证保留原生产主图，这是相对历史换图方案的五项保守调整。商品原名、原文说明、个人/人工字段、Offer及全部报价历史保留；未拆分、合并、删除或搬迁Offer。

## 人工验收

- [ ] 小说/漫画、原版/文库、卷次和物理套装/单品区分正确。
- [ ] 父目录、分类、中文简介和标签符合你的理解，原文及来源保留。
- [ ] 参考图与商品图角色明确，partial疑问可见，个人收藏字段和原报价保留。
- [ ] 单个商品的纠正只作用于指定范围，不自动推广全系列或全库。

**尚未取得用户确认。阶段停在人工验收；不自动启动新增采集、扩量、监控或下一阶段。**

建议先看三个例子：#80目录与#91十卷卖家合售的区别；#484小说目录与#485漫画目录及五个小说卷次；#495普通/BOX报价混杂仍为partial且本次未拆分。#93版本和#494拍卖内容的疑问亦保留。

反馈格式：商品链接或编号 → 错在哪里 → 应该是什么 → 理由/来源（可选）→ 适用范围。

## 逐项入口

| 编号及详情 | 生产状态 | 核实状态 | 未决问题 |
| --- | --- | --- | --- |
| [#80 Fate stay night アンソロジーコミック](https://collector-radar.martainjonn.chatgpt.site/?item=family-bd1e9d29d163cfb06f93cbe07b7b0c30) | 已应用，完整读回通过 | verified | 无已记录未决问题 |
| [#81 Fate/stay night アンソロジーコミック1](https://collector-radar.martainjonn.chatgpt.site/?item=member-17vmdp9) | 已应用，完整读回通过 | verified | 无已记录未决问题 |
| [#82 Fate/stay night アンソロジーコミック10](https://collector-radar.martainjonn.chatgpt.site/?item=member-1q1tmhj) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#83 Fate/stay night アンソロジーコミック2](https://collector-radar.martainjonn.chatgpt.site/?item=member-171nkmc) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#84 Fate/Stay night アンソロジーコミック3](https://collector-radar.martainjonn.chatgpt.site/?item=member-17bn6bb) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#85 Fate/Stay night アンソロジーコミック4](https://collector-radar.martainjonn.chatgpt.site/?item=member-16hod8e) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#86 Fate/stay night アンソロジーコミック5](https://collector-radar.martainjonn.chatgpt.site/?item=member-16rnyxd) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#87 Fate/Stay night アンソロジーコミック6](https://collector-radar.martainjonn.chatgpt.site/?item=member-15xp5ug) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#88 Fate/stay night アンソロジーコミック7](https://collector-radar.martainjonn.chatgpt.site/?item=member-167orjf) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#89 Fate/stay night アンソロジーコミック8](https://collector-radar.martainjonn.chatgpt.site/?item=member-15dpygi) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#90 Fate/stay night アンソロジーコミック9](https://collector-radar.martainjonn.chatgpt.site/?item=member-15npk5h) | 已应用，完整读回通过 | partial | 出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#91 Fate stay night アンソロジーコミック 全10巻セット(ランクB)](https://collector-radar.martainjonn.chatgpt.site/?item=8d0ad208-bbb5-4139-97a0-457c57beed04) | 已应用，完整读回通过 | partial | 尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#92 Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)](https://collector-radar.martainjonn.chatgpt.site/?item=source-8756a25a5dafc97e8e16cc2dfec8c605) | 已应用，完整读回通过 | partial | 尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#93 Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 / 桜井光 / 三輪士郎 / TYPE-MOON](https://collector-radar.martainjonn.chatgpt.site/?item=source-47ed7d0c0174ad78f2164f35017e288a) | 已应用，完整读回通过 | partial | 骏河屋内部编码0400310302762与Amiami发行JAN不同；不移植另一挂牌JAN、不自动合并，待书体/版权页与版本照片确认。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#484 Fate/Prototype 蒼銀のフラグメンツ](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#485 Fate/Prototype 蒼銀のフラグメンツ](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#486 Fate/Prototype 蒼銀のフラグメンツ (1)](https://collector-radar.martainjonn.chatgpt.site/?item=source-9447610c42728f7b86ee5d52ba4486ca) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#487 Fate/Prototype 蒼銀のフラグメンツ (2)](https://collector-radar.martainjonn.chatgpt.site/?item=source-ad7c3d833749fffd927ae606c8a14513) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#488 Fate/Prototype 蒼銀のフラグメンツ (3)](https://collector-radar.martainjonn.chatgpt.site/?item=source-ee54ecbcd5737dd27cc7f4192c7a2040) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#489 Fate/Prototype 蒼銀のフラグメンツ (4)](https://collector-radar.martainjonn.chatgpt.site/?item=source-1a19408b2f4ef5af6c71b43dde757f3c) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#490 Fate/Prototype 蒼銀のフラグメンツ (5)](https://collector-radar.martainjonn.chatgpt.site/?item=source-c2b2e148b7681b82c96330739b270d70) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#493 Fate/Prototype 蒼銀のフラグメンツ 1 アクリルスタンド付き特装版 (書籍)[KADOKAWA]《在庫切れ》](https://collector-radar.martainjonn.chatgpt.site/?item=source-6507b9cf8cf301dda6981354e1d1e4ab) | 已应用，完整读回通过 | partial | 尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#494 Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=source-b5830bd4ca18e15655566e1166eb9bee) | 已应用，完整读回通过 | partial | 原拍卖照片未能重新核验，不能确定每册版本与附件；不新建物理组件关系。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。 |
| [#495 Fate/Prototype 蒼銀のフラグメンツ 全5巻セット / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=b3c2f3ac-46ad-427b-b106-0ecd3e4bf579) | 已应用，完整读回通过 | partial | 同一Item存在普通套装与収納BOX付两类挂牌，需后续带报价迁移回执的拆分决定；本批不挪动或删除报价。；套装参考图尚未视觉核验。 |
| [#496 Fate/Prototype 蒼銀のフラグメンツ(1) / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=21bf754b-7370-4f5e-83c4-9adeafdcd83d) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#497 Fate/Prototype 蒼銀のフラグメンツ(2) / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=bab8701d-a249-4022-91c9-625d79a100ff) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#498 Fate/Prototype 蒼銀のフラグメンツ(3) / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=cdab3ad1-68d4-419c-a12c-b3399e72274d) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#499 Fate/Prototype 蒼銀のフラグメンツ(4) / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=2a92ea72-5340-403c-9bc1-71420ee63f9e) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#500 Fate/Prototype 蒼銀のフラグメンツ(5) / 桜井光](https://collector-radar.martainjonn.chatgpt.site/?item=6cd1e115-1669-450d-b042-be02c96cacb6) | 已应用，完整读回通过 | partial | 历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。 |
| [#509 Fate/Requiem](https://collector-radar.martainjonn.chatgpt.site/?item=family-16c4c4278428fb44aff7e22ca7e15479) | 已应用，完整读回通过 | partial | 现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。 |
| [#510 Fate/Requiem 1 『星巡る少年』 / 星空めてお / NOCO / TYPE-MOON](https://collector-radar.martainjonn.chatgpt.site/?item=source-0fe194fcad613e09070850be41941fa0) | 已应用，完整读回通过 | partial | 现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。 |
| [#511 Fate/Requiem 2 『懐想都市新宿』 (書籍)[TYPE-MOON BOOKS]《在庫切れ》](https://collector-radar.martainjonn.chatgpt.site/?item=source-c29c5b9bf940672edd2e74b51a3943b7) | 已应用，完整读回通过 | partial | 现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。 |

## 五条父级关系

#484–490七个商品与五条关系在同一revision请求完成；关系ID、成员ID、contains类型、数量1均保留。原版小说移到#484，漫画留在#485，文库版本未更动。逻辑目录不表示可购买或可拥有的物理套装。

| 成员 | 写前父级 | 写后父级 | 生产结果 |
| --- | --- | --- | --- |
| [#486 Fate/Prototype 蒼銀のフラグメンツ (1)](https://collector-radar.martainjonn.chatgpt.site/?item=source-9447610c42728f7b86ee5d52ba4486ca) | [#485](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | [#484](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用并读回 |
| [#487 Fate/Prototype 蒼銀のフラグメンツ (2)](https://collector-radar.martainjonn.chatgpt.site/?item=source-ad7c3d833749fffd927ae606c8a14513) | [#485](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | [#484](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用并读回 |
| [#488 Fate/Prototype 蒼銀のフラグメンツ (3)](https://collector-radar.martainjonn.chatgpt.site/?item=source-ee54ecbcd5737dd27cc7f4192c7a2040) | [#485](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | [#484](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用并读回 |
| [#489 Fate/Prototype 蒼銀のフラグメンツ (4)](https://collector-radar.martainjonn.chatgpt.site/?item=source-1a19408b2f4ef5af6c71b43dde757f3c) | [#485](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | [#484](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用并读回 |
| [#490 Fate/Prototype 蒼銀のフラグメンツ (5)](https://collector-radar.martainjonn.chatgpt.site/?item=source-c2b2e148b7681b82c96330739b270d70) | [#485](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) | [#484](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) | 已应用并读回 |

## 生产旧值 → 实际新值

### #80 · Fate stay night アンソロジーコミック

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=family-bd1e9d29d163cfb06f93cbe07b7b0c30) · verified → verified · 已应用/完整读回通过 · 2026-10-29T14:19:35.395Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| category | 漫画系列目录 | コミック |
| publisher | KADOKAWA | エンターブレイン |
| productType | 漫画系列目录 | 漫画选集系列目录 |
| summary | Enterbrain／KADOKAWA 出版的《Fate/stay night》商业漫画 Anthology 系列目录，当前关联第 1 至 10 卷，封面采用第 1 卷参考图。 | Enterbrain「マジキューコミックス」《Fate/stay night》日文漫画选集的逻辑目录，按第1至第10卷组织独立单册。目录图采用第一卷的书影，各卷ISBN和挂牌分别保留。 |
| tags | Fate/stay night、漫画、Anthology、商业漫画选集、Enterbrain、KADOKAWA、系列目录 | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス、系列目录 |

来源：[1](https://www.kadokawa.co.jp/product/200700002632/)、[2](https://www.kadokawa.co.jp/product/200700002943/)、[3](https://jp.mercari.com/shops/product/mrP7SaCHPn5D6CVnoegqNJ)。

未决问题：无已记录未决问题。

### #81 · Fate/stay night アンソロジーコミック1

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-17vmdp9) · partial → verified · 已应用/完整读回通过 · 2026-10-29T14:19:35.781Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック1》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第1卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| imageRole | （空） | product |
| member | Fate stay night アンソロジーコミック 1 | 第1卷 |
| image | （空） | https://assets.mercari-shops-static.com/-/large/plain/WWSMRtZgDAuJfFEUGQLxfi.jpg@jpg |

来源：[1](https://www.kadokawa.co.jp/product/200700002632/)、[2](https://mottainaihonpo.com/shop/Item/bkui3105mblgqcfc)。

未决问题：无已记录未决问题。

### #82 · Fate/stay night アンソロジーコミック10

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-1q1tmhj) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:03.805Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック10》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第10卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 10 | 第10卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002943/)、[2](https://item.rakuten.co.jp/comicset/4757723520/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #83 · Fate/stay night アンソロジーコミック2

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-171nkmc) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:04.112Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック2》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第2卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 2 | 第2卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002647/)、[2](https://www.honyaclub.com/shop/goods/goods.aspx?goods=11979716)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #84 · Fate/Stay night アンソロジーコミック3

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-17bn6bb) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:04.449Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック3》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第3卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。本卷书目记载150页。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 3 | 第3卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002704/)、[2](https://books.rakuten.co.jp/rb/1694636/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #85 · Fate/Stay night アンソロジーコミック4

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-16hod8e) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:04.747Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック4》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第4卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 4 | 第4卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002717/)、[2](https://jp.mercari.com/shops/product/2ypWsJBAooQgZgtiBBLuCL)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #86 · Fate/stay night アンソロジーコミック5

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-16rnyxd) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:05.051Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック5》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第5卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。本卷书目记载142页。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 5 | 第5卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002742/)、[2](https://books.rakuten.co.jp/rb/1713007/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #87 · Fate/Stay night アンソロジーコミック6

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-15xp5ug) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:05.344Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/Stay night アンソロジーコミック6》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第6卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 6 | 第6卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002776/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/WR666)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #88 · Fate/stay night アンソロジーコミック7

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-167orjf) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:05.888Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック7》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第7卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 7 | 第7卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002817/)、[2](https://store.kadokawa.co.jp/shop/g/g200700002817/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #89 · Fate/stay night アンソロジーコミック8

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-15dpygi) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:06.256Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック8》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第8卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 8 | 第8卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002863/)、[2](https://store.kadokawa.co.jp/shop/g/g200700002863/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #90 · Fate/stay night アンソロジーコミック9

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=member-15npk5h) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:20:06.546Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | KADOKAWA | エンターブレイン |
| summary | KADOKAWA书目收录的《Fate/stay night アンソロジーコミック9》是漫画选集，收录围绕原作角色创作的商业短篇漫画。 | Enterbrain「マジキューコミックス」出版的《Fate/stay night》日文漫画选集第9卷，属于这套十卷选集中的独立单册。以原作世界与人物为题材的选集形式，与同名故事漫画的连续改编卷次分别编目。 |
| tags | Fate/stay night、漫画选集、Fate/stay night アンソロジーコミック、KADOKAWA、商业漫画选集、Enterbrain | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス |
| member | Fate stay night アンソロジーコミック 9 | 第9卷 |

来源：[1](https://www.kadokawa.co.jp/product/200700002906/)。

未决问题：出版社该卷封面旧回执为404；新增书目对应已核对，仍缺本卷可视觉确认的封面。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #91 · Fate stay night アンソロジーコミック 全10巻セット(ランクB)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=8d0ad208-bbb5-4139-97a0-457c57beed04) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:21:01.795Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| series | Fate | Fate/stay night |
| productLine | Fate stay night アンソロジーコミック 全10巻セット(ランクB) | Fate/stay night アンソロジーコミック |
| productType | （空） | 漫画选集卖家套装 |
| summary | （空） | 骏河屋把Enterbrain版《Fate/stay night アンソロジーコミック》第1至第10卷合售的中古套装；本条原挂牌为ランクB。十册对应独立出版卷次，成色随挂牌保留。 |
| tags | 书籍、卖家拼套、アンソロジー、コミック、ランク、Fate、品牌:エンターブレイン、产品线:Fate stay night アンソロジーコミック 全10巻セット(ランクB)、作品:Fate、发售年:2005、出版社:エンターブレイン | Fate/stay night、漫画选集、エンターブレイン、マジキューコミックス、卖家拼套 |
| imageRole | （空） | catalogue_reference |
| wave | （空） | 1–10 |
| member | Fate stay night アンソロジーコミック 全10巻セット(ランクB) | 第1–10卷合售 |
| jan | 9784757723528 | （空） |

来源：[1](https://www.suruga-ya.jp/product/detail/WN1316?branch_number=0002)、[2](https://www.kadokawa.co.jp/product/200700002943/)。

未决问题：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #92 · Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-8756a25a5dafc97e8e16cc2dfec8c605) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:21:02.081Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| series | Fate | Fate:Lost Einherjar |
| productLine | Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍) | Fate:Lost Einherjar 極光のアスラウグ |
| productType | （空） | 小说 |
| summary | （空） | TYPE-MOON BOOKS发行、桜井光著、三輪士郎绘制插画的《Fate:Lost Einherjar 極光のアスラウグ》第一卷「亜種二連聖杯戦争」。故事从九世纪北欧延伸到201X年的奥斯陆，阿斯拉乌格与拉格纳作为从者被召唤，卷入二连圣杯战争。 |
| tags | 书籍、Lost、聖杯、戦争、書籍、Fate、品牌:TYPE-MOON TYPE-MOON BOOKS、产品线:Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍)、出版社:TYPE-MOON BOOKS、作品:Fate、发售年:2022、零售目录、TYPE-MOON | Fate:Lost Einherjar、小说、TYPE-MOON BOOKS、桜井光、三輪士郎、アスラウグ、ラグナル・ロズブローク |
| wave | （空） | 1 |
| member | Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 (書籍) | 第1卷 亜種二連聖杯戦争 |
| characters |  | アスラウグ、ラグナル・ロズブローク |

来源：[1](https://typemoon.com/products/tmbooks/aslaug/)、[2](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-032171-R)。

未决问题：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #93 · Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 / 桜井光 / 三輪士郎 / TYPE-MOON

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-47ed7d0c0174ad78f2164f35017e288a) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:21:02.367Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| category | 書籍 | 小説 |
| series | Fate | Fate:Lost Einherjar |
| productLine | Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 | Fate:Lost Einherjar 極光のアスラウグ |
| publisher | TYPE-MOON | TYPE-MOON BOOKS |
| productType | （空） | 小说 |
| summary | （空） | TYPE-MOON BOOKS发行、桜井光著、三輪士郎绘制插画的《Fate:Lost Einherjar 極光のアスラウグ》第一卷「亜種二連聖杯戦争」。故事从九世纪北欧延伸到201X年的奥斯陆，阿斯拉乌格与拉格纳作为从者被召唤，卷入二连圣杯战争。 |
| tags | 书籍、Lost、聖杯、戦争、桜井、士郎、Fate、同人誌、品牌:TYPE－MOON、出版社:TYPE-MOON、作品:Fate、发售年:2022、类别:書籍 | Fate:Lost Einherjar、小说、TYPE-MOON BOOKS、桜井光、三輪士郎、アスラウグ、ラグナル・ロズブローク |
| wave | （空） | 1 |
| member | Fate:Lost Einherjar 極光のアスラウグ 1巻 亜種二連聖杯戦争 / 桜井光 / 三輪士郎 / TYPE-MOON | 第1卷 亜種二連聖杯戦争 |
| characters |  | アスラウグ、ラグナル・ロズブローク |

来源：[1](https://typemoon.com/products/tmbooks/aslaug/)、[2](https://www.suruga-ya.jp/product/detail/ZHORE256167)。

未决问题：骏河屋内部编码0400310302762与Amiami发行JAN不同；不移植另一挂牌JAN、不自动合并，待书体/版权页与版本照片确认。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #484 · Fate/Prototype 蒼銀のフラグメンツ

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=family-c91ba4972ab712e2ca5b67ef3132eeb1) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:00.620Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说系列目录 |
| summary | （空） | 桜井光著、中原绘制插画的《Fate/Prototype 蒼銀のフラグメンツ》原版单行本小说目录，共五卷，描写《Fate/Prototype》八年前的圣杯战争。此目录组织原版各卷和店铺记录，文库改版与鈴木ツタ漫画版分别编目。 |
| tags | 系列档案 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、系列目录 |
| image | https://cdn.suruga-ya.jp/database/pics_webp/game/2m2990.jpg.webp | https://cdn.kdkw.jp/cover_1000/321405/321405000240.webp |

来源：[1](https://www.kadokawa.co.jp/product/321405000240/)、[2](https://www.kadokawa.co.jp/product/321405000241/)、[3](https://www.kadokawa.co.jp/product/321408000209/)、[4](https://www.kadokawa.co.jp/product/321408000210/)、[5](https://www.kadokawa.co.jp/product/321502000137/)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #485 · Fate/Prototype 蒼銀のフラグメンツ

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=family-ece84739ad4d11735dbc4948fe7edd5f) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:01.065Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| productLine | Fate/Prototype 蒼銀のフラグメンツ | Fate/Prototype 蒼銀のフラグメンツ 漫画版 |
| productType | （空） | 漫画系列目录 |
| summary | （空） | 鈴木ツタ改编《Fate/Prototype 蒼銀のフラグメンツ》小说的漫画版目录，以沙条爱歌与Saber参与的圣杯战争为故事背景。第一卷通常版与附亚克力立牌的特装版分别保留，原版小说各卷移入小说目录。 |
| tags | 系列档案 | Fate/Prototype、漫画、KADOKAWA、鈴木ツタ、系列目录 |
| image | https://cdn.kdkw.jp/cover_1000/321408/321408000210.webp | https://cdn.kdkw.jp/cover_1000/322404/322404000993.webp |

来源：[1](https://www.kadokawa.co.jp/product/322404000993/)、[2](https://www.kadokawa.co.jp/product/322404000992/)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #486 · Fate/Prototype 蒼銀のフラグメンツ (1)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-9447610c42728f7b86ee5d52ba4486ca) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:23:01.568Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| summary | KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (1)》是小说，桜井光创作的 Fate/Prototype 前传小说。 | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第1卷。以1991年的圣杯战争为起点，描写沙条爱歌与Saber的契约，以及年幼的绫香所见的姐姐。 |
| tags | Fate/Prototype、小说、Fate/Prototype 蒼銀のフラグメンツ、KADOKAWA、桜井光、前传 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、沙条愛歌、沙条綾香、セイバー |
| member | Fate/Prototype 蒼銀のフラグメンツ (1) | 第1卷（原版单行本） |
| kind | unknown | base |
| characters |  | 沙条愛歌、沙条綾香、セイバー |

来源：[1](https://www.kadokawa.co.jp/product/321405000240/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2990)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #487 · Fate/Prototype 蒼銀のフラグメンツ (2)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-ad7c3d833749fffd927ae606c8a14513) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:23:01.884Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| summary | KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (2)》是小说，桜井光创作的 Fate/Prototype 前传小说。 | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第2卷。延续《Fate/Prototype》的前日谭，以交错的阵营心愿推进圣杯战争；本卷官方介绍明确收录中原绘制的全彩插画。 |
| tags | Fate/Prototype、小说、Fate/Prototype 蒼銀のフラグメンツ、KADOKAWA、桜井光、前传 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传 |
| member | Fate/Prototype 蒼銀のフラグメンツ (2) | 第2卷（原版单行本） |
| kind | unknown | base |

来源：[1](https://www.kadokawa.co.jp/product/321405000241/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2991)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #488 · Fate/Prototype 蒼銀のフラグメンツ (3)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-ee54ecbcd5737dd27cc7f4192c7a2040) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:23:02.290Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| summary | KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (3)》是小说，桜井光创作的 Fate/Prototype 前传小说。 | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第3卷。围绕Assassin的自我矛盾、曾统治世界的Rider，以及试图阻止圣杯战争的Berserker，展开不同从者的参战立场。 |
| tags | Fate/Prototype、小说、Fate/Prototype 蒼銀のフラグメンツ、KADOKAWA、桜井光、前传 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、アサシン、ライダー、バーサーカー |
| member | Fate/Prototype 蒼銀のフラグメンツ (3) | 第3卷（原版单行本） |
| kind | unknown | base |
| characters |  | アサシン、ライダー、バーサーカー |

来源：[1](https://www.kadokawa.co.jp/product/321408000209/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M3447)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #489 · Fate/Prototype 蒼銀のフラグメンツ (4)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-1a19408b2f4ef5af6c71b43dde757f3c) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:23:02.701Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| summary | KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (4)》是小说，桜井光创作的 Fate/Prototype 前传小说。 | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第4卷。聚焦Archer与御主エルザ・西条的共同作战，以及Lancer受ナイジェル・セイワード灵药支配的困境。 |
| tags | Fate/Prototype、小说、Fate/Prototype 蒼銀のフラグメンツ、KADOKAWA、桜井光、前传 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、アーチャー、エルザ・西条、ランサー、ナイジェル・セイワード |
| member | Fate/Prototype 蒼銀のフラグメンツ (4) | 第4卷（原版单行本） |
| kind | unknown | base |
| characters |  | アーチャー、エルザ・西条、ランサー、ナイジェル・セイワード |

来源：[1](https://www.kadokawa.co.jp/product/321408000210/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M4603)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #490 · Fate/Prototype 蒼銀のフラグメンツ (5)

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-c2b2e148b7681b82c96330739b270d70) · partial → partial · 已应用/完整读回通过 · 2026-10-29T14:23:03.097Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| summary | KADOKAWA书目收录的《Fate/Prototype 蒼銀のフラグメンツ (5)》是小说，桜井光创作的 Fate/Prototype 前传小说。 | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第5卷。五卷原版小说的完结卷，围绕沙条爱歌的愿望与Saber推进圣杯战争的最终局面。 |
| tags | Fate/Prototype、小说、Fate/Prototype 蒼銀のフラグメンツ、KADOKAWA、桜井光、前传 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、沙条愛歌、セイバー |
| member | Fate/Prototype 蒼銀のフラグメンツ (5) | 第5卷（原版单行本） |
| kind | unknown | base |
| characters |  | 沙条愛歌、セイバー |

来源：[1](https://www.kadokawa.co.jp/product/321502000137/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M5568)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #493 · Fate/Prototype 蒼銀のフラグメンツ 1 アクリルスタンド付き特装版 (書籍)[KADOKAWA]《在庫切れ》

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-6507b9cf8cf301dda6981354e1d1e4ab) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:35.344Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| productLine | Fate/Prototype 蒼銀のフラグメンツ | Fate/Prototype 蒼銀のフラグメンツ 漫画版 |
| productType | （空） | 附特典漫画特装版 |
| summary | （空） | 鈴木ツタ绘制的《Fate/Prototype 蒼銀のフラグメンツ》漫画第一卷特装版，在漫画书之外附Saber全身亚克力立牌。改编桜井光的前日谭小说，以1991年东京的圣杯战争为舞台；本版ISBN与漫画通常版不同。 |
| tags | 书籍、アクリルスタンド、Prototype、フラグ、メンツ、アクリル、スタンド、付き、書籍、KADOKAWA、在庫、切れ、TYPE-MOON、Fate、奈須きのこ、特典、品牌:KADOKAWA、产品线:Fate/Prototype 蒼銀のフラグメンツ、出版社:KADOKAWA、作品:Fate/Prototype、发售年:2024、零售目录、类别:コミック、画师/作者:鈴木 ツタ、画师/作者:桜井 光、画师/作者:イラスト 中原、画师/作者:ＴＹＰＥ－ＭＯＯＮ、亚克力立牌、出版社档案 | Fate/Prototype、漫画、KADOKAWA、鈴木ツタ、特装版、アクリルスタンド、セイバー |
| member | Fate/Prototype 蒼銀のフラグメンツ 1 アクリルスタンド付き特装版 (書籍)[KADOKAWA]《在庫切れ》 | 第1卷 亚克力立牌特装版 |
| characters |  | セイバー |

来源：[1](https://www.kadokawa.co.jp/product/322404000992/)、[2](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-041430)。

未决问题：尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #494 · Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-b5830bd4ca18e15655566e1166eb9bee) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:35.670Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| productLine | Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光 | Fate/Prototype 蒼銀のフラグメンツ |
| productType | （空） | 小说卖家拼套 |
| summary | （空） | 原拍卖标题将《Fate/Prototype 蒼銀のフラグメンツ》第1至第5卷与《Fate/Labyrinth》一起出售，是跨书目卖家拼套。具体各册版本、书况和附属物仍需原拍卖照片确认。 |
| tags | 书籍、卖家拼套、Fate、作品:Fate/Prototype | Fate/Prototype、Fate/Labyrinth、小说、卖家拼套、桜井光 |
| wave | （空） | 1–5 |
| member | Fate/prototype 蒼銀のフラグメンツ 1~5巻セット+Fate/Labyrinth 桜井光 | 苍银第1–5卷与Fate/Labyrinth合售 |

来源：[1](https://auctions.yahoo.co.jp/jp/auction/u1223034656)、[2](https://www.kadokawa.co.jp/product/321502000137/)。

未决问题：原拍卖照片未能重新核验，不能确定每册版本与附件；不新建物理组件关系。；尚未完成本版本图片的视觉对应核验；现有链接不作为核实凭据。。

### #495 · Fate/Prototype 蒼銀のフラグメンツ 全5巻セット / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=b3c2f3ac-46ad-427b-b106-0ecd3e4bf579) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:36.332Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| productLine | （空） | Fate/Prototype 蒼銀のフラグメンツ |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说卖家套装 |
| summary | （空） | 《Fate/Prototype 蒼銀のフラグメンツ》原版小说五卷的中古合售记录。现存挂牌包含普通五卷套装与标明附収納BOX的另一款，收纳盒是否随附须以各条挂牌为准。 |
| tags | 书籍、卖家拼套、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、特典、发售年:2017 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、卖家拼套 |
| imageRole | （空） | catalogue_reference |
| wave | （空） | 1–5 |
| member | Fate/Prototype 蒼銀のフラグメンツ 全5巻セット / 桜井光 | 原版第1–5卷合售 |
| jan | 9784041031445 | （空） |

来源：[1](https://www.suruga-ya.jp/kaitori/kaitori_detail/2Y1040)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2Y1252)、[3](https://www.kadokawa.co.jp/product/321502000137/)。

未决问题：同一Item存在普通套装与収納BOX付两类挂牌，需后续带报价迁移回执的拆分决定；本批不挪动或删除报价。；套装参考图尚未视觉核验。。

### #496 · Fate/Prototype 蒼銀のフラグメンツ(1) / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=21bf754b-7370-4f5e-83c4-9adeafdcd83d) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:36.719Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说 |
| summary | （空） | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第1卷。以1991年的圣杯战争为起点，描写沙条爱歌与Saber的契约，以及年幼的绫香所见的姐姐。 |
| tags | 书籍、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、产品线:Fate/Prototype 蒼銀のフラグメンツ、发售年:2014 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、沙条愛歌、沙条綾香、セイバー |
| imageRole | （空） | product |
| member | Fate/Prototype 蒼銀のフラグメンツ(1) / 桜井光 | 第1卷（原版单行本） |
| characters |  | 沙条愛歌、沙条綾香、セイバー |
| isbn | （空） | 9784041021279 |

方案调整：图片缺少独立视觉凭证，按NEXT_TASK保留生产原图；仍为partial。

来源：[1](https://www.kadokawa.co.jp/product/321405000240/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2990)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #497 · Fate/Prototype 蒼銀のフラグメンツ(2) / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=bab8701d-a249-4022-91c9-625d79a100ff) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:37.205Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说 |
| summary | （空） | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第2卷。延续《Fate/Prototype》的前日谭，以交错的阵营心愿推进圣杯战争；本卷官方介绍明确收录中原绘制的全彩插画。 |
| tags | 书籍、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、产品线:Fate/Prototype 蒼銀のフラグメンツ、发售年:2014 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传 |
| imageRole | （空） | product |
| member | Fate/Prototype 蒼銀のフラグメンツ(2) / 桜井光 | 第2卷（原版单行本） |
| isbn | （空） | 9784041021286 |

方案调整：图片缺少独立视觉凭证，按NEXT_TASK保留生产原图；仍为partial。

来源：[1](https://www.kadokawa.co.jp/product/321405000241/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M2991)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #498 · Fate/Prototype 蒼銀のフラグメンツ(3) / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=cdab3ad1-68d4-419c-a12c-b3399e72274d) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:37.579Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说 |
| summary | （空） | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第3卷。围绕Assassin的自我矛盾、曾统治世界的Rider，以及试图阻止圣杯战争的Berserker，展开不同从者的参战立场。 |
| tags | 书籍、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、产品线:Fate/Prototype 蒼銀のフラグメンツ、发售年:2015 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、アサシン、ライダー、バーサーカー |
| imageRole | （空） | product |
| member | Fate/Prototype 蒼銀のフラグメンツ(3) / 桜井光 | 第3卷（原版单行本） |
| characters |  | アサシン、ライダー、バーサーカー |
| isbn | （空） | 9784041024522 |

方案调整：图片缺少独立视觉凭证，按NEXT_TASK保留生产原图；仍为partial。

来源：[1](https://www.kadokawa.co.jp/product/321408000209/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M3447)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #499 · Fate/Prototype 蒼銀のフラグメンツ(4) / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=2a92ea72-5340-403c-9bc1-71420ee63f9e) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:38.534Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说 |
| summary | （空） | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第4卷。聚焦Archer与御主エルザ・西条的共同作战，以及Lancer受ナイジェル・セイワード灵药支配的困境。 |
| tags | 书籍、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、产品线:Fate/Prototype 蒼銀のフラグメンツ、发售年:2016 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、アーチャー、エルザ・西条、ランサー、ナイジェル・セイワード |
| imageRole | （空） | product |
| member | Fate/Prototype 蒼銀のフラグメンツ(4) / 桜井光 | 第4卷（原版单行本） |
| characters |  | アーチャー、エルザ・西条、ランサー、ナイジェル・セイワード |
| isbn | （空） | 9784041024539 |

方案调整：图片缺少独立视觉凭证，按NEXT_TASK保留生产原图；仍为partial。

来源：[1](https://www.kadokawa.co.jp/product/321408000210/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M4603)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #500 · Fate/Prototype 蒼銀のフラグメンツ(5) / 桜井光

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=6cd1e115-1669-450d-b042-be02c96cacb6) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:23:38.997Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| origin | unknown | commercial |
| publisher | 角川書店/KADOKAWA | KADOKAWA |
| productType | （空） | 小说 |
| summary | （空） | 桜井光著、中原绘制插画的《苍银的碎片》原版日文小说第5卷。五卷原版小说的完结卷，围绕沙条爱歌的愿望与Saber推进圣杯战争的最终局面。 |
| tags | 书籍、Prototype、フラグ、メンツ、桜井、Fate、品牌:角川書店/KADOKAWA、出版社:角川書店/KADOKAWA、画师/作者:中原、产品线:Fate/Prototype 蒼銀のフラグメンツ、发售年:2017 | Fate/Prototype、小说、KADOKAWA、桜井光、中原、前传、沙条愛歌、セイバー |
| imageRole | （空） | product |
| member | Fate/Prototype 蒼銀のフラグメンツ(5) / 桜井光 | 第5卷（原版单行本） |
| characters |  | 沙条愛歌、セイバー |
| isbn | （空） | 9784041031445 |
| releaseDate | 2017-03-10 | 2017-04-26 |

方案调整：图片缺少独立视觉凭证，按NEXT_TASK保留生产原图；仍为partial。

来源：[1](https://www.kadokawa.co.jp/product/321502000137/)、[2](https://www.suruga-ya.jp/kaitori/kaitori_detail/2M5568)。

未决问题：历史回执有图片哈希及尺寸，但未定位独立视觉核对记录；需确认封面与具体卷次/版本对应。。

### #509 · Fate/Requiem

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=family-16c4c4278428fb44aff7e22ca7e15479) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:25:23.794Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | TYPE-MOON | TYPE-MOON BOOKS |
| productType | （空） | 小说系列目录 |
| summary | （空） | 星空めてお著、NOCO绘制插画的TYPE-MOON BOOKS《Fate/Requiem》小说系列目录。故事描写圣杯战争结束后的世界，以没有圣杯的少女宇津见绘里濑与神秘少年相遇为起点；此目录按独立卷次组织，已核对第一卷「星巡る少年」和第二卷「懐想都市新宿」。 |
| tags | 系列档案 | Fate/Requiem、小说、TYPE-MOON BOOKS、星空めてお、NOCO、系列目录 |

来源：[1](https://www.typemoon.com/products/tmbooks/requiem/)。

未决问题：现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。。

### #510 · Fate/Requiem 1 『星巡る少年』 / 星空めてお / NOCO / TYPE-MOON

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-0fe194fcad613e09070850be41941fa0) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:25:24.174Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| publisher | TYPE-MOON | TYPE-MOON BOOKS |
| productType | （空） | 小说 |
| summary | （空） | TYPE-MOON BOOKS发行、星空めてお著、NOCO绘制插画的《Fate/Requiem》第一卷「星巡る少年」。在圣杯战争结束、人人拥有圣杯并召唤从者的世界里，唯独没有圣杯的宇津见绘里濑遇见了最后被召唤的神秘少年。 |
| tags | 书籍、Requiem、巡る、少年、星空、TYPE-MOON、Fate、同人誌、品牌:TYPE-MOON、产品线:Fate/Requiem、出版社:TYPE-MOON、发售年:2018、品牌:TYPE-MOON TYPE-MOON BOOKS、出版社:TYPE-MOON BOOKS、零售目录 | Fate/Requiem、小说、TYPE-MOON BOOKS、星空めてお、NOCO、宇津見エリセ |
| imageRole | （空） | product |
| member | Fate/Requiem 1 『星巡る少年』 / 星空めてお / NOCO / TYPE-MOON | 第1卷 星巡る少年 |
| characters |  | 宇津見エリセ |
| releaseDate | 2018/12/29 | 2018-12-31 |

来源：[1](https://www.typemoon.com/products/tmbooks/requiem/)、[2](https://typemoon.com/news/2018/-Ms4ny)、[3](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-012659)。

未决问题：现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。。

### #511 · Fate/Requiem 2 『懐想都市新宿』 (書籍)[TYPE-MOON BOOKS]《在庫切れ》

[打开详情](https://collector-radar.martainjonn.chatgpt.site/?item=source-c29c5b9bf940672edd2e74b51a3943b7) · pending → partial · 已应用/完整读回通过 · 2026-10-29T14:25:24.778Z

| 字段 | 写前生产值 | 写后读回值 |
| --- | --- | --- |
| productType | （空） | 小说 |
| summary | （空） | TYPE-MOON BOOKS发行、星空めてお著、NOCO绘制插画的《Fate/Requiem》第二卷「懐想都市新宿」。宇津见绘里濑与金色少年踏上寻找失落“废都冬木”的旅程，从临海都市秋叶原前往怀想都市新宿，继续探索重构后的世界。 |
| tags | 书籍、Requiem、都市、新宿、書籍、BOOKS、在庫、切れ、TYPE-MOON、Fate、品牌:TYPE-MOON TYPE-MOON BOOKS、产品线:Fate/Requiem、出版社:TYPE-MOON BOOKS、发售年:2020、零售目录 | Fate/Requiem、小说、TYPE-MOON BOOKS、星空めてお、NOCO、宇津見エリセ |
| imageRole | （空） | product |
| member | Fate/Requiem 2 『懐想都市新宿』 (書籍)[TYPE-MOON BOOKS]《在庫切れ》 | 第2卷 懐想都市新宿 |
| characters |  | 宇津見エリセ |
| releaseDate | 20年06月12日 | 2020-06-12 |

来源：[1](https://www.typemoon.com/products/tmbooks/requiem/)、[2](https://typemoon.com/news/2020/KUuKXN)、[3](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-015842)。

未决问题：现有Amiami书影尚未完成逐卷视觉核对；保留原图及准确imageRole，不以HTTP或搜索缩略图标记verified。。

## 验证范围

35,020条active紧凑目录完成有界只读覆盖：15,811主目录、19,209同人；稳定ID无重复，原15,811编号保持。覆盖扫描不等于资料核实。8,549条归并存档未进入写入范围；总关系仍1,835，仅指定五边变更。

本次没有应用代码变化，没有重复运行历史46项回归、构建或全量导入，也没有新增浏览器视觉验收。历史v4、v8、fate-snapshot失败及约3.10倍全量导入耗时回退仍保留，不声称CI全绿。完整生产原件、请求、逐项读回及受保护回滚仅在忽略目录work/current-stage/；本页仅含脱敏差异。

## 本轮页面核查发现的未解决问题

实际查看 #80、#484、#495；这不是32页逐页视觉验收，也不提升图片核实状态。

- #484 小说目录显示10条成员：#486–490与#496–500各构成1–5卷。五条父级移动正确，但同卷重复商品仍需单独核对身份和Offer后决定归并。
- #495 显示“5件拥有状态未知”，下方同时显示“还缺1”，未知/缺少的界面语义不一致，尚未修改代码或收藏状态。
- #80正确显示漫画选集逻辑目录与“已核实”；其他缺图卷次继续保留待补，不把父目录核实传播到子项。

固定32条数据修订已完成，整体商品识别/去重和界面逻辑仍待人工验收；上述问题不视为通过。
