# 300条真实挂牌试点：首批30条交付

2026-10-30 UTC。用户授权：更新GitHub Prompt、搭建隔离工作台、准备300条真实挂牌、先处理30条；正式商品库不得改动。Prompt已先提交为044155730e21684700366d250f24cb89f58d8c39。

## 已完成与边界

- 准备300条唯一来源挂牌，稳定编号P001–P300，原始行/文件哈希及时间可追溯。299条是既有采集观察，P015为真实Mercari挂牌的搜索索引观察；其详情已失效，不宣称当前在售。
- 首30条已运行现有rule-23基线，并由当前AI会话完成逐件资料查证与建议。后270条只准备，未运行识别或研究。
- 交付本机工作台：样本、原始挂牌、规则对照、研究建议、关联目录、证据、人工审核及导出。人工意见单独追加，支持刷新和重启后保留。
- 9组关联目录、84条证据记录（含30条挂牌、23条既有出版社快照）。资料集I/II/III/VIII分别38/35/37/24个收录条目，保留全部角色和职阶，不截断为15个标签。
- 独立人工参考答案0、用户审核0、正式商品库写入0、正式Site部署0、独立付费模型API调用0。
- 这不是HobbyLib已上线的自动互联网研究能力。系统自动部分是数据准备、规则基线、证据/研究建议入库和审核工作台；资料查证来自本次会话辅助研究。

## 样本与实验口径

| 类型 | 目标 | 实际 |
| --- | ---: | ---: |
| 书籍/资料集 | 60 | 46 |
| 卡片/随机周边 | 60 | 60 |
| 游戏/特典 | 60 | 60 |
| 手办/配件 | 40 | 40 |
| 2025–2026活动周边 | 40 | 22 |
| 其他/疑难/补足样本 | 40 | 72 |

书籍和活动组按当前可用二手来源、去重和互斥分配后不足目标；以其他真实二手观察补足300，不能把72条全部称为困难拼套。样本不是随机总体抽样。来源为Amiami59、骏河屋175、Mandarake8、Mercari19、Yahoo39；资料集21条。

分组后开发100、冻结候选200，202个组；标记已研究的23条全部放开发组。先按同标题、同发行族与既有分组做保守隔离。分组未完成人工审计，冻结候选尚无独立真值，且包含历史已入库商品，不能称为未见新品盲测或据此推算新品召回。

清单指纹：5a0c47b066a305c41c46cca33060dfd76bca24e3de97d2fada3dfa68f53ace7f。重复准备得到相同清单；原始输入固定，变更会拒绝覆盖。

## 首批发现

1. **P005套装ISBN污染**：1–22卷套装带有第22卷ISBN 9784065436097，现有规则以ISBN一致给出较强匹配。Publisher目录截至本次查证已到23卷，但第23卷不能自动算进旧挂牌。需增加标识作用范围，区分系列、单卷、卖家套装；原始采集发生在23卷发售之前。
2. **P015 Amiami挂画**：官方原版游戏特典页、2016年新闻和参考图分别支持Amiami、A3挂画、Wada Arco以及尼禄/玉藻前。建议作为Fate/EXTELLA的独立店铺特典关联。挂牌实物无法复核，因此候选身份仍待审核，不能因有限索引未匹配就直接建正式新品。
3. **P010从图补字段**：查看挂牌卡背后，能够读出Caster、库丘林、N07；第5弹只有待交叉核对的线索。避免因角色同名或旧库同标题就当成完整识别。
4. **P018/P019与P020组件**：玛修私服衣服套装与含人偶本体商品有不同JAN，不能合并；尼禄闭眼脸是GOODSMILE原预约特典，当前二手Amiami不是原发行店铺。
5. **P021–P024日期冲突**：Aniplex官方页面有延期公告，1月下旬改3月中旬，现标2026-03-13起发货。二手站2026-01-31保留为旧观察，活动年份2025独立保存。
6. **P025/P026/P027/P028保留未知**：学生证具体发放方式、混合拼包逐件身份、两张威化卡的各自弹次，以及animate徽章特典关系尚缺独立证据。卖家文字不是官方事实。
7. **P029/P030缺件和拆售**：VELBER BOX缺PS4游戏；EXTRA十周年印画是套装组件，挂牌写成EXTELLA十周年需要纠正。都不能套用完整游戏盒装的内容或价值。

