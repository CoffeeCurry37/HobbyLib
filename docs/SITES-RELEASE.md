# GitHub → Sites 发布准备

GitHub CoffeeCurry37/HobbyLib 是开发来源，原 Sites 项目 appgprj_6ab5bd99340881919e4311a732df6eb9 是发布目标，D1绑定 DB 继续承载生产商品库。本轮没有合并PR、推送Sites分支、保存新Sites版本、部署网站或修改生产商品。原 custom 访问权限保持不变。

## 已验证的映射

| 环节 | 当前结果 |
| --- | --- |
| GitHub构建提交 | `3fa5d8c0efaf190bd2fd5e60d350c6ac820cbcaf` |
| 本地准备的Sites源码提交 | `7a95d3bb696b464edade2506f970af6b7822a216`；与上述GitHub提交的Git tree完全相同 |
| Sites现有源码HEAD | `6357bd5f020415c17652bf2bdfdbd26130bdac17`；只读clone确认，没有额外Sites修改 |
| 现有Sites版本 | 64；候选尚未保存版本，不能称为65版 |
| 构建 | Sites与standalone通过；现有DB绑定与项目ID保持 |
| 发布包 | 309项，8,057,287字节；仅dist编译输出和生成的hosting配置，不包含备份/研究/SQLite |
| 包SHA256 | `0bdd3eb7c314232bc6b038b4edaac27092d820040e956db59abe65f95ebbe9db` |
| 本地预览 | 独立版隔离副本登录200、应用页面200、32条商品详情逐项匹配 |
| 浏览器视觉QA | 未执行：没有浏览器控制与受支持的远程预览转发 |
| 生产发布核验 | 未发布；原站仍为第64版 |

映射/构建包回执见[reports/release-20261027/mapping.json](reports/release-20261027/mapping.json)，本地HTTP核验见[preview-checks.json](reports/release-20261027/preview-checks.json)。随后文档提交不会改变上述固定发布候选；如选择其他源码提交，应重新准备映射。

## 原生能力核对与可重复流程

Sites原生提供临时源码凭证、save_site_version、deploy_site_version和deployment status。此次凭证响应publish_on_push_accepted=false；GitHub push不会自动同步或上线。Sites skill的site-workflow.mjs在本环境未安装，未假装执行；本轮使用临时凭证经隐藏stdin做只读Git clone，再在本地准备与GitHub相同tree的后继提交。凭证未写文件或命令行，未改任何Sites远端ref。

本地prepare-sites-release.py不含网络写入或生产D1访问。它核对固定Sites基线、原project_id与DB绑定，导入本地GitHub commit，以现有SitesHEAD和GitHub提交作为父提交，构建并打包。这样将来可普通fast-forward推送，不需要force。先在当前选定提交的干净checkout运行：

```sh
python scripts/prepare-sites-release.py --github-commit 3fa5d8c0efaf190bd2fd5e60d350c6ac820cbcaf --sites-checkout work/release/sites-readonly --expected-sites-head 6357bd5f020415c17652bf2bdfdbd26130bdac17 --output work/release/pr2
```

本轮候选保存在work/release/sites-readonly的Git对象中，包在work/release/pr2/site.tar.gz。只读源镜像不得被当成另一个开发主仓库。发布前另行取得网站发布授权，并执行：

1. 再读get_site、最新version与源码HEAD。如果HEAD不再是已记录基线，停止推送；先把新增Sites改动纳入GitHub审阅。保持project_id、DB及访问权限。
2. 用同项目的新临时凭证，经隐藏stdin传递；普通push已准备的候选SHA到返回的branch。绝不force，不启用自动publish_on_push。保留远端结果并确认SHA。
3. save_site_version传该已推送的完整SHA及对应不变archive；记录返回的Sites版本号和opaque version ID。
4. 当前custom权限用deploy_site_version发布已保存version；只在pending/building/publishing时继续查status，保存最终构建、版本和部署结果。未经授权不执行以上写入。
5. 在授权的真实账号中核对目录、详情、刷新冲突409和权限；重新检查生产目标读取版本。GitHub合并、Sites发布、商品批量应用分别记录。

## 商品应用与回滚边界

当前第64版不支持本PR的revision关系替换参数。生产32条资料与5条边的具体批准，不自动授权网站发布；关系应用须等支持版本已部署并核验。先读取最新只读投影和完整32条目标及所有受影响关系，再比较expectedVersion/指纹。快照动作不可直接发送；版本变化停止该项并重新研究。

#484–490七个端点的资料和五条迁移应合为一个catalogue-curation revision请求；其他25条按最多20条拆分。五条边只更换逻辑父级。逐请求保存回执，逐项读回；成功范围不重复询问、不重放。001–004已经生产应用，005–006目前仅本地回执。

源码回退可重新部署已保存的第64版，但会失去并发/隔离保护；不对D1做无条件还原。资料撤销使用应用后实际版本、当前关系指纹和保留原件；后续任何编辑不符则拒绝。完整副本已验证精确回滚与拒绝过期撤销。
