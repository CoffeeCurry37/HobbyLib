import fs from 'node:fs';
import assert from 'node:assert/strict';
const priv = 'work/series-evidence-20261103';
const pub = 'research/series-evidence-20261103';
const wave = pub + '/historical-events';
const read = path => JSON.parse(fs.readFileSync(path));
const write = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const groups = read(pub + '/queue-index.json').groups;
const byId = new Map(read(priv + '/targets-projection.json').map(t => [t.id, t]));
const catalogues = read(wave + '/official-catalogues.json');
const catalogueEntries = Map.groupBy(catalogues.entries, e => e.url);
const urlsByScope = new Map(catalogues.catalogues.map(c => [c.url, c.scope]));
const unresolved = read(wave + '/unresolved.json').items;
const exceptions = read(wave + '/outside-catalogue.json').exceptions;
const exceptionMap = new Map(exceptions.map(e => [e.url, e]));
const details = new Map(fs.readdirSync(wave + '/details').map(file => {
 const d = read(wave + '/details/' + file);
 return [d.url, d];
}));
const issues = unresolved.map(issue => {
 const target = byId.get(issue.itemId);
 const observations = (target.officialObservations || []).map(o => {
  const detail = details.get(o.url);
  const variant = detail?.variants.find(v => v.variantId === o.variant);
  return {url: o.url, observedVariant: o.variant || null, officialVariant: variant?.label || null,
   officialTitle: detail?.title || exceptionMap.get(o.url)?.officialTitle || null,
   salesScopes: (catalogueEntries.get(o.url) || []).filter(e => e.groupId === issue.groupId)
    .map(e => urlsByScope.get(e.catalogueUrl)), sourceSha256: detail?.source.sha256 || exceptionMap.get(o.url)?.sourceSha256 || null};
 });
 return {...issue, observations};
});
const dualSale = issues.filter(i => i.groupId === 'series-3bafa0802d86283c' &&
 i.observations.some(o => o.salesScopes.includes('15年の軌跡 会场在售商品官方通販')) &&
 i.observations.some(o => o.salesScopes.includes('15年の軌跡 事後通販')));
const winter = issues.filter(i => i.observations.some(o =>
 exceptionMap.get(o.url)?.reason === 'official-title-identifies-winter-event-check-for-resale'));
const protectedIds = new Set(read(wave + '/identity-matches.json').matches
 .filter(m => m.status === 'protected-existing-review').map(m => m.itemId));
assert.ok(issues.every(i => !protectedIds.has(i.itemId)));
write(wave + '/casebook.json', {items: issues, dualSaleReviewItemIds: dualSale.map(i => i.itemId),
 winterEventReviewItemIds: winter.map(i => i.itemId)});
const logs = fs.readdirSync(priv + '/historical-events').filter(n => n.endsWith('.receipts.jsonl'));
const captures = logs.flatMap(n => fs.readFileSync(priv + '/historical-events/' + n, 'utf8')
 .trim().split('\n').filter(Boolean).map(JSON.parse));
write(wave + '/capture-summary.json', {receiptEntries: captures.length, uniqueUrls:new Set(captures.map(r=>r.url)).size,
 networkRequests:captures.filter(r=>!r.cacheHit).reduce((n,r)=>n+r.requestCount,0),
 cacheReuses:captures.filter(r=>r.cacheHit).length, failures:captures.filter(r=>r.status!=='captured').length,
 scope:'Local capture receipts only. Search traffic and shared first-round cache reads are not billed here.',
 paidModelApiCalls:0, totalCost:'unknown'});
const supported = read(wave + '/identity-matches.json').matches.filter(m => m.status === 'official-identity-supported');
const selected = groups.filter(g => catalogues.catalogues.some(c => c.groupId === g.id));
const breakdown = selected.map(g => ({groupId:g.id, label:g.label, selected:g.activeSnapshotCount,
 supported:supported.filter(m=>m.groupId===g.id).length, outstanding:issues.filter(i=>i.groupId===g.id).length}));
write(wave + '/group-results.json', {groups:breakdown, unresolved:issues.length,
 dualSaleCandidates:dualSale.length, dualSaleConflictingSource:dualSale.filter(i=>i.reason==='conflicting-official-source-variant-key').length,
 winterEventReview:winter.length, winterEventPages:new Set(winter.flatMap(i=>i.observations.filter(o=>exceptionMap.get(o.url)?.reason==='official-title-identifies-winter-event-check-for-resale').map(o=>o.url))).size});
console.log(JSON.stringify(read(wave + '/group-results.json')));
