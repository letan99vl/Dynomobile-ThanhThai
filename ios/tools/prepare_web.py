#!/usr/bin/env python3
from pathlib import Path
import json
import re
import shutil

IOS = Path(__file__).resolve().parents[1]
ROOT = IOS.parent
OUT = IOS / "TSRDyno" / "Web"

OUT.mkdir(parents=True, exist_ok=True)
html = (ROOT / "index.html").read_text(encoding="utf-8")

html = re.sub(r'<link rel="manifest"[^>]*>\s*', '', html)

parts = [
    (ROOT / "live" / "head.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "rpm.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "kpis.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "speed.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "info.html").read_text(encoding="utf-8"),
]
payload = json.dumps(parts, ensure_ascii=False)

start_marker = " function getText(path){return fetch(path+'?v="
end_marker = " }).catch(function(e){mount.innerHTML='<div class=\"pc-live-loading\">LIVE LOAD ERROR</div>';console.error(e)});"

start = html.find(start_marker)
if start < 0:
    raise RuntimeError("LIVE loader start was not found")

end = html.find(end_marker, start)
if end < 0:
    raise RuntimeError("LIVE loader end was not found")
end += len(end_marker)

replacement = (
    " var p=" + payload + ";\n"
    " mount.innerHTML=p[0]+'<div class=\"live-gauge-grid\">'+p[1]+p[2]+p[3]+'</div>'+p[4];\n"
    " startPcLive();"
)

html = html[:start] + replacement + html[end:]

html = re.sub(r'<img id="exhaustBgDirect"[^>]*>\s*', '', html)
html = html.replace(
    "</head>",
    "<style id=\"ios-bundled-clean\">#exhaustBgDirect,#exhaustBgLayer{display:none!important}</style>\n</head>",
    1,
)

if not re.search(r"PB\s+\d+\.\d+", html):
    raise RuntimeError("Visible PB tag was not found in bundled UI")

(OUT / "index.html").write_text(html, encoding="utf-8")

assets = ROOT / "assets"
out_assets = OUT / "assets"
if out_assets.exists():
    shutil.rmtree(out_assets)
if assets.exists():
    shutil.copytree(assets, out_assets)

m = re.search(r"PB\s+(\d+\.\d+)", html)
print(f"Prepared local 37TSR iOS Web bundle at PB {m.group(1) if m else 'unknown'}")
