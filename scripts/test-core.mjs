import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'radar-tests-'));
try{
 for(const name of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))writeFileSync(join(dir,name+'.cjs'),ts.transpileModule(readFileSync('lib/radar/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\(\"\.\/([\w-]+)\"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(dir,f),readFileSync('lib/radar/'+f));
 const result=spawnSync(process.execPath,['--test','tests/core.test.cjs'],{stdio:'inherit',env:{...process.env,RADAR_TEST_TMP:dir}});process.exitCode=result.status??1;
}finally{rmSync(dir,{recursive:true,force:true});}
