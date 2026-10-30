# HobbyLib

个人兴趣商品库与中古商品发现助手。当前网站为 **Collector Radar · 收藏雷达**。

**当前阶段：先确认修改后的逻辑上线，整理现有商品，由用户人工确认后再进入下一阶段。**

- [打开收藏雷达](https://collector-radar.martainjonn.chatgpt.site)（按现有账号权限登录）
- [当前任务 / 完整 Codex Prompt](docs/NEXT_TASK.md)
- [当前进度](docs/PROGRESS.md)
- [商品知识整理与增量识别：设计记忆](docs/PRODUCT_KNOWLEDGE_DESIGN.md)（2026-10-29 研究结论，含 AI 快速入口）
- [AI 分工、32 条验收与 300 条试点方案](docs/PRODUCT_KNOWLEDGE_PILOT.md)（待实施建议，不表示验收通过）
- [32 条商品验收清单](docs/reports/issue-3/REVIEW-32.md)（32条及五边已应用并读回，查看未决项与验收问题）
- [本次仓库检查与清理](docs/REPOSITORY-REVIEW-2026-10-28.md)
- [Sites 发布映射](docs/SITES-RELEASE.md)
- [业务规则与代码索引](docs/ARCHITECTURE.md)
- [商品身份、层级、标签与匹配契约](docs/PRODUCT_IDENTITY_CONTRACT.md)
- [项目章程](docs/PROJECT_CHARTER.md)、[长期愿景](docs/VISION.md)
- [数据备份与恢复](docs/DATA.md)、[研究断点](research/editorial-20261021/RESUME.md)
- [独立运行说明](standalone/README.zh-CN.md)

## 已上线与待完成

2026-10-28（America/Chicago）原生查询确认：**Sites 65 / active / custom**，部署 succeeded。PR #2 已合并；后续主分支没有新的应用运行逻辑需要补发。GitHub 源码、Sites 发布、生产商品修订是独立环节。

固定32条及五条父级关系已完成生产应用，原执行回执来自PR #4并已同步到main。本轮独立读取32条，完整记录、原文、Offer与报价历史指纹全部一致；新增写入0。当前为 **2条verified、30条partial**，原执行实际新增verified1。详情见[生产回执](docs/reports/issue-3/production-20261029.json)和[独立核对](docs/reports/issue-3/reconciliation-20261029.json)。

已交付页面、真实差异与问题清单。#484同卷重复条目、#495未知/缺少展示语义仍待处理；001–006成功动作禁止重放。下一执行按用户具体反馈修正指定范围。**交付后等待用户明确确认逻辑，再进入下一阶段。** 不需要把全库都标成 verified 才让用户试用。

## 数据基线

2026-10-26 备份：35,020 active（含 19,209 同人）、8,549 合并存档、1,835 关系。原 15,811 个非同人固定编号：310 verified、42 partial、1 archived、15,458 pending，历史下一未开始 #91。以上都是历史快照；实时数量和断点必须重新读取，001–004 不得重放。

## 本地开发

Node.js 24+，使用 package.json 指定的 pnpm 版本与锁文件。

```text
pnpm install --frozen-lockfile
pnpm test:core
node scripts/test-identity.mjs
node scripts/test-curation-conflicts.mjs
node scripts/test-curation-revision.mjs
node scripts/test-acceptance.mjs
node scripts/test-editorial-flow.mjs
pnpm build:standalone
```

按实际改动选择检查。完整 workflow 有 v4、v8、fate-snapshot 三项已记录失败，另有历史全量导入约 3.10 倍耗时回退；见 [历史诊断](docs/reports/issue-3/README.md)。本次限定回归通过不代表全套 CI 全绿，仓库目前没有 Actions 运行记录。

独立版需要 RADAR_PASSWORD（至少 16 字符）、RADAR_ORIGIN、RADAR_DATA_DIR，使用 `pnpm start:standalone`。备份校验用 `python scripts/snapshot.py verify`；恢复细节见 DATA.md。不要为整理商品把旧备份覆盖生产。

统一身份决定、冲突复查、分页审计、关系事务保护及应用内事件已实现；[实施记录](docs/IMPLEMENTATION-2026-10-26.md)为历史技术证据。真实人工标注留出集、常驻云监控、站外通知及到手费用模型未完成，本阶段不扩展这些能力。
