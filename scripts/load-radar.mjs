import ts from 'typescript';
import{readFileSync,writeFileSync,readdirSync,mkdtempSync,mkdirSync,rmSync}from'node:fs';
import{createRequire}from'node:module';import{join}from'node:path';import{tmpdir}from'node:os';
export function loadRadar(){
 const dir=mkdtempSync(join(tmpdir(),'radar-source-')),require=createRequire(import.meta.url);
 const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")');
 for(const f of readdirSync('lib/radar'))if(f.endsWith('.ts'))writeFileSync(join(dir,f.replace('.ts','.cjs')),compile(readFileSync('lib/radar/'+f,'utf8')));else if(f.endsWith('.json'))writeFileSync(join(dir,f),readFileSync('lib/radar/'+f));
 writeFileSync(join(dir,'sqlite.cjs'),compile(readFileSync('standalone/sqlite.ts','utf8')));
 mkdirSync(join(dir,'node_modules/zod'),{recursive:true});writeFileSync(join(dir,'node_modules/zod/index.js'),'module.exports=require('+JSON.stringify(require.resolve('zod'))+');');
 const close=()=>rmSync(dir,{recursive:true,force:true});process.once('exit',close);
 return {get:name=>require(join(dir,name+'.cjs')),close};
}
