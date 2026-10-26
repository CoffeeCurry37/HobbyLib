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
