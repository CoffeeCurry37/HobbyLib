# HobbyLib

个人兴趣商品库与中古商品发现助手。当前网站为 **Collector Radar · 收藏雷达**。

**当前阶段：32条商品及五条父级关系已生产应用并读回，等待用户人工确认逻辑；确认前不进入下一阶段。**

- [打开收藏雷达](https://collector-radar.martainjonn.chatgpt.site)（按现有账号权限登录）
- [当前任务 / 完整 Codex Prompt](docs/NEXT_TASK.md)
- [当前进度](docs/PROGRESS.md)
- [32 条商品验收清单](docs/reports/issue-3/REVIEW-32.md)（真实生产差异、来源和逐项读回结果）
- [本次仓库检查与清理](docs/REPOSITORY-REVIEW-2026-10-28.md)
- [Sites 发布映射](docs/SITES-RELEASE.md)
- [业务规则与代码索引](docs/ARCHITECTURE.md)
- [商品身份、层级、标签与匹配契约](docs/PRODUCT_IDENTITY_CONTRACT.md)
- [项目章程](docs/PROJECT_CHARTER.md)、[长期愿景](docs/VISION.md)
- [数据备份与恢复](docs/DATA.md)、[研究断点](research/editorial-20261021/RESUME.md)
- [独立运行说明](standalone/README.zh-CN.md)

## 已上线与待验收

2026-10-29（America/Chicago）确认：原 **Sites 65 / active / custom**，PR #2运行逻辑已上线。本次应用代码未变，只为限时维护配置部署同一已保存版本；任务末已关闭维护窗口并确认维护接口返回401。

固定 **32条修订全部成功，32条逐项完整读回通过，五条父级关系在七端点同一事务完成**；跳过0、阻断0、失败0。最终verified2 / partial30，实际新增verified **1**（#80原本已核实）。

个人/人工字段、原日文名称与说明、Offer及报价历史保留。#496–500因缺少独立图片视觉证据保留原主图；#93版本、#494拍卖内容、#495普通/BOX混杂仍保留疑问。

请先检查[网页与32条差异清单](docs/reports/issue-3/REVIEW-32.md)。**尚未取得用户语义验收；不自动启动下一阶段。** [脱敏生产回执](docs/reports/issue-3/production-20261029.json)。

## 当前数据与验证边界

本次有界只读覆盖：35,020 active（含19,209同人）、8,549归并存档、1,835关系。原15,811编号不变，复核状态为311 verified / 57 partial / 1 archived / 15,442 pending。覆盖扫描不等于全部商品核实。

001–006已成功动作不得重放。应用代码未变，本次没有重复运行历史46项回归、构建、全量导入或浏览器视觉检查。历史v4、v8、fate-snapshot失败及约3.10倍全量导入耗时回退仍未解决，不称CI全绿。

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
