import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT,DATA,REPORT,read,sha} from '../pilot-workbench/common.mjs';
export const V2_REPORT=resolve(ROOT,'research/pilot-v2-20261030');
export const VERSION='pilot-v2.1';
const pid=n=>'P'+String(n).padStart(3,'0');
export function admission(f){
 if(f.scopeUnknown)return {mode:'review',reason:'出售范围或发行身份尚待确认'};
 if(f.fixedSetPart&&!f.explicitBonusException)return {mode:'excluded',reason:'固定官方套装的孤立拆件不新增商品页'};
 if(f.sellerSet||f.mixedLot||f.code||f.explicitBonusException)return {mode:'temporary',reason:'临时出售对象，保留历史并跟随挂牌生命周期'};
 return {mode:'permanent',reason:'正式发行商品或可独立收集成员，零挂牌永久保留'};
}
export function visibility(mode,offers){
 if(mode==='excluded')return 'excluded';
 if(mode==='review')return 'review';
 if(mode==='permanent')return 'visible';
 if(offers.length&&offers.every(o=>['sold','ended'].includes(o.status)&&o.confirmed===true))return 'archived';
 return 'visible';
}
export function scopedSaleForm(title,source,isbn,price){
 const m=title.match(/(?:1|１)\s*[～~–\-－]\s*(\d+)\s*(?:巻|卷)/u);
 const set=/セット|套装/.test(title);
 if(m&&set&&/骏河屋|駿河屋|mandarake|まんだらけ/i.test(source))return {form:'seller-set',from:1,to:Number(m[1]),isbnScope:isbn?'member-not-set':'unknown',priceUsedForIdentity:false};
 return {form:set?'set-unconfirmed':'unknown',isbnScope:'unconfirmed',priceUsedForIdentity:false};
}
export function identityCompatible(a,b){
 for(const k of ['work','edition','platform','medium','volume','isbn','wave','cardNumber','className','character','jan'])if(a[k]&&b[k]&&String(a[k])!==String(b[k]))return false;
 return true;
}
export function fieldMerge(existing,incoming){
 const out=new Map(existing.map(f=>[f.field,f]));
 for(const f of incoming){const old=out.get(f.field);if(old?.manual)continue;if(old&&old.status==='supported'&&f.status!=='supported')continue;out.set(f.field,f);}
 return [...out.values()];
}
export function loadInputs(){
 const samples=read(resolve(DATA,'samples.json')),manifest=read(resolve(REPORT,'manifest.json'));
 if(samples.length!==300||sha(samples.map(({raw,...rest})=>rest))!==sha(manifest))throw Error('Frozen input mismatch');
 const proposals=read(resolve(REPORT,'proposals-30.json')).rows;
 const feedback=read(resolve(REPORT,'user-feedback-20261030.json'));
 if(proposals.length!==30||feedback.rows.length!==30)throw Error('First30 scope mismatch');
 for(const p of proposals){const f=feedback.rows.find(f=>f.id===p.id);if(!f||sha(p)!==f.proposalRowSha256||f.inputHash!==p.inputHash)throw Error('Feedback binding mismatch '+p.id);}
 return {samples:samples.filter(s=>proposals.some(p=>p.id===s.id)),proposals,feedback,baseline:read(resolve(REPORT,'baseline-30.json')).rows,catalogues:read(resolve(REPORT,'catalogues.json')),evidence:read(resolve(REPORT,'evidence.json')),updates:read(resolve(V2_REPORT,'research-updates.json')),descriptions:read(resolve(REPORT,'description-examples-20261030.json')).rows};
}
export function buildModel(input=loadInputs()){
 const {samples,proposals,feedback,baseline,catalogues,evidence,updates,descriptions}=input;
 const products=[],groups=[],rows=[],byId=new Map();
 function group(id,title,type,description,sources=[],expectedCount=null){const g={id,title,type,description,sources,expectedCount};groups.push(g);return g;}
 function add(p){if(byId.has(p.id))throw Error('Duplicate product '+p.id);const v={mode:'permanent',type:'商品',state:'supported',image:'',imageRole:'none',summary:'',sources:[],tags:[],characters:[],variants:[],sampleIds:[],links:[],...p};products.push(v);byId.set(p.id,v);return v;}
 const cat=id=>catalogues.find(c=>c.id===id);
 group('material','FGO material','书籍 / 资料集','设定资料集按卷归档；完整收录人物单独保存。',['material']);
 group('turas','FGO -turas réalta-','书籍 / 漫画','单卷永久保留，卖家组合单独展示；本轮查到第23卷。',['turas','turas23'],23);
 for(const n of [14,5,6])group('wafer'+n,'FGO 威化第'+n+'弹','卡片 / 集换式',cat('wafer'+n).note,cat('wafer'+n).sources,cat('wafer'+n).expectedCount);
 for(const [id,title]of [['extra','Fate/EXTRA'],['extra-ccc','Fate/EXTRA CCC'],['extella','Fate/EXTELLA'],['extella-link','Fate/EXTELLA LINK'],['extra-record','Fate/EXTRA Record']])group(id,title,'游戏','作品身份独立；版本、特典与临时组合分栏展示。',id==='extella'?['extella','v2-extella-matrix']:id==='extella-link'?['extella-link']:[]);
 group('figures','比例手办','手办','厂商与销售商分别记录。');
 group('figma','Max Factory · figma','手办 / 产品线','本体永久建档；官店替换脸单卖按临时入口处理。',['v2-nero']);
 group('nendoroid-doll','GSC · 粘土人娃','手办 / 产品线','玛修私服人偶与官方单卖衣服套装为独立商品。',['mash-doll','mash-outfit']);
 group('fes2025','FGO Fes.2025','活动周边','Aniplex线上发售资料建立永久档案；事后受注日期与发货日期分开。',['fes-kama','fes-louhi','fes-mat','fes-asclepius']);
 group('fes2026','FGO Fes.2026 · 学生证','活动特典','用户提供入场特典信息，系列与实物对应仍需补证。',['v2-student-history']);
 group('mixed','Fate · 混合套装','其他 / 临时组合','只按大IP整理，未知成员不强行补齐。');
 for(const [i,m]of cat('material').members.entries())add({id:'material-'+(i+1),groupId:'material',title:'Fate/Grand Order '+m.name,type:'设定资料集',characters:m.characters||[],sources:m.sources,summary:'TYPE-MOON BOOKS发行的《Fate/Grand Order material》系列第'+(i+1)+'卷。完整收录条目见角色资料。',tags:['Fate/Grand Order','TYPE-MOON BOOKS','资料集'],identity:{work:'Fate/Grand Order',edition:'material',volume:i+1}});
 for(const [i,m]of cat('turas').members.entries())add({id:'turas-'+(i+1),groupId:'turas',title:'FGO -turas réalta- 第'+(i+1)+'卷',type:'漫画',summary:'《Fate/Grand Order -turas réalta-》漫画系列第'+(i+1)+'卷。出版社已列出该卷发行资料。',sources:m.sources,tags:['Fate/Grand Order','漫画'],isbn:m.isbn,releaseDate:m.releaseDate,identity:{work:'Fate/Grand Order',edition:'turas-realta',volume:i+1,isbn:m.isbn}});
 for(const m of cat('wafer14').members)add({id:'wafer14-'+sha(m.name).slice(0,12),groupId:'wafer14',title:'FGO 威化14 · '+m.name,type:'威化单卡',mode:'review',state:'proposed',summary:'零售目录列出的第14弹候选卡片。正式编号及卡面对应待核实。',tags:['Fate/Grand Order',m.name],characters:[m.name],sources:m.sources,identity:{work:'Fate/Grand Order',wave:14,character:m.name}});
 for(const [id,title,platforms,mediums]of [
 ['regular','通常版',['PS4','PS Vita','Switch'],['实体']],
 ['limited','LIMITED BOX',['Switch'],['实体']],
 ['best','Best Collection',['PS4','PS Vita','Switch'],['实体']],
 ['regalia','REGALIA BOX',['PS4','PS Vita'],['实体']],
 ['velber','VELBER BOX',['PS4 + PS Vita'],['实体']]
 ])add({id:'extella-'+id,groupId:'extella',title:'Fate/EXTELLA '+title,type:'游戏',summary:id==='velber'?'《Fate/EXTELLA》的豪华限定盒装，同时包含PS4和PS Vita游戏。缺件仅记录在具体挂牌，不改变母版本身份。':'《Fate/EXTELLA》的'+title+'。按实际发行平台分别记录身份与报价。',sources:['extella','v2-extella-matrix',...(id==='regular'?['extella-switch']:[])],tags:['Fate/EXTELLA',title],identity:{work:'Fate/EXTELLA',edition:title,medium:'实体'},variants:platforms.map(platform=>({platform,medium:'实体',jan:id==='regular'?({'PS4':'4535506302564','PS Vita':'4535506302571',Switch:'4535506302656'}[platform]):id==='velber'?'4535506302588':null,sources:id==='regular'?[{'PS4':'v2-ps4-jan','PS Vita':'v2-vita-jan',Switch:'v2-switch-jan'}[platform]]:['v2-extella-matrix']}))});
 add({id:'figma-nero-370',groupId:'figma',title:'figma 尼禄·克劳狄乌斯 370',type:'可动手办',summary:'Max Factory的《Fate/EXTELLA》尼禄figma，型号370。官店购入曾附“闭眼得意脸”，二手挂牌不默认附送。',sources:['v2-nero'],tags:['figma','Max Factory','Fate/EXTELLA','ネロ・クラウディウス'],characters:['ネロ・クラウディウス'],referenceImages:[{url:updates.sources.find(s=>s.id==='v2-nero-image').url,role:'官店特典参考图（官网链接）',sources:['v2-nero-image']}],identity:{work:'Fate/EXTELLA',edition:'figma370'}});
 for(const [cid,prefix]of [['fes-b','B'],['fes-c','C']])for(const m of cat(cid).members)add({id:'fes-'+prefix+'-'+sha(m.name).slice(0,12),groupId:'fes2025',title:'FGO Fes.2025 B2半裁挂画 '+prefix+'组 · '+m.name,type:'挂画',summary:'FGO Fes.2025的B2半裁挂画'+prefix+'组角色款式。曾在Aniplex进行活动事后受注销售。',tags:['FGO Fes.2025',m.name,'挂画'],characters:[m.name],sources:m.sources,identity:{work:'Fate/Grand Order',event:'Fes2025',line:cid,character:m.name}});
 const member=(gid,word)=>{const a=products.filter(p=>p.groupId===gid&&p.title.includes(word));if(a.length!==1)throw Error('Member ambiguous '+gid+' '+word);return a[0].id;};
 const mapping={P001:'material-1',P002:'material-2',P003:'material-3',P004:'material-8',P006:member('wafer14','ダンテ'),P008:member('wafer14','両儀式'),P011:'extella-regular',P012:'extella-limited',P020:'sample-P020',P021:member('fes2025','カーマ'),P024:member('fes2025','アスクレピオス'),P029:'extella-velber'};
 const groupMap={P005:'turas',P007:'wafer6',P009:'wafer5',P010:'wafer5',P013:'extella-link',P014:'extella-link',P015:'extella',P016:'figures',P017:'figma',P018:'nendoroid-doll',P019:'nendoroid-doll',P020:'figma',P022:'fes2025',P023:'fes2025',P025:'fes2026',P026:'mixed',P027:'mixed',P028:'extella-link',P030:'extra'};
 for(const p of proposals){
  const s=samples.find(s=>s.id===p.id),f=feedback.rows.find(f=>f.id===p.id),g=feedback.groups.find(g=>g.feedbackNo===f.feedbackNo),b=baseline.find(x=>x.id===p.id);
  const policy=admission({scopeUnknown:['P010','P025','P028'].includes(p.id),fixedSetPart:p.id==='P030',sellerSet:['P005','P027'].includes(p.id),mixedLot:p.id==='P026',code:p.id==='P014',explicitBonusException:p.id==='P020'});
  const id=mapping[p.id]||'sample-'+p.id;
  const goodImage=(s.raw.images||[s.raw.image]).find(u=>/^https:\/\//.test(u||'')&&!/logo|favicon|common\/pc/i.test(u))||'';
  const summary=descriptions.find(d=>d.id===p.id)?.description||updates.descriptions[p.id];
  if(!summary)throw Error('Missing description '+p.id);
  const product=byId.get(id)||add({id,groupId:groupMap[p.id],title:p.canonicalTitle,type:p.productType,identity:{work:groupMap[p.id]},tags:[p.productType]});
  Object.assign(product,{mode:policy.mode,state:policy.mode==='review'?'proposed':'supported',summary:['P011','P029'].includes(p.id)?product.summary:summary,sampleIds:[...product.sampleIds,p.id],sources:[...new Set([...product.sources,...p.sources])],image:goodImage,imageRole:goodImage?'历史挂牌图片':'none'});
  if(p.id==='P015'){product.type='游戏店铺特典';product.image=evidence.find(e=>e.id==='extella-art-image').url;product.imageRole='官方特典参考图';}
  product.characters=[...new Set([...product.characters,...p.facts.filter(f=>/角色|画面角色/.test(f.field)&&f.value).flatMap(f=>Array.isArray(f.value)?f.value:[f.value])])];
  product.tags=[...new Set([...product.tags,...product.characters.slice(0,4),...p.facts.filter(f=>/画师|厂商|出版社/.test(f.field)&&f.value).map(f=>f.value)])];
  product.facts=fieldMerge(product.facts||[],p.facts);
  if(p.id==='P025')product.facts=fieldMerge(product.facts,[{field:'发放方式',value:'入场特典，不参与线上贩售',status:'user-confirmed',sources:['user-feedback-10'],manual:true}]);
  if(p.id==='P027')product.facts=fieldMerge(product.facts,[{field:'套装数量',value:'2张威化卡片',status:'user-confirmed',sources:['user-feedback-12'],manual:true}]);
  const unknowns=p.id==='P026'?['成员和数量未知，按用户要求不强制逐件研究；链接无法访问。']:p.id==='P027'?['用户确认两张组合；弹次、编号、稀有度与实物情况仍待核实。']:p.id==='P025'?['用户确认入场特典；独立历史摘要尚未视觉互证，完整系列待补。']:p.id==='P011'?['三个候选应按平台保留；PS4目标建议仍需独立SKU复核。']:p.unknowns;
  const target=p.id==='P011'?b.candidates.find(c=>c.jan==='4535506302564')?.id:null;
  const saleFormDecision=scopedSaleForm(s.title,s.source,s.raw.facts?.isbn||s.raw.facts?.jan,s.raw.offer?.price);
  const decision={saleFormDecision,action:policy.mode==='excluded'?'exclude-new-product':policy.mode==='review'?'review':policy.mode==='temporary'?'temporary':b.decision.status==='matched'?'link-proposed':'review-candidates',reason:policy.reason,targetId:target||b.decision.targetItemId||null,productionApplied:false,automaticResearch:false};
  const extraSources=p.id==='P011'?['v2-vita-jan','v2-switch-jan','v2-ps4-jan']:p.id==='P010'?['v2-cu-retailer']:p.id==='P020'?['v2-nero','v2-nero-image']:p.id==='P025'?['v2-student-faq','v2-student-history']:p.id==='P028'?['v2-animate']:[];
  product.sources=[...new Set([...product.sources,...extraSources])];
  rows.push({id:p.id,productId:id,title:p.canonicalTitle,summary,mode:policy.mode,inputHash:f.inputHash,proposalRowSha256:f.proposalRowSha256,feedbackNo:g.feedbackNo,feedback:g,decision,unknowns,change:updates.notes[p.id]||g.nextAction,sources:product.sources,originalUnknowns:p.unknowns,baselineStatus:b.decision.status});
 }
 byId.get('sample-P005').links=Array.from({length:22},(_,i)=>({id:'turas-'+(i+1),type:'包含单卷',quantity:1}));
 byId.get('sample-P020').links=[{id:'figma-nero-370',type:'所属本体'}];byId.get('figma-nero-370').links=[{id:'sample-P020',type:'官店特典临时单卖'}];
 byId.get('sample-P018').links=[{id:'sample-P019',type:'适用人偶（不含本体）'}];byId.get('sample-P019').links=[{id:'sample-P018',type:'独立销售服装'}];
 byId.get('sample-P030').parentNote='Fate/EXTRA 10th ANNIVERSARY Celebration BOX；仅记录盒装内容，不新增该印画独立商品。';
 for(const p of products){if(!p.groupId)throw Error('Missing group '+p.id);p.descriptionSources=p.sources;}
 return {version:VERSION,sourceMode:'frozen observations + user review + assistant evidence; local deterministic policy replay',products,groups,rows,evidence:[...evidence,...[10,12].map(n=>({id:'user-feedback-'+n,url:'https://github.com/CoffeeCurry37/HobbyLib/blob/main/research/pilot-300-20261029/user-feedback-20261030.json',grade:'user',findings:'用户逐条审核第'+n+'点；只对明确确认的字段生效。'})),...updates.sources.map(s=>({...s,retrievedDate:updates.date}))],productionWrites:0,paidApiCalls:0,independentGoldLabels:0};
}
