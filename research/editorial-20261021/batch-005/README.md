# 批次 005：逐项资料修订验收页

**29 条 prepared，生产 applied 0。** 已在 43,569 条记录的完整隔离副本实际应用并逐项读回；14 条达到五项核实条件，15 条保留具体问题。这两个数字是隔离结果，不增加生产 verified。实时只读投影/完整目标版本尚不可得；本批以 2026-10-26 快照为基准，生产应用前必须逐项重读和重定版本。

## 一页代表性结果

| 原编号 | 原问题 | 本批结果与来源 | 未解决问题 |
| --- | --- | --- | --- |
| #81 | 第一卷缺封面，简介仅指向系列 | ISBN 9784757717954 对应 Enterbrain マジキュー漫画选集第1卷；复用 #80 已视觉核对的相同ISBN书影，明确图像角色为单册商品图 | 无（隔离） |
| #91 | 产品线混入套装与ランクB；第10卷ISBN被当作套装编号 | 骏河屋 WN1316 第1–10卷卖家合售；清除Item错误JAN，保留原日文题、所有Offer及成色记录；补中文说明和规范标签 | 套装图片未视觉核对 |
| #486–490 | 小说位于漫画逻辑目录，简介空泛 | 五卷各自补内容简介、作者/插画与有出处的角色标签；五条contains从 #485 改到原版小说 #484；逐卷ISBN、旧封面回执对应 | 无（隔离） |
| #489/#499 | 只有书目模板或空简介 | 第4卷明确介绍Archer/エルザ阵营与Lancer受灵药支配的困境；原版ISBN 9784041024539；两个店铺Item及报价仍独立 | 无（隔离） |
| #485 | 漫画目录借用小说第4卷图 | 改用已核对的漫画第1卷参考封面，产品线明确漫画版；保留通常/特装版两个成员 | 无（隔离） |
| #93 | 骏河屋同人店铺标签混进作品事实 | 依据 TYPE-MOON 官方页及作者/卷名对应为《極光のアスラウグ》小说第1卷；保留原来源文本 | 店铺内部码不同，待版本照片；未自动合并 |
| #495 | 普通套装与収納BOX付报价混在一条Item | 明确记录 2Y1040 / 2Y1252 两款差异，补摘要；清除第5卷ISBN误作套装编号 | 需有独立报价迁移回执的拆分；套装图未核实 |

summary 在详情页标题下显示，description 在“商品详细说明”显示。本批只补 summary，完整保留每条原始 description。原日文标题全部保留。没有无来源的稀有度、购入价值、附件或年份推断。

## 计数与验证

- 分类/层级字段：29 条；其中 category 实际改变 2 条。中文简介：29 条；标签：29 条；主图：8 条；逻辑父级关系：5 条。
- preserved：43,540 条未涉及记录逐字节保留；prepared：29；applied（生产）：0；isolatedApplied：29；verified（隔离五项合格）：14；partial：15。
- 全部 47,433 个 Offer 及历史、个人字段、锁定人工字段、8,549 条归并存档、15,811 个原编号和1,835条关系保留；只改指定五条边的fromId。
- 过期 curation 请求、过期Item/关系计划均拒绝；回滚后的Item字节与全部关系哈希完全恢复；存在后续编辑时拒绝撤销。验收副本保持应用后状态供预览。
- 未调用生产写入、归并、全量导入、报价抓取或发布；历史001–004绝不能重放。

## 全部变更清单

