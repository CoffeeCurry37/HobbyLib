# 身份整理验证产物

这些报告来自本轮实际执行，生产数据库和 Sites 均未修改。

| 产物 | 内容 |
| --- | --- |
| [synthetic-evaluation.json](synthetic-evaluation.json) | 24 条合成分层样本、tuning/holdout、precision/recall/复查率、Wilson 区间、逐项决定 |
| [shadow-comparison.json](shadow-comparison.json) | main 2003e3d 的完整规则 21 与规则 22 比较；24 条中 18 条目标变化，零写入 |
| [snapshot-staging.json](snapshot-staging.json) | 流式完整副本的 SHA-256、计数、耗时和内存 |
| [historical-audit-summary.json](historical-audit-summary.json) | 15,811 固定编号的只读审计、缓存和性能 |
| [prototype-audit-example.jsonl](prototype-audit-example.jsonl) | #486–490 的逐项身份/目录/标签建议与来源，不含个人字段 |
| [prototype-plan.json](prototype-plan.json) | 五条目录关系差异、七个 Item 版本、全关系指纹、证据与回滚要求 |
| [prototype-validation.json](prototype-validation.json) | 在完整 43,569 条记录副本上的保护/过期/回滚实测 |
| [test-results.json](test-results.json) | 核心/身份/构建/类型结果、三个基线既有失败及全量测试耗时 |
| [resume-validation.json](resume-validation.json) | 15,811 条记录复用、实际副本改变拒绝续跑与原字节恢复 |
| [workflow-results.json](workflow-results.json) | 分别执行的 16 个现有 workflow 套件结果 |

合成集：5 次正确自动关联 / 5 次自动关联，5 个正例全部召回，复查率 19/24，硬冲突误匹配为 0。自动关联 precision 的 95% Wilson 区间约 [56.6%,100%]，样本很小；这不是生产准确率。来源样本数为 Mandarake 19、骏河屋 4、Mercari 1；其他来源与真实人工标注集尚无样本。没有声称已经达到生产阈值。

完整审计：16 条 matched、8 条 ambiguous、15,315 条 unmatched、471 条 conflict、1 条 archived、0 条 missing。每条以自己以外的索引候选比较，因此 unmatched 不表示无原发行身份；conflict 也不表示已发生生产误合并。全部 15,811 编号保留；程序检查、缓存命中和建议不增加 verified。

实测：流式副本约 4.80 秒 / 15.4 MiB 峰值 RSS；全队列审计约 75.60 秒 / 632.9 MiB；Prototype 完整副本验证与回滚约 24.49 秒 / 348.1 MiB。Node RSS 包含 TypeScript 模块加载；不是净业务内存或 token 数。审计分页 218 页，索引 119,036 键，最大候选桶 53；16,750 个来源引用中找到 314 个历史缓存回执，来源请求和付费 API 请求均为 0。缓存只是历史资料，未核验实时价格/库存。

完整运行命令、已知失败及未运行边界见 [实施记录](../../IMPLEMENTATION-2026-10-26.md)；接续与回滚见 [IDENTITY-HANDOFF](../../IDENTITY-HANDOFF.md)。

完整 Fate 64 批导入回归耗时 1,358.51 秒，随后仍在历史扫描审计数 `0 != 4` 失败；基线同一失败耗时 438.93 秒。当前安全校验/决定持久化路径在这项全量测试中约为基线的 3.10 倍耗时，尚需优化，不能宣称性能已改善。失败之后的断言没有执行。
