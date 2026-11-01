// Reviewed annotations from this experiment, not an autonomous vision model.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from '../pilot-workbench/common.mjs';
import {read,cached,imageRecord} from './sources.mjs';
import {validateVision} from '../recognition/vision.mjs';
const specs={
 P079:{size:[1080,453],notes:'可见6枚徽章和3个橡胶挂件；包装文字与角色图案可辅助候选检索，不能据此认定同一发售系列。',regions:[['阿尔托莉雅候选徽章',[0,.08,.2,.4]],['尼禄候选徽章',[.21,.08,.2,.4]],['阿蒂拉候选徽章',[.41,.07,.19,.39]],['Robin Hood字样徽章',[.61,.07,.19,.4]],['Hans Christian Andersen字样徽章',[.81,.03,.18,.4]],['贞德候选徽章',[.06,.48,.23,.44]],['Siegfried字样挂件一',[.29,.48,.23,.5]],['齐格飞候选挂件二',[.51,.48,.24,.5]],['莎士比亚候选挂件',[.75,.48,.23,.5]]]},
 P087:{size:[300,300],notes:'缩略图可辨多种纸类，部分重叠；按可见区域分组，无法确认每张角色、背面或整套数量。',saleScope:'unknown',regions:[['左上装饰纸品',[.07,.04,.34,.39]],['右上文件夹',[.42,.03,.47,.28]],['中部卡片组',[.4,.29,.55,.37]],['左中彩色卡片组',[.06,.43,.35,.24]],['左下红色卡片组',[.06,.64,.31,.21]],['下部文件夹或纸品组',[.37,.63,.63,.32]]]},
 P183:{size:[300,225],notes:'两盒相同光之高扬斯卡娅面条压手办，与标题两件组合相符；只确认盒面，未检查内部附件。',regions:[['光之高扬斯卡娅手办外盒一',[.02,.04,.46,.94]],['光之高扬斯卡娅手办外盒二',[.49,.04,.43,.94]]]},
 P234:{size:[300,300],notes:'可见三个杯子及对应D赏外盒；款式具体命名仍需官方对照。',regions:[['左侧红色印花杯',[.06,.47,.33,.45]],['中央黑色印花杯',[.35,.46,.3,.47]],['右侧红色印花杯',[.64,.46,.29,.47]]]},
 P236:{size:[1200,1200],notes:'可见8个海报盒，分属不同一番赏。盒面字样可读；不根据盒面认定内部完好。',regions:[['Last One赏海报盒',[.025,.535,.55,.105]],['A赏海报盒一',[.03,.632,.55,.079]],['A赏海报盒二',[.03,.706,.55,.076]],['A赏海报盒三',[.04,.78,.55,.074]],['H赏水着贞德Alter海报盒',[.586,.31,.1,.537]],['I赏水着贞德海报盒',[.679,.31,.086,.54]],['H赏宫本武藏海报盒',[.766,.31,.083,.55]],['H赏XX海报盒',[.851,.31,.096,.544]]]},
 P238:{size:[1080,1081],notes:'两枚徽章，图案与标题埃列什基伽勒、伊什塔尔一致；原发行系列尚不明确。',regions:[['埃列什基伽勒候选徽章',[.16,.42,.31,.35]],['伊什塔尔候选徽章',[.563,.374,.432,.457]]]},
 P242:{size:[1004,1080],notes:'可见15枚徽章，存在重复款。角色只作视觉候选，未根据画风推断官方活动或发行批次。',regions:[...Array.from({length:15},(_,i)=>{const col=i%4,row=Math.floor(i/4);return [['白发男性候选','粉发男性候选','紫发角色候选','其他角色候选'][col], [.13+col*.215,.12+row*.212,.215,.205]];})]},
 P249:{productPatch:{path:['TYPE-MOON','Fate','Fate 综合','混合套装'],title:'Fate系列 Saber、玛修与奥尔加玛丽角色手办组合'},size:[300,225],notes:'标题Fate/Zero与玛修、奥尔加玛丽不相符；照片可见3个不同角色，保留Fate综合临时组合，不据错标题归入Zero同一系列。',work:'Fate 综合',regions:[['Saber候选',[.02,.06,.29,.77]],['玛修候选',[.30,.15,.35,.68]],['奥尔加玛丽候选',[.67,.18,.31,.65]]]},
 P252:{size:[640,480],notes:'袋中可见两个头部、两组身体和支架底座。头部与标题切嗣、肯尼斯相符；零件数量不直接等于齐件结论。',regions:[['肯尼斯候选头部',[.65,.04,.31,.41]],['切嗣候选头部',[.7,.45,.29,.4]],['身体及支架底座组',[0,0,.69,.95]]]},
 P257:{size:[300,300],notes:'总览可见手办盒、绿盒、立牌与多包小物；分组标注，低清晰度不逐个猜角色或数量。',saleScope:'unknown',regions:[['主要手办外盒',[.37,.24,.36,.43]],['左侧绿色包装',[.25,.35,.14,.25]],['右侧透明立牌或挂件',[.72,.55,.2,.16]],['左侧小包装组',[.1,.56,.29,.19]],['下部多包小物',[0,.68,.96,.26]]]},
 P260:{size:[1080,810],notes:'两只もちもちマスコット，外观与标题藤丸立香男女两款相符，具体发售批次未知。',regions:[['藤丸立香女性候选',[.02,.05,.56,.75]],['藤丸立香男性候选',[.55,.05,.44,.61]]]},
 P265:{size:[300,300],notes:'可见Fate15周年三枚徽章固定包装和一件凛挂件。这是至少两个商品的组合，不将固定徽章组拆成新单品。',regions:[['Fate15周年三枚徽章固定组',[.07,.27,.52,.51]],['远坂凛候选挂件',[.59,.36,.34,.47]]]},
 P298:{productPatch:{mode:'temporary'},size:[300,300],notes:'三张书签与标题卡多克、基尔什塔利亚、戴比特相符；是活动特典组合，不能当线上贩售商品。',regions:[['卡多克候选书签',[.05,.07,.31,.89]],['基尔什塔利亚候选书签',[.35,.07,.31,.89]],['戴比特候选书签',[.66,.07,.31,.89]]]}
};
const all=read('work/pilot-300/samples.json');const results=Object.entries(specs).map(([id,spec])=>{const s=all.find(s=>s.id===id),url=s.raw.image||s.raw.images?.[0],c=cached(url);if(c?.status!=='captured')throw Error('Missing visual source '+id);const v={sampleId:id,sourceUrl:s.url,imageUrl:url,contentHash:c.sha256,dimensions:spec.size,productPatch:spec.productPatch,method:'assistant-reviewed-visible-region-annotation',modelApiCalls:0,automatedSegmentation:false,saleScope:spec.saleScope||'seller-described-combination',notes:spec.notes,regions:spec.regions.map(([label,box],i)=>({id:id+'-region-'+(i+1),label,work:spec.work||'Fate/Grand Order / 系列待确认',box,quantityVisible:/组/.test(label)?null:1,identityStatus:'candidate',permanentCreate:false,catalogueCandidates:[],image:imageRecord(url,'拼包实物区域',s.url,box)}))};validateVision(v,c.sha256);return v;});
fs.writeFileSync(resolve(ROOT,'work/pilot-v4/vision.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({lots:results.length,regions:results.reduce((n,v)=>n+v.regions.length,0)}));
