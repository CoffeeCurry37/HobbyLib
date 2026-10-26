# 按组核对、逐项留痕

用户于 2026-10-23 要求减少时间和 token，取消固定 40 件批次。原始 15,811 个编号不变。程序预检、来源采集、商品资料核实分别计数；不得把扫描或分组当成完成核实。

## 继续入口

1. 只读 `RESUME.md`、`workflow/summary.json` 和所选任务包，避免重读整库、历史聊天或全部网页。持久断点随项目源代码保存；含个人字段的临时完整记录和动作文件保存在仓库外。完成一个可恢复阶段即同步源码，不要累积到整个研究批次结束。
2. 需要刷新时，既有隐藏 stdin 客户端使用 `mode: "index"`，读取 `/api/maintenance?editorialIndex=1`；账号浏览器对应 `/api/radar?editorialIndex=1`。此投影不含备注、拥有状态、价格历史和归并存档。
3. `node scripts/editorial-flow.mjs plan <index.json>`：检查每个原始编号，记录缺项、冲突、来源和所属研究组；未变的指纹复用检查结果。归并、缺失、同人、来源失败与疑难项全部保留。脚本不会自动设置 verified。
4. `node scripts/editorial-flow.mjs packet 81`：81 是当前最低未开始编号，后续使用实际断点；0 包括全部疑难项。默认包不超过 18,000 字符，字段共性只写一次，大组按成员截断并给下一编号。这是字符预算，不是 token 保证。没有进入该包的条目仍在全量清单中。定期用 0 处理旧 partial。
5. `node scripts/editorial-flow.mjs capture <packet.json> research/editorial-20261021/workflow 60`：至多 4 个站点并发，同站逐页低频请求。每页原子保存精简事实、URL、时间、网页哈希或失败原因。中断后只补未成功缓存的任务。成功静态资料缓存 180 天，失败/需要阅读缓存 7 天；登录和年龄确认墙不能反复自动重试。需要提前刷新时保留旧 Git 历史，再只移走对应缓存。
6. 先查官方系列总目录，复用已缓存商品资料；仅针对缺图、身份/分类冲突、版本或附件不明者补检索。每个成员的卷号、ISBN、卡面和附件仍需分别匹配。分组只是研究候选，不能直接授权合并或强行归入某父级。

## 决策与应用

公开决定格式为 `{campaign, groups:[{id, common, members:[...]}]}`。每个成员包含 `ordinal`、任务包中至少 12 位 `fingerprint`、`fields`、`sources`、`match:{by,url,value}`、`checks`、`unresolved`，可显式指定 `status`。

- common 只允许 series/event/productLine/productType/category/majorClass/origin/publisher/manufacturer/brand。
- 日期、图片、ISBN/JAN、附件和版本相关字段按成员明确填写。组可提供经查证的 summaryTemplate 与 tags；每个成员须明确 useSummaryTemplate/useGroupTags 才会使用。简介模板只支持 {title}/{productType}/{series}/{event}/{productLine}/{wave}/{member}，缺值就拒绝，不编造发售背景。角色标签仍按成员填写。
- match.by 为 isbn、jan、title、variant 或 catalogue-entry。必须写具体对应条目，不能只写“同组”。
- checks 必须包含 classification/context/image/tags/summary 五项布尔值。全 true、无 unresolved 且字段齐全才可 verified；否则保留 partial/blocked 和具体问题。
- 图片 HTTP 成功只证明可读取；卡面匹配、目录参考图和实物图仍需区分。图集最多 10 张。

决定完成后，客户端 `mode: "items"` 加 `ids`/`idsFile` 与 `output`，分段读取最新完整目标记录，避免每次导出全库。执行：

```text
node scripts/editorial-group-prepare.mjs fresh-targets.json decisions.json private-actions.json
```

脚本验证指纹和手动字段，保留备注、优先度、拥有状态和报价，自动拆成每个请求 20 件。20 只是 API 请求限制，不是研究批次上限。它只准备操作，不直接发送，不生成模糊合并。

在临时 SQLite 副本中验证拟改记录及关联，应用后读取目标结果核验。例行字段补全不再每批重复完整导出与未变化应用的编译。归并、层级重构或 schema 变化仍做全库完整性检查。保存 expectedVersion、公开决定、已应用回执；应用前后检查实时复核进度，禁止重放旧批次。最终关闭维护窗口。

## 验证与边界

`node scripts/test-editorial-flow.mjs` 验证完整计数、来源去重、版本/年份隔离、指纹失效、输出预算、SQL 投影、读取用户隔离、个人/手动字段保护及拒绝过期决定。附加 `<full-export> <compact-output> <report>` 参数可验证完整数据库投影一致性。

本流程没有额外 LLM API 调用，没有新增定时任务。程序批处理无需把全部记录放入模型上下文，后续会话或显式启动脚本时继续。长周期资料缓存不能用于实时库存/价格，新商品扫描与价格监控保持独立。不要承诺尚未实测的固定提速倍数或 token 节省比例。
