# 当前执行入口：Issue #3

更新时间：2026-10-28 00:36 UTC（America/Chicago 10月27日19:36）。执行依据：[Issue #3](https://github.com/CoffeeCurry37/HobbyLib/issues/3)。历史接续文档中的“等待生产批准”和“从 #91 开始”不能替代本页顺序。

**用户要求立即停止，已保存后暂停。** 用户已告知网站域名加入环境允许列表；本轮未重新核验有效策略或连通性，未开启维护窗口。下一对话先读本页，再核验网络配置。当前分支 `main`，前一成果提交 `bcbee8a`；本次仅文档断点提交由 `git log -1 --oneline` 获取，不重跑已通过的代码测试。额度及重置时间仍不可见。

- 分支 `feat/explainable-identity`，开始 head `104269b75d85696a0933a621d6738bd00e0c242e`；PR #2 已按 Issue #3 的条件授权合并，合并 SHA `14a3f2e9758e6020fbf844fc062e74d27457ab78`；工作分支已切为 `main`。修复检查点 `02a10c7` / `ea7c167` 保留。
- Sites 已发布 **65**，source `271d287c534bf3a93cc53d8727b6f6f0eafd6917`，deployment `appgdep_6ae13f49c2ac81919a31d77ee9108166` succeeded。原 project/D1 DB/custom 权限不变。完整映射见 reports/issue-3/release.json。旧候选 `7a95d3bb` 不得复用。
- 资料计数：prepared 32 / isolatedApplied 32 / productionApplied 0 / production verifiedDelta 0 / verifiedEligible 2 / partial 30。历史14条的图片资格已逐项定位：14条有下载回执，但仅2条有明确视觉记录；12条已在最新方案降为partial。历史14/18不能再用作生产动作。详见 research/editorial-20261021/issue-3-image-review/。
- 批次 001–004 已在生产应用，绝不能重放。005–006 的旧本地 actions 不能用于生产。
- 账户剩余额度及重置时间不可见；未购买额度或使用重置权益。

## 执行顺序与授权边界

1. 补真实 `postAction(catalogue-curation)` 回归，复现已取消目标边导致丢边、并发取消被覆盖；修复准确最终图与同事务偏好保护，过期 Item 返回 409。
2. 相关回归、类型检查、重新构建；记录三个既有失败。完整隔离副本中一次提交 #484–490 七端点字段及五边，验证成功、失败和受版本保护的回滚。
3. 真实浏览器 QA：详情简介/标签/imageRole、Prototype 两类父目录、复核候选/解决、409 与重新读取、移动宽度。只有 HTTP 200 不合格。无法完成时保持 NO-GO，继续不依赖发布的只读资料工作。
4. 重新检查 GitHub head/base 与 Sites 新改动。条件通过后，Issue #3 已授权合并 PR #2、原项目受控发布及固定 32 Item/5 边生产应用，无须再次泛化询问。保存新的 GitHub SHA → Sites SHA → archive hash → saved version → deployment 映射。
5. 从生产完整读取目标、偏好及关系并重新生成版本。#484–490 七件及五边同一请求，其他 25 件每次至多 20 件。每次逐项回读并保存去重回执；冲突停止该项，保护用户编辑。最新方案30条 partial 保持未决；实际计算 verifiedDelta。
6. 发布后重新读取全部 active Item 紧凑投影（含同人），按 Issue #3 的风险优先级持续逐组复查。新拆分、归并、Offer 转移或超出固定范围的身份重分类需独立具体方案及批准。

## 可恢复产物

- 原完整副本 `work/identity/full-copy.sqlite`；原已应用32条本地副本 `work/editorial-005/review.sqlite`；最新补充图片降级后的完整副本 `work/issue-3/image-review/applied.sqlite`。均为隔离文件，不能作为生产导入。
- 逐项编号、Item ID、before/after、来源和五项检查：`research/editorial-20261021/batch-005/diffs.json`、`batch-006/diffs.json`；全部变更分别见 `FULL-CHANGES.md`。
- 缓存和既有来源：各批次 `source-cache-reuse.json`、`network-crosschecks.json`、既有 workflow 缓存。个人完整记录/动作/回滚资料保留在忽略的 `work/`。
- 阶段 1–2 已验证：新增 9/9 冲突回归（含浏览器发现的详情编辑过期版本）；既有 acceptance 3/3、core 20/20、identity 12/12、curation-revision、editorial-flow、tsc、Sites/standalone 构建通过。完整 43,569 条副本的七端点字段 + 五边同请求、冲突和回滚通过；见 reports/issue-3/。三个旧测试失败详见代码验收报告，未重复全量导入。真实 Chromium 五项 QA 全部通过，截图和详细日志留在忽略的 work/issue-3/browser-hiy67Q；本地外站图片加载受限，不增加图片 verified。发布前核实 Sites 无额外改动，随后普通 fast-forward 推送新候选并通过原生工具保存/发布65。
- 网络状态：此前 enforced 策略导致网站 CONNECT403；用户于本检查点告知已加入域名，**尚未重新核验**。原生 D1 行读取截断商品 JSON，不能代替完整目标。未绕过代理，未更改维护密钥/环境版本62。缺新鲜完整目标时禁止生产写入。
- 下一命令：`git status --short && git log -1 --oneline && cat docs/reports/issue-3/release.json`，然后读取 cloud_environment.environment_status 的有效允许列表并验证网站访问。连通后取完整32目标、catalogMeta（含偏好/全图）与紧凑投影，重新生成动作；不能重放旧 actions。用户本轮要求停止，以上步骤留到下一对话执行。

每阶段更新本页以及 IDENTITY-HANDOFF.md、研究 RESUME.md；保存测试命令/结果、真实生产回执、当前提交及下一条命令。约 15–20 分钟或一个自然组内形成可审阅检查点并推送已验证内容。

## 只读风险组后续

#495的普通/附BOX混合已形成独立3Item方案并在完整副本SQL演练/精确回滚；见 research/editorial-20261021/issue-3-prototype-box/。不在固定32条的Offer迁移授权内，不发送生产。下一只读自然组：#94 KADOKAWA小说目录、#106/#111–114五个推定成员及来源#107；先核对套装的实际版本，不能凭裸标题填ISBN。暂停时仅完成初始定位，7件均未形成可应用决定，不计 prepared/applied/verified；已发现的 Item ID、来源与待查问题保存于 `research/editorial-20261021/issue-3-apocrypha-start.json`，下次直接接续，勿重新搜索已定位的第1/5卷出版社链接。
