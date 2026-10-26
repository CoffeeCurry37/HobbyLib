import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
process.chdir(dirname(fileURLToPath(import.meta.url)));
import {spawnSync} from 'node:child_process';
const npm=process.platform==='win32'?'npm.cmd':'npm',npx=process.platform==='win32'?'npx.cmd':'npx';
for(const [command,args] of [[npm,['install','--no-save','--no-package-lock','playwright']],[npx,['playwright','install','chromium']]]){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});if(result.status!==0)process.exit(result.status||1);
}
console.log('Browser component installed. Use START-BROWSER-WINDOWS.cmd for background rendering and local account reading.');
