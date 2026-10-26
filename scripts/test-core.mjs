import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'radar-tests-'));
process.once('exit',()=>rmSync(dir,{recursive:true,force:true}));
try{
 for(const name of readdirSync('lib/radar').filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))writeFileSync(join(dir,name+'.cjs'),ts.transpileModule(readFileSync('lib/radar/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText.replace(/require\(\"\.\/([\w-]+)\"\)/g,'require("./$1.cjs")'));
 for(const f of readdirSync('lib/radar').filter(f=>f.endsWith('.json')))writeFileSync(join(dir,f),readFileSync('lib/radar/'+f));
 // Run the node:test module in this process. Nested test-runner child launches
 // can report a file-level success without executing its registered cases in
 // restricted runtimes; direct import reports every case and its exit status.
 process.env.RADAR_TEST_TMP=dir;await import('../tests/core.test.cjs');
}catch(error){rmSync(dir,{recursive:true,force:true});throw error;}
