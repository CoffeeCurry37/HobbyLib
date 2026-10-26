import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadRadar} from './load-radar.mjs';
const r=loadRadar(), identity=r.get('identity'), {EMPTY_FACTS}=r.get('types');
const offer=(url='https://order.mandarake.co.jp/order/detailPage/item?itemCode=123',extra={})=>({id:url,source:'Mandarake',url,price:1000,currency:'JPY',condition:'中古',availability:'available',bonus:'unknown',observedAt:'2026-10-26T00:00:00.000Z',history:[],...extra});
const item=(id,extra={})=>({...EMPTY_FACTS,id,title:'Synthetic Chronicle 1',description:'',image:'',brand:'',series:'Synthetic Chronicle',year:'',category:'小説',kind:'base',tags:[],isbn:'',msrp:null,ownership:'unknown',quantity:0,priority:50,rating:null,review:true,bucket:'normal',notes:'',evidence:[],offers:[],createdAt:'2026-10-01T00:00:00.000Z',...extra});
test('same listing never bypasses known medium, platform or component conflicts',()=>{
 for(const [a,b] of [[{category:'小説'},{category:'コミック'}],[{category:'ゲームソフト',title:'Synthetic Adventure Nintendo Switch'},{category:'ゲームソフト',title:'Synthetic Adventure PS4'}],[{kind:'base'},{kind:'bonus',title:'Synthetic Chronicle 特典単品'}]]){
  const old=item('old',{...a,offers:[offer()]}),next=item('next',{...b,offers:[offer()]});
  assert.equal(identity.findProduct([old],next),null);
 }
});
test('same listing does not collapse volumes',()=>assert.equal(identity.findProduct([item('old',{title:'Synthetic Chronicle 1巻',wave:'1',productLine:'Synthetic Chronicle',offers:[offer()]})],item('next',{title:'Synthetic Chronicle 2巻',wave:'2',productLine:'Synthetic Chronicle',offers:[offer()]})),null));
test('missing or empty source identifiers are not shared keys',()=>{
 for(const url of ['https://order.mandarake.co.jp/order/detailPage/item','https://order.mandarake.co.jp/order/detailPage/item?itemCode=','not a URL'])assert.equal(identity.listingKey(url),'');
});
test('index replacement removes previous keys, including when archived',()=>{
 const old=item('old'),index=identity.productIndex([old]);
 index.add({...old,title:'Entirely Different Product'});
 assert.equal(index.lookup(item('query')).length,0);
 index.add({...old,title:'Entirely Different Product',archivedInto:'target'});
 assert.equal(index.lookup(item('query',{title:'Entirely Different Product'})).length,0);
});
test('multiple items on the same listing require review',()=>{
 const a=item('a',{offers:[offer()]}),b=item('b',{offers:[offer()]});
 assert.equal(identity.findProduct([a,b],item('next',{offers:[offer()]})),null);
});
