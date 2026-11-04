import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const pub = 'research/series-evidence-20261103';
const priv = 'work/series-evidence-20261103';
const branch = 'historical-events';
const sources = JSON.parse(fs.readFileSync(pub + '/' + branch + '/catalogue-plan.json'));
const groups = JSON.parse(fs.readFileSync(pub + '/queue-index.json')).groups;
const hash = input => createHash('sha256').update(input).digest('hex');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const catalogues = [];
const entries = [];
for (const source of sources) {
  const group = groups.find(g => g.id === source.groupId);
  assert.ok(group);
  const file = priv + '/cache/' + hash(source.url);
  const html = fs.readFileSync(file + '.html', 'utf8');
  const meta = JSON.parse(fs.readFileSync(file + '.json'));
  assert.equal(meta.status, 'captured');
  assert.equal(hash(html), meta.sha256);
  const expected = Number(html.match(/(\d+)\s*件の結果/)?.[1]);
  const titles = [...html.matchAll(/<article id="product_tile"[\s\S]*?<\/article>/g)];
  assert.ok(expected > 0);
  assert.equal(titles.length, expected, 'Retrieve all catalogue pages: ' + source.url);
  const unique = new Set();
  for (const [tile] of titles) {
    const path = tile.match(/href="([^"]+\.html)"/)?.[1];
    const heading = tile.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    assert.ok(path && heading);
    const url = new URL(decode(path), source.url);
    assert.equal(url.origin, 'https://online.aniplex.co.jp');
    const sku = url.pathname.split('/').at(-1).replace(/\.html$/, '');
    assert.match(sku, /^item[A-Za-z0-9]+$/);
    assert.ok(!unique.has(url.href));
    unique.add(url.href);
    entries.push({groupId: group.id, event: group.label, url: url.href, sku,
      title: decode(heading.replace(/<[^>]*>/g, '').trim()), catalogueUrl: source.url,
      sourceSha256: meta.sha256});
  }
  catalogues.push({...source, event: group.label, expected, extracted: unique.size,
    localCoverage: group.activeSnapshotCount, sha256: meta.sha256, at: meta.at,
    completeCurrentRetailCatalogue: true, completeEventUniverse: false});
}
const publicPath = pub + '/' + branch + '/';
const write = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
write(publicPath + 'official-catalogues.json', {catalogues, entries});
write(publicPath + 'catalogue-summary.json', {catalogues});
const urls = [...new Map(entries.map(e => [e.url, {url: e.url, groupId: e.groupId}])).values()];
assert.ok(urls.length <= 350);
write(priv + '/' + branch + '/detail-plan.json', urls);
console.log(JSON.stringify({catalogues: catalogues.map(c => [c.scope, c.extracted]),
  distinctDetails: urls.length, totalMemberships: entries.length}));
