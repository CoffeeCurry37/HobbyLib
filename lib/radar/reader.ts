import {AsyncLocalStorage} from 'node:async_hooks';
import {fetchPublic,safeUrl} from './collector';
export type SourceReader=(url:string)=>Promise<{text:string;url:string}>;
const context=new AsyncLocalStorage<SourceReader>();
export const withSourceReader=<T>(reader:SourceReader,fn:()=>T):T=>context.run(reader,fn);
export const readSource=(url:string)=>{safeUrl(url);return (context.getStore()||fetchPublic)(url);};
