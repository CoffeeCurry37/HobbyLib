import {spawnSync} from 'node:child_process';
// Preserve the locked dependency graph on Windows; the existing Linux installer keeps its leases.
const win=process.platform==='win32';
const r=win?spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','pnpm install --frozen-lockfile'],{stdio:'inherit',windowsVerbatimArguments:true}):spawnSync('bash',['scripts/install-pnpm.sh'],{stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
