# 系列补证进度（2026-11-13）

截至 2026-11-13，累计已逐件检查 78 个系列的 6,992 条候选，5,191 条有效记录已补齐简介和来源。1,791 条仍待整条补证，3 条认可资料与6条既有V6简介原样保留，1 个历史编号已归档到已更新的有效记录。其余 1,770 个系列尚待逐件研究。完整核实系列数为 0。

本轮按顺序检查strange Fake闪粉徽章与埃尔梅罗二世镜面挂件各11条，共22条；20+2两批正式补充并完整读回，无跳过。仅补空缺简介并追加两条官方出处，原认可、旧证据、ISBN/JAN、原名、图片、个人字段、挂牌历史、关系及偏好保留。Sites 70，环境修订125；维护入口已实测 HTTP 401 关闭。

22条补入官方支持的系列共通信息，9条仍有字段待查：徽章2条原フラット名称与官方图FRANCESCA PRELATI冲突；挂件3条A/B原标签无官方画面映射；另4条包装记录保留实际封装、附件及专属条码缺口。原名不改，BOX商品码不填给单款或零售套组；挂件约65×65mm是最大尺寸，不能当每款精确长宽。

本轮[9条字段待查](../series-evidence-20261113/strangefake-mirror/field-pending.json)及[前轮未决链](../series-evidence-20261113/tsukihime-strangefake/resume.json)均保留；已补通用信息不等于完整核实。

前轮[2条日期字段待查](../series-evidence-20261113/tsukihime-strangefake/field-pending.json)保留；历史未决项沿[前轮断点](../series-evidence-20261113/link-samurai/resume.json)继续保留。

前轮LINK/Samurai的[1条整条待查](../series-evidence-20261113/link-samurai/pending.json)及[7条字段待查](../series-evidence-20261113/link-samurai/field-pending.json)保留。上轮极光E/F的22条记录保留[字段待查](../series-evidence-20261113/aurora-ef/field-pending.json)。此前闪粉F/もちもち23条已补充，7条名称/包装缺口仍见[此前待查](../series-evidence-20261112/glitterf-mochi16/field-pending.json)。此前ついコレ24条已补充，其4条包装字段继续[待查](../series-evidence-20261112/tsuikore45/field-pending.json)，以及此前エルメロイ/闪粉徽章23条均不重放。

此前2条书目跨卷冲突见[整条待查](../series-evidence-20261112/elmelloi-glitter/pending.json)，2条徽章包装见[字段待查](../series-evidence-20261112/elmelloi-glitter/field-pending.json)。

此前卫宫家/Vol.22两批26条不重放。此前FoxTail/徽章42条不重放，其中2条单包仍有[字段待查](../series-evidence-20261112/foxtail-badges/field-pending.json)；此前Vol.22的3条包装缺口见[字段待查](../series-evidence-20261112/emiya-chara22/field-pending.json)。

上一轮CLIMAX/英霊剣豪31条已补充，CLIMAX第1～8卷页数/开本仍[待查](../series-evidence-20261111/climax-kengou/field-pending.json)，本轮未重放。

下一批先补查MELTY BLOOD漫画书目的10条，再查埃尔梅罗二世 Grace note HOBBY STOCK扭蛋徽章的10条。出版社与动画官方入口已缓存；逐卷核ISBN及纸本日期，徽章逐图核A/B/C、隐藏款及零售全套范围。这20条仅为来源发现，尚未逐条补证。

[最新断点](../series-evidence-20261113/strangefake-mirror/README.md) · [待查及接续](../series-evidence-20261113/strangefake-mirror/resume.json) · [累计分组](current-progress.json)。

以下保留此前阶段记录，不覆盖最新断点。

## 首批证据
原队列1,848组 / 9,795个不同记录ID；V6完成后本地快照中9,780个仍有效，15个旧ID待核对归并映射。队列中342条已有editorial受保护。
首批7个活动涉及4,397条记录；[官方目录](catalogue-summary.json)726条目录记录，去重593个详情页已全部解析，取得3,885个可选规格。各页面有URL、时间、哈希；缓存优先复用，不重复抓取已取得资料。

|系列|覆盖记录|明确身份对应|已有审核保护|待补证|
|---|---:|---:|---:|---:|
|最終再臨展|1941|1529|1|411|
|FGO Fes.2025|979|461|1|517|
|FGO Fes.2026|410|323|0|87|
|星見の回廊|301|204|0|97|
|FGO Fes.2024|281|269|1|11|
|FGO Fes.2023|254|249|0|5|
|FGO Fes.2022|231|212|0|19|

明确身份对应要求相同官方详情URL、完整规格名和既有挂牌规格键无矛盾；已知重复活动前缀只在同一来源内规范化。不会删除随机单包/完整套装、霊衣、媒介或尺寸等身份限定。280条出现多个同名候选，原挂牌可能包含不同官方款式，暂留待明确，不自动拆分或合并。

## 正式应用
3,247条仅补齐空白summary并追加两条证据。保留原名、原文、图片、标签、已认可事实、个人字段、挂牌/报价、关联与偏好；不改editorial核实状态。对于分款尺寸表，不把第一款尺寸写给其他款。

[隔离同API演练](simulation.json)163批/3247条通过，35,000条有效记录、1,824条关联及359条已有editorial全部保留，过期版本及个人字段改写被拒绝。全套历史CI未重跑；应用源码和网站版本不变。
正式库已写入 3,247 条，163 批逐条复读通过。写入前后的正式库均为 34,999 条有效、8,575 条存档、1,823 条关联。V6 归档快照的计数只用于历史比对。新增完整核实商品和完整结案系列均为 0。[正式核对](production.json) · [逐批摘要](verified-batches.json)。

复核查得 6 条在其他年度目录销售的款式。官方完整款名明确给出 Fes.2022、2023 或 2024；保留原年度设计归属及单包/复刻限定，销售目录不能证明首发年度。[复刻商品号与来源](cross-event-sources.json) · [采集记录汇总](capture-summary.json)。

## 证据与恢复
- [全量分组索引](queue-index.json)、[官方目录条目](official-catalogues.json)、[本轮汇总](evidence-summary.json)。
- [压缩证据包](evidence-bundle.json.gz)含593个官方详情结构化事实、3247条对应/补充方案及1147条未决记录；[哈希清单](bundle-manifest.json)。只含来源事实、商品ID和拟补字段，无完整个人库或凭证。
- 解包：`node scripts/series-evidence-bundle.mjs --unpack`。然后读取相应商品详情/匹配/未决文件，不默认重跑研究。
- 私有HTML、完整目标、拟请求及逐批原件：本机`hobbylib-live-v6/work/series-evidence-20261103/`，禁止上传。
- 维持 Sites 70，环境修订 75 已生效，以本轮维护凭证实测返回 HTTP 401。首批已写回，禁止重放。
- 所有V6旧477批/25组合并、32条、五边和001–006禁止重放。

此阶段补的是有依据的商品资料。图片尚未逐件视觉核对，历史入场礼/其他参展商/下架商品不一定在当前Aniplex目录中；不能将抓取、身份对应或摘要补齐称为全组核实完成。随后开展的六个历史活动已在第二批完成本次逐件核对。











