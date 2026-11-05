// Use a separate evidence pack, plan, and receipts for each collection round.
export const historical = process.argv.includes('--historical-events');
export const publicRoot = 'research/series-evidence-20261103';
export const privateRoot = 'work/series-evidence-20261103';
export const fourSeries = process.argv.includes('--four-series');
export const nov4 = process.argv.includes('--nov4');
export const nov4Books = process.argv.includes('--nov4-books');
const bookRefresh = process.argv.includes('--nov4-book-refresh');
export const tenyearAj = process.argv.includes('--tenyear-aj');
export const kyomaf = process.argv.includes('--kyomaf');
export const nov5Events = process.argv.includes('--nov5-events');
if ([historical,fourSeries,nov4,nov4Books,bookRefresh,tenyearAj,kyomaf,nov5Events].filter(Boolean).length>1) throw Error('Choose a single evidence round');
const suffix = fourSeries ? '/four-series' : historical ? '/historical-events' : '';
const novemberRound = nov5Events ? 'series-evidence-20261105/kyomaf-aj' : kyomaf ? 'series-evidence-20261104/kyomaf' : tenyearAj ? 'series-evidence-20261104/tenyear-aj' : bookRefresh ? 'series-evidence-20261104/books/refresh' : nov4Books ? 'series-evidence-20261104/books' : nov4 ? 'series-evidence-20261104' : null;
export const output = novemberRound ? 'research/' + novemberRound : publicRoot + suffix;
export const work = novemberRound ? 'work/' + novemberRound : privateRoot + suffix;
