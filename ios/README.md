# 37TSR Dyno iOS

Native iOS shell for 37TSR Dyno.

- Swift + WKWebView
- Native CoreBluetooth bridge
- Bundled local UI
- Bundle ID: `vn.tsr37.dyno`
- Version: `1.0 (1)`
- Minimum iOS: 15.0
- Current bundled UI target: current visible PB from index.html

Build locally on macOS:

```bash
cd ios
brew install xcodegen
chmod +x prepare_xcode_project.sh
./prepare_xcode_project.sh
open TSRDyno.xcodeproj
```

Unsigned IPA is generated automatically by the GitHub Actions workflow.
