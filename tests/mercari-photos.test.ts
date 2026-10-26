import assert from 'node:assert/strict';
import {parseHtml} from '../lib/radar/collector';
const url='https://jp.mercari.com/search?keyword=Fate',title='FGO コレクションカード';
const tile='<a href="/item/m123"><img alt="'+title+'のサムネイル"><p data-testid="thumbnail-item-name">'+title+'</p><span data-testid="item-tile-price">500</span></a>';
const good='https://static.mercdn.net/item/detail/webp/photos/m123_1.jpg',row={id:'m123',name:title,photos:[{uri:good},{uri:'https://evil.example/a.jpg'}],thumbnails:[]};
function html(payload:any){const line='6:'+JSON.stringify(payload)+'\n',a=line.slice(0,80),b=line.slice(80);return tile+[a,b].map(s=>'<script>self.__next_f.push('+JSON.stringify([1,s])+')</script>').join('');}
function search(items:any[]){return {children:{fallback:{'@"/v2/entities:search",query':{meta:{nextPageToken:'v1:1'},items}}}};}
const parsed=parseHtml(html(search([row])),url).products;assert.equal(parsed.length,1);assert.equal(parsed[0].image,good);assert.deepEqual(parsed[0].images,[good]);
assert.equal(parseHtml(html(search([{...row,name:'另一商品'}])),url).products[0].image,'');
assert.equal(parseHtml(html(search([{...row,id:'m999'}])),url).products[0].image,'');
assert.equal(parseHtml(html({recommendations:{meta:{},items:[row]}}),url).products[0].image,'');
assert.equal(parseHtml(tile+'<script>self.__next_f.push(notJSON)</script>',url).products.length,1);
console.log('Mercari photos: split SSR payload, exact listing match, image hosts, recommendations and malformed input passed');
