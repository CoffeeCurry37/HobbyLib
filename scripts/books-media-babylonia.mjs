import assert from 'node:assert/strict';
import {read,write,cached,hash} from './four-series-common.mjs';
const dir='research/series-evidence-20261105/books-media',priv='work/series-evidence-20261105/books-media',at=new Date().toISOString();
const targets=read(priv+'/babylonia-targets.json'),originals=new Map(read('work/v6/production-after.json').items.map(i=>[i.id,i]));
const observations=read(dir+'/web-observations.json').filter(o=>!o.id.startsWith('babylonia-'));
const obs=(id,url,facts)=>{const o={id:'babylonia-'+id,url,at,kind:'public-web-search-text-observation',...facts,hashMeaning:'JSON观察记录哈希，不是原HTML哈希；不作实时库存依据。'};observations.push(o);return{id:o.id,sha256:hash(JSON.stringify(o))}};
const ami=code=>'https://www.amiami.jp/top/detail/detail?gcode='+code+'&page=related_item';
const refs={
 stageBD:obs('stage-bd','https://books.rakuten.co.jp/rb/15781660/?l-id=item-c-physical-series',{jan:'4534530115287',model:'ANZX-10117/9',discs:{BD:2,DVD:1},scope:'零售JAN与型号相联；本体规格，额外店铺光盘不在此范围。'}),
 stageDVD:obs('stage-dvd','https://books.rakuten.co.jp/rb/15781661/?l-id=item-c-physical-series',{jan:'4534530115294',model:'ANZB-10117/9',discs:{DVD:3},scope:'零售JAN与型号相联；本体规格，额外店铺光盘不在此范围。'}),
 base:obs('box-54110',ami('MED-DVD2-54110'),{code:'MED-DVD2-54110',jan:'4534530144768',mainBD:6,extras:['封面迷你卡'],scope:'共同BD本体规格；与另一54113挂牌的特典差异保留。'}),
 special:obs('box-54113',ami('MED-DVD2-54113'),{code:'MED-DVD2-54113',jan:'4534530144768',mainBD:6,extras:['封面迷你卡','A4亚克力板'],scope:'AmiAmi特典仅属于此挂牌，不推广到54110。'}),
 ost:obs('ost-43841',ami('MED-CD2-43841'),{code:'MED-CD2-43841',jan:'4534530144720',extras:['封面迷你卡'],scope:'原声通常盘与此商品清单特典。光盘数采用官方4CD，不采零售时长。'}),
 combo:obs('combo-54115',ami('MED-DVD2-54115'),{code:'MED-DVD2-54115',components:['Standard Edition Blu-ray BOX','Original Soundtrack CD'],extras:['BD封面迷你卡','CD封面迷你卡','同时购入A4文件夹'],scope:'两种商品组合，不是两张光盘；此清单未含AmiAmi亚克力板。'}),
 comboSpecial:obs('combo-54120',ami('MED-DVD2-54120'),{code:'MED-DVD2-54120',components:['Standard Edition Blu-ray BOX','Original Soundtrack CD'],extras:['BD封面迷你卡','CD封面迷你卡','同时购入A4文件夹','AmiAmi A4亚克力板'],scope:'仅此零售编号的亚克力板特典，非所有组合共有。'})
};
const stage=cached('https://stage.fate-go.jp/babylonia/bddvd/'),erratum=cached('https://stage.fate-go.jp/babylonia/news/?id=50988'),single=cached('https://unison-s-g.com/15th/16thsingle/'),box=cached('https://anime.fate-go.jp/ep7-tv/package/'),ost=cached('https://anime.fate-go.jp/ep7-tv/tv/music/?page=ost');
assert.ok(stage.body.includes('本編ディスク2枚')&&stage.body.includes('2019年1月26日')&&stage.body.includes('2019年1月27日'));
assert.ok(erratum.body.includes('ANZX-10117')&&erratum.body.includes('本編Blu-ray＋特典DVD3枚組'));
assert.ok(single.body.includes('TFCC-89674')&&single.body.includes('TFCC-89675')&&single.body.includes('2 LIVE CD'));
assert.ok(box.body.includes('ANSX-16051')&&box.body.includes('本編ディスク6枚組'));
assert.ok(ost.body.includes('SVWC-70628')&&ost.body.includes('全4枚組'));
const common={source:box.source,officialTitle:'Fate/Grand Order -絶対魔獣戦線バビロニア- & -終局特異点 冠位時間神殿ソロモン- Blu-ray Disc Box Standard Edition',scope:'官方型号ANSX-16051～16056及完整原始标题确认同一BD本体；特典逐挂牌保留',sourceRole:'official-base-product',summary:'《Fate/Grand Order -绝对魔兽战线巴比伦尼亚-》与《终局特异点 冠位时间神殿所罗门》的Standard Edition蓝光盒装，型号ANSX-16051～16056。本体为6张Blu-ray，含英语配音和英语字幕。',notes:'只补共同本体规格；现有店铺特典、二手状态、挂牌和图片全部保留。'};
const definitions={
 'source-2133ea765b659bc96fccb7c763fcf665':{source:single.source,officialTitle:'Phantom Joke 初回限定盤 TFCC-89674',scope:'官方艺人单曲页区分初回与通常；与留存JAN及明确版本标题对应',summary:'UNISON SQUARE GARDEN第16张单曲《Phantom Joke》的初回限定盘，型号TFCC-89674。由单曲CD与2张现场CD组成；标题曲是巴比伦尼亚动画片头曲，现场CD收录2019年2月9日Zepp Tokyo公演。',notes:'JAN 4988061896748及初回标题为留存AmiAmi来源；不把预约或店铺特典算作所有副本原配。'},
 'source-5b84d85092ce14b8ecfc5589259c7e1d':{source:single.source,officialTitle:'Phantom Joke 通常盤 TFCC-89675',scope:'官方艺人单曲页区分初回与通常；与留存JAN及明确版本标题对应',summary:'UNISON SQUARE GARDEN第16张单曲《Phantom Joke》的通常盘，型号TFCC-89675，为单张CD。标题曲是巴比伦尼亚动画片头曲；通常盘不含初回限定盘附带的2张现场CD。',notes:'JAN 4988061896755及通常标题为留存AmiAmi来源；不追加未确认的预约或店铺特典。'},
 'source-2d2d27c21cc1d54b9b5a873faa80415b':{source:stage.source,additionalSources:[erratum.source],observationSources:[refs.stageBD],officialTitle:'Fate/Grand Order THE STAGE -絶対魔獣戦線バビロニア- Blu-ray ANZX-10117/9',scope:'官方舞台页、官方包装勘误与JAN 4534530115287对应的零售型号交叉核对',summary:'《Fate/Grand Order THE STAGE -绝对魔兽战线巴比伦尼亚-》完全生产限定版蓝光本体，型号ANZX-10117～10119，为2张本篇Blu-ray加1张特典DVD。收录2019年1月26日女性御主版、1月27日男性御主版公演，附特制册子。',notes:'以官方勘误排除旧包装“DVD3枚”误记；额外店铺特典光盘不属于本体3片规格。',second:erratum.source.url},
 'source-ed1b7468c35bb9259c30fec25ca2345c':{source:stage.source,observationSources:[refs.stageDVD],officialTitle:'Fate/Grand Order THE STAGE -絶対魔獣戦線バビロニア- DVD ANZB-10117/9',scope:'官方舞台本体2本篇加1特典规格与JAN 4534530115294对应的DVD型号交叉核对',summary:'《Fate/Grand Order THE STAGE -绝对魔兽战线巴比伦尼亚-》完全生产限定版DVD本体，型号ANZB-10117～10119，为2张本篇DVD加1张特典DVD。分别收录2019年1月26日女性御主版、1月27日男性御主版公演，附特制册子。',notes:'未将ANIPLEX+/Animate额外附加光盘推广到此AmiAmi条目；不同媒介及原挂牌保持独立。'},
 'source-47b8c50beab3f9d41af8111aa5b4c7e4':{...common},
 'source-b59338819772cd57f5713f0758da2501':{...common,observationSources:[refs.base,refs.special],notes:'两挂牌JAN相同但54110与54113特典不同；仅补共同6BD本体，保留挂牌差别，不统一宣称附A4亚克力板。'},
 'source-79e2e74c52b9a57f3e47cccb7acd81c7':{source:ost.source,observationSources:[refs.ost],officialTitle:'Fate/Grand Order バビロニア & ソロモン Original Soundtrack SVWC-70628～70631',scope:'官方原声4CD型号与零售编号MED-CD2-43841、JAN 4534530144720及特典清单对应',summary:'《Fate/Grand Order -绝对魔兽战线巴比伦尼亚-》与《终局特异点 冠位时间神殿所罗门》的原声CD，型号SVWC-70628～70631，共4张CD。AmiAmi编号MED-CD2-43841的商品清单另列封面插画迷你卡特典。',notes:'官方4CD规格优先；不写有冲突的零售时长，不据历史特典清单推定实时库存。',second:ami('MED-CD2-43841')}
};
for(const [id,code,special,ref] of [['source-2a45b912988bd8e9ab44ed9e166d373c','MED-DVD2-54115',false,refs.combo],['source-db29ce3b16cbf64cfd1f1e88bc7f956f','MED-DVD2-54120',true,refs.comboSpecial]]){
 definitions[id]={source:box.source,additionalSources:[ost.source],observationSources:[ref],officialTitle:common.officialTitle+' + Original Soundtrack',scope:'官方两个本体型号与AmiAmi '+code+'的2点组合清单分别对应',sourceRole:'official-products-with-retailer-bundle',second:ami(code),summary:'AmiAmi编号'+code+'的零售组合，含巴比伦尼亚与所罗门的Standard Edition蓝光盒装（6张Blu-ray）及Original Soundtrack（4张CD）。清单另列BD、CD封面迷你卡各一张和同时购入A4文件夹'+(special?'，以及AmiAmi限定A4亚克力板':'')+'。',notes:'2点指两个商品本体，不是两张光盘；特典仅依据此零售编号清单，不作当前库存保证。'};
}
const rows=targets.map(t=>{
 const original=originals.get(t.id),r={itemId:t.id,groupId:t.groupId,title:t.title,identityBinding:{isbn:original.isbn||'',jan:original.jan||'',productLine:original.productLine||'',offerUrls:[...new Set(original.offers.map(o=>o.url))].sort()}};
 if(original.editorial||original.locked||original.manualFields?.length||original.summary)return{...r,status:'protected',reason:'既有官方V6单卷简介和证据原样保留；不重复追加',protection:'existing-summary',existingSummary:original.summary};
 if(definitions[t.id])return{...r,status:'supported',sourceRole:'official-product',...definitions[t.id]};
 let reason,needed;
 if(t.id.startsWith('member-')){reason='派生单卷仅有卷号，未明确BD/DVD，也无独立JAN或挂牌';needed='原始包装媒介和型号，或可定位此编号的独立商品页';}
 else if(['749ce5e1-a981-45c3-ac12-e4e7639ff7f7','source-4c1f8cc3313865192ec3ffcaa97c4c1d'].includes(t.id)){reason='同条目留存BD与DVD两种媒介挂牌，无法作为单一版本补写；不自动拆分归并';needed='逐挂牌媒介、整套型号和组成，另行形成结构处理方案';}
 else if(t.id==='source-82339700144bf79c2388849926b1b04f'){reason='留存标题为出租版11卷；当前独立出租目录未获确认，不能套用零售5卷规格';needed='11卷出租DVD的卷目、编号及包装证据';}
 else if(['97f25801-08b6-4106-a36e-92cbdab15cad','source-fcfb8c6e6af0588d2b3670a98a24f3be'].includes(t.id)){reason='Mandarake标题截断且无JAN/型号，原页当前不可读，不能确认3片本体或4片店铺组合';needed='包装背面、完整型号及光盘清单；仅有舞台作品名不足';}
 else throw Error('Unreviewed media '+t.id);
 return{...r,status:'pending',reason,needed,retainedSourceUrls:t.sourceUrls};
});
assert.equal(rows.length,25);assert.equal(rows.filter(r=>r.status==='supported').length,9);assert.equal(rows.filter(r=>r.status==='protected').length,6);assert.equal(rows.filter(r=>r.status==='pending').length,10);
write(dir+'/web-observations.json',observations);write(dir+'/cases-babylonia.json',{at,rows});
write(dir+'/babylonia-facts.json',{at,officialSources:[stage.source,erratum.source,single.source,box.source,ost.source],stage:{baseDiscs:3,additionalStoreDisc:1,BD:[2,1],DVD:3},single:{limited:'TFCC-89674 / CD+2 LIVE CD',regular:'TFCC-89675 / CD'},box:{model:'ANSX-16051～16056',mainBD:6},ost:{model:'SVWC-70628～70631',CD:4},scope:'官方原始HTML哈希与公开零售观察分别保存；未把报价历史当独立官方证据。'});
console.log(JSON.stringify({reviewed:25,ready:9,protected:6,pending:10}));

