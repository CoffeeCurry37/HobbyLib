import {nonTypeMoonWork} from './catalogue-policy.mjs';
// An ordinary English word in an unrelated card/song is not a franchise identity.
export const FATE_TITLE_RE=/\bFate\s*(?:[/／:：]|(?:stay\s*night|Grand\s*Order|EXTRA|EXTELLA|Zero|Apocrypha|Prototype|strange\s*Fake|kaleid|hollow|Requiem|Samurai|tiger\s*colosseum|コスプレ|Fantasm|Compilation|シリーズ|フェイト|(?:\d{1,2}(?:th|周年)?\s*)?anniversary))|\bFGO\b|フェイト/i;
export function fateRelated(title:string){if(nonTypeMoonWork(title))return false;return FATE_TITLE_RE.test(title.normalize('NFKC'))||/[<【「『]Fate[>】」』]/i.test(title)||/meets Fate.*(?:セイバー|凛)/i.test(title)||/^Fate\s*(?:$|[「『(]|[\u3000-\u9fff])/i.test(title.normalize('NFKC'));}
