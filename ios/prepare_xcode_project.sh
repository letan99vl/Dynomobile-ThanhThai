#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v xcodegen >/dev/null 2>&1; then
  echo "Install XcodeGen first: brew install xcodegen"
  exit 1
fi
python3 tools/prepare_web.py
python3 tools/make_icons.py
xcodegen generate
echo "Generated: $(pwd)/TSRDyno.xcodeproj"
