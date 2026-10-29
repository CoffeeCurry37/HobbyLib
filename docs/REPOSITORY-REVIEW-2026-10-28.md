# 仓库检查与阶段收敛（2026-10-28，America/Chicago）

审查基线 main `c6ac70cbd0ee9925a9720ecd7a243512da112b9c`，本次工具核验时间约 2026-10-29 00:44 UTC。用户要求先确认已修改逻辑上线、整理现有商品、人工确认正确性，再进入下一阶段；本次交付是仓库检查、旧文件清理与接续指令更新，没有执行商品修订。

## 结论

没有在本次限定检查中发现阻止现有网页试用或固定32条受保护整理的新问题。**不等于全项目没有缺陷或全套测试通过。** 主要确证问题是入口文档过时/互相矛盾：仍写 Sites64、未合并、等待批准，且旧 Prompt 要求重做已完成 A–D，缺少用户人工验收停止点。现已统一到 NEXT_TASK.md。

## 本次实际核验

- GitHub 连接确认仓库 private、默认 main、未归档，有 pull/push 权限；开始时 open PR=0，Actions workflow runs=0。没有自动检查记录不能称 CI 全绿。
- 远端递归树未截断。复制/读取内容后，**984 个文件的 Git blob SHA 全部与审查基线一致**，再从该副本运行检查；没有把旧本地目录当最新检出。
- GitHub compare：PR #2 合并至审查基线共5个后续提交，只涉及文档、研究及 prepare-sites-release.py 打包修正，没有新增应用运行逻辑漏发。
- 原生 get_site：原项目 appgprj_6ab5bd99340881919e4311a732df6eb9，65 / active / custom；get_site_version 确认源码271d287c及原部署；get_deployment_status 返回 succeeded 与原站URL。保留原DB及权限；没有重新发布。
- 复查 curation 的精确关系替换、偏好与商品事务保护、409路径，并运行下面检查。32条方案核对唯一ID/原编号、六组每组≤20、2/30资格、5边和七端点范围；这些是方案校验，不是生产读回。

本次命令：

```text
node --test scripts/test-curation-conflicts.mjs scripts/test-curation-revision.mjs scripts/test-acceptance.mjs scripts/test-identity.mjs scripts/test-core.mjs scripts/test-editorial-flow.mjs
```

**46/46 通过，0失败/跳过**（44个注册用例 + 2个脚本入口；约7.41秒）。覆盖核心20、身份12、关系/编辑冲突9、独立验收3，以及关系迁移和editorial脚本。均为内存/临时数据库，无生产写入。明细保存在 [机器回执](reports/repository-20261028/checks.json)。

未重跑：完整workflow、全量Fate导入、Sites/standalone构建、类型检查、浏览器、备份解压/恢复或24小时监控。本次不改应用逻辑，不把旧构建/浏览器成功当成新执行。

## 尚存问题及证据边界

1. v4 出版社/商品名断言、v8 缺件/旧标签预期、fate-snapshot 64/82批清单与扫描计数问题仍在历史报告。它们未在本次重跑或修复。[有界诊断](reports/issue-3/legacy-diagnostics.json)、[详细历史结果](reports/issue-3/README.md)。
2. 历史完整Fate导入1358.51秒、基线438.93秒，约3.10倍耗时；尚未优化。扩量前有界定位，不为本阶段反复全量测试。
3. 固定32条尚无生产成功回执；本次未完整读取生产记录，因此不能独立确认实时应用状态。仓库记录productionApplied0，最新资格2/partial30。
4. 上次云实例有效网络CONNECT403属历史环境证据；本次没有复验该实例或应用鉴权。执行商品写入的任务必须重新取得完整JSON及正确账号，不能拿原生截断行当完整目标。
5. 没有真实人工标注留出集，合成用例不能证明生产语义准确率。用户仍需在网页检查分类、层级、版本、简介和标签。

## 清理范围

删除7个可确认过时或无引用文件：
- examples/d1/app/api/notes/route.ts、examples/d1/db/schema.ts：未接入应用的起始模板，examples已排除在tsconfig外，活动代码无引用。
- public/file.svg、public/globe.svg、public/window.svg：未引用的模板图片；完整源码/文档检索无消费引用（历史source-inventory只作原始清单）。
- docs/reports/release-20261027/mapping.json、preview-checks.json：废弃7a95d3bb候选的发布指令与HTTP预览，已被Sites65实际回执和浏览器验收取代；避免误用旧候选。

README/AGENTS/PROGRESS/NEXT_TASK 对齐现状；旧长 Prompt 与 IDENTITY-HANDOFF 缩为兼容索引，研究 RESUME 保留当前断点与证据链接。旧检查点和删除文件可在 [清理前提交](https://github.com/CoffeeCurry37/HobbyLib/tree/c6ac70cbd0ee9925a9720ecd7a243512da112b9c)恢复，不另造重复归档。

商品快照、采集批次、全部来源缓存、005/006决定/差异、图片复核、#495隔离方案、15,811固定编号、生产001–004回执、迁移、运行代码及锁文件均不删改。历史库存/来源文件仍被程序或恢复流程引用，不能仅因“旧”就删除。

## 接续

以 [NEXT_TASK.md](NEXT_TASK.md)作为唯一完整 Prompt。先完成32条网页可见结果，保留未决问题并提交用户人工验收；没有明确反馈不自动开始下一阶段。
