// Use a separate evidence pack, plan, and receipts for each collection round.
export const historical = process.argv.includes('--historical-events');
export const publicRoot = 'research/series-evidence-20261103';
export const privateRoot = 'work/series-evidence-20261103';
export const fourSeries = process.argv.includes('--four-series');
export const nov4 = process.argv.includes('--nov4');
if ([historical,fourSeries,nov4].filter(Boolean).length>1) throw Error('Choose a single evidence round');
const suffix = fourSeries ? '/four-series' : historical ? '/historical-events' : '';
export const output = nov4 ? 'research/series-evidence-20261104' : publicRoot + suffix;
export const work = nov4 ? 'work/series-evidence-20261104' : privateRoot + suffix;
