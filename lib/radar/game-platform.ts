import type {Item} from './types';
import {sourceCategory} from './source-category';

// Read the actual software department or primary title, never related-product text.
export function gamePlatforms(item:Pick<Item,'title'|'category'>&Partial<Pick<Item,'evidence'|'tags'|'locked'>>){
 const s=(item.title+' '+sourceCategory(item).value).normalize('NFKC');
 const platforms:[RegExp,string][]=[[/PS\s*Vita|PlayStation\s*Vita/i,'PSVita'],[/\bPSP\b|PlayStation Portable/i,'PSP'],[/\bPS5\b|PlayStation\s*5/i,'PS5'],[/\bPS4\b|PlayStation\s*4/i,'PS4'],[/\bPS3\b|PlayStation\s*3/i,'PS3'],[/\bPS2\b|PlayStation\s*2/i,'PS2'],[/Nintendo\s*Switch\s*2|ニンテンドースイッチ2/i,'Switch 2'],[/Nintendo\s*Switch(?!\s*2)|ニンテンドースイッチ(?!2)|\bSwitch(?!\s*2)/i,'Switch'],[/3DS/i,'3DS'],[/ニンテンドーDS(?!Lite)|Nintendo\s*DS(?!Lite)|\bDS\b/i,'DS'],[/DVD-ROM|PCゲーム|パソコン(?:ゲーム|ソフト)|\bPC\b/i,'PC'],[/ドリームキャスト|Dreamcast/i,'Dreamcast']];
 return [...new Set(platforms.filter(([re])=>re.test(s)).map(([,name])=>name))];
}
