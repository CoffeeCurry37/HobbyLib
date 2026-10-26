# Collector Radar v0.12.0

Private collector catalogue and purchase-priority inbox. No automatic ordering.

The Sites app and independent Node 24 / SQLite runtime share parsing, identity, inventory, metadata and relationships. Products and marketplace offers are separate: shop, condition, bonus inclusion, current bid and observed price history belong to the offer. Base, bonus, component and set ownership remain independent.

Earlier versions repaired numbered product identity, removes demo records, adds numeric/manual sorting, infers explicit set members, displays partial ownership and compares freshly verified missing-member versus bundle prices. Permanent completed editions/original bundles and stocked seller lots have distinct catalogue behavior. TYPE-MOON now contains parallel Fate/FGO/other work boards, with figure manufacturers and collectible card lines below them. Sold/no-price records remain catalogued for restock tracking. Only recent verified available offers can trigger inbox notices. Captcha/login/age gates pause automated sources; saved search observations never masquerade as fresh live checks.

v0.10.0 groups event merchandise by canonical activity, distinguishes video bundles, game editions, complete merchandise sets and random selections, extracts frequent searchable title tags, and unifies Fate/FGO figures under Fate 综合 → 手办. Doujin is R18 only when explicit product evidence or a manual edit says so. Main catalogue pages use an indexed scope and projected SQL, bounded to 600 rows / 1.5 MB, with doujin and merge archives loaded on demand. Optional helper modules are initially closed and can be enabled in settings. Full titles, source variants, user edits and ownership remain stored.

v0.11.0 rechecks every active record against actual source classification, guards Ichiban Kuji identity by campaign/award/variant rather than shared JANs, and merges repeated sales-channel titles while preserving raw offers and recoverable archives. Five verified campaigns have 44 award catalogues. Known members use original prize-pack units; unknown variants remain visible empty slots. Gallery images distinguish actual products, complete award sets and award references. A checked Yahoo lot is linked to the three pictured variants; other photographs require review and do not imply a complete set. Lazy source images have an authenticated, restricted-host fallback.

The bounded update revisits all 1,226 retained Aniplex product pages and 5,909 variant observations, reparses previously captured AmiAmi breadcrumbs, fetches all 216 listings in the available-item entrance, and continues Surugaya Ichiban Kuji, Yahoo bundles and Surugaya doujin pages. Source-checked Melonbooks/Toranoana release entries retain product-level age classifications and distinguish a publication date from the shop release date. Partial catalogues, unavailable pages and remaining images stay explicitly pending. Detailed counts and continuation URLs are recorded in the import manifest and release information.

v0.12.0 gives every product one primary class and matching tag: books, games, media, merchandise, large merchandise, cards, toys or doujin. Catalogue navigation uses the same classes, consolidates Fate toys under Fate 综合 → 玩具, keeps Kuji and standalone bonuses as separate entries, and omits empty game branches. Product-local categories take precedence over genre labels: 映像ソフト and ゲーム原作系 no longer imply game software. Work identification excludes search terms and related-title navigation. Game platforms, book volumes, original editions and new editions remain separate identities.

This update adds captured KyoMAF, AnimeJapan and TYPE-MOON Comiket catalogues, Aniplex current-product details, AmiAmi historical and used details, Mercari product categories and photos, and publisher-verified physical editions. Electronic-only publisher records are excluded. Two manually checked Yahoo Kuji photographs retain their actual member links; unreviewed photos do not imply a complete set. Saved continuation queues keep historical partitions and observed verification pauses. The maintenance endpoint refuses an unpopulated catalogue owner before any import.

See `standalone/README.zh-CN.md` for usage and deployment. `VERIFICATION.md` separates tested paths from restricted or untested environments.

## Development

Use the existing pnpm lockfile. Sites source/build/deploy uses its native workflow and D1 user-scoped storage, identified by `.openai/hosting.json`.

```
node scripts/build-capture.mjs
python3 scripts/package-extension.py
node scripts/test-core.mjs
node scripts/test-runtime.mjs
node scripts/test-runtime.mjs tests/v4.test.ts
node scripts/test-workflow.mjs
NODE_OPTIONS=--max-old-space-size=96 node scripts/test-workflow.mjs fate-snapshot
pnpm exec tsc --noEmit
pnpm build:standalone
node scripts/test-standalone-http.mjs
```

Standalone: `RADAR_PASSWORD` (16+ characters), `RADAR_ORIGIN`, `RADAR_DATA_DIR`, then `pnpm start:standalone`. One process per database. Optional Playwright is installed separately by the compiled release's `setup-browser.mjs`; `RADAR_BROWSER=1` renders anonymous public pages. Visible local account sessions are separate and operated by the user. Cloud does not import Playwright.

No LLM/API key is connected. Classification uses rules; preference learning uses regularized tag weights; translation uses a glossary and preserves Japanese originals. Automated enrichment extracts explicit source fields and source-checked catalogue entries; the research action uses ISBN or a single exact matching catalogue result, with exact identity matching. Notifications remain in-app. Scheduled monitoring is standalone only; no independent production host or 24-hour soak test is implied.
