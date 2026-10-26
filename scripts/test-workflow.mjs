import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'radar-workflow-')),require=createRequire(import.meta.url);
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
try{
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')))writeFileSync(join(dir,file.replace('.ts','.cjs')),compile(readFileSync('lib/radar/'+file,'utf8')).replace(/require\("(?:\.\/|@\/lib\/radar\/)([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const name of ['sqlite','scheduler'])writeFileSync(join(dir,name+'.cjs'),compile(readFileSync('standalone/'+name+'.ts','utf8')).replace(/require\("\.\.\/lib\/radar\/([\w-]+)"\)/g,'require("./$1.cjs")'));
 for(const file of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(dir,file),readFileSync('lib/radar/'+file));
 mkdirSync(join(dir,'node_modules/zod'),{recursive:true});writeFileSync(join(dir,'node_modules/zod/index.js'),'module.exports=require('+JSON.stringify(require.resolve('zod'))+');');
 for(const name of process.argv.slice(2).length?process.argv.slice(2):['v4','v6','v7','v8','v9','v10','v11','v12','crawl','scale']){const source=compile(readFileSync('tests/'+name+'.test.ts','utf8')).replace(/require\("\.\.\/(?:lib\/radar|standalone)\/([\w-]+)"\)/g,'require("./$1.cjs")');const path=join(dir,name+'.cjs');writeFileSync(path,'(async()=>{'+source.replace('require("../lib/radar/suruga-snapshot.json")','require("./suruga-snapshot.json")')+'})().catch(e=>{console.error(e);process.exitCode=1;});');const r=spawnSync(process.execPath,[path],{stdio:'inherit'});if(r.error||r.signal||r.status!==0){console.error('Workflow test failed:',name,r.error?.message||r.signal||r.status);process.exitCode=r.status||1;break;}}
}finally{rmSync(dir,{recursive:true,force:true});}