| 原编号 | Item ID | 修改字段 | 状态 | 身份来源 |
| --- | --- | --- | --- | --- |
| 80 | `family-bd1e9d29d163cfb06f93cbe07b7b0c30` | category、publisher、productType、summary、tags | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/200700002632/) |
| 81 | `member-17vmdp9` | publisher、summary、tags、member、image、imageRole | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/200700002632/) |
| 82 | `member-1q1tmhj` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002943/) |
| 83 | `member-171nkmc` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002647/) |
| 84 | `member-17bn6bb` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002704/) |
| 85 | `member-16hod8e` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002717/) |
| 86 | `member-16rnyxd` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002742/) |
| 87 | `member-15xp5ug` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002776/) |
| 88 | `member-167orjf` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002817/) |
| 89 | `member-15dpygi` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002863/) |
| 90 | `member-15npk5h` | publisher、summary、tags、member | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/200700002906/) |
| 91 | `8d0ad208-bbb5-4139-97a0-457c57beed04` | origin、series、productLine、productType、summary、tags、jan、wave、member、imageRole | 待应用；partial | [来源](https://www.suruga-ya.jp/product/detail/WN1316?branch_number=0002) |
| 92 | `source-8756a25a5dafc97e8e16cc2dfec8c605` | productType、series、productLine、wave、member、summary、tags、characters | 待应用；partial | [来源](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-032171-R) |
| 93 | `source-47ed7d0c0174ad78f2164f35017e288a` | category、productType、series、productLine、publisher、wave、member、summary、tags、characters | 待应用；partial | [来源](https://www.suruga-ya.jp/product/detail/ZHORE256167) |
| 484 | `family-c91ba4972ab712e2ca5b67ef3132eeb1` | origin、productType、publisher、summary、tags、image | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321405000240/) |
| 485 | `family-ece84739ad4d11735dbc4948fe7edd5f` | productType、productLine、summary、tags、image | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/322404000993/) |
| 486 | `source-9447610c42728f7b86ee5d52ba4486ca` | member、kind、summary、tags、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321405000240/) |
| 487 | `source-ad7c3d833749fffd927ae606c8a14513` | member、kind、summary、tags | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321405000241/) |
| 488 | `source-ee54ecbcd5737dd27cc7f4192c7a2040` | member、kind、summary、tags、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321408000209/) |
| 489 | `source-1a19408b2f4ef5af6c71b43dde757f3c` | member、kind、summary、tags、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321408000210/) |
| 490 | `source-c2b2e148b7681b82c96330739b270d70` | member、kind、summary、tags、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321502000137/) |
| 493 | `source-6507b9cf8cf301dda6981354e1d1e4ab` | productType、productLine、member、summary、tags、characters | 待应用；partial | [来源](https://www.kadokawa.co.jp/product/322404000992/) |
| 494 | `source-b5830bd4ca18e15655566e1166eb9bee` | origin、productType、productLine、wave、member、summary、tags | 待应用；partial | [来源](https://auctions.yahoo.co.jp/jp/auction/u1223034656) |
| 495 | `b3c2f3ac-46ad-427b-b106-0ecd3e4bf579` | origin、productType、productLine、publisher、jan、wave、member、summary、tags、imageRole | 待应用；partial | [来源](https://www.suruga-ya.jp/kaitori/kaitori_detail/2Y1040) |
| 496 | `21bf754b-7370-4f5e-83c4-9adeafdcd83d` | origin、productType、publisher、member、isbn、summary、tags、image、imageRole、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321405000240/) |
| 497 | `bab8701d-a249-4022-91c9-625d79a100ff` | origin、productType、publisher、member、isbn、summary、tags、image、imageRole | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321405000241/) |
| 498 | `cdab3ad1-68d4-419c-a12c-b3399e72274d` | origin、productType、publisher、member、isbn、summary、tags、image、imageRole、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321408000209/) |
| 499 | `2a92ea72-5340-403c-9bc1-71420ee63f9e` | origin、productType、publisher、member、isbn、summary、tags、image、imageRole、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321408000210/) |
| 500 | `6cd1e115-1669-450d-b042-be02c96cacb6` | origin、productType、publisher、member、isbn、summary、tags、image、imageRole、releaseDate、characters | 待应用；五项通过 | [来源](https://www.kadokawa.co.jp/product/321502000137/) |

完整逐项 before/after、expectedVersion、afterVersion、来源、身份对应、字段证据、checks、unresolved、关系差异：[diffs.json](diffs.json)。原文缓存定位：[source-cache-reuse.json](source-cache-reuse.json)。逐项决定：[decisions.json](decisions.json)。完整性/回滚：[validation.json](validation.json)；本地回执：[isolated-receipts.json](isolated-receipts.json)；关系计划：[relation-plan.json](relation-plan.json)。

复现（本地已有副本时脚本拒绝覆盖；保留或另存旧回执后再在新隔离目录运行）：

```sh
node scripts/editorial-group-prepare.mjs work/editorial-005/targets.json research/editorial-20261021/batch-005/decisions.json work/editorial-005/actions.json
node research/editorial-20261021/batch-005/validate.mjs
```

完整目标、动作、回滚原件和 SQLite 副本仅放忽略目录 work/editorial-005/，不进入 Git。29条是自然研究组总量，2个API请求只是20件限制。生产版本未核对、用户未批准前不得发送动作文件。
