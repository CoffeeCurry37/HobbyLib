import type {Item} from './types';
import {manualField,canonicalBrand} from './catalog';
import {metadataTags} from './metadata';
export const TAG_VOCABULARY_VERSION=1;
export const TAG_NAMESPACES={brand:'品牌',productLine:'产品线',publisher:'出版社',manufacturer:'厂家',circle:'社团',series:'作品',category:'类别',year:'发售年',artists:'画师/作者',characters:'角色'} as const;
export const TAG_ALIASES={'TYPE MOON':'TYPE-MOON','タイプムーン':'TYPE-MOON','角川書店':'KADOKAWA','バンダイ':'万代 BANDAI'};
// Legacy string[] remains authoritative until provenance is known. No automatic
// deletions, including tags that resemble an old automatic classification.
export function tagSuggestions(item:Item){
 const supported=Object.entries(TAG_NAMESPACES).flatMap(([field,namespace])=>{
  const sources=item.evidence.filter(e=>e.field===field&&e.url&&/来源明确|人工|核对/.test(e.method));
  if(!sources.length)return [];
  return metadataTags(item).filter(tag=>tag.startsWith(namespace+':')).map(rawTag=>({tag:['brand','publisher','manufacturer'].includes(field)?namespace+':'+canonicalBrand(rawTag.slice(namespace.length+1)):rawTag,rawTag,field,sources:sources.map(e=>({url:e.url,value:e.value,method:e.method})),vocabularyVersion:TAG_VOCABULARY_VERSION}));
 });
 return {add:manualField(item,'tags')?[]:supported.filter(e=>!item.tags.includes(e.tag)),remove:[],preserve:item.tags,unattributed:item.tags.filter(t=>!supported.some(e=>e.tag===t)),manual:manualField(item,'tags')};
}
