> Image checkpoint (2026-10-28 00:25 UTC): fixed32 remain prepared32 / isolatedApplied32 / productionApplied0 / verifiedDelta0, but current verifiedEligible2 / partial30. Fourteen download receipts located; only#80/#81 have explicit visual provenance. Twelve status downgrades actually applied/read back/rolled back in a full isolated copy; latest applied copy work/issue-3/image-review/applied.sqlite. Read issue-3-image-review/decisions.json before production preparation. Next risk group#495, Item b3c2f3ac-46ad-427b-b106-0ecd3e4bf579: distinguish2Y1040 from2Y1252 with campaign BOX; no production split authorization. Network unblock pending; quota/resetunknown.

> Latest checkpoint (2026-10-28 00:20 UTC): PR2 merged14a3f2e; Sites65 published successfully from271d287c, deployment appgdep_6ae13f49c2ac81919a31d77ee9108166. Branch main. prepared32 / isolatedApplied32 / productionApplied0 / verifiedDelta0; historical isolated14/partial18 pending image-receipt revalidation. Production target reads are blocked by enforced egress (site host CONNECT403), native rows truncated; network configuration request pending. Do not replay001–004 or snapshot actions. Follow ../../docs/NEXT_TASK.md. Quota/reset unknown.

> Current execution authority (2026-10-27): [Issue #3 checkpoint](../../docs/NEXT_TASK.md). NO-GO at 104269b; repair relation/prefs races, then full-copy atomic rehearsal and real browser QA. Issue #3 conditionally authorizes publication and the fixed 32 Items/5 edges only after acceptance. Historical approval/cursor notes below are superseded.

> Latest checkpoint (2026-10-27): code/data **3fa5d8c** pushed; documentation head is `git log -1`. 32 prepared / 32 isolatedApplied / 0 productionApplied; isolated verified14 / partial18. Sites remains64; release prepared and local HTTP QA passed, browser visual QA unavailable. Read the final two checkpoint sections and batch-005/006 first; preceding production counts describe historical snapshots. Usage quota/reset not visible.

# Exhaustive non-doujin catalogue review

User asks every active non-doujin record to be individually checked against source pages for classification/hierarchy, cover, relevant tags and a one-sentence Chinese summary. No record may be silently skipped. Existing notes, ownership and manual edits must survive.

The immutable queue is `lib/radar/editorial-manifest.json` (15,811 IDs). Do not rerun the seed generator or replace the queue. The editorial object in each live item is the authoritative progress checkpoint. `GET /api/radar?editorialAudit=1` returns counts, first unstarted ordinal, unresolved records, and pagination. New records outside the original queue are counted separately and need an appended campaign later.

**Current online checkpoint, verified 2026-10-25: 310 verified, 42 partial, 1 archived, 15,458 pending out of 15,811. Batches 001–004 are applied; DO NOT replay them. This turn applied 273 records (245 verified + 28 partial), all read back exactly. Next unstarted ordinal is #91 (Enterbrain Fate/stay night 10-volume seller lot). One reviewed logical parent is outside the original queue.**

Resume: follow WORKFLOW.md. Use the compact editorial index and per-item fingerprints; reuse unchanged results and source receipts. Work in related groups with a bounded packet, not fixed 20–40-item batches. Fetch full fresh records only for targets before guarded writes. Preserve every original ordinal and unresolved item. Mark `verified` only after all five checks pass. A source failure or ambiguous item goes into `partial` or `blocked`, with a concrete unresolved question. These do not count as completed. Changes to the reviewed fields or cover invalidate the status. Archived/missing/doujin records stay in the accounting.

Use `catalogue-curation` with expectedVersion (max 20 changes), preserving all personal/manual fields. Validate on a disposable exact SQLite copy first. Publish source/schema before applying actions; compare the live export afterwards. Save the source checkpoint at each batch before continuing research; scratch files can disappear between turns. Never state the full catalogue was reviewed merely because its IDs were queued.

Historical notes below; do not replay them. First research batch was ordinals 1–40, sorted books first then Japanese title. Sources previously established:
- #2 Surugaya 871587820 is a standalone Sakura badge from Special BOOK, not the book.
- #6 Surugaya 185282674 is framed reproduction art despite its anime-book source category.
- #17 Mercari shops S8tvrhXyxJukt5vvNG2Zrd is the TYPE-MOON Ace 12 timeline poster alone.
- #32 Yahoo r1242732093 includes an Orchestra Concert CD plus pamphlet/bonuses, not just a book.
- #10/#11 Aniplex pages contain multiple variants: select the book-only bundle variant 002.
- #20/#22/#25 publisher cover URLs: https://data.ichijinsha.co.jp/img/75806974 , /img/75808641 , /img/75806988. ISBNs confirmed by publisher.
- #15, #36 ambiguous actual contents; #24/#26 special-edition extras incomplete; #27–30 retailer bundle volume ranges unknown; #37 film pamphlet count unclear; #14 former auction unavailable. Keep these unresolved.

The source-only checkpoint initially contains no completed editorial items. Read live progress to determine whether the later first-batch actions were applied.


## Batch 001 applied and verified online, 2026-10-22

Ordinals 1–40 are applied: 32 verified, 8 partial, next pending #41. Two guarded curation calls updated 20 records each and added six relations. Full online export comparison confirmed exactly these 40 changed, all other products/archives unchanged, and all personal/manual fields and original offer data preserved. Active products 35,020; archived 8,548; relations 1,821; unchanged doujin 19,209. Eight empty/placeholder covers filled, 21 covers improved overall. SQLite simulation, live integrity audit, editorial regression test and TypeScript check passed. Browser QA was unavailable due to managed preview infrastructure.

Partial ordinals: #14 unavailable former auction/edition extras; #15 book vs Rider bust sales content; #27–30 exact manga bundle volume ranges; #36 full magazine vs appendix-only; #37 pamphlet count/chapter range. Four manga bundle covers are first-volume catalogue references, not bundle photographs.

#24/#26 special edition contents resolved using https://data.ichijinsha.co.jp/detail/75808369 and https://data.ichijinsha.co.jp/detail/75806989. The latter officially published bonus is called a doujinshi, but the parent remains commercial. Ichijinsha image endpoints returned HTML: the live records use tested Rakuten images for #20/#22/#25. #10/#11 use actual official gallery book covers, not text-only variant labels, and are book-only Aniplex bundles without Blu-ray.

Live item.editorial is authoritative; do not redo batch 001 merely because scratch captures disappeared. Rebuild the worklist by mapping the saved manifest.ids to a fresh export, preserving order. Never reseed. Continue with #41. Preserve absent/archived/partial slots in accounting.

## Batch 002 prepared, 2026-10-23

The explicit decisions for ordinals 41–80 are saved in `batch-002-decisions.json`, with public prepared records and image receipts. All forty cover images were downloaded and visually checked; #79 replaces an Aniplex format label with the actual jacket, and #80 uses the ISBN-matched Mercari Shops book photo because the publisher cover URL returned 404.

Prepared operations: forty curation updates, one logical Game Artbook series parent, fifteen relations, and one duplicate archive (#59 into #56, identical Mandarake product number 0101370241). The series has twelve active child listings after that merge; seven publication volumes remain distinguishable. #41 is linked as a ufotable bonus DVD under the first Heaven's Feel limited Blu-ray. #70 is linked under the established 2014 TYPE-MOON Ace Special kuji directory but its exact artwork remains unresolved.

Partial batch ordinals: #54 initial-edition attachments; #57/#60 printing/reprint date; #62 initial map stickers; #70 rolled-poster artwork; #77 seller lot versus original C69 fixed package. Do not add Aniplex bundle extras to plain book #76, nor Amiami bookmark extras to #55/#63. Do not merge C86 Apocrypha giveaway #42 with the later full reference book #71.

Simulation and full personal/manual-field audit passed; no other original records changed, all existing offers survived, all collection member counts and Samurai Remnant bonus links survived. Queue simulation: 65 verified, 14 partial, 1 archived, 15,731 pending, next #81. Read live editorial progress before applying anything: preparation is not proof of online application. `editorial-prepare.mjs` refuses to replay reviewed rows; use live checkpoint to recover partial application. Browser QA is unverified because the earlier managed preview infrastructure failed; do not retry without recovery evidence.

## Batch 002 applied and verified online, 2026-10-23

All four production operations succeeded: two 20-record guarded updates; creation of the Game Artbook parent with fifteen links; one same-product merge. Full post-application export passed `verify-v14-data.mjs` and `editorial-audit.mjs`. Exactly the forty reviewed originals changed, one new parent was added, and all 43,528 other original records were unchanged. Personal/manual fields and original offer identities survived. Active 35,020; archive 8,549; relations 1,835. Doujin count remains 19,209. Existing 24 collection directories and 29 bonuses for each Samurai Remnant base are intact.

New parent: `family-c3655149adbbc165530e342b2c49336d`, twelve active child listings spanning seven Game Artbook volumes. Public live metadata, source/cover checks and audit counts are saved alongside this file. The owner-only maintenance window is closed at final deployment. Continue with ordinals 81 onward, preserving all fourteen partial records as unresolved. Do not claim that all 15,811 were reviewed. The next ten queue entries are the Enterbrain Fate/stay night anthology volumes; the parent now has an ISBN-matched first-volume reference cover, but the children still need individual review and cover matching.

## Grouped workflow checkpoint

The user replaced fixed 40-item research batches with WORKFLOW.md. workflow/items.jsonl accounts for all 15,811 ordinals; these are program checks, not new completed reviews. Current verified/partial/archive counts remain 65/14/1; next unstarted ordinal 81. Grouping candidates cover 5360 members in 470 groups. Sources deduplicate 24182 references into 18180 URLs, preserving variants. Read workflow/summary.json and the bounded next-packet.json first. Cache data and source receipts are persistent only once the source helper commits and pushes them; synchronize at each recoverable stage. Do not reprocess batches 001–002.

Full projection validation passed: 227,551,131 bytes -> 44,961,161 bytes (80% less transfer); all 15,811 fingerprints/groups/statuses retained. Pilot source receipts: 67 pages, {'blocked': 15, 'fetched': 51, 'needs-reading': 1}. Repeating the same capture fetched zero pages; receipts and failure reasons are cached. No product facts or editorial completion counts were changed this turn. Source statuses are capture results only. Source pipeline tests and TypeScript checks passed; see workflow/validation.json.

## Batches 003–004 applied and verified, 2026-10-25

15 guarded requests updated 273 records. Live readback exactly matched every prepared record. Personal fields, offers, all 1,835 relations, active/archive counts preserved. 28 categories changed; 44 main image URLs changed, including 3 formerly blank covers. This is not completion of the whole catalogue.

- Batch 003: 102 updated, 80 verified and 22 missing-cover partials. Complete material directory corrected from comics to reference books. GOD EATER books removed from the Fate classification.
- Batch 004: 171 updated, 165 verified and 6 partials. Five original Prototype novels (#486–490) still share the wrong mixed manga directory; classify their own facts as novels but do not claim their hierarchy is complete. #580 UBW manga 9 is announced for 2026-11-27; publisher cover currently 404.
- Cover gaps: #81–90, #133/#137/#138, #434–442. KADOKAWA main and alternate links returned 404, OpenBD lacked covers. Additional retailer search is needed. The first anthology volume may reuse the previously verified parent #80 cover after matching provenance.
- Never merge original novels, later paperbacks and manga adaptations by title alone; their ISBNs and artwork differ. #485 is a mixed directory; #484 is original novels, #501 paperbacks. Reparent only with integrity validation.
- Existing source cache now has 321 receipts. Reuse them. Publisher profiles are research candidates only; live statuses/fingerprints determine work remaining.
- Exact item-level public decisions and image receipts: batch-003/ and batch-004/. Combined live verification: batch-004/live-validation.json.

Resume at #91 plus unresolved items using current workflow/summary.json and packet. All 15,811 IDs remain accounted for, and none of the unfinished records have been silently removed.

## Identity implementation audit (read-only)

The implementation branch completed a fixed-ordinal audit of all 15,811 slots and validated a five-edge Prototype reparenting plan in the complete isolated snapshot. No production curation, new verification, batch replay or Sites publish occurred. Continue at #91 with 42 partials; do not replay batches 001–004. See ../../docs/IDENTITY-HANDOFF.md and the machine-readable report/plan in ../../docs/reports/identity-20261026/. Suggestions and grouping remain separate from source verification.

## PR #2 acceptance checkpoint — 2026-10-27 UTC

Three API/ingest regressions reproduced at 760a508 and fixed on feat/explainable-identity; see ../../docs/IDENTITY-HANDOFF.md and acceptance-20261027 reports. Production remains untouched; batches 001–004 must not be replayed. Fresh native DB rows were truncated, so current production versions are unavailable. Last reliable checkpoint remains #91, 310 verified / 42 partial / 1 archived. Business prepared/applied/newly verified: 0 at this code checkpoint. Continue the complete Enterbrain anthology group #81–91 using prior sources and #80's verified image receipt, then Prototype #484/#486–490. Full copy remains work/identity/full-copy.sqlite; no repeat import or audit. Usage quota and reset time are not exposed.

## Batch 005 prepared and applied in isolated copy — 2026-10-27 UTC

Current branch feat/explainable-identity, code checkpoint a541f10 pushed. This commit saves 29 prepared decisions: #80–93, #484–490, #493–500. Full IDs and differences: batch-005/diffs.json. Production applied 0; isolatedApplied 29; isolated verified 14 / partial 15; production progress is not advanced. Six previous partials can resolve after approved application; nine anthology covers remain unresolved. All 47,433 offers/history, 8,549 archives, personal/manual fields, original descriptions and 15,811 ordinals preserved; 43,540 untouched records byte-identical. Five Prototype logical edges moved, stale plans and undo-after-edit rejected, exact rollback passed. See batch-005/README.md, validation.json, source-cache-reuse.json and network-crosschecks.json.

Private files work/editorial-005/: targets.json, actions.json, rollback-items.json, review.sqlite (applied local copy). No production receipts for 005; never replay 001–004. Fresh production projection and target versions still unavailable because native table JSON is truncated. Do not send snapshot actions. Next: Sites release preparation/local preview, then #509–511 Requiem or #94 Apocrypha. Run `cat research/editorial-20261021/batch-005/validation.json` first. Quota/reset invisible.

## Batch006 and atomic relation API checkpoint

#509–511 (Fate/Requiem directory and both published volumes) prepared/applied in the isolated copy; three remain partial for image correspondence. Combined005+006: prepared32, isolatedApplied32, productionApplied0, isolated verified14/partial18, preserved43537 unrelated records. Full before/after: batch-005/FULL-CHANGES.md and batch-006/FULL-CHANGES.md. Batch005 final validation now uses the actual guarded curation relation-revision API for all five moves. For production, stage #484–490 field edits and five moves in one request with fresh endpoint/graph versions; do not replay intermediate rehearsal operations. Current full local copy work/editorial-005/review.sqlite; latest combined hash batch-006/validation.json. No production authorization/receipts. Never replay001–004. Next: release preparation and local HTTP preview; then #94 Apocrypha after fresh target access. Quota/reset not exposed.

## Release preparation complete; no production application

Code/data checkpoint3fa5d8c pushed; this documentation commit adds release/preview receipts. Fixed GitHub3fa5d8c→prepared local Sites7a95d3bb, build passed, no saved version or deployment; live remains64/6357bd5. Authenticated local preview read all32 Items successfully; browser visual QA unavailable. See ../../docs/SITES-RELEASE.md. Current combined32-item application lives only in work/editorial-005/review.sqlite, final hash in batch-006/validation.json. Prepared32 / isolatedApplied32 / productionApplied0 / isolated verified14 / partial18. Full IDs/sources/diffs in both batches. Await concrete32-item/five-edge production approval and fresh complete targets; relation writes also require independently authorized deployment of the supporting API. No replay001–004. Next command: `cat research/editorial-20261021/batch-006/validation.json`; next research group#94 Apocrypha. Usage quota/reset invisible.

## Issue #3 stages 1–2 — 2026-10-27 14:29 UTC

Follow ../../docs/NEXT_TASK.md. Relation/prefs regressions fixed; 8/8 new API cases passed. Seven real Prototype endpoints (#484–490) and five moves applied in one request in the complete disposable snapshot; dismissal races, stale versions, replay and guarded rollback verified. No production writes or new business verification: prepared32 / isolatedApplied32 / productionApplied0 / verifiedDelta0 / partial18. Browser QA now uses installed Chromium; publication remains gated on its result. Reports ../../docs/reports/issue-3/. Never replay001–004 or use historical local actions against production. Quota/reset unavailable. Next command: `cat docs/reports/issue-3/browser-qa.json`.

## Issue #3 stage 3 — 2026-10-27 14:35 UTC

Real Chromium QA now passed all five required flows, including stale edit 409/reload, review resolution retaining observations, and mobile390/320. Fixed the observed UI/API issues; fresh type/build checks passed. Code stage1–2 pushed as02a10c7; next head via git log. Native Sites head remains6357bd5/version64/custom. Follow NEXT_TASK for conditionally authorized merge/publication, then fetch fresh fixed32 targets; no new production application or verifiedDelta yet. Image rendering was network-limited locally; locate historical receipts before assigning verified. Quota/reset unavailable.

## Prototype BOX risk group — 2026-10-28 00:32 UTC

Read issue-3-prototype-box/README.md and plan.json. Exact evidence separates ordinary2Y1040, boxed2Y1252 and novel-campaign box608516830; CD box excluded. Full-copy guarded SQL simulation moved one preserved Offer, added2 planned Items/6 edges, retained47,433 Offers/history and all personal/archive/ordinal data; concurrent edits and stale rollback rejected, exact rollback passed. prepared3/isolatedApplied3/production0/verifiedDelta0/partial3, one overlaps fixed32. Not production-approved or API-ready. Private records work/issue-3/prototype-box-v2/. Next independent group#94 and five inferred novel members; resolve#107 source edition before assigning ISBNs. Site65 remains live; production fixed32 blocked by network config. Quota/resetunknown.
