// Only explicitly equivalent anniversary labels are folded. Regional and named exhibitions stay separate.
export function canonicalEvent(raw:string){
 const value=raw.normalize('NFKC').trim().replace(/\s+/g,' ');
 if(/OVER THE SAME SKY|简体|繁體|中国|中国語|Korea|USA|星見|Chronicle/i.test(value))return value;
 const fes=value.match(/^(?:Fate\s*\/\s*Grand\s*Order|FGO)\s*Fes\.?\s*(20\d{2})(?:\s*\([^)]*\))?$/i);
 const anniversary=value.match(/^(?:Fate\s*\/\s*Grand\s*Order|FGO)\s*(\d{1,2})(?:st|nd|rd|th)?\s*Anniversary(?:\s*\([^)]*\))?$/i);
 const year=fes?Number(fes[1]):anniversary?2015+Number(anniversary[1]):0;
 if(year>=2017&&year<=2026&&year!==2020)return `Fate/Grand Order Fes. ${year} (${year-2015}周年)`;
 if(year===2020)return 'Fate/Grand Order 5th Anniversary (2020)';
 if(year===2016)return 'Fate/Grand Order 1st Anniversary (2016)';
 return value;
}
export const catalogueLabel=(name:string)=>canonicalEvent(name).replace(/^华夫饼卡片$/,'威化卡片');
