import {build} from 'vite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const directory=mkdtempSync(join(tmpdir(),'radar-runtime-tests-'));
try{
 await build({configFile:false,logLevel:'error',resolve:{alias:{'@':resolve('.')}},ssr:{noExternal:['zod']},build:{ssr:resolve(process.argv[2]||'tests/runtime.test.ts'),outDir:directory,target:'node24',rollupOptions:{output:{entryFileNames:'test.mjs'}}}});
 await import(pathToFileURL(join(directory,'test.mjs')).href);
}finally{rmSync(directory,{recursive:true,force:true});}
