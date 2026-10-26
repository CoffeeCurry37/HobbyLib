'use client';
import {useEffect,useState} from 'react';
import {ImageOff} from 'lucide-react';
import type {Item} from '@/lib/radar/types';
export function ProductImage({src,alt='',loading='lazy'}:{src:string;alt?:string;loading?:'lazy'|'eager'}){
 const [attempt,setAttempt]=useState(0);useEffect(()=>setAttempt(0),[src]);
 if(!src||!src.startsWith('https://')||attempt>1)return <span className="product-image-missing" title="图片待补，可在资料页打开来源核对"><ImageOff aria-hidden="true"/><small>图片待补</small></span>;
 return <img src={attempt===0?src:'/api/radar?image='+encodeURIComponent(src)} alt={alt} loading={loading} referrerPolicy="no-referrer" onError={()=>setAttempt(n=>n+1)}/>;
}
export function ProductGallery({item}:{item:Item}){
 const images=[...new Set([item.image,...(item.images||[])])].filter(Boolean).slice(0,10),[selected,setSelected]=useState(0);
 useEffect(()=>setSelected(0),[item.id]);if(!images.length)return <div className="detail-gallery empty"><ProductImage src=""/></div>;
 return <section className="detail-gallery" aria-label="商品图片"><div className="detail-gallery-main"><ProductImage key={images[selected]||images[0]} src={images[selected]||images[0]} alt={item.title} loading="eager"/></div>{item.imageRole==='catalogue_reference'&&<p className="image-reference-label">系列发行参考图 · 单款实拍待确认</p>}{item.imageRole==='award_reference'&&<p className="image-reference-label">赏级参考图 · 单款图片待确认</p>}{images.length>1&&<div className="detail-gallery-thumbs">{images.map((src,n)=><button key={src} aria-label={`查看图片 ${n+1}`} aria-pressed={n===selected} onClick={()=>setSelected(n)}><ProductImage key={src} src={src}/></button>)}</div>}</section>;
}
