# v0.12.0 verification — 2026-10-06 UTC

## Catalogue and retained records

- Final online and local exports contain 32,950 active products and 8,384 recoverable merge archives. All three owned records retain their IDs, quantities and notes. Every original record remains active or recoverable through its merge target.
- This release adds 4,212 unique captured source records to the previous snapshot and merges 15 confirmed duplicate products. Repeated batches are idempotent. Final checks find zero strict automatic merge candidates and zero duplicate source-listing identities; other cross-shop duplicates may still require review.
- Each non-manually-protected record has one matching primary-class tag: books 1,369; games 88; media 585; merchandise 7,720; large merchandise 1,819; cards 808; toys 1,470; doujin 19,091.
- 32,698 active records have image URLs; 252 remain without images, including 157 offerless records. Images remain source URLs rather than an offline cache. Stored links do not guarantee future source availability.

## Classification and book numbering

- Product-local categories outrank genre labels. 映像ソフト, 一般ゲーム系, ゲーム原作系 and ゲームソフト関連 no longer put movies, OSTs, books or accessories in the game catalogue. Search words and related-work tags do not select the work branch.
- Eight classes drive navigation and filters. Fate toys are consolidated under Fate 综合 → 玩具. Kuji and standalone bonuses retain separate entries. Empty game branches are omitted; the verified Prisma Illya 3DS game remains represented.
- Game platforms, book volumes, original/new editions and video formats remain separate identities. Media bundles, game editions, complete merchandise sets, original prize-pack units and seller-created lots keep distinct sale forms.
- Nineteen retail titles had preorder, stock or publisher suffixes obscuring their volume. Their physical ISBNs and publisher titles were checked before updating volume fields. Captured UBW manga volumes are 1–9; turas realta volumes are 1–23, with volume 23 retaining its announced October 8, 2026 release date. Future imports use an exact-ISBN publisher-title fallback and preserve manual volume edits.
- Doujin defaults to all ages without an explicit product-level adult indication. Unknown audiences remain pending; BL alone does not imply R18.

## Source evidence and continuation

- Aniplex KyoMAF, AnimeJapan and TYPE-MOON Comiket: 149 product details, 465 variant observations; current Fate product details also remain in the snapshot.
- AmiAmi: 652 historical/used details; Mercari: 359 details. Surugaya, Yahoo and public Mandarake list observations retain their source links.
- Publisher capture: 624 KADOKAWA physical editions after excluding 84 electronic-only records, and 23 Kodansha turas realta editions. ISBNs, covers, release dates and stated prices retain source evidence; unavailable covers remain pending.
- Five Kuji campaigns have 44 award catalogues with source/reference pictures. Unknown variants remain visible. Two inspected Yahoo photographs retain their actual three-plush and four-figure member links. Other photographs do not imply verified membership; no general AI vision service is connected.
- The local package preserves 18 disabled queues, five remaining Surugaya historical partitions and Mandarake's verification pause. Historical coverage remains partial. Melonbooks could not be read; Mandarake detail age verification remains pending. Saved observations do not count as freshly checked stock or trigger purchase alerts.

## Checks completed during resume

- v12 regressions cover genre versus medium, work isolation, platforms, hardware/bonuses, manual preservation, and matching/mismatching publisher ISBNs for volume recovery. TypeScript, production and standalone builds pass.
- Compiled HTTP checks cover login, private APIs, CSRF, repeated imports, padded/different volume numbers, staged/cancelled uploads and atomic backup restoration.
- Populated-runtime checks cover final catalogue counts, archives, exact owned details/exports, complete streamed backups, disabled queues and ordinary-catalogue pagination. Generated SQLite databases pass integrity checks.
- Live pagination returned all 32,950 records without duplicate IDs or count mismatches. One sample measured metadata at 6,473 ms, the first ordinary page at 1,250 ms, all 25 ordinary pages at 7,794 ms and all 33 doujin pages at 8,345 ms. These are individual observations, not latency guarantees.
- Maintenance imports require the configured populated owner and an expiring token. The maintenance window is closed after this update.
- Browser visual acceptance, Windows double-click startup, external Docker/Caddy deployment and a 24-hour monitoring run were not performed. Local monitoring remains disabled until enabled in the application.


