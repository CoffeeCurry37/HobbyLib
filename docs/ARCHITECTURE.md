# 业务规则与代码索引

当前执行顺序见 [NEXT_TASK.md](NEXT_TASK.md)：300条隔离准备及首30研究已交付，用户15点反馈已保存；下一阶段先做首30条V2。本轮只有文档/审核记忆更新。以下运行索引根据既有源码整理，新增设计不能当作已上线能力。

长期目标见 [项目章程](PROJECT_CHARTER.md)；目标行为与现有模型的映射见 [商品契约](PRODUCT_IDENTITY_CONTRACT.md)。[2026-10-26 审查](REVIEW-2026-10-26.md) 区分已实现能力、静态风险及待验证事项；当前开发入口只用NEXT_TASK；[旧实施 Prompt](CODEX_IMPLEMENTATION_PROMPT.md)作为历史技术资料，不能覆盖最新用户反馈。这些设计要求不代表当前代码已经实现。

## 新目录与识别能力的设计入口（尚未实现）

- [目录/收录/简介政策](PRODUCT_CATALOG_POLICY.md)：一级/二级、永久/临时、平台展示、固定套装拆件、特典例外、1–3句简介。
- [15点用户审核](PILOT_FEEDBACK_2026-10-30.md)：30条反馈作用范围与证据边界。
- [下一阶段实现与验收](PILOT_PHASE2_PLAN.md)：隔离V2最小结构、页面演示、生命周期、研究分流、成本与冻结评测。
- [机器反馈层](../research/pilot-300-20261029/user-feedback-20261030.json)：绑定冻结输入/提案，不能作为现有数据库迁移或已导入的UI审核记录。

展示页可按版本聚合平台，底层身份/SKU/报价与拥有仍独立；临时页撤下不删除永久成员/历史。现有types/service/relations需在隔离环境验证适配，这次没有新增运行字段或接口。

## 数据模型与运行方式

Item 表示商品身份；Offer 表示店铺挂牌、成色、附属品、报价及历史。同一商品可有多个挂牌。本体、特典、组件、套装的拥有状态独立。

- app/：React 目录、详情、编辑、套装和复查界面。
- app/api/radar/route.ts：登录用户隔离的接口。
- lib/radar/service.ts、store.ts：查询/操作分发及 D1/SQLite 存储。
- standalone/：Node 24 + SQLite 服务与调度。
- drizzle/：迁移；不得改写已应用迁移。
- browser-extension/：浏览器采集辅助。
- .openai/hosting.json：既有 Sites 项目及 D1 绑定，保留原 ID。

## 业务规则

表内未带路径的文件位于 lib/radar/。

| 业务 | 实现 | 约束 |
| --- | --- | --- |
| 采集及解析 | collector.ts, html.ts, reader.ts, recognition.ts | 商品卡片限定标题/价格/库存；空营销页不能当作零商品结果 |
| 分类与作品归属 | source-category.ts, product-class.ts, classification.ts, work-identity.ts, taxonomy.ts | 商品局部事实优先；搜索词和相关导航不是证据 |
| 元数据与标签 | metadata.ts, product-features.ts, catalog.ts, keywords.ts | 保留日文原名与别名、人工字段；现价不能当定价 |
| 身份与匹配 | identity.ts, identity-facts.ts, duplicate-groups.ts | 区分卷号、媒介、平台、版本、组件、特典、原厂套装和卖家拼套 |
| 合并与撤销 | maintenance.ts, merge-plan.ts | 原挂牌及归并存档保留；冲突先解决；不得用旧撤销覆盖后续编辑 |
| 套装/父级/特典 | relations.ts, sets.ts, catalogue-families.ts, game-packages.ts | 包含关系不能成环；拥有状态和数量独立；未知成员显式标注 |
| 一番赏与卡片 | kuji-key.ts, kuji-members.ts, collection-facts.ts, lot-images.ts | 活动/赏别/款式识别；共用 JAN 不等于同款；未核实照片不推断齐套 |
| 报价与优先度 | identity.ts, engine.ts | 当前可用报价要求 24 小时内核验、有价格、非结束拍卖；旧列表不冒充实时库存 |
| 有界导入导出 | import-limits.ts, database-export.ts, backup-transfer.ts | 分页控内存，恢复暂存后原子完成，可恢复断点 |
| 爬取和调度 | crawl-queue.ts, crawl-progress.ts, standalone/scheduler.ts | 游标持久化、失败退避、验证暂停；受监控开关控制 |
| 逐项复查 | editorial.ts, editorial-index.ts, curation.ts | 指纹失效后重查；expectedVersion 防并发覆盖，保护个人字段与报价 |

