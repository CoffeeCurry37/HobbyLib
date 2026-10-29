# 商品整理断点（2026-10-28，America/Chicago）

先读 [当前完整任务](../../docs/NEXT_TASK.md)和[进度](../../docs/PROGRESS.md)。当前目标是把已上线逻辑用于现有商品整理，交付用户人工确认；确认前不进入新增采集或下个独立任务。

## 固定 32 条的恢复点

- Site 65 已上线；源码与部署映射见 [发布记录](../../docs/SITES-RELEASE.md)。
- prepared32 / historicalIsolatedApplied32 / productionAppliedRecorded0 / verifiedDeltaRecorded0。
- 图片复核后资格为 verifiedEligible2 / partial30；不能使用旧 14/18 口径。
- 目前无完整新鲜生产读回；本次仓库整理未修改商品。上一云实例网络回执见 [resume-20261028.json](../../docs/reports/issue-3/resume-20261028.json)，新任务需检查自己的实际环境。
- 应用范围 #80–93、#484–490、#493–500、#509–511；逐项 ID、字段、来源见 [32 条清单](../../docs/reports/issue-3/REVIEW-32.md)和 [review-list.json](../../docs/reports/issue-3/review-list.json)。
- 六组为 #80–81、#82–90、#91–93、#484–490、#493–500、#509–511。第四组七端点与五边必须同一个 revision。每组完整读回后保存回执，不重放成功组。

复用 [batch-005](batch-005/README.md)、[batch-006](batch-006/README.md)字段决定和 [图片复核](issue-3-image-review/README.md)。读取新鲜完整目标、偏好及全图，重新生成受版本保护的动作；不重放旧 actions/expectedVersion，不用隔离数据库覆盖生产。

#93 版本、#494 拍卖内容、#495 普通/BOX 混杂仍未解决；partial 可以保留并应用有依据的安全字段。#495 [三 Item 方案](issue-3-prototype-box/README.md)只是隔离研究，Offer 转移和拆分不在固定 32 条范围。

## 原队列与资料复用

[workflow/summary.json](workflow/summary.json)是 2026-10-25 的历史断点：15,811 固定编号，310 verified / 42 partial / 1 archived / 15,458 pending，nextUnstarted91。原编号永久保留；001–004 已在生产应用，绝不重放。实际恢复以新鲜投影及成功回执为准。

需要研究时按 [WORKFLOW.md](WORKFLOW.md)读取紧凑任务包、复用 workflow/source-cache 和已有匹配/视觉回执。分组、抓取、只读覆盖均不算核实完成。完整备份只在明确需要副本完整性检查时使用，不默认加载到上下文。

后续 Apocrypha #94/#106/#107/#111–114 的 ID、来源及问题保留在 [初始定位](issue-3-apocrypha-start.json)；它们未形成可应用决定。**先交付本阶段并取得用户反馈，不能自动从这组继续。**

## 接续交付

更新 32 条清单中的真实生产结果、五边结果、未决项及读回时间；将用户反馈记录到 GitHub 当前任务。只读覆盖队列可以准备，写明范围/游标，不扩大生产修订。交付后状态为“待用户人工验收”，不是“全部资料已核实”。

旧英文/中文重复检查点及历史停止状态已从本入口移除；原文可从 [清理前版本](https://github.com/CoffeeCurry37/HobbyLib/blob/c6ac70cbd0ee9925a9720ecd7a243512da112b9c/research/editorial-20261021/RESUME.md)恢复。所有批次、来源缓存、图片复核及验证文件保留。
