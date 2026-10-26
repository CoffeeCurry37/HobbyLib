const assert=require('node:assert/strict');
const {test}=require('node:test');
const engine=require(process.env.RADAR_TEST_TMP+'/engine.cjs');
const collector=require(process.env.RADAR_TEST_TMP+'/collector.cjs');
const metadata=require(process.env.RADAR_TEST_TMP+'/metadata.cjs');
const {DEFAULT_PREFS}=require(process.env.RADAR_TEST_TMP+'/types.cjs');
const prefs={junkThreshold:1000,alertThreshold:70,tagWeights:{},rules:[],glossary:{'月姫':'月姬'},language:'ja',searchUrl:'https://order.mandarake.co.jp/order/'};
const item=(title)=>engine.createItem(title,'',undefined,prefs);
test('Unknown price never becomes cheap junk',()=>{assert.equal(engine.classify('不明なもの','',null,1000).bucket,'normal');assert.equal(engine.classify('不明なもの','',500,1000).bucket,'normal');});
test('Bonus only, missing bonus, and base remain separate',()=>{assert.equal(engine.classify('月姫 読本 特典のみ').kind,'bonus');assert.equal(engine.classify('月姫 読本 特典欠').kind,'base');});
test('No year inferred from arbitrary title digits',()=>{assert.equal(engine.classify('TYPE-MOON 2024 パンフレット').year,'');assert.equal(engine.classify('本','発行日：2024年').year,'2024');});
test('Missing bonus not suppressed by owned base',()=>{const base=item('本体'),bonus=item('特典のみ');base.ownership='owned';base.quantity=1;bonus.ownership='missing';const state={items:[base,bonus],relations:[{fromId:base.id,toId:bonus.id,kind:'bonus',quantity:1}],prefs};assert.equal(engine.scoreItem(bonus,state).score,60);assert.equal(engine.scoreItem(base,state).score,0);});
test('Bundle counts partial quantity and penalizes duplicate components',()=>{const set=item('全3種セット'),a=item('a'),b=item('b');a.ownership='owned';a.quantity=1;b.ownership='missing';const state={items:[set,a,b],relations:[{fromId:set.id,toId:a.id,kind:'contains',quantity:2},{fromId:set.id,toId:b.id,kind:'contains',quantity:1}],prefs};const score=engine.scoreItem(set,state);assert.equal(score.owned,1);assert.equal(score.missing,2);assert.equal(score.unknown,0);assert.ok(score.score<60);});
test('Blacklist outranks whitelist',()=>{const i=item('月姫 本');const s={items:[i],relations:[],prefs:{...prefs,rules:[{type:'allow',keyword:'月姫',priority:100},{type:'block',keyword:'月姫',priority:0}]}};assert.equal(engine.scoreItem(i,s).blocked,true);assert.equal(engine.scoreItem(i,s).score,0);});
test('Demonstration labels excluded from learning; explicit labels drive weights',()=>{const a=item('月姫 本');a.rating=5;a.demo=true;assert.deepEqual(engine.learnWeights([a]),{});a.demo=false;assert.ok(engine.learnWeights([a])['月姫']>0);});
test('Directed containment rejects cycles',()=>{assert.equal(engine.relationCycle('c','a',[{fromId:'a',toId:'b',kind:'contains'},{fromId:'b',toId:'c',kind:'contains'}]),true);});
test('Japanese fallback preserves canonical name',()=>{assert.equal(engine.translate('月姫 特典',prefs),'月姫 特典');assert.equal(engine.translate('月姫 特典',{...prefs,language:'zh'}),'月姬 特典');});
test('List cards keep title price and availability scoped',()=>{const html='<div class="item"><a href="/order/detailPage/item?itemCode=100"><img alt="月姫 読本 特典欠" src="/a.jpg"></a><div class="price">1,200円</div><p>在庫あり</p></div><div class="item"><a href="/order/detailPage/item?itemCode=200">月姫 読本 特典のみ</a><p>売り切れ</p></div><a rel="next" href="/order/listPage/list?page=2">次へ</a>';const result=collector.parseHtml(html,'https://order.mandarake.co.jp/order/listPage/list');assert.equal(result.products.length,2);assert.equal(result.products[0].offer.price,1200);assert.equal(result.products[0].offer.bonus,'absent');assert.equal(result.products[1].offer.price,null);assert.equal(result.products[1].offer.availability,'sold');assert.match(result.next,/page=2/);});
test('JSON-LD foreign currencies are not mislabelled as yen',()=>{const html='<script type="application/ld+json">{"@type":"Product","name":"Book","offers":{"price":100,"priceCurrency":"USD"}}</script>';assert.equal(collector.parseHtml(html,'https://www.suruga-ya.jp/item/1').products[0].offer.price,null);});
test('Crawl URL and redirect hosts are restricted',()=>{for(const u of ['http://order.mandarake.co.jp/','https://localhost/','https://api.openbd.jp.evil.org/','https://x:secret@api.openbd.jp/','https://api.openbd.jp:444/'])assert.throws(()=>collector.safeUrl(u));});
test('Empty marketing page is not silently a valid zero-item catalogue',()=>{assert.equal(collector.parseHtml('<h1>MANDARAKE</h1>','https://www.mandarake.co.jp/').products.length,0);});
test('Standalone postcard is not assumed to be a purchase bonus',()=>{assert.notEqual(engine.classify('月姫 ポストカード','',300).kind,'bonus');assert.equal(engine.classify('月姫 ポストカード','',300).bucket,'junk');assert.equal(engine.classify('月姫 読本','',300).bucket,'normal');});
test('Explicit source facts retain MSRP, creators and original release granularity',()=>{
 const facts=metadata.extractMetadata('<dl><dt>メーカー</dt><dd>実際のメーカー</dd><dt>キャラ名</dt><dd>アルトリア</dd><dt>発売日</dt><dd>１８年０９月未定</dd><dt>参考価格</dt><dd>20,166円(税込)</dd><dt>販売価格</dt><dd>16,230円</dd><dt>JANコード</dt><dd>4545784042434</dd></dl>');
 assert.equal(facts.msrp,20166);assert.equal(facts.year,'2018');assert.equal(facts.releaseDate,'18年09月未定');assert.deepEqual(facts.characters,['アルトリア']);
 const doujin=metadata.extractMetadata('<p>サークル：テストサークル</p><p>作者：画師A、画師B</p>');assert.equal(doujin.origin,'doujin');assert.deepEqual(doujin.artists,['画師A','画師B']);assert.ok(metadata.metadataTags(doujin).includes('画师/作者:画師A'));
});
test('Metadata does not silently overwrite manual fields and does not infer MSRP from offer',()=>{
 const i=item('Book');i.locked=true;i.manufacturer='Manual';const updated=metadata.applyMetadata(i,{manufacturer:'Source',year:'2020'},'https://www.amiami.jp/');assert.equal(updated.manufacturer,'Manual');assert.equal(updated.year,'');assert.ok(updated.evidence.some(e=>e.value==='Source'));
 assert.equal(metadata.extractMetadata('<script type="application/ld+json">{"@type":"Product","offers":{"price":30000,"priceCurrency":"JPY"},"seller":{"name":"Store"}}</script>').msrp,undefined);
});
test('Automatic links require unique full parent title and preserve ownership',()=>{
 const base=item('TYPE-MOON 月姫 設定資料集 第1巻'),bonus=item('TYPE-MOON 月姫 設定資料集 第1巻 店舗特典 ポストカード');base.ownership='owned';base.quantity=1;bonus.ownership='missing';
 const s={items:[base,bonus],relations:[],prefs:DEFAULT_PREFS};const links=engine.automaticRelations(s);assert.equal(links.length,1);assert.equal(links[0].fromId,base.id);assert.equal(links[0].toId,bonus.id);assert.equal(bonus.ownership,'missing');
 const duplicate=item(base.title);assert.equal(engine.automaticRelations({...s,items:[base,bonus,duplicate]}).length,0);
 assert.equal(engine.automaticRelations({...s,prefs:{...DEFAULT_PREFS,dismissedRelations:[engine.relationKey(links[0])]}}).length,0);
});
test('Different volumes and editions do not auto-link, Japanese titles produce recommendations',()=>{
 const a=item('月姫 設定資料集 第1巻 初版'),b=item('月姫 設定資料集 第2巻 再版 購入特典 ポストカード');const candidates=engine.suggestMatches(a,[a,b]);assert.equal(candidates.length,1);assert.equal(candidates[0].automatic,false);assert.ok(candidates[0].conflicts.length>0);
 const set=item('月姫 全3種セット');assert.equal(engine.automaticRelations({items:[a,set,b],relations:[],prefs:DEFAULT_PREFS}).length,0);
});
test('Verification forms pause sources but ordinary age labels do not',()=>{
 assert.throws(()=>collector.checkInteraction('<h1>あなたは18歳以上ですか</h1><button>はい</button>','https://order.mandarake.co.jp/'),e=>e.code==='age_verification');
 assert.doesNotThrow(()=>collector.checkInteraction('<h1>本</h1><p>18歳以上向け商品もあります</p>','https://order.mandarake.co.jp/'));
 assert.throws(()=>collector.checkInteraction('<h1>Verify you are human</h1>','https://www.amiami.jp/'),e=>e.code==='captcha');
});
test('Real Mandarake card structure keeps tax and inventory-check distinct',()=>{
 const html=require('node:fs').readFileSync('tests/fixtures/mandarake-cards.html','utf8');const result=collector.parseHtml(html,'https://order.mandarake.co.jp/order/listPage/list?categoryCode=01');assert.equal(result.products.length,2);assert.equal(result.products[0].offer.price,1320);assert.equal(result.products[0].offer.availability,'unknown');assert.match(result.products[0].title,/material 9/);assert.equal(result.products[1].offer.price,770);assert.ok(result.products[0].image.startsWith('https://img.mandarake.co.jp/'));
});
