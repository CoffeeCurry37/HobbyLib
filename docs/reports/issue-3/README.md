> 最新接续：固定32条验收入口见[REVIEW-32.md](REVIEW-32.md)，当前任务网络复验与生产阻断见[resume-20261028.json](resume-20261028.json)。下文代码/浏览器门禁均为历史已完成结果，本轮没有重跑。Sites65已上线；32条应用仍待新鲜生产读取。

# Issue #3：代码及完整副本验收

2026-10-27 UTC，起点 `104269b75d85696a0933a621d6738bd00e0c242e`，分支 `feat/explainable-identity`。当前状态及授权以 [NEXT_TASK](../../NEXT_TASK.md) 为准。以下全部为隔离测试，生产应用 0。

## 关系修订契约

`catalogue-curation` 带 `revision` 时，必须准确提交 `原图 - remove + relations`；不能跳过必需的新边。目标已被用户取消返回 HTTP 409 / `RELATION_DISMISSED`。目标关系键或 ID 已存在（包括数量不同、请求内部重复）返回 409 / `RELATION_ALREADY_EXISTS`。请求须明确移除旧边后才能改变数量。旧边、Item 或图指纹过期返回 409 / `VERSION_CONFLICT`，重放不覆盖之后的修改。

事务中比较首次读取的完整 preferences 原始 JSON，包括“原来没有偏好行”的情况。并发插入、更新或删除偏好都会拒绝当前修订；不会清空用户取消记录。偏好与 Item/关系保护在同一 SQL batch，不能产生删边后跳过新增的半完成状态。未带 revision 的历史添加接口继续兼容其去重行为。

## 本轮实际执行

- `node scripts/test-curation-conflicts.mjs`：修复前 7 失败 / 1 通过，修复后 8/8 通过。两个 Issue 原始场景均从真实 `postAction` 进入；另外覆盖既存目标、数量、重复、重放、过期 Item、受保护回滚。私有完整日志 `work/issue-3/regression-{before,after}.log`。
- `node scripts/test-curation-revision.mjs`：通过（成功、过期关系、端点、并发备注、回滚）。
- `node scripts/test-acceptance.mjs`：3/3；`test-core.mjs`：20/20；`test-identity.mjs`：12/12；`test-editorial-flow.mjs`：通过。
- `pnpm exec tsc --noEmit`、`pnpm build`、`pnpm build:standalone`：通过。构建日志 `work/issue-3/{sites,standalone}-build.log`。CRLF 文件采用 `git -c core.whitespace=cr-at-eol diff --check`，未重写全仓换行。
- 曾误调用不存在的 `scripts/test-curation.mjs`，报 MODULE_NOT_FOUND；已确认正确入口为上面的 `test-curation-revision.mjs`，后续 editorial 测试单独执行通过，不将错误调用计作测试通过。
- `node scripts/test-prototype-atomic.mjs work/issue-3/prototype.sqlite docs/reports/issue-3/prototype-atomic.json`：完整 43,569 条副本，#484–490 七件资料与五条关系 **同一个请求** 应用，通过真实 API 校验及回滚。详见 [机器回执](prototype-atomic.json)。保留 47,433 条 Offer、8,549 存档、1,835 条关系总量，43,562 条非端点记录原始 JSON 字节不变。回滚后七件字段值完全一致；Zod 的 JSON 属性顺序及更新时间可能不同，未宣称原数据库文件字节相同。

## 仍然失败的历史测试

当前与 `2003e3d` 基线分别执行 `node scripts/test-workflow.mjs v4`、`v8`。没有将失败改称通过：

1. v4：两边均在出版社/商品名判同断言失败。
2. v8：基线仍在旧标签“华夫饼卡片”断言失败，实际为“威化卡片”。当前在更早的 `missing === 6` 失败：既有 PR 身份契约要求未知拥有状态不算明确缺件，实际 owned3 / missing0 / unmarked6，core/identity 的相应行为回归通过。这不是本轮关系修复新增退化；`sets.ts` 与 `taxonomy.ts` 在本轮未改。
3. fate-snapshot：公开清单 `fate-v0121-0a8c22aa23939085`（64 批）和运行清单 `fate-v015-b2bd25ef89b370ea`（82 批）不同，最后一批不触发后者的审计记录。用真实最后一批的一条观测、前置游标 63，在当前和基线各自 API 中复现 HTTP200 / scans0。完整 32k 导入本轮未重复，历史 `0 != 4` 失败与 3.10x 性能回退仍保留。

[有界诊断结果](legacy-diagnostics.json)；命令 `node scripts/diagnose-legacy-baselines.mjs /workspace/HobbyLib-baseline`。原 v4/v8 日志在 `work/issue-3/{current,baseline}-{v4,v8}.log`。

## 后续门禁

真实 Chromium/Playwright QA 使用完整副本和明确标注的两条本地案件样本，不触及生产。检查详情、imageRole、两个目录、复核选取/解除、409 后重新读取及移动宽度。报告生成于 `browser-qa.json`；未通过前不得合并/发布/应用。现有 32 条业务修订的逐项差异及来源继续在 batch-005/006，生产计数不因测试增长。剩余额度/重置时间不可见。

## 真实浏览器验收与修复（14:35 UTC）

首次真实浏览器结果见 browser-before.json：过期详情编辑返回400，复核冲突无重新读取按钮，移动编辑表单内在宽度溢出。已修为409、保留输入的持续冲突提示和重新读取流程、清除过期候选版本、收窄表单网格。重新读取完成后展示最新资料，用户可据此重新编辑。

最终 [browser-qa.json](browser-qa.json) 五项全部通过。执行命令：`PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright/index.mjs node scripts/test-browser-issue3.mjs`；使用环境已有 Chromium，无新增浏览器安装。真实DOM操作与本地API响应一起断言，保存390/320宽度编辑前后无横向溢出、候选冲突后再选择并解除、两条观测及用户新备注保留。截图经查看；其完整文件留在报告列出的私有目录。外站图像加载受环境网络限制，不据此声称任何封面新核实。

新增详情过期编辑回归后冲突脚本9/9；原curation-revision与acceptance3/3重跑通过。UI变化后重新执行tsc和Sites/standalone构建通过（work/issue-3/*-ui.log）。没有为资料批次重复全库研究或导入。
