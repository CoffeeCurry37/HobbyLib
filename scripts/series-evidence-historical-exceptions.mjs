import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const base = 'work/series-evidence-20261103';
const directory = 'research/series-evidence-20261103/historical-events';
const catalogues = JSON.parse(fs.readFileSync(directory + '/official-catalogues.json'));
const groups = new Map(catalogues.catalogues.map(c => [c.groupId, c.event]));
const targets = JSON.parse(fs.readFileSync(base + '/targets-projection.json'));
const pages = JSON.parse(fs.readFileSync(base + '/historical-events/outside-catalogue.json'));
const exceptions = [];
const explicitReprints = [];
for (const {groupId, url} of pages) {
  const key = createHash('sha256').update(url).digest('hex');
  const meta = JSON.parse(fs.readFileSync(base + '/cache/' + key + '.json'));
  const source = {groupId, url, event: groups.get(groupId), at: meta.at,
    itemIds: targets.filter(t => t.groupId === groupId && t.sourceUrls.includes(url)).map(t => t.id)};
  if (meta.status !== 'captured') {
    exceptions.push({...source, reason: 'unavailable-source'});
    continue;
  }
  const body = fs.readFileSync(base + '/cache/' + key + '.html');
  assert.equal(createHash('sha256').update(body).digest('hex'), meta.sha256);
  const title = body.toString('utf8').match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  assert.ok(title);
  const year = /^FGO Fes\.(\d{4})$/.exec(source.event)?.[1];
  const explicit = year && title.includes('【復刻】') && title.includes('Fes.' + year + '描き下ろし');
  const reason = explicit ? 'official-reissue-title-explicitly-identifies-artwork-year'
    : /冬祭り|冬まつり/.test(title) ? 'official-title-identifies-winter-event-check-for-resale'
    : 'not-in-reviewed-catalogues-requires-separate-event-proof';
  exceptions.push({...source, officialTitle: title, sourceSha256: meta.sha256, reason});
  if (explicit) explicitReprints.push({groupId, url, sku: new URL(url).pathname.slice(1,-5), title,
    scope: 'artwork attribution from official reissue title only', sourceSha256: meta.sha256});
}
fs.writeFileSync(directory + '/outside-catalogue.json', JSON.stringify({exceptions, explicitReprints}, null, 2) + '\n');
console.log(JSON.stringify({outsideSources: exceptions.length, explicitReprints: explicitReprints.length,
  reasons: Object.fromEntries([...Map.groupBy(exceptions, e => e.reason)].map(([k, v]) => [k, v.length]))}));
