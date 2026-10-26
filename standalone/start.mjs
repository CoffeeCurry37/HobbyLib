import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
// The release pack places this file at its root; source users use pnpm start:standalone.
const directory=dirname(fileURLToPath(import.meta.url));process.chdir(directory);
if(Number(process.versions.node.split('.')[0])<24){console.error('Collector Radar requires Node.js 24 or newer.');process.exit(1);}
const data=resolve('data');mkdirSync(data,{recursive:true,mode:0o700});
const passwordFile=resolve(data,'studio-password.txt');if(!existsSync(passwordFile))writeFileSync(passwordFile,randomBytes(18).toString('base64url'),{mode:0o600,flag:'wx'});
process.env.RADAR_PASSWORD=readFileSync(passwordFile,'utf8').trim();process.env.RADAR_DATA_DIR=data;process.env.HOST='127.0.0.1';process.env.PORT='8080';process.env.RADAR_ORIGIN='http://localhost:8080';
console.log('Collector Radar: http://localhost:8080');
console.log('Your local studio password is saved in data/studio-password.txt. Open that file and copy it into the login page.');
console.log('Keep this window open while running locally. For 24/7 operation, use the included server deployment instructions.');
if(process.platform==='win32')setTimeout(()=>spawn('cmd',['/c','start','','http://localhost:8080'],{stdio:'ignore'}).unref(),1500);
await import('./dist-standalone/server/server.mjs');
