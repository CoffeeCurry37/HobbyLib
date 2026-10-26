export const PAGE_IMPORT_BYTES=4_000_000;
export const BACKUP_IMPORT_BYTES=256_000_000;
export const ACTION_BYTES=4_500_000;
export const MAX_CATALOGUE_NODES=10_000;
export const MAX_BACKUP_ITEMS=21_000_000;
export const MAX_BACKUP_RELATIONS=1_000_000;
export const JSON_ARGUMENT_BYTES=1_800_000;

// D1 supports JSON table functions. A bounded JSON argument avoids one SQL
// statement per record and keeps each parameter below its 2 MB value limit.
export function jsonChunks(rows:unknown[],maxBytes=JSON_ARGUMENT_BYTES,maxRows=1000){
 const chunks:string[]=[],encoder=new TextEncoder();let parts:string[]=[],size=2;
 for(const row of rows){const part=JSON.stringify(row),bytes=encoder.encode(part).byteLength;
  if(bytes+2>maxBytes)throw new Error('单条备份记录过大，请减少该条目的历史记录后重试');
  if(parts.length&&(size+bytes+1>maxBytes||parts.length>=maxRows)){chunks.push('['+parts.join(',')+']');parts=[];size=2;}
  parts.push(part);size+=bytes+1;
 }
 if(parts.length)chunks.push('['+parts.join(',')+']');return chunks;
}

export async function readActionText(request:Request){
 if(Number(request.headers.get('content-length')||0)>BACKUP_IMPORT_BYTES)throw new Error('备份内容超过 256 MB');
 const reader=request.body?.getReader();if(!reader)return {text:'',bytes:0};
 const decoder=new TextDecoder(),parts:string[]=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>BACKUP_IMPORT_BYTES){await reader.cancel();throw new Error('备份内容超过 256 MB');}parts.push(decoder.decode(value,{stream:true}));}
 parts.push(decoder.decode());return {text:parts.join(''),bytes};
}
