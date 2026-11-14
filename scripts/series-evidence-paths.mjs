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
export const aj26Ky22 = process.argv.includes('--aj26-ky22');
export const nov14KeythCcc = process.argv.includes('--nov14-keyth-ccc');
export const nov14MeltyCapsule = process.argv.includes('--nov14-melty-capsule');
export const nov13StrangefakeMirror = process.argv.includes('--nov13-strangefake-mirror');
export const nov13TsukihimeStrangefake = process.argv.includes('--nov13-tsukihime-strangefake');
export const nov13LinkSamurai = process.argv.includes('--nov13-link-samurai');
export const nov13AuroraEF = process.argv.includes('--nov13-aurora-ef');
export const nov12GlitterfMochi16 = process.argv.includes('--nov12-glitterf-mochi16');
export const nov12Tsuikore45 = process.argv.includes('--nov12-tsuikore45');
export const nov12ElmelloiGlitter = process.argv.includes('--nov12-elmelloi-glitter');
export const nov12EmiyaChara22 = process.argv.includes('--nov12-emiya-chara22');
export const nov12FoxtailBadges = process.argv.includes('--nov12-foxtail-badges');
export const nov11ClimaxKengou = process.argv.includes('--nov11-climax-kengou');
export const nov11Pikuriru = process.argv.includes('--nov11-pikuriru');
export const nov10ExtellaWafer3 = process.argv.includes('--nov10-extella-wafer3');
export const nov10Wafers = process.argv.includes('--nov10-wafers');
export const nov5BooksMedia = process.argv.includes('--nov5-books-media');
export const nov5Cards = process.argv.includes('--nov5-cards');
if ([historical,fourSeries,nov4,nov4Books,bookRefresh,tenyearAj,kyomaf,nov5Events,aj26Ky22,nov5Cards,nov5BooksMedia,nov10Wafers,nov10ExtellaWafer3,nov11Pikuriru,nov11ClimaxKengou,nov12FoxtailBadges,nov12EmiyaChara22,nov12ElmelloiGlitter,nov12Tsuikore45,nov12GlitterfMochi16,nov13AuroraEF,nov13LinkSamurai,nov13TsukihimeStrangefake,nov13StrangefakeMirror,nov14MeltyCapsule,nov14KeythCcc].filter(Boolean).length>1) throw Error('Choose a single evidence round');
const suffix = fourSeries ? '/four-series' : historical ? '/historical-events' : '';
const novemberRound = nov14KeythCcc ? 'series-evidence-20261114/keyth-ccc' : nov14MeltyCapsule ? 'series-evidence-20261114/melty-capsule' : nov13StrangefakeMirror ? 'series-evidence-20261113/strangefake-mirror' : nov13TsukihimeStrangefake ? 'series-evidence-20261113/tsukihime-strangefake' : nov13LinkSamurai ? 'series-evidence-20261113/link-samurai' : nov13AuroraEF ? 'series-evidence-20261113/aurora-ef' : nov12GlitterfMochi16 ? 'series-evidence-20261112/glitterf-mochi16' : nov12Tsuikore45 ? 'series-evidence-20261112/tsuikore45' : nov12ElmelloiGlitter ? 'series-evidence-20261112/elmelloi-glitter' : nov12EmiyaChara22 ? 'series-evidence-20261112/emiya-chara22' : nov12FoxtailBadges ? 'series-evidence-20261112/foxtail-badges' : nov11ClimaxKengou ? 'series-evidence-20261111/climax-kengou' : nov11Pikuriru ? 'series-evidence-20261111/pikuriru' : nov10ExtellaWafer3 ? 'series-evidence-20261110/extella-wafer3' : nov10Wafers ? 'series-evidence-20261110/wafers' : nov5BooksMedia ? 'series-evidence-20261105/books-media' : nov5Cards ? 'series-evidence-20261105/cards' : aj26Ky22 ? 'series-evidence-20261105/aj26-ky22' : nov5Events ? 'series-evidence-20261105/kyomaf-aj' : kyomaf ? 'series-evidence-20261104/kyomaf' : tenyearAj ? 'series-evidence-20261104/tenyear-aj' : bookRefresh ? 'series-evidence-20261104/books/refresh' : nov4Books ? 'series-evidence-20261104/books' : nov4 ? 'series-evidence-20261104' : null;
export const output = novemberRound ? 'research/' + novemberRound : publicRoot + suffix;
export const work = novemberRound ? 'work/' + novemberRound : privateRoot + suffix;


