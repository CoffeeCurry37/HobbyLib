# GitHub → Sites 发布记录

## 2026-10-29 本轮独立复核

应用代码保持Sites65及原源码SHA不变；只为限定32条复读短期开启既有维护配置，未发送商品写请求。任务结束截止时间设为0，环境revision68部署`appgdep_6ae3eb4e55248191b2e7b84c3f9b3d3b`于2026-10-30T00:56:59.405902+00:00 succeeded；当前维护凭证GET返回401。原项目、DB和custom访问范围保持。下文revision62/65及部署ID均为原执行历史，不是当前维护状态。

32条完整记录、原文和Offer/历史与原生产回执一致；五边正确。见[独立核对](reports/issue-3/reconciliation-20261029.json)。


2026-10-29（America/Chicago）确认原Site仍为65 / active / custom。应用源码与包未变；本次仅为维护配置启用与关闭部署同一已保存版本。当前停止点见[NEXT_TASK.md](NEXT_TASK.md)。

Issue #3 的关系修复、完整副本单请求迁移和真实 Chromium 门禁通过后，PR #2 已合并并发布原站。GitHub 是开发来源；D1 继续保存动态商品库。原始发布时访问权限为custom、维护环境revision62、生产商品未写入；下述原始回执保留。2026-10-29生产结果见文末。

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

Sites 原生临时 Git 凭证返回 publish_on_push_accepted=false；GitHub push 和 Sites Git push 都不是部署。当次发布环境没有 site-workflow.mjs helper，因此当时使用普通 Git 同步已审阅源、原生 save_site_version/deploy_site_version；凭证只经隐藏 stdin/进程环境，不写文件或输出。保留项目 appgprj_6ab5bd99340881919e4311a732df6eb9、DB和custom权限。

下一次发布按当前可用 Sites skill/helper 执行；以下步骤记录既有发布，不能据此跳过当前工具要求。

1. 核对 GitHub head/base、必需验收与当前发布授权，获取原生 Sites 状态与新凭证，读取远端源码HEAD。若有新Sites修改先协调回GitHub，不force。
2. 干净checkout选定GitHub提交。`scripts/prepare-sites-release.py` 在本地Sites对象库创建相同tree、继承已核实Sites head与GitHub提交的后继提交，构建并生成映射。不导入D1。
3. 包根放 `.openai/hosting.json`，构建目录保留 `dist/server/index.js` / `dist/client/...`。首次保存因旧打包器生成 `server/index.js` 被原生验证拒绝，未创建版本；已修正打包器并用同一未变构建重新打包，原生保存65成功。没有为打包布局变化重复构建。
4. 重新核对远端仍是期望head，普通push候选SHA，再以完全相同SHA及archive调用save_site_version。保留返回的opaque版本ID，按当前audience调用deploy_site_version。
5. pending/building/publishing才轮询。terminal succeeded及URL是原生发布核验；本次已成功并另读get_site确认65/custom。不要把未执行的远程商品操作或视觉测试列作上线核验。

旧3fa5d8c→7a95d3bb是废弃候选，不能使用；旧 mapping/HTTP 预览报告已删除，原文保留在 [清理前 Git 历史](https://github.com/CoffeeCurry37/HobbyLib/tree/c6ac70cbd0ee9925a9720ecd7a243512da112b9c/docs/reports/release-20261027)。实际65版回执继续保留。

## 2026-10-29生产整理与维护配置

本次GitHub基线`47dcb62f32e30127009f100457a818e1e8ed3146`相对合并后的运行文件未变，保持Site65和源码`271d287c534bf3a93cc53d8727b6f6f0eafd6917`，没有重建、保存新版本或改动DB/custom权限。

| 用途 | 环境revision | 部署 | 结果 |
| --- | --- | --- | --- |
| 首次限时窗口，只读后会话中断 | 63 | `appgdep_6ae2b1aca6048191865e27a411ceb1cb` | succeeded；窗口自动过期，无商品写入 |
| 续跑窗口，刷新输入后应用32条 | 64 | `appgdep_6ae3559697ac8191bed65bec3d861a16` | succeeded |
| 任务结束，维护截止设为0 | 65 | `appgdep_6ae357973dec8191a7305d3be88d2293` | succeeded；当前凭证GET维护状态返回401 |

环境revision和Site版本是独立编号。新维护令牌仅在会话内存和Sites Secret；原令牌不可读且会话中断后已过期，未伪造账号头、放宽公开权限或绕过代理。

**固定32条已六组生产应用，32条独立完整读回通过；五条小说目录边与七端点在同一revision完成。** 最终verified2 / partial30，实际verified增量1。#496–500保留原主图；#93/#494/#495未决问题保留。商品/关系计数、偏好、原文、个人/人工字段和Offer历史核对通过。

[完整脱敏回执](reports/issue-3/production-20261029.json) · [逐项差异和人工验收清单](reports/issue-3/REVIEW-32.md)。完整原件/请求/读回/受版本及图指纹保护的回滚仅在忽略目录work/current-stage/。001–006已成功动作均不得重放。

**等待用户明确确认逻辑，不启动下一阶段。** 本次未新增应用代码或交互，无新增浏览器QA；历史测试不计作本次结果，旧失败仍保留。
