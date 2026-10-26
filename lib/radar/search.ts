import type {Item} from './types';
export const searchText=(item:Item)=>[item.summary,item.productType,item.event,item.title,...(item.aliases||[]),...item.tags,item.brand,item.series,item.manufacturer,item.publisher,item.productLine||'',item.wave||'',item.member||'',item.circle,...item.artists,...item.characters].join(' ').normalize('NFKC').toLowerCase();
export function matchesSearch(item:Item,query:string,document=searchText(item)){
 const terms=query.normalize('NFKC').toLowerCase().match(/"[^"]+"|[^\s]+/g)||[];
 return terms.every(term=>{const tag=term.startsWith('#')?term.slice(1):term.startsWith('tag:')?term.slice(4):'';return tag?item.tags.some(t=>t.normalize('NFKC').toLowerCase().includes(tag)):document.includes(term.replace(/^"|"$/g,''));});
}