威化14弹：官方总数34、含2秘密款已有依据；零售商34个名字仅为候选名单，未逐张确认，序号不当作印刷卡号。5/6弹总数已查，逐卡目录仍不完整。Fes挂画B组15款、C组17款为可选款式，不是整套实物或随机盲盒。

## 规则基线与验证

历史有效身份索引15,810条，来源日期2026-10-25；不含当前全库和完整报价。删除参考索引全部Offer，关闭原挂牌链接捷径。复用77个雷达模块/数据文件与加载器，其Git blob哈希全部与0441557一致（code-provenance.json）。候选规范化覆盖createItem/applyMetadata/repairClassification；不声称完整生产导入回放。

结果：27条matched、2条ambiguous、1条unmatched，约7.4秒。**这不是27条正确**。同名未知卡、卖家拼包也可能matched。每条重复计算决定一致，另做30个独立的同挂牌回扫探针，均返回原候选；不混入识别准确率。

已运行：试点6项自动测试全部通过；既有身份回归12项通过；identity-evaluate的24个合成样例无标签失败。合成评测不代表真实商品准确率。真实浏览器已检查列表/筛选、38角色完整展示、关联目录、隐藏建议、审核保存与刷新持久化、恶意HTML作为纯文本呈现；测试在8790独立副本，不写交付库。没有进行无关全量导入、正式构建或生产写入。

## 成本与下一轮实施

独立模型API费用0，公开资料抓取脚本21次（18份成功、3份503后参考官方搜索索引）。另有会话搜索和图片查看，次数/会话token未完整计量；订阅与人工时间未知，不能称总成本免费。完整页面缓存在本机，同一个系列可复用。未来运行须计量每条/每研究组请求、token、重试、人工分钟及每个正确结果成本；本次不能可靠外推3万条费用。

先请用户审核30条中13条重点案例及若干普通项，分开确认身份、版本/组件、标签含义和关联关系；在工作台填写理由，可导出review。审核记录是反馈，只有未见预测的独立标注才可成为测量真值。

收到反馈后依次：

1. 修正实验提取与匹配规则：ISBN/JAN作用范围，平台/版本硬冲突，发行渠道与当前卖家分离，缺件状态，日期类型，角色关系（收录/描绘）。修正不自动修改生产。
2. 建立可执行研究管线：先查本地已确认目录，按研究组缓存官方页；品类专用字段抽取；需要时视觉/OCR；每字段保留原文定位、时间、来源等级和冲突。配置可替换模型接口，使用新授权预算前不启动付费API。
3. 审计200冻结候选的商品组隔离，补充真实新增商品和硬负例；由用户/审核者先建独立参考答案，再跑剩余270条。分别报告候选召回、身份正确率、无依据字段、误合并、拒绝率、人工量和费用。
4. 严重误合并必须先解决。旧设计99.5%自动关联门槛仍有效，30/300条都不能据此证明；只有品类/来源的独立证据和误差区间满足门槛，才讨论小范围只读在线影子运行，生产写入另议。

旧32条已完成写入和独立读回，但#484同卷重复、#495未知/缺少显示尚未通过语义验收。它们保留为单独回归，本轮不重放旧动作。

## 逐条入口

