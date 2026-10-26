# HobbyLib

个人兴趣商品库与中古商品发现助手，涵盖书籍、漫画、手办、玩具及其他收藏品。当前运行中的网站名为 **Collector Radar · 收藏雷达**。

- [在线收藏雷达](https://collector-radar.martainjonn.chatgpt.site)（本人登录）
- [当前进度与下一步](docs/PROGRESS.md)
- [业务规则与代码索引](docs/ARCHITECTURE.md)
- [数据来源、备份与恢复](docs/DATA.md)
- [继续逐项复查](research/editorial-20261021/RESUME.md)
- [独立运行说明](standalone/README.zh-CN.md)
- [原 HobbyLib 愿景](docs/VISION.md)

## 当前数据

2026-10-26 线上完整导出：**35,020 条现有商品、8,549 条合并存档、1,835 条关系**。其中同人商品 19,209 条。备份保留个人备注、拥有状态、报价与历史信息；本仓库应保持私有。

原非同人复查队列共 15,811 个编号：310 已核实、42 待补查、1 已归档、15,458 未完成。下一个未开始编号为 **91**。已应用批次 001–004 不得重放。预检、分组和抓取网页均不等于完成商品核实。

本次同步包含网站第 64 版源码、全部已保存采集批次和研究断点，以及完整线上数据库备份。**GitHub 提交不等于线上发布**；网站仍通过原 Sites 项目发布。

## 本地开发

需要 Node.js 24+；沿用 package.json 指定的 pnpm 版本及锁文件。

```text
pnpm install --frozen-lockfile
pnpm test:core
node scripts/test-editorial-flow.mjs
pnpm test:workflow
pnpm build:standalone
```

独立版使用 RADAR_PASSWORD（至少 16 字符）、RADAR_ORIGIN、RADAR_DATA_DIR，启动命令为 `pnpm start:standalone`。完整说明及 Windows 启动方式见 standalone/。

验证及解压备份（Python 3 标准库）：

```text
python scripts/snapshot.py verify
python scripts/snapshot.py extract --output data/collector-radar-backup.json
```

应用内导入解压后的 JSON 可恢复本次商品库。恢复会替换目标账号数据，应先备份目标数据库。

## 已实现与待完成

已有商品/挂牌分离、分类及标签规则、版本匹配与可撤销归并、套装/组件/特典关系、收藏状态、优先度、采集队列、分组研究和断点恢复。分类由规则实现，未接入额外 LLM API；提醒在应用内展示。独立版具有定时监控逻辑，但没有本次验证的常驻云主机。

分类、图片及系列关系仍有待查项；见 [PROGRESS.md](docs/PROGRESS.md)。本次检查结果见 [SYNC-2026-10-26.md](docs/SYNC-2026-10-26.md)。
