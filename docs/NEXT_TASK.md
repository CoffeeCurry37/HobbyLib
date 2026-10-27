# 当前执行入口：Issue #3

更新时间：2026-10-27 14:29 UTC。执行依据：[Issue #3](https://github.com/CoffeeCurry37/HobbyLib/issues/3)。历史接续文档中的“等待生产批准”和“从 #91 开始”不能替代本页顺序。

- 分支 `feat/explainable-identity`，开始 head `104269b75d85696a0933a621d6738bd00e0c242e`；PR #2 未合并，工作树开始时干净。当前 **NO-GO**。
- Sites 最近核实版本 64，source `6357bd5f020415c17652bf2bdfdbd26130bdac17`；尚无本轮部署。旧候选 `7a95d3bb` 不得复用。
- 资料计数：prepared 32 / isolatedApplied 32 / productionApplied 0 / production verifiedDelta 0 / isolated verified 14 / partial 18。历史 14 条的图片凭证须再逐项定位，不自动增加生产 verified。
- 批次 001–004 已在生产应用，绝不能重放。005–006 的旧本地 actions 不能用于生产。
- 账户剩余额度及重置时间不可见；未购买额度或使用重置权益。

## 执行顺序与授权边界

1. 补真实 `postAction(catalogue-curation)` 回归，复现已取消目标边导致丢边、并发取消被覆盖；修复准确最终图与同事务偏好保护，过期 Item 返回 409。
2. 相关回归、类型检查、重新构建；记录三个既有失败。完整隔离副本中一次提交 #484–490 七端点字段及五边，验证成功、失败和受版本保护的回滚。
3. 真实浏览器 QA：详情简介/标签/imageRole、Prototype 两类父目录、复核候选/解决、409 与重新读取、移动宽度。只有 HTTP 200 不合格。无法完成时保持 NO-GO，继续不依赖发布的只读资料工作。
4. 重新检查 GitHub head/base 与 Sites 新改动。条件通过后，Issue #3 已授权合并 PR #2、原项目受控发布及固定 32 Item/5 边生产应用，无须再次泛化询问。保存新的 GitHub SHA → Sites SHA → archive hash → saved version → deployment 映射。
5. 从生产完整读取目标、偏好及关系并重新生成版本。#484–490 七件及五边同一请求，其他 25 件每次至多 20 件。每次逐项回读并保存去重回执；冲突停止该项，保护用户编辑。18 条 partial 保持未决；实际计算 verifiedDelta。
6. 发布后重新读取全部 active Item 紧凑投影（含同人），按 Issue #3 的风险优先级持续逐组复查。新拆分、归并、Offer 转移或超出固定范围的身份重分类需独立具体方案及批准。

## 可恢复产物

- 原完整副本 `work/identity/full-copy.sqlite`；已应用 32 条的本地副本 `work/editorial-005/review.sqlite`。均为隔离文件，不能作为生产导入。
- 逐项编号、Item ID、before/after、来源和五项检查：`research/editorial-20261021/batch-005/diffs.json`、`batch-006/diffs.json`；全部变更分别见 `FULL-CHANGES.md`。
- 缓存和既有来源：各批次 `source-cache-reuse.json`、`network-crosschecks.json`、既有 workflow 缓存。个人完整记录/动作/回滚资料保留在忽略的 `work/`。
- 阶段 1–2 已验证：新增 8/8 冲突回归；既有 acceptance 3/3、core 20/20、identity 12/12、curation-revision、editorial-flow、tsc、Sites/standalone 构建通过。完整 43,569 条副本的七端点字段 + 五边同请求、冲突和回滚通过；见 reports/issue-3/。三个旧测试失败详见代码验收报告，未重复全量导入。真实浏览器 QA 正在执行，当前仍 NO-GO。
- 下一命令：`cat docs/reports/issue-3/browser-qa.json`；若未生成，读取 `work/issue-3/browser-first.log` 并继续浏览器验收。代码验收完成前不新开商品写入组。

每阶段更新本页以及 IDENTITY-HANDOFF.md、研究 RESUME.md；保存测试命令/结果、真实生产回执、当前提交及下一条命令。约 15–20 分钟或一个自然组内形成可审阅检查点并推送已验证内容。
