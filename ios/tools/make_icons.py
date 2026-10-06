#!/usr/bin/env python3
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "TSRDyno" / "Assets.xcassets" / "AppIcon.appiconset"
SVG = Path(__file__).with_name("37TSR-AppIcon.svg")
SIZES = [20,29,40,58,60,76,80,87,120,152,167,180,1024]

def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

if shutil.which("sips") is None:
    raise RuntimeError("sips is required on macOS")

OUT.mkdir(parents=True, exist_ok=True)
master = OUT / "_37tsr-master.jpg"

run("sips", "-s", "format", "jpeg", "-s", "formatOptions", "100",
    str(SVG), "--out", str(master))

for size in SIZES:
    out = OUT / f"icon-{size}.png"
    run("sips", "--resampleHeightWidth", str(size), str(size),
        "-s", "format", "png", str(master), "--out", str(out))

master.unlink(missing_ok=True)
print(f"Generated {len(SIZES)} 37TSR app icons")
