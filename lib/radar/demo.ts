import {createItem} from './engine';
import {DEFAULT_PREFS,Item,Relation} from './types';
export function demoData(){
 const titles=['演示 · 月姫 設定資料集 本体','演示 · 月姫 設定資料集 店舗特典のみ','演示 · Fate トレーディングフィギュア 全3種セット','演示 · セイバー 単品','演示 · 遠坂凛 単品','演示 · 間桐桜 単品','演示 · 未分類 小物'];
 const items:Item[]=titles.map((title,i)=>{const x=createItem(title,'仅用于测试操作的虚构记录；不是实际商品、报价或拥有记录。',undefined,DEFAULT_PREFS);x.id='demo-'+i;x.demo=true;x.review=false;return x;});
 items[0].kind='base';items[0].ownership='owned';items[0].quantity=1;items[0].series='月姫';items[0].tags=['TYPE-MOON','月姫','設定資料集'];
 items[1].ownership='missing';items[1].kind='bonus';items[1].priority=80;items[1].tags=['TYPE-MOON','月姫','特典'];
 items[2].kind='set';items[2].priority=65;items[2].tags=['Fate','フィギュア'];
 for(const i of [3,4,5]){items[i].kind='component';items[i].tags=['Fate','フィギュア'];items[i].ownership=i===3?'owned':'missing';items[i].quantity=i===3?1:0;}
 items[6].bucket='junk';items[6].review=true;
 const relations:Relation[]=[{id:'demo-r0',fromId:items[0].id,toId:items[1].id,kind:'bonus',quantity:1},...[3,4,5].map(i=>({id:'demo-r'+i,fromId:items[2].id,toId:items[i].id,kind:'contains' as const,quantity:1}))];
 return{items,relations};
}
