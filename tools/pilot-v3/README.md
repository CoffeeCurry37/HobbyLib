# 收藏雷达模块工作台（当前默认V4）

本机入口：http://127.0.0.1:8793/ 。存在V4模型时默认读取最新300条阶段结果；保留V3原件。页面新增本轮200条和资料缺口，正式商品库不连接。

启动：在仓库根目录运行 `node tools/pilot-v3/server.mjs`。本地HTML/图片缓存位于忽略目录；单从GitHub下载模型不会带回原图，需要使用已保存的公开来源计划重新缓存。不要为看工作台重新执行整个识别试验或重放生产动作。

# 收藏雷达模块工作台 V3

在仓库目录启动：node tools/pilot-v3/server.mjs，打开 <http://127.0.0.1:8793/>。已提交的research/pilot-v3-20261030/catalogue-v3.json可以直接浏览，无须重跑资料研究。

首页保留原模块：TYPE-MOON、变形金刚、机器人/模型、其他收藏、待归档、同人。按作品、品类、产品线继续进入；顶部面包屑返回上层。侧边栏可看新增70条、同系列永久目录、4个拼包的27处识图区域，以及隐藏历史。

范围为原30继承＋原development剩余70；另200不运行。永久零挂牌保留；用户指定失效与历史明确结束的临时对象退出当前模块。挂牌均为历史记录，不代表当前库存。最终结果和4条图片缺口见[报告](../../research/pilot-v3-20261030/REPORT.md)。

本服务绑定127.0.0.1、检查Host/Origin、仅GET；没有生产客户端、数据库绑定、发布或同步接口。原V1/V2资料、个人审核与32条修订不覆盖。

## 图片与新环境

原图缓存在受忽略的work/pilot-v3/source-cache；GitHub保存来源/摘要和结果，不提交完整网页或原图。新环境先启动可阅读文字；若需要恢复图库，运行node tools/pilot-v3/restore-images.mjs生成223个已成功来源的恢复计划（此步无网络），再运行node tools/recognition/capture.mjs work/pilot-v3/restore-images.json。它只恢复已确认图片、不复核旧商品、不重试原4条失败源；核对原SHA-256，变化或不可访问保留缺口，不沿用旧视觉标注。不要把缺本地缓存说成原资料失效。

识别代码见[recognition](../recognition/README.md)。重新生成需本机冻结样本、旧V2、紧凑历史目录和原来源缓存；只有证据/代码变化才重跑node tools/recognition/run.mjs。测试：node --test tools/recognition/test.mjs。当前交付无付费模型API调用，搜索/识图由会话辅助，尚无常驻无人值守执行器。
