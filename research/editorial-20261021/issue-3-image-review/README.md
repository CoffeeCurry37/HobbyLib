# 固定32条应用前：历史图片资格复核

本轮只复核原005–006宣称五项合格的14条。全部找到URL/哈希对应的下载回执；#80/#81的来源回执还明确记录visualChecked=true。其余12条未找到独立视觉检查凭证，不能由下载成功、尺寸或旧五项勾选补推。故在待应用方案中将这12条改为partial；不删除来源图片，不撤销有依据的简介、分类、标签及五条父级修订。

**最新固定批次状态：prepared32 / isolatedApplied32 / productionApplied0 / verifiedDelta0 / verifiedEligible2 / partial30。** 原来的14/18仅作历史隔离结果，不能再用于生产动作。

| 原编号 | Item ID | 复用凭证 | 新方案状态 |
| --- | --- | --- | --- |
| #80 | family-bd1e9d29d163cfb06f93cbe07b7b0c30 | research/editorial-20261021/batch-002-image-receipts.json 的 #80；7ad948d56534 | 保留五项资格 |
| #81 | member-17vmdp9 | research/editorial-20261021/batch-002-image-receipts.json 的 #80；7ad948d56534 | 保留五项资格 |
| #484 | family-c91ba4972ab712e2ca5b67ef3132eeb1 | research/editorial-20261021/batch-004/image-checks.json 的 #486；5770fb738813 | partial：待视觉对应 |
| #485 | family-ece84739ad4d11735dbc4948fe7edd5f | research/editorial-20261021/batch-004/image-checks.json 的 #492；0a0d08efdf4e | partial：待视觉对应 |
| #486 | source-9447610c42728f7b86ee5d52ba4486ca | research/editorial-20261021/batch-004/image-checks.json 的 #486；5770fb738813 | partial：待视觉对应 |
| #487 | source-ad7c3d833749fffd927ae606c8a14513 | research/editorial-20261021/batch-004/image-checks.json 的 #487；8847d508edd6 | partial：待视觉对应 |
| #488 | source-ee54ecbcd5737dd27cc7f4192c7a2040 | research/editorial-20261021/batch-004/image-checks.json 的 #488；82105c88aa78 | partial：待视觉对应 |
| #489 | source-1a19408b2f4ef5af6c71b43dde757f3c | research/editorial-20261021/batch-004/image-checks.json 的 #489；d9b84e6ded4a | partial：待视觉对应 |
| #490 | source-c2b2e148b7681b82c96330739b270d70 | research/editorial-20261021/batch-004/image-checks.json 的 #490；9f6582c64dd8 | partial：待视觉对应 |
| #496 | 21bf754b-7370-4f5e-83c4-9adeafdcd83d | research/editorial-20261021/batch-004/image-checks.json 的 #486；5770fb738813 | partial：待视觉对应 |
| #497 | bab8701d-a249-4022-91c9-625d79a100ff | research/editorial-20261021/batch-004/image-checks.json 的 #487；8847d508edd6 | partial：待视觉对应 |
| #498 | cdab3ad1-68d4-419c-a12c-b3399e72274d | research/editorial-20261021/batch-004/image-checks.json 的 #488；82105c88aa78 | partial：待视觉对应 |
| #499 | 2a92ea72-5340-403c-9bc1-71420ee63f9e | research/editorial-20261021/batch-004/image-checks.json 的 #489；d9b84e6ded4a | partial：待视觉对应 |
| #500 | 6cd1e115-1669-450d-b042-be02c96cacb6 | research/editorial-20261021/batch-004/image-checks.json 的 #490；9f6582c64dd8 | partial：待视觉对应 |

逐项来源、原/新editorial对象、五项checks、unresolved、版本及完整图片回执见 [decisions.json](decisions.json)。这些expectedVersion来自隔离副本，**不是生产版本**。

已从完整43,569条副本，通过真实catalogue-curation接口一次应用12条状态修订，并逐项读回。仅editorial变化，个人/人工字段、Offer及历史、原名description、偏好及全部关系不变，其余43,557条原始字节不变。过期请求拒绝、受保护回滚恢复原字段值。见 [validation.json](validation.json)。最新可审查隔离副本是 work/issue-3/image-review/applied.sqlite；原 work/editorial-005/review.sqlite 保留，不重放其动作。

没有新生产写入，不能将本次资料降级称为新核实。Sites65发布与此状态修订独立。生产完整目标仍被环境网络策略阻断；获准网络配置后再读实时记录并重做差异。账户额度/重置unknown。
