# HobbyLib 本地商品识别试点

这是独立研究工作台，不是正式网站的新页面。它只监听 `127.0.0.1`，使用 `work/pilot-300/pilot.sqlite`；没有生产数据库绑定、维护令牌、生产同步接口或模型 API。

## 打开与重启

Node.js 24.22.1 已验证。仓库依赖已安装时，在仓库目录执行：

```text
node tools/pilot-workbench/prepare.mjs
node tools/pilot-workbench/server.mjs
```

打开 <http://127.0.0.1:8789/>。默认只显示已研究的 P001–P030，可切换查看全部300条或冻结候选200条。审核填写姓名、结论、理由、修正和适用范围；保存只进入本地实验库。顶部可下载审核记录。审核不自动改写建议，也不批量应用到同组。

首次 `prepare` 从仓库已有真实抓取文件还原输入，核对种子文件哈希，创建冻结样本。此后相同输入可重跑，不同输入会拒绝覆盖。不要手改 samples.json 或删除数据库；需要新版本时先保留原件和审核记录，再另开试点。

## 各层数据

| 层 | 位置 | 含义 |
| --- | --- | --- |
| 固定输入 | `work/pilot-300/samples.json` | 300条历史公开挂牌观察；完整内容不提交 |
| 可追溯清单 | `research/pilot-300-20261029/manifest.json` | 稳定编号、来源、分组、快照位置、哈希 |
| 原规则输出 | `baseline-30.json` | rule-23离线身份索引实验，不是生产导入回放 |
| AI辅助研究 | `proposals-30.json` | 当前会话逐件查证后的建议，不是后台模型服务 |
| 证据与关联 | `evidence.json` / `catalogues.json` | 官方、零售、卖家及图像证据分别标明 |
| 人工意见 | SQLite `reviews` | 追加版本、理由、输入/建议哈希；不由AI填充为真值 |

SQLite `inputs` 不可变；`outputs` 以层/编号/内容哈希保存不同版本，`current_output` 指向当前建议。审核保留当时输入与建议哈希。服务器启动会重新检查导入，不覆盖审核。

## 复现实验

```text
node tools/pilot-workbench/run-baseline.mjs
node --test tools/pilot-workbench/test.mjs
node scripts/test-identity.mjs
node scripts/identity-evaluate.mjs
```

基线复用现有 createItem、applyMetadata、repairClassification、productIndex、matchDecision。参考索引是2026-10-25的15,810条有效身份投影，删除全部候选Offer，避免用挂牌原链接直接找回旧归属；没有完整报价/图片/正式库。每条另做一个独立同挂牌重扫探针，不能混作新商品识别准确率。

`build-research.mjs` 是会话研究结果的确定性编译器：手工编写有依据的字段、从既有出版社观察整理目录。它不会自主搜索或调用模型。交付JSON可直接使用；只有重新生成研究资料时才需要本地 `source-cache`。`capture-sources.mjs` 是单独显式运行的公开来源读取工具，上限35个白名单地址，不由服务器调用，不绕过登录/验证码。它不能仅凭HTTP成功认定字段事实。页面全文只保存本地，GitHub保留事实摘要、链接与指纹。

## 隔离和验收

- 数据目录必须位于仓库 `work/` 子目录，拒绝路径越界和符号链接；默认仅本机访问。
- 写审核需同源、随机会话令牌、JSON格式和大小限制；并发保存使用 expectedRevision。
- UI使用纯文本节点处理挂牌、证据和审核，不把第三方文本当HTML执行；限制来源协议，拒绝跨站嵌入。
- 自动测试用独立 `work/pilot-qa/run-*`；浏览器试填用 `work/pilot-ui-qa`，不计入交付的人工审核数。
- 服务器没有生产写入入口；GitHub提交也不会部署正式Site。
- 自动测试通过不代表商品结论正确；真实准确率必须等待独立人工参考答案。

本轮报告与下一步见 [首批30条报告](../../research/pilot-300-20261029/REPORT.md)。不自动处理后270条，不因用户打开页面而视为验收通过。
