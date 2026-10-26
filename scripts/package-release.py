"""Package compiled runtime only; source remains in the Sites repository."""
from pathlib import Path
import json, shutil, sys, tempfile, zipfile

root=Path(__file__).resolve().parents[1]
output=Path(sys.argv[1]).resolve()
with tempfile.TemporaryDirectory(prefix='radar-release-') as temp:
    package=Path(temp)/'collector-radar'
    package.mkdir()
    shutil.copytree(root/'dist-standalone',package/'dist-standalone')
    shutil.copy(root/'standalone/start.mjs',package/'start.mjs')
    shutil.copy(root/'standalone/setup-browser.mjs',package/'setup-browser.mjs')
    shutil.copy(root/'VERIFICATION.md',package/'VERIFICATION.md')
    shutil.copytree(root/'browser-extension',package/'browser-extension')
    (package/'package.json').write_text(json.dumps({'name':'collector-radar-runtime','version':'0.14.0','private':True,'type':'module','engines':{'node':'>=24'}}))
    for filename in ['FIND-NODE.cmd','START-WINDOWS.cmd','SETUP-BROWSER.cmd']:
        (package/filename).write_bytes((root/'standalone'/filename).read_text().replace('\n','\r\n').encode('utf-8'))
    shutil.copy(root/'standalone/WINDOWS-QUICKSTART.html',package/'WINDOWS-QUICKSTART.html')
    (package/'START-BROWSER-WINDOWS.cmd').write_bytes(b'@echo off\r\ncd /d "%~dp0"\r\nset RADAR_BROWSER=1\r\ncall "%~dp0START-WINDOWS.cmd"\r\n')
    shutil.copy(root/'standalone/README.zh-CN.md',package/'README.zh-CN.md')
    (package/'Dockerfile.standalone').write_text('FROM node:24-bookworm-slim\nWORKDIR /app\nCOPY dist-standalone ./dist-standalone\nENV HOST=0.0.0.0 PORT=8080 RADAR_DATA_DIR=/data\nRUN mkdir /data && chown node:node /data\nUSER node\nEXPOSE 8080\nCMD ["node","dist-standalone/server/server.mjs"]\n')
    shutil.copy(root/'compose.yaml',package/'compose.yaml')
    if len(sys.argv)>2:
        (package/'data').mkdir()
        shutil.copy(Path(sys.argv[2]).resolve(),package/'data/radar.sqlite')
        shutil.copy(root/'standalone/DEPLOY-AND-CONTINUE.zh-CN.md',package/'DEPLOY-AND-CONTINUE.zh-CN.md')
    if len(sys.argv)>3:
        shutil.copy(Path(sys.argv[3]).resolve(),package/'release-info.json')
    if len(sys.argv)>4:
        shutil.copy(Path(sys.argv[4]).resolve(),package/'PREVIOUS-DATA-BACKUP.json.gz')
    notices=[]
    manifest=json.loads((root/'package.json').read_text())
    for name in manifest['dependencies']:
        folder=root/'node_modules'/name
        for filename in ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md']:
            path=folder/filename
            if path.exists():
                notices.append(name+'\n'+path.read_text(errors='replace')+'\n')
                break
    (package/'THIRD_PARTY_NOTICES.txt').write_text('\n'.join(notices))
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package.rglob('*')):
            if path.is_file():archive.write(path,path.relative_to(package.parent))
print(json.dumps({'path':str(output),'bytes':output.stat().st_size}))