## 优先度

engine.ts 使用手动优先度、标签偏好、白/黑名单、愿望清单、拥有状态、套装重复数量、缺件和同税费口径的历史降价。黑名单优先；拥有本体不等于拥有特典；未知拥有状态不当作缺件。分数限制为 0–100，保留理由，没有自动下单。

## 研究流程

scripts/editorial-flow.mjs 生成逐项预检、候选组和限长任务包；editorial-fetch.mjs 等保存来源回执；editorial-group-prepare.mjs 检查指纹和成员匹配后生成操作。

classification/context/image/tags/summary 五项全满足且无 unresolved 才能 verified。分组不能填造 ISBN、日期、附件或图片。来源事实/图片变化会使核实过期。详细流程见 research/editorial-20261021/WORKFLOW.md。

## 发布边界

GitHub 源码、线上 D1、Sites 发布是三个独立环节。维护端点还要求短期令牌、截止时间和目标账号。读取/备份不需要开启维护窗口。本次同步没有提交部署密钥或浏览器会话。

## 规则 23 实施索引

| 模块 | 当前行为 |
| --- | --- |
| identity.ts / identity-facts.ts | 有效来源键；统一硬冲突；ISBN-10/13、历史 JAN 中 ISBN；替换索引移除旧键；唯一目标 |
| match-decision.ts | 四态决定、稳定理由码、SHA-256 输入/决定、原值/作用域证据；与 findProduct 共用 evaluateProduct |
| service.ts / atomic-ingest.ts | 同键冲突进入稳定 review Item；旧观测不覆盖资料；Item/Offer/关系/通知事务提交；并发变更拒绝；compact 导入共用有界候选 |
| identity-review.ts | 同来源案件复用，隔离观测不作为可信候选；双方版本保护的明确解除，矛盾重现时重新打开 |
| relation-guard.ts | curation/merge/ingest 对读取的关系图作原子校验，防止仅保护 Item 后覆盖关系 |
| market-events.ts | Offer 内事件序号与类型；new_listing / restock / price_drop；通知删除或读取窗口之外仍不重放 |
| price-comparison.ts | 成色、附件、税制、出售形式分组；竞拍/整套标识，未知到手费用和汇率保留 null |
| tag-provenance.ts | 命名空间、别名与字段证据投影；兼容 string[]，保护人工标签，来源不明旧标签保留 |
| revision-plan.ts / prototype-plan.mjs | 本地计划的 Item/关系/规则保护、图完整性与撤销校验；无生产执行端点 |
| snapshot-stage.py / identity-audit.mjs | 流式完整本地副本、分页读取、候选索引、固定编号、输入/代码/数据哈希与可恢复产物 |
| identity-evaluate.mjs / identity-shadow.mjs | 无系列/挂牌跨 split 泄漏的合成评测；完整旧 checkout 与当前规则只读比较 |

新增 Item.matchDecision 与 Offer.eventSequence/lastEvent 都是可选 JSON 字段，现有导入/导出 schema 接受它们；没有新增 SQL 表或改写迁移。API 的 `identity-shadow` 在 stateFor 之前只读召回，既不迁移历史记录，也不请求来源。其旧路由比较与完整旧规则回放分别标注，不能混称。

逻辑系列仍兼容历史 `contains` 存储，但 catalogueGroup 的边表示目录成员；不会据此把目录当作可售实物或推定物理齐套。售罄/补货、拥有状态、附件和版本分别处理。[兼容与回滚](IDENTITY-HANDOFF.md) 包含复现命令及发布边界。
