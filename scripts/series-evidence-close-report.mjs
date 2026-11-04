import fs from 'node:fs';
import assert from 'node:assert/strict';
import {output, publicRoot, privateRoot, work, historical} from './series-evidence-paths.mjs';
const read = path => JSON.parse(fs.readFileSync(path));
const write = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const deployment = process.argv.find(s => s.startsWith('--deployment='))?.slice(13);
const revision = Number(process.argv.find(s => s.startsWith('--revision='))?.slice(11));
assert.match(deployment || '', /^appgdep_[a-z0-9]+$/);
assert.ok(Number.isInteger(revision) && revision > 0);
assert.ok(process.argv.includes('--observed-http-401'), 'Run authenticated closed-window verification first');
const report = read(output + '/production.json');
assert.ok(report.finalReadbackPassed);
const receiptsFor = directory => fs.readFileSync(directory + '/apply-receipts.jsonl', 'utf8')
  .trim().split('\n').map(JSON.parse).filter(r => r.status === 'verified');
const receipts = receiptsFor(work);
const ids = new Set(receipts.flatMap(r => r.ids));
assert.equal(ids.size, report.productionApplied);
assert.equal(new Set(receipts.map(r => r.batch)).size, receipts.length);
assert.equal(receipts.length, report.verifiedBatches);
const before = read(work + '/metadata-before.json');
const after = read(work + '/metadata-after.json');
assert.deepEqual(before.catalog.counts, after.catalog.counts);
assert.equal(before.relations.length, after.relations.length);
write(output + '/verified-batches.json', receipts.map(({batch, items, digest, afterHash, at}) =>
 ({batch, items, planDigest:digest, afterHash, at})));
Object.assign(report, {stage:'applied-read-back-and-closed', maintenanceClosed:true, closedHttpStatus:401,
 environmentRevision:revision, deploymentId:deployment, siteVersion:70, countsBefore:before.catalog.counts,
 relationsBefore:before.relations.length});
write(output + '/production.json', report);
if (historical) {
 const index = read(publicRoot + '/queue-index.json');
 const rows = [];
 const seen = new Set();
 const allMatched = new Set();
 for (const [publicDir, privateDir] of [[publicRoot,privateRoot],[output,work]]) {
  const matches = read(publicDir + '/identity-matches.json').matches;
  const pending = read(publicDir + '/unresolved.json').items;
  const applied = new Set(receiptsFor(privateDir).flatMap(r => r.ids));
  const selected = new Set([...matches,...pending].map(i => i.groupId));
  for (const id of applied) {
   assert.ok(!allMatched.has(id), 'Overlapping rounds');
   allMatched.add(id);
  }
  for (const group of index.groups.filter(g => selected.has(g.id))) {
   assert.ok(!seen.has(group.id), 'A series occurs twice');
   seen.add(group.id);
   const current = matches.filter(i => i.groupId === group.id);
   const updated = current.filter(i => applied.has(i.itemId)).length;
   const protectedCount = current.filter(i => i.status === 'protected-existing-review').length;
   const pendingCount = pending.filter(i => i.groupId === group.id).length;
   const skipped = group.activeSnapshotCount - updated - pendingCount - protectedCount;
   assert.ok(skipped >= 0);
   rows.push({groupId:group.id, label:group.label, snapshotItems:group.activeSnapshotCount,
    productionApplied:updated, pendingEvidence:pendingCount, protectedExisting:protectedCount,
    freshVersionSkips:skipped, complete:false});
  }
 }
 const sum = key => rows.reduce((n,r) => n+r[key],0);
 assert.equal(sum('productionApplied'),allMatched.size);
 write(publicRoot + '/current-progress.json',{at:new Date().toISOString(),baselineQueueGroups:index.groups.length,
  seriesWithItemReview:seen.size,seriesAwaitingItemReview:index.groups.length-seen.size,
  completeSeries:0,newFullyVerifiedProducts:0,coveredSnapshotItems:sum('snapshotItems'),
  productionApplied:allMatched.size,protectedExisting:sum('protectedExisting'),pendingEvidence:sum('pendingEvidence'),
  freshVersionSkips:sum('freshVersionSkips'),lastLiveCounts:report.counts,liveRelations:report.relations,
  maintenanceClosed:true,rows,nextSourceFile:'next-official-sources.json'});
}
console.log(JSON.stringify({applied:report.productionApplied, batches:report.verifiedBatches, closed:report.maintenanceClosed}));