## v0.12.1 启动修复（2026-10-06）

- 打开页面仅执行目录 GET，不再自动运行全库归并或快照导入。读取第一页立即显示，不依赖 identityMigrated；整理失败不会把整个库呈现为空。
- 针对性回归：过期整理版本、分批回调、中途断网保留已读商品、空响应和重复游标错误、重试。
- 32,950 商品的完整 v0.12.0 副本测试：分页读取通过，3 条已拥有记录及详情哈希一致，8,384 个合并存档完整；模拟第二页断网后首批 600 条仍保留。测试时间不代表在线速度。
- Windows 启动器检查 Node.js 24+ 和常见安装路径；新增离线中文启动指南。尚未在真实 Windows 系统运行脚本；此环境未提供可用的浏览器界面验收工具，已验证前端目录加载逻辑和真实 HTTP 接口。
- 本轮采集 AmiAmi 4 页、Yahoo 4 页、Aniplex 3 页；保留 428 个不同来源标识，补查 30 个 AmiAmi 新记录详情。归并后的实际新增数见 release-info.json；不能当作所有历史目录已经完整。

## v0.12.1 归并循环修复（2026-10-10）

- 套装单卷匹配使用同 ISBN 的已核验出版社标题，能识别带库存和商店后缀的已有单卷。已归档的占位身份不再自动重建；同一次整理新增的合并存档立即参与此保护。
- 新建套装成员在确定品类后重新生成主分类与标签，避免漫画占位条目保留周边标签。
- 仅归并重复记录时跳过全库关键词统计和额外关系推导，降低内存峰值；已有关系在归并时直接重定向。
- v121 与 v12 回归及 TypeScript 检查通过；真实整理前快照的严格重复对为 1 组，模拟合并后新建占位为 0、剩余严格重复对为 0。重复整理回归验证结果稳定。
- 最终完整库数量、收藏保留与采集接续位置记录在完整包的 release-info.json。Windows 实机和浏览器画面验收仍未执行。


## v0.12.2 — 2026-10-11

- Deduplication recognizes physical ISBN stored in either ISBN or JAN, validated publisher succession, anthology volume numbers and source-credited circle readings with a matching artist. Default age ratings no longer defeat a source-confirmed identity; explicit conflicting ratings remain separate.
- English editions, manga versus novels, volumes, platforms, manual identity edits, and Aniplex variants remain protected. Mutually incompatible editions cannot join through a record with incomplete metadata.
- A reviewed merge plan reads at most 20 pairs per request, revalidates their identities, preserves recoverable archives, and applies changes atomically with a concurrent-edit guard. Repeating a completed pair is idempotent.
- Prior full-catalogue simulation identified 102 pairs (74 books, 28 doujin), retaining all three owned records, their quantities and notes. The release data report records final online counts and validation.
- Publisher succession reference: https://www.kadokawa.co.jp/topics/6247/


## v0.13.0 — 2026-10-14

- Full item pages use a bounded item endpoint, a ten-image gallery, explicit edit mode, quote panels and linked child pages. Catalogue navigation preserves its mounted view and scroll position.
- Event aliases are canonicalized. Distinct game platforms, book publishers and merchandise artwork remain protected in duplicate matching.
- Online curation: 474 event labels standardized across the resumed operations; 41 new official catalogue entries and 125 relations stored. Samurai Remnant has 28 retailer bonus records shared by the three supported physical platforms, plus their platform-specific launch bonus.
- Public crawl continuation and evidence are saved in public/fate-crawl/v13/audit.json. This is partial coverage; Melonbooks and Toranoana list requests returned no scoped products.
- Browser visual QA and real Windows launch were not available in this environment. Runtime tests and online data verification are reported separately in the release data report.

