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

# Keep the bundled iOS build self-contained and remove PWA-only manifest loading.
html = re.sub(r'<link rel="manifest"[^>]*>\s*', '', html)

# Inline LIVE fragments so WKWebView does not depend on fetch(file://...).
parts = [
    (ROOT / "live" / "head.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "rpm.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "kpis.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "speed.html").read_text(encoding="utf-8"),
    (ROOT / "live" / "info.html").read_text(encoding="utf-8"),
]
payload = json.dumps(parts, ensure_ascii=False)

pattern = re.compile(
    r" function getText\(path\)\{return fetch\(path\+'\?v=[^']+'\)\.then\(function\(r\)\{if\(!r\.ok\)throw new Error\(path\+' '\+r\.status\);return r\.text\(\)\}\)\}\s*"
    r" Promise\.all\(\[\s*getText\('live/head\.html'\),getText\('live/rpm\.html'\),getText\('live/kpis\.html'\),getText\('live/speed\.html'\),getText\('live/info\.html'\)\s*\]\)\.then\(function\(p\)\{\s*"
    r"mount\.innerHTML=p\[0\]\+'<div class="live-gauge-grid">'\+p\[1\]\+p\[2\]\+p\[3\]\+'</div>'\+p\[4\];\s*"
    r"startPcLive\(\);\s*"
    r"\}\)\.catch\(function\(e\)\{mount\.innerHTML='<div class="pc-live-loading">LIVE LOAD ERROR</div>';console\.error\(e\)\}\);",
    re.S
)

replacement = (
    " var p=" + payload + ";\n"
    " mount.innerHTML=p[0]+'<div class=\"live-gauge-grid\">'+p[1]+p[2]+p[3]+'</div>'+p[4];\n"
    " startPcLive();"
)

html, count = pattern.subn(replacement, html, count=1)
if count != 1:
    raise RuntimeError("Could not inline LIVE fragments; index loader signature changed")

# The background experiment is deferred; keep iOS clean and local.
html = re.sub(r'<img id="exhaustBgDirect"[^>]*>\s*', '', html)
html = html.replace(
    "</head>",
    "<style id=\"ios-bundled-clean\">#exhaustBgDirect,#exhaustBgLayer{display:none!important}</style>\n</head>",
    1
)

if "PB 1.004" not in html:
    raise RuntimeError("Expected PB 1.004 was not found in bundled UI")

(OUT / "index.html").write_text(html, encoding="utf-8")

# Copy assets defensively for any remaining relative URL references.
assets = ROOT / "assets"
out_assets = OUT / "assets"
if out_assets.exists():
    shutil.rmtree(out_assets)
if assets.exists():
    shutil.copytree(assets, out_assets)

print("Prepared local 37TSR iOS Web bundle at PB 1.004")
