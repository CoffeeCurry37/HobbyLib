import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const pub = 'research/series-evidence-20261103/four-series';
export const priv = 'work/series-evidence-20261103/four-series';
export const parent = 'work/series-evidence-20261103';
export const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
export const write = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
export const hash = input => createHash('sha256').update(input).digest('hex');
export const sources = read('research/series-evidence-20261103/next-official-sources.json').sources.slice(0,4);
export const targetRows = () => read(parent + '/targets-projection.json');
export function cached(url) {
  const name = parent + '/cache/' + hash(url);
  const meta = read(name + '.json');
  assert.equal(meta.status, 'captured', url);
  const body = fs.readFileSync(name + '.html', 'utf8');
  assert.equal(hash(body), meta.sha256);
  return {body, source:{url, at:meta.at, sha256:meta.sha256}};
}
export function clean(s) {
  return String(s || '').replace(/&(?:amp|quot|apos|nbsp|lt|gt|ldquo|rdquo);|&#(?:\d+|x[\da-f]+);/gi, m => {
    if (m.startsWith('&#')) return String.fromCodePoint(m[2].toLowerCase()==='x'?parseInt(m.slice(3,-1),16):Number(m.slice(2,-1)));
    return ({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' ','&lt;':'<','&gt;':'>','&ldquo;':'“','&rdquo;':'”'})[m] || m;
  }).trim();
}
fs.mkdirSync(pub,{recursive:true});
fs.mkdirSync(priv,{recursive:true});