- Fixed hosted compact source imports exceeding Worker memory: identity matching streams bounded database pages and hydrates only relevant full records. Complete original descriptions, notes, ownership and offer history are preserved. Set inference is not run on a partial catalogue.
- New bounded-import regression passed, including late-page matches, unchanged unrelated records and repeated-batch idempotence. v9, v11 and v13 regressions and TypeScript passed. Legacy v9 fixtures now mark conflicting circle/rating facts explicitly, consistent with the v0.12.2 identity policy.
- A 41,763-record SQLite copy processed the four 100-or-fewer source batches with an 80 MB JavaScript heap limit; observed heap after each batch was 22–65 MB. Local test time was about 4.4–4.6 seconds per batch, not an online latency guarantee.

## v0.13.0 final data acceptance — 2026-10-14

- Cloud snapshot import completed all 68 saved batches. The last 394 accepted source observations contributed 310 new catalogue records, including 64 records committed before the interrupted first attempt; replay was idempotent.
- Online export confirmed 33,485 active records, 8,524 recoverable archives and all three original owned records. Strict duplicate matching found zero remaining pairs; canonical hierarchy sibling checks and noncanonical event checks also returned zero. Ambiguous cross-shop products may still need manual review.
- Three Samurai Remnant physical-platform bases each have 29 bonus links. Four logical wafer/Fes card directories and six individually identified official Fes card records are present. Two existing doujin records retain confirmed BOOTH/Melonbooks/Toranoana original-page evidence; this is not a complete match of every doujin record.
- Nine older galleries exceeding ten images were trimmed with record-version guards. Existing manual fields were protected. Further imports and detail enrichment now also cap saved galleries at ten images.
- Live ordinary-catalogue pagination returned all 14,401 records; metadata reported another 19,084 doujin records. First ordinary page measured 410 ms and the complete ordinary catalogue 11,735 ms in this observation. These are API measurements, not visual rendering or future latency guarantees.
- TypeScript, v13 detail/edit/relationship tests, bounded-import regression, startup GET-only/progressive/error-retention regression and both standalone builds passed. The final packaged data and populated HTTP results are recorded in release-info.json and the release audit.
- Live maintenance is closed at delivery. No background cloud schedule was enabled. Browser visual acceptance and real Windows launch remain unperformed.

## v0.14.0 — 2026-10-17

- Added stable game-edition, publisher/medium book-series and collection parents. Existing startup remains read-only and progressive; imports perform bounded matching and grouping.
- Online batch completed: 395 original records curated, 117 logical parents and 553 missing card entries created, 23 reviewed duplicates archived reversibly, and 1,307 initial parent/member links added. Entries without confirmed card numbers or characters are explicitly labeled as placeholders; series reference images are labeled.
- Verified 22 Bandai wafer releases (622 published slots), 14 Aniplex Aurora designs and 35 official postcard numbers. Official variant evidence overrides legacy seller-lot classification; known pack and box variants share one parent while preserving separate offers.
- 663 accepted observations from six accessible shops added 443 records and matched 220 existing records. Melonbooks and Toranoana list access remained unavailable; saved checkpoints describe partial coverage. No unavailable source was reported as fully scanned.
- Production before the final packaging correction: 34,575 active records, 8,547 merge archives and all three owned records. The final database counts, personal-field comparison and relationship checks are included in release-info.json.
- Full-data simulation processed 77 bounded actions. Original personal and manual fields were retained; collection counts, unique member keys, ten-image limits, and acyclic valid relations passed. One remaining same-title/circle candidate has conflicting recorded age ratings and was held for review; sibling hierarchy audit found no duplicate nodes.
- Corrected atomic version-check SQL to use the composite item index instead of scanning the entire owner catalogue for each batch. The 68 curation batches took 3.4 seconds total on the disposable SQLite copy; this is not a hosted latency guarantee.
- TypeScript, v14 core and family regressions, and v13 detail/edit/personal-field tests passed. Browser visual QA and real Windows startup were unavailable. Local runtime HTTP tests and live pagination are recorded in the delivered release-info.json; external image URLs still require internet.