| 样本 | 研究建议 | 优先级 | 原挂牌 |
| --- | --- | --- | --- |
| P001 | Fate/Grand Order material I | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-008296-R) |
| P002 | Fate/Grand Order material II | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-008297-R) |
| P003 | Fate/Grand Order material III | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-009096-R) |
| P004 | Fate/Grand Order material VIII | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=MED-BOOK-015843-R) |
| P005 | Fate/Grand Order -turas réalta- 1–22卷套装 | 重点核对 | [来源](https://www.suruga-ya.jp/product/detail/WK13678) |
| P006 | FGO ウエハース14 30 ダンテ・アリギエーリ | 常规审核 | [来源](https://order.mandarake.co.jp/order/detailPage/item?itemCode=1349900668&ref=list&dispCount=240&soldOut=1&keyword=Fate) |
| P007 | FGO ウエハース6 25 メルトリリス | 常规审核 | [来源](https://order.mandarake.co.jp/order/detailPage/item?itemCode=1349900577&ref=list&dispCount=240&soldOut=1&keyword=Fate) |
| P008 | FGO ウエハース14 22 両儀式 | 常规审核 | [来源](https://order.mandarake.co.jp/order/detailPage/item?itemCode=1349900460&ref=list&dispCount=240&soldOut=1&keyword=Fate) |
| P009 | FGO ウエハース5 13 エリザベート・バートリー〔ブレイブ〕 | 常规审核 | [来源](https://order.mandarake.co.jp/order/detailPage/item?itemCode=1110268223&ref=list&dispCount=240&soldOut=1&keyword=Fate) |
| P010 | FGO 威化卡 Caster／クー・フーリン N07（候选第5弹） | 重点核对 | [来源](https://jp.mercari.com/item/m29853131899) |
| P011 | Fate/EXTELLA PS4 通常版 | 重点核对 | [来源](https://www.suruga-ya.jp/product/other/107000643) |
| P012 | Fate/EXTELLA Nintendo Switch LIMITED BOX | 常规审核 | [来源](https://www.suruga-ya.jp/product/other/109000022) |
| P013 | Fate/EXTELLA LINK PS4 プレミアム限定版 | 常规审核 | [来源](https://www.suruga-ya.jp/product/detail/107001683) |
| P014 | Fate/EXTELLA LINK 斯卡哈「魔境のサージェント」服装码 | 重点核对 | [来源](https://auctions.yahoo.co.jp/jp/auction/h1247177232) |
| P015 | Fate/EXTELLA あみあみ特典 A3挂画／尼禄＆玉藻前 | 重点核对 | [来源](https://jp.mercari.com/item/m27190268962) |
| P016 | Saber／阿尔托莉雅 英霊正装Ver. 1/7 | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=FIGURE-048263-R) |
| P017 | figma Lancer／阿尔托莉雅 DX Edition 568-DX | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=FIGURE-140121-R) |
| P018 | ねんどろいどどーる 玛修私服 衣服套装 | 重点核对 | [来源](https://www.amiami.jp/top/detail/detail?gcode=FIGURE-183273-R) |
| P019 | ねんどろいどどーる 玛修私服 人偶 | 常规审核 | [来源](https://www.amiami.jp/top/detail/detail?gcode=FIGURE-183272-R) |
| P020 | figma 尼禄「目閉じドヤ顔」店铺特典替换脸 | 重点核对 | [来源](https://www.amiami.jp/top/detail/detail?gcode=FIGURE-143065-R) |
| P021 | FGO Fes.2025 迦摩 B2半裁挂画 | 常规审核 | [来源](https://www.suruga-ya.jp/product/detail/873122822) |
| P022 | FGO Fes.2025 洛乌希雪景球 | 常规审核 | [来源](https://www.suruga-ya.jp/product/detail/561358660) |
| P023 | FGO Fes.2025 Final Journey 桌面橡胶垫 | 常规审核 | [来源](https://www.suruga-ya.jp/product/detail/561358658) |
| P024 | FGO Fes.2025 阿斯克勒庇俄斯 B2半裁挂画 | 常规审核 | [来源](https://www.suruga-ya.jp/product/detail/873122739) |
| P025 | FGO Fes.2026 Rider／达芬奇 学生证卡 | 重点核对 | [来源](https://www.suruga-ya.jp/product/detail/887078213) |
| P026 | Fate 混合周边拼包（逐件身份待拆） | 重点核对 | [来源](https://auctions.yahoo.co.jp/jp/auction/e1240903214) |
| P027 | FGO 威化卡 卡多克＆贝里尔拼套 | 重点核对 | [来源](https://jp.mercari.com/item/m21101839771) |
| P028 | Fate/EXTELLA LINK 吉尔伽美什＆无铭 徽章2个套装 | 重点核对 | [来源](https://jp.mercari.com/item/m63381541922) |
| P029 | Fate/EXTELLA VELBER BOX（缺PS4游戏本体） | 重点核对 | [来源](https://www.suruga-ya.jp/product/detail/105007167) |
| P030 | Fate/EXTRA 10th ANNIVERSARY Celebration BOX Wada印画（单件） | 重点核对 | [来源](https://auctions.yahoo.co.jp/jp/auction/n1247140939) |

程序与启动说明见 [工作台README](../../tools/pilot-workbench/README.md)。字段证据与未知项以 proposals-30.json / evidence.json 为准。
