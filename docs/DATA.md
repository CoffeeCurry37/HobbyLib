# 数据来源与恢复

| 路径 | 内容 | 用法 |
| --- | --- | --- |
| snapshots/2026-10-26/collector-radar-backup.json.gz | 线上完整商品库，含个人字段、挂牌、历史、存档及关系 | 校验、解压，在应用内导入 |
| public/fate-crawl/、lib/radar/ 中的快照/清单/登记表 | 历次来源观测、目录和采集断点 | 研究证据及已有导入程序输入；不是当前线上数据库 |
| research/ | 研究决定、来源/图片回执、复查队列、分组 | 按 RESUME.md 接续，禁止重放已应用批次 |

完整快照保留 35,020 个商品及 8,549 个归并存档。压缩可逆，解压后 SHA-256 应与 manifest 完全一致。图片通常为原站 URL；没有保存全部图片二进制，外链仍可能失效。

public/fate-crawl/manifest.json 是历史 v0.12.1 清单（64 批）；lib/radar/fate-crawl-manifest.json 是后续 v0.15 清单（82 批、32,490 条来源记录）。按原源码保留，不能只读前者就忽略后续，也不能累加所有批次视为独立商品数。恢复最新状态应使用完整快照。

## 验证与恢复

```text
python scripts/snapshot.py verify
python scripts/snapshot.py extract --output data/collector-radar-backup.json
```

Python 3 标准库即可。检查压缩/原文件哈希、商品计数、重复 ID、关系端点、固定复查队列和状态。解压拒绝覆盖已有文件，输出到被忽略的 data/。

在目标应用先备份，再选择解压文件导入。现有恢复流程分块上传，最终检查后替换目标账号数据。本次 GitHub 同步没有执行线上恢复。

## 保存范围

原始源码文件的 SHA-256 与 Git blob 哈希见 docs/source-inventory.json。忽略 Python 缓存、依赖、本机状态和凭证。旧网站 README 保存在 docs/collector-radar-original.md，旧 HobbyLib README 保存在 docs/VISION.md。

仓库含个人收藏数据，应保持私有。没有提交登录会话、维护令牌、API 密钥或环境变量值。分享/开源时使用另行清理的副本。
