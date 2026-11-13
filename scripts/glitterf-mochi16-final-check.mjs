import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {read} from './four-series-common.mjs';
const d='research/series-evidence-20261112/glitterf-mochi16',p=read(d+'/production.json'),r=read(d+'/resume.json'),g=read('research/series-evidence-20261103/current-progress.json');
assert.equal(p.productionApplied,23);assert.ok(p.maintenanceClosed&&p.finalReadbackPassed);assert.equal(p.environmentRevision,115);assert.equal(p.closedHttpStatus,401);assert.equal(r.preparedCommit,'239920f283c5dcf71b353192710ecbcbca03a860');assert.equal(r.fieldPendingRecords,7);assert.equal(g.seriesWithItemReview,70);assert.equal(g.productionApplied,5104);assert.equal(g.seriesAwaitingItemReview,1778);
assert.deepEqual(p.counts,{main:15790,doujin:19209,archive:8575});assert.equal(p.relations,1823);assert.equal(read(d+'/verified-batches.json').reduce((n,r)=>n+r.items,0),23);assert.ok(read(d+'/field-pending.json').items.every(r=>r.appliedSafeSummary));assert.equal(read(d+'/pending.json').length,0);
const files=['AGENTS.md','README.md','docs/NEXT_TASK.md','docs/PROGRESS.md','docs/PROJECT_MEMORY.md','research/series-evidence-20261103/README.md',d+'/README.md'];
// The local Sites checkout does not contain every historical GitHub document.
// Validate new batch links here; historical links are retained from the GitHub baseline.
for(const f of files){const s=fs.readFileSync(f,'utf8');assert.ok(s.includes('5,104'),f);assert.ok(!s.includes('68 个系列的 6,881'),f);for(const m of s.matchAll(/\]\(([^)]+)\)/g)){const url=m[1];if(/^(https?:|#|\/|mailto:)/.test(url)||url.includes(' '))continue;const local=path.resolve(path.dirname(f),url.split('#')[0]);if(local.replaceAll('\\','/').includes(d+'/'))assert.ok(fs.existsSync(local),f+' broken batch link '+url);}}
console.log(JSON.stringify({passed:true,documents:files.length,productionApplied:23,fieldPending:7,cumulativeApplied:5104,maintenanceClosed:true}));

