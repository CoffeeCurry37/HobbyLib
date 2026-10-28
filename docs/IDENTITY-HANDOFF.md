> 图片状态更新（2026-10-28 00:25 UTC）：固定32条当前待应用五项资格2 / partial30，生产0 / verifiedDelta0。12条缺独立视觉凭证，已通过真实API在完整副本降级并验证保留/回滚；不能再使用旧14/18生成生产动作。逐项证据见 research/editorial-20261021/issue-3-image-review/。下一自然风险组：#495 普通五卷拼套与ComptiQ×Animate BOX付拼套拆分计划（仅研究/隔离，未获生产授权）。

> 最新状态（2026-10-28 00:20 UTC）：PR #2已合并14a3f2e，Sites65已成功发布，source271d287c / deployment appgdep_6ae13f49c2ac81919a31d77ee9108166。工作分支main。生产32条尚未应用：环境网络策略拒绝网站域名，需完整新鲜目标；已请求配置放行。下一步见 [NEXT_TASK](NEXT_TASK.md)，下面旧NO-GO/等待发布段落是历史。额度/重置不可见。

> 当前执行入口（2026-10-27）：[Issue #3 / NEXT_TASK.md](NEXT_TASK.md)。104269b 新关系验收阻断，先修复再进行真实浏览器 QA；Issue #3 提供条件通过后的固定范围发布/生产授权。旧检查点保留作历史，不能据此重放批次或提前发布。

# 身份整理接续入口

最新接续（2026-10-27）：代码/业务检查点 **3fa5d8c** 已推送 PR #2；最终文档提交见 `git log -1`。验收三缺口修复、32条真实商品决定和5条关系已通过隔离应用/回滚；生产应用0，Sites仍64，PR未合并。prepared32 / isolatedApplied32 / 隔离verified14 / partial18。先读本页末尾“发布准备与最终接续”、batch-005/006及SITES-RELEASE.md；下文较早检查点是历史记录。额度/重置不可见。

本轮基于 main `2003e3d31526821e681b9fdcc1d51b7b6ec7d6be`，开发分支 `feat/explainable-identity`。A 阶段提交 `1549acd`，集成检查点 `ee216a7` 已推送。后续提交与 PR 包含最终报告；先读 [实施记录](IMPLEMENTATION-2026-10-26.md) 和 [验证产物](reports/identity-20261026/README.md)，不要重做已完成的合成复现或完整审计。

## 已完成的独立工作

- 规则 22：有效来源键、统一硬冲突门禁、唯一目标、索引替换/归档清理。`findProduct` 保留兼容返回；`matchDecision` 增加可复现指纹、来源、候选、四态、稳定理由码与证据等级。
- 摄取保留冲突/歧义观测为稳定 review Item，保护旧 Item；旧观测不回写元数据。`identity-shadow` API 只读且不请求来源，完整旧版比较用离线脚本。摄取不调用商品归并。
- 全量快照流式副本、分页索引审计与断点；独立逐项建议、受控标签命名空间/别名、未知来源标签保留。Prototype 五卷仅提出关系重归类计划，完整副本验证和回滚通过。
- 原子保存 Item、关系、偏好及应用内事件；并发版本不符整体拒绝。Offer 的事件水位不依赖最近 300 条通知。新挂牌/首次详情核验、降价、恢复后再次降价、补货、套装缺件均有测试。
- 同版 JPY 挂价按出售形式、成色、附件和税费分组；未知到手费用/汇率保留 null。逻辑档案不作为可购买商品，未知拥有状态不计明确缺件。

## 无生产写入的复现

Node 24 与锁定的 pnpm 11.25.0；Python 标准库，无额外收费 API。环境如限制用户缓存路径，可设置 `COREPACK_HOME` 与 `XDG_CACHE_HOME` 到工作区目录。不要提交本机环境或缓存。

```sh
pnpm install --frozen-lockfile
node scripts/test-core.mjs
node scripts/test-identity.mjs
node scripts/test-editorial-flow.mjs
node scripts/identity-evaluate.mjs
node scripts/test-workflow.mjs
pnpm exec tsc --noEmit
pnpm build:standalone
pnpm build

python scripts/snapshot-stage.py --snapshot snapshots/2026-10-26/collector-radar-backup.json.gz --output work/identity/full-copy.sqlite
node scripts/identity-audit.mjs --snapshot work/identity/full-copy.sqlite --from 1 --to 15811 --out work/identity/audit
node scripts/identity-audit.mjs --snapshot work/identity/full-copy.sqlite --from 1 --to 15811 --out work/identity/audit --resume
node scripts/prototype-plan.mjs --snapshot work/identity/full-copy.sqlite --out work/identity/prototype --validate
```

stage 拒绝覆盖文件；audit 以只读 SQLite 打开，不调用会迁移数据的 `stateFor`。输入哈希、实际 Item/关系/偏好内容、规则代码或范围变化拒绝续跑（源码换行统一后哈希）。审计输出约 100 条一页，逐页原子保存后更新游标；重复页覆盖而不重放生产批次。`--validate` 只接受带本地快照标记的完整副本，事务内验证五条关系并回滚，不提供生产提交选项。

完整旧/新比较另建基线 worktree，再运行（只读源码和脱敏观测）：

```sh
git worktree add --detach ../HobbyLib-baseline 2003e3d31526821e681b9fdcc1d51b7b6ec7d6be
node scripts/identity-shadow.mjs --baseline ../HobbyLib-baseline --out work/identity/shadow.json
```

在线人工复查可 POST `{action:"identity-shadow",products:[...Parsed]}`，与摄取和审计使用同一个 `matchDecision`。API 返回旧路由近似差异并明确标记 baseline；完整旧规则差异以离线基线报告为准。该操作不写生产商品、不设 verified、不打开维护窗口。

## 兼容、并发和回滚

没有新增表或数据库迁移，没有改写既有迁移。新增可选 `Item.matchDecision`、`Offer.eventSequence/lastEvent` 随现有 JSON 导出/恢复；已实测恢复后事件去重及个人字段保留；旧数据缺这些字段仍可读。已读通知不被重放改回未读；通知删除后 Offer 水位仍在。同一时间戳不被当成更新，较旧观测不覆盖新数据。

Item 与整个关联图均在同一提交中校验；失败保持原数据。compact 导入在 Sites 和 standalone 共用有界候选读取。用户编辑与摄取冲突需要重读重试；不会让一个旧编辑覆盖另一个新编辑。仅哈希发生变化的 Item，避免每批重复哈希全库。

历史 Relation 的 `contains` 兼容保留；若 from Item 是 `catalogueGroup`，解释为逻辑目录成员，不证明物理齐套。Prototype 计划明确标注该语义；物理套装推断仅使用实际成员证据。没有批量改写历史关系种类或自动补齐卖家拼套。

源码回滚独立于数据库：可审阅后 revert PR；无需数据库降级迁移。回退到旧代码会失去新增保护，旧导入器还可能剥离新的可选 JSON 字段，因此应保留新版完整备份，不把旧格式导出当作事件台账完整备份。修订计划撤销必须校验计划之后的关系指纹和全部受影响 Item 版本；后续用户编辑会拒绝撤销。现有归并存档的恢复保护继续有效。

## 仍依赖后续输入或授权

1. 尚无真实人工标注留出集。24 条合成用例和静态快照审计不能推导生产精确率；按来源、品类补充真实标注与独立系列划分，再决定扩大自动关联策略。新策略不因合成分数自动启用。
2. 全库的 16 条唯一匹配建议、8 条歧义及 471 条冲突是候选审计结果，不是已确认误合并或已核实商品。需要逐成员来源复核；保留原 15,811 编号。
3. Prototype 生产应用需新鲜目标/关系指纹、差异和单独授权。当前没有应用生产修订，也没有重放批次 001–004。
4. 当前资料断点仍是 #91，310 verified、42 partial、1 archived。缺图、真实版本和来源访问限制仍按研究流程处理；本轮新增 verified 为 0。
5. 常驻监控、外部通知、付费模型、汇率和真实运费/服务费/税费没有配置；不虚构送达、到手最低价或全天运行结果。登录/验证码/年龄墙沿用暂停和游标机制。

现有 v4、v8、fate-snapshot 三项回归仍失败，独立 main 基线可复现；完整 Fate 导入耗时约 22.64 分钟，基线约 7.32 分钟，性能仍需优化。详见实施记录，不能把这三项写成通过。

本地详细日志与完整审计页在忽略目录 `work/identity/`；可分享的合成报告、五卷示例和计划已提交。再次接续先看分支最新提交和这些文档；无需把完整备份放入模型上下文。

## PR #2 独立验收修复检查点（2026-10-27 UTC）

基于验收 head `760a508f6fddb063b63564e5556bb715e386a786`；当前分支 `feat/explainable-identity`，本节所在提交为修复检查点（用 `git log -1 -- docs/reports/acceptance-20261027` 取完整 SHA）。原三个检查点保留。

- 先在真实 `postAction` / 完整 ingest 入口重现三项失败，再修复。刷新成功、失败和提交时竞态均保护新备注、拥有、数量、人工字段、报价及关系；版本冲突返回 HTTP 409 / VERSION_CONFLICT。
- 规则 23 将隔离观测从可信候选剥离，同来源案件复用并保留全部观测、解除记录；新增带双方版本保护的明确解除入口和界面，解除后正常刷新正式报价，后续矛盾重新打开同一案件。
- 完整 ingest 保留 locked 人工 tags 集合；新增 identityReview 可选字段随备份恢复。
- 验收、identity、core、editorial、相关 workflows、类型检查、standalone 与 Sites 构建通过；详见 [本轮检查](reports/acceptance-20261027/checks.json)。原 v4、v8、fate-snapshot 三个基线失败未改动，未重复运行或计作通过。
- 本检查点业务 prepared / applied / 新增 verified 均为 0；原生产进度 310 verified / 42 partial 是最后可信快照，不是本次实时读数。Sites 原生表读取截断 Item JSON，维护凭证不可读取，尚未取得新鲜完整投影/目标版本。
- 下一组：#81–91 Enterbrain 十卷选集与卖家套装；复用 #80 封面回执，然后 #484/#486–490 Prototype 原版小说。继续命令：`node scripts/editorial-flow.mjs packet 91`，按固定编号补入 #91，不把分组排序包当作原始断点。
- 来源缓存保持 research/editorial-20261021/workflow/；本地完整副本 work/identity/full-copy.sqlite 复用，不重新导入。批次 001–004 绝不能重放。无生产应用、PR 合并或 Sites 发布。额度及重置时间不可见。

## 批次 005 已验证检查点（2026-10-27 UTC）

修复代码检查点 `a541f10` 已推送 PR #2；本节所在提交保存资料检查点，完整SHA见 `git log -1 -- research/editorial-20261021/batch-005`。复用旧完整副本和来源，未重做全量导入或审计。

- 处理 #80–93、#484–490、#493–500，共29条；完整Item ID、before/after、字段证据和expectedVersion见 [批次005](../research/editorial-20261021/batch-005/README.md)及diffs.json。
- prepared 29 / 生产 applied 0 / isolatedApplied 29 / 隔离 verified 14 / partial 15；43,540条未涉及记录逐字节保留。原42个partial中处理15个，6个可在本批应用后解除；生产计数仍未更新。
- 29条中文简介和标签修订、29条分类/层级字段（category改变2条）、8条主图、5条Prototype逻辑父级迁移已在完整副本应用并逐项核对。47,433个Offer及历史、个人/人工字段、原文description、8,549条存档、15,811原编号保留。过期计划拒绝、关系完整性和精确回滚通过。
- 来源复用/新网络交叉证据、公开决定、差异、回执、验证均位于 research/editorial-20261021/batch-005/。私有完整目标/动作/回滚原件和应用后副本在 work/editorial-005/；review.sqlite为已应用隔离副本，不能当生产新鲜目标。first-run.sqlite是验证脚本遇到JSON属性顺序导致版本哈希比较失败的旧隔离产物，非生产回执；最终验证以validation.json为准。
- #91的套装JAN实为第10卷ISBN；#495混入普通套装与附収納BOX报价，保留具体拆分问题，未挪动报价。#82–90缺封面；#92/#93/#493需图片核对；#494拍卖版本/附件待确认。没有将未解决项计作verified。
- 原生Sites源码只读clone确认HEAD仍为 `6357bd5f020415c17652bf2bdfdbd26130bdac17`，没有Sites侧新提交；凭证未落盘，未push到Sites。下一步完成发布准备和本地预览；额度/重置时间仍不可见。
- 生产前仍需新鲜只读投影、目标版本与本批明确批准；当前原生表读取截断，未获得完整生产目标。001–004绝不能重放；005只有隔离回执。下一条命令：`cat research/editorial-20261021/batch-005/validation.json`，再继续发布准备。后续研究可从 #94 Apocrypha 或 #509–511 Requiem 自然组展开。

## 后续检查点：真实API关系迁移 + Requiem组

批次005当前validation.json已替换为真实catalogue-curation API的五条关系替换验证，不再只是离线SQL移动；相关回归test-curation-revision.mjs覆盖端点遗漏、旧关系指纹、并发备注、成功替换和撤销。curation、验收3项、editorial及类型检查通过。生产应用时，#484–490七条目标字段与五条关系应放在同一revision请求，其他目标分段；不要重放演练的中间步骤。

批次006新增 #509–511，Item ID与全部before/after见batch-006/diffs.json和FULL-CHANGES.md。3条中文简介/标签/分类字段已在同一完整隔离副本应用，3条均因图片核对保留partial。合计prepared32、isolatedApplied32、生产applied0、隔离verified14/partial18、未涉及记录43,537。库为work/editorial-005/review.sqlite；最终组合哈希见batch-006/validation.json。生产新鲜版本仍不可见，旧生产进度仍停#91，001–004不能重放。下一命令：`cat research/editorial-20261021/batch-006/validation.json`；随后执行scripts/prepare-sites-release.py本地准备。Sites源基线6357bd5、版本64、身份/权限/DB均未更改。额度与重置时间不可见。

## 发布准备与最终接续

已推送代码/业务检查点3fa5d8c（前序a541f10、e864510）。当前提交补充发布回执；源码候选仍固定3fa5d8c，不因随后文档提交伪造新构建。GitHub3fa5d8c→本地Sites7a95d3bb→Sites版本未保存；现有线上仍64/6357bd5。Sites与standalone构建通过，登录/首页及32条详情HTTP读取通过；浏览器视觉QA未验证。详见SITES-RELEASE.md和reports/release-20261027/。

最终业务范围：#80–93、#484–490、#493–500、#509–511；Item ID均列于两批diffs.json。prepared32 / isolatedApplied32 / 生产applied0 / 隔离verified14 / partial18；preserved43537。生产旧断点#91与310/42/1仅为最后可信快照。完整目标、动作、回滚原件均在work/editorial-005、006；最终review.sqlite包含两批，组合哈希见006/validation.json。005–006没有生产回执，001–004绝不可重放。

下一步由本轮明确要求的生产批准及新鲜只读目标访问决定。生产关系写入还依赖支持revision的源码已获独立网站发布授权并上线。资料批准不含合并或发布。恢复先执行 `git status --short` 与 `cat research/editorial-20261021/batch-006/validation.json`；复用32条决定，拿到新投影后仅重做指纹变化的成员。未授权前可继续#94 Apocrypha，但不要重复全库导入/审计或无关构建。

本轮新增相关回归通过；原v4、v8、fate-snapshot三项基线失败以及既有完整导入性能回退仍保留，未重复运行或计为通过。额度剩余和重置时间不可见；未购买额度或使用重置权益。

## Issue #3 阶段 1–2 检查点（2026-10-27 14:29 UTC）

在 104269b 基础上新增 8 组真实 API 回归（修复前 7 失败 / 1 通过，修复后全部通过），严格关系修订、事务内偏好比较及过期 Item 409 已验证。完整副本七件字段 + 五边单请求成功/拒绝/回滚通过；未涉及生产。新增执行入口 docs/NEXT_TASK.md，报告 docs/reports/issue-3/。已有 32 prepared / 32 isolatedApplied / 0 productionApplied / verifiedDelta 0 / partial 18 不变。当前真实 Chromium QA 正在执行；未过门禁不得合并、发布或应用。来源和逐项 ID 继续复用 batch-005/006，无批次重放。额度/重置不可见。

## Issue #3 阶段 3 浏览器门禁（2026-10-27 14:35 UTC）

阶段 1–2 提交 02a10c7 已推送。真实 Chromium 在隔离完整副本上发现并修复详情过期版本400、冲突后缺少重新读取入口及移动表单溢出。五项实际浏览器操作现全部通过；9/9 新API回归、原目录及三项验收、类型检查、两种构建通过。截图私存 work/issue-3/browser-hiy67Q，公开报告 docs/reports/issue-3/browser-qa.json；外站图片网络受限，不将UI验收当图片身份核实。Sites远端重新核实仍6357bd5/64/custom，未写生产。下一步核对GitHub远端并按Issue3条件授权合并/发布；禁止旧7a95d3bb候选。业务计数和001–004禁重放不变，额度不可见。

## #495 自然风险组（2026-10-28 00:32 UTC）

证实2Y1252附ComptiQ×Animate小说全卷活动BOX，2Y1040未承诺附盒；独立组件号608516830，不能混用CD版特典。完整方案及逐字段before/after见research/editorial-20261021/issue-3-prototype-box/。完整副本SQL事务演练已通过：保留原#495、拟新增拼套及盒体2Item、迁移1条完整Offer、拟增6边，全部47,433报价历史保留；并发与过期回滚拒绝，正常回滚恢复原始行和图。prepared3/isolatedApplied3/production0/verifiedDelta0/partial3，和固定32条有1件重叠，不能简单相加。现有API缺完整split/undo，盒体视觉对应待查；本方案未获生产授权。下一独立只读自然组#94小说目录及其5个推定成员，先核对#107来源确定原版/文库。额度不可见。
