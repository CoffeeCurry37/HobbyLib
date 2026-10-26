"""Deterministic, unpacked Chrome/Edge extension distribution."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
output=root/'public/collector-radar-browser.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted((root/'browser-extension').glob('*')):
        if not p.is_file():continue
        info=zipfile.ZipInfo('collector-radar-browser/'+p.name,(2026,9,28,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        archive.writestr(info,p.read_bytes())
print(str(output))
