# GitHub → Sites 发布记录

Issue #3 的关系修复、完整副本单请求迁移和真实 Chromium 门禁通过后，PR #2 已合并并发布原站。GitHub 是开发来源；D1 继续保存动态商品库。访问权限仍为 custom，维护环境仍为原 revision62，生产商品未写入。

| 环节 | 实际结果 |
| --- | --- |
| 验收 head | `ea7c167129c57b7fc515b1ffe73b4c12b2c905a7` |
| GitHub 合并 SHA | `14a3f2e9758e6020fbf844fc062e74d27457ab78`；与验收 head 的 tree 相同 |
| Sites 原 head | `6357bd5f020415c17652bf2bdfdbd26130bdac17`；发布前再次读取，无额外修改 |
| Sites 新源码 SHA | `271d287c534bf3a93cc53d8727b6f6f0eafd6917`；Git tree 与合并 SHA 完全相同，普通 fast-forward 推送 |
| 本地 archive SHA256 | `89fc0f7e1064347dfa8c989dedf3e33d25bb79dcfce52f5ba67ea5ffb1f8b88a` |
| archive | 8,058,328字节，309项（含目录）；仅构建输出和 hosting，无快照/研究/SQLite/密钥 |
| Sites 版本 | **65**，`appgprj_6ab5bd99340881919e4311a732df6eb9~appgver_7d7492a4b3708191a6411c811baf056e` |
| 部署 | `appgdep_6ae13f49c2ac81919a31d77ee9108166`，**succeeded**，2026-10-28 00:18:29 UTC |
| URL | https://collector-radar.martainjonn.chatgpt.site |
| 发布后原生读取 | 65 / custom / 原项目及URL；D1 DB绑定保持 |

[原生回执及完整映射](reports/issue-3/release.json)。工具将上传包规范化为tar，返回自己的content_hash/size/file_count；与本地gzip包的hash分开记录，不能混用。

## 可重复流程

Sites 原生临时 Git 凭证返回 publish_on_push_accepted=false；GitHub push 和 Sites Git push 都不是部署。当前环境没有 site-workflow.mjs helper，使用普通 Git 同步已审阅源、原生 save_site_version/deploy_site_version；凭证只经隐藏 stdin/进程环境，不写文件或输出。保留项目 appgprj_6ab5bd99340881919e4311a732df6eb9、DB和custom权限。

1. 核对 GitHub head/base、必需验收与当前发布授权，获取原生 Sites 状态与新凭证，读取远端源码HEAD。若有新Sites修改先协调回GitHub，不force。
2. 干净checkout选定GitHub提交。`scripts/prepare-sites-release.py` 在本地Sites对象库创建相同tree、继承已核实Sites head与GitHub提交的后继提交，构建并生成映射。不导入D1。
3. 包根放 `.openai/hosting.json`，构建目录保留 `dist/server/index.js` / `dist/client/...`。首次保存因旧打包器生成 `server/index.js` 被原生验证拒绝，未创建版本；已修正打包器并用同一未变构建重新打包，原生保存65成功。没有为打包布局变化重复构建。
4. 重新核对远端仍是期望head，普通push候选SHA，再以完全相同SHA及archive调用save_site_version。保留返回的opaque版本ID，按当前audience调用deploy_site_version。
5. pending/building/publishing才轮询。terminal succeeded及URL是原生发布核验；本次已成功并另读get_site确认65/custom。不要把未执行的远程商品操作或视觉测试列作上线核验。

旧3fa5d8c→7a95d3bb是废弃历史候选，不能使用；其旧报告仅作历史保留。

## 商品应用及下一断点

发布授权和固定32条应用授权见Issue #3，已满足代码/浏览器门禁。但当前云环境代理未允许网站域名（CONNECT403），Sites原生表读取又截断JSON，尚不能取完整新鲜目标。未打开维护窗口或发送商品动作。

网络配置放行后，读完整32目标、偏好及全部关系，核对身份/待改字段并重新生成expectedVersion。#484–490七端点与五边同一revision请求；其余25条每次≤20。每次逐项读回，保存回执、原件和应用后版本；生产verified增量以实际前后状态为准。历史14条图片资格正在逐项检查，不自动继承verified。001–004绝不重放，旧005/006隔离动作也不能直接发送。

回滚只允许按应用后版本和图指纹保护的反向修订；不回灌整库。必要源码回滚可部署已保存64，但会失去新并发保护，须另行评估。
