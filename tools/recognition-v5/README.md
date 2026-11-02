# 隔离分类与身份修复 V5

读取已保存模型即可浏览；入口仍是 `node tools/pilot-v3/server.mjs`，默认优先V5、其次V4/V3。正式库与正式Site不连接。

- taxonomy.mjs：全局规范键、旧字段转换、作品/活动/厂商/产品线的统一路由、同级约束和通用系列触发。
- identity.mjs：官方补全与挂牌的同入口匹配；平台展示聚合，版本/范围冲突保护，保留原挂牌和旧ID跳转。
- sources.mjs：已有公开页面缓存的有界解析，以及绑定哈希的官方图示转录。不会自动联网。
- run.mjs：以V4和冻结300条构建V5、规范登记表、变化清单和研究队列。
- report.mjs：实际请求/费用、输入指纹、图片文件哈希和相关回归验证。
- test.mjs：本轮17项结构/语义/隔离回归。

完整重建需要本机忽略目录内的冻结样本、V3来源缓存及V5计划。顺序：`node tools/recognition-v5/sources.mjs` → `node tools/recognition-v5/run.mjs` → `node tools/recognition-v5/report.mjs`。查看或修改文档无需重跑。GitHub不含原HTML/原图；V5新增来源及哈希在`research/pilot-v5-20261101/source-plan.json`。旧已认可来源保持不复查；换环境缓存恢复不等于重新核实产品。

详见[报告](../../research/pilot-v5-20261101/REPORT.md)、[长期记忆](../../docs/RECOGNITION_V5.md)、[用户反馈](../../docs/PILOT_FEEDBACK_V5.md)。未接无人值守视觉模型；partial和未知项不伪装为完成。
