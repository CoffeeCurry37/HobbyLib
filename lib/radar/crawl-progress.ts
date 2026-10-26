import {createHash} from 'node:crypto';
import {listingKey} from './identity';
import type {Parsed} from './collector';
export function searchScope(url:string){const u=new URL(url);for(const key of ['page','p','pageNumber'])u.searchParams.delete(key);u.searchParams.sort();return u.href;}
export const listingPageKey=(products:Parsed[])=>createHash('sha256').update([...new Set(products.map(p=>listingKey(p.offer.url)))].sort().join('\n')).digest('hex');
