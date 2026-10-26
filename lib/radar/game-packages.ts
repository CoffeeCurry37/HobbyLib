import type {Item} from './types';
export function gamePackage(item:Item){
 const t=item.title.normalize('NFKC');
 if(!/Fate\s*\/\s*EXTELLA\s+(?:REGALIA|VELBER)\s*BOX/i.test(t)||/(?:REGALIA|VELBER)\s*BOX.*(?:収納(?:BOX|ボックス)|material|マウスパッド|プロダクトコード)/i.test(t))return null;
 const velber=/VELBER/i.test(t),vita=/Vita|PSV/i.test(t),ps4=/PS4|PlayStation.?4/i.test(t),platform=velber?'both':vita?'vita':ps4?'ps4':'unknown';
 const url='https://www.marv.jp/titles/cs/'+(velber?'715':vita?'712':'711')+'/';
 const names=[{title:`Fate/EXTELLA ${velber?'VELBER':'REGALIA'} BOX ワダアルコ描き下ろし収納ボックス`,category:'グッズ'},{title:'Fate/EXTELLA material',category:'書籍'}];
 if(velber)names.push({title:'Fate/EXTELLA セイバーブライド マウスパッド (VELBER BOX同梱)',category:'グッズ'});
 if(['both','ps4'].includes(platform))names.push({title:'Fate/EXTELLA PlayStation 4 ゲームソフト',category:'ゲーム'},{title:'Fate/EXTELLA ネロ・クラウディウス「束縛の花嫁衣装」プロダクトコード',category:'デジタル特典'});
 if(['both','vita'].includes(platform))names.push({title:'Fate/EXTELLA PlayStation Vita ゲームソフト',category:'ゲーム'},{title:'Fate/EXTELLA ギルガメッシュ衣装プロダクトコード',category:'デジタル特典'});
 return {url,names,platform,description:velber?'官方确认包含双平台游戏、设定集、绘制收纳盒、鼠标垫和两种服装代码。':platform==='unknown'?'REGALIA BOX 有 PS4 与 PSVita 两版；平台尚未确认，先连接共有的设定集和收纳盒。服装代码及游戏需按平台核对。':'官方限定版内容，游戏及代码按对应平台记录。'};
}
