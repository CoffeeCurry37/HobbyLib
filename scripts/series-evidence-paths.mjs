// Use a separate evidence pack, plan, and receipts for each collection round.
export const historical = process.argv.includes('--historical-events');
export const publicRoot = 'research/series-evidence-20261103';
export const privateRoot = 'work/series-evidence-20261103';
export const fourSeries = process.argv.includes('--four-series');
if (historical && fourSeries) throw Error('Choose a single evidence round');
const suffix = fourSeries ? '/four-series' : historical ? '/historical-events' : '';
export const output = publicRoot + suffix;
export const work = privateRoot + suffix;
