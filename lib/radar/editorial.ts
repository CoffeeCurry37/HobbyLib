import type {Item} from './types';
export const EDITORIAL_FIELDS=['title','category','majorClass','productType','origin','series','event','productLine','wave','kind','saleForm','summary','tags','characters'] as const;
export const editorialBasis=(i:Partial<Item>)=>JSON.stringify(EDITORIAL_FIELDS.map(k=>i[k]??null));
export const currentEditorial=(i:Item)=>!!i.editorial?.checks.classification&&i.editorial.basis===editorialBasis(i);
export const REVIEW_LABELS:Record<string,string>={pending:'尚未复核',partial:'待补资料',verified:'已核实',blocked:'来源受阻',stale:'资料变更，需复查',archived:'已归并，保留追踪',excluded:'核实为同人',missing:'记录缺失'};
export function editorialStatus(i:Item|undefined,campaign:string){if(!i)return 'missing';if(i.archivedInto)return 'archived';const e=i.editorial;if(!e||e.campaign!==campaign)return 'pending';if(e.basis!==editorialBasis(i)||e.imageUrl!==i.image)return 'stale';if(e.status==='verified'&&i.origin==='doujin')return 'excluded';return e.status;}
