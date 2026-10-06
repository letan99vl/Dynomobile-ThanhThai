# 37TSR Dyno — PROJECT HANDOFF

## Current build
- Project: 37TSR Dyno / Dynomobile-ThanhThai
- Repository: letan99vl/Dynomobile-ThanhThai
- GitHub Pages: https://letan99vl.github.io/Dynomobile-ThanhThai/
- Current visible web PB: **PB 1.005**
- Main branch current handoff baseline: **d1dd7169a7ad58efaa3931e35434c705b6585f12**
- Deployment mode: GitHub Pages **Deploy from branch -> main / root**.
- The old duplicate custom Pages workflow was removed. Do not add a second Pages deploy workflow unless intentionally changing the deployment model.

## PB rule — IMPORTANT
Every user-visible web/app change MUST increment the PB shown in the header:
`2T · PB x.xxx`

Current PB: `1.005`

Recommended sequence:
`1.005 -> 1.006 -> 1.007 ...`

Whenever PB changes:
1. Update the header `#buildTag` in `index.html`.
2. Update "Current visible web PB" in this file.
3. Commit both changes.
4. Check the newest GitHub Pages run and only call the build live after that exact head SHA succeeds.

PB is the quickest way for the user to verify whether their browser/device is showing the newest deployed build.

---

# Key files
- `index.html` — main 37TSR web app.
- `firmware/DynoTL_Mobile_BLE_ESP32S3.ino` — ESP32-S3 firmware.
- `live/head.html`
- `live/rpm.html`
- `live/speed.html`
- `live/kpis.html`
- `live/info.html`

Live fragments may be fetched with a cache-busting version in `index.html`. If fragment content changes, bump that fragment cache key too.

---

# Product direction
This fork is for **37TSR**, focused on **2-stroke motorcycles**.

Visual rules:
- White / black / glass / transparent UI.
- LIVE RPM/SPEED gauges intentionally have no concentric face/inner circles; keep ticks, labels, needle, hub and numeric readout only.
- Classic analog gauges.
- Gauge needles: black.
- Gauge numeric readouts: black.
- HP: red `#ff2d2d`.
- Torque: green `#22c55e`.
- Speed: blue `#3b82f6`.
- Engine RPM: yellow `#facc15`.

AFR UI was intentionally removed for this 2-stroke fork.

The firmware still contains legacy AFR ADC/config/packet fields for protocol compatibility. Do not re-introduce AFR UI unless explicitly requested.

---

# ESP32-S3 hardware / firmware
Firmware:
`firmware/DynoTL_Mobile_BLE_ESP32S3.ino`

Important GPIO:
- GPIO18 = roller/wheel Hall sensor.
- GPIO16 = engine RPM pickup.
- GPIO6 = shift-light output, 3.3 V logic.
- GPIO4 = legacy AFR ADC, still present in firmware only.

BLE:
- Device name currently still `BT Speed Dyno`.
- Service UUID: `d7a10001-7c35-4a6d-9f0e-2ea3117f1000`
- Live characteristic: `d7a10002-7c35-4a6d-9f0e-2ea3117f1000`
- Command characteristic: `d7a10003-7c35-4a6d-9f0e-2ea3117f1000`
- Status characteristic: `d7a10005-7c35-4a6d-9f0e-2ea3117f1000`

Filtered live packet:
`D,timeMs,wheelRPM,engineRPM,afrVoltage,hallPulseCount,hallPulseMs`

201m raw pulse event:
`P,pulseCount,pulseUs`

For `P`, the second timestamp field is now **microseconds from micros()**, not milliseconds.

---

# Roller RPM / Live / HP-Torque
The normal Live and dyno calculation path MUST stay filtered.

Roller Hall:
- direct interrupt on GPIO18
- rising edge
- false-pulse rejection
- absolute minimum Hall period: **6000 us**
- dynamic early gate based on previous valid period
- startup Median-5 validation
- filtered roller period
- filtered output RPM

Engine RPM:
- PCNT input on GPIO16
- runtime-adjustable pulse period filter
- default filter: 250 us

Live / HP / Torque use the filtered roller RPM path.
Do NOT replace Live/HP/Torque with the raw 201m pulse-to-pulse speed path.

---

# 201m / 1/8 mile logic — IMPORTANT
The 201m mode is intentionally separated from normal filtered dyno speed.

## Start
When user presses RUN 201m:
1. Web sends `201ARM`.
2. ESP32-S3 arms the raw Hall race path.
3. The **next valid Hall pulse** is the start event.
4. That pulse = **0.000 s and 0 m**.
5. It does NOT wait for Median-5 roller RPM startup.

Firmware commands:
- `201ARM`
- `201DISARM`

Status responses:
- `201ARMED`
- `201DISARMED`

## During race
After the first valid pulse, ESP32 queues every valid Hall pulse for the race path.

The raw 201m pulse queue size is 16.

Firmware emits:
`P,pulseCount,pulseUs`

The 201m web logic uses ONLY `P` events for:
- race distance
- raw roller speed
- raw roller RPM
- split timing

The periodic filtered `D` packet MUST NOT advance 201m distance or calculate 201m speed when raw P event mode is active.

## Distance
Distance is:
`valid pulses since start * pi * wheel diameter`

Default wheel diameter is 240 mm, editable in the 201m page.

## Raw speed
Raw race speed is calculated from the period between valid pulses:
`speed = pulse distance / pulse-to-pulse time`

The race path uses **microsecond timestamps**.

The web rejects impossible pulse timing:
`dtUs < 6000 * pulseStep`

This protects against transport/timestamp glitches that previously produced several-thousand-km/h spikes.

## Splits
Current split marks:
- 60 ft = 18.288 m
- 1/16 mile = 100.584 m
- 201 m = 201.000 m
- 1/8 mile = 201.168 m

When a split lies between two Hall pulses, the web interpolates the crossing time between the previous and current pulse. Do not simply use the later pulse timestamp.

---

# Shift light
Settings:
- enable / disable
- light-on RPM
- blink RPM

ESP32 config keys:
- `SL` = enable
- `SR` = light RPM
- `SB` = blink RPM

GPIO6 behavior:
- disabled / below threshold = LOW
- above ON RPM = HIGH
- above blink RPM = toggle every 100 ms

GPIO6 is logic output only. Large lamps require a transistor/driver.

---

# ESP32 NVS settings
ESP32-S3 is intended to be the settings source of truth after initial migration.

Relevant keys include:
- wheel diameter
- vehicle inertia
- max RPM display
- max speed display
- ignition cycle
- engine RPM filter
- auto start
- auto end run
- auto thresholds
- shift-light settings
- smoothing level

Web localStorage remains a cache/fallback.

---

# 201m UI
Desktop/tablet:
- balanced 2x2 dashboard
- top-left: live race data
- top-right: split times
- bottom-left: RPM vs distance graph
- bottom-right: run history

Small phones:
- use three views:
  - DATA
  - GRAPH
  - RUNS
- DATA is the default and prioritizes live numbers + split times.
- GRAPH gives the chart the full content area.
- RUNS gives history the full content area.
- Phone breakpoint was widened to catch landscape phones with CSS viewport widths above 900 px.

Do not force all four quadrants onto a small phone again; it becomes unreadably small.

---

# Background image
A 2-stroke expansion chamber image was requested as background.

This work was deprioritized because it did not render reliably on the user's browser/device. The user explicitly said to leave it for later.

Do not spend time on the background unless the user asks to resume it.

---

# Known cleanup opportunities
1. Rename BLE device from `BT Speed Dyno` to a 37TSR-specific name if requested.
2. Remove legacy AFR firmware/config fields only if compatibility impact is reviewed first.
3. Shift-light RPM currently follows firmware engine RPM directly; if 720-degree ignition-cycle correction becomes important, review whether threshold comparison should use corrected displayed RPM.
4. Background image task is unresolved/deferred.

---

# Working rules for the next assistant
- Work directly in `letan99vl/Dynomobile-ThanhThai`.
- Preserve working 201m raw Hall logic.
- Preserve filtered Live/HP/Torque logic.
- Do not weaken Hall false-pulse rejection just to make 201m start faster.
- First valid Hall pulse after `201ARM` must remain race T=0.
- Never make the 201m distance depend on filtered RPM when raw P events are available.
- Increment PB for every user-visible web build.
- Update this handoff file after meaningful architecture/firmware/UI changes.
- Check newest GitHub Pages run after commits.
- Rapid commits can supersede/cancel older Pages runs; only the newest head matters.


---

# iOS native app / IPA
A native iOS shell now exists in `ios/`, following the proven BLINK REDLEO pattern but simplified for 37TSR Dyno.

Architecture:
- Swift native shell
- WKWebView
- Native CoreBluetooth bridge
- Local bundled 37TSR UI
- No dependency on Safari/Bluefy Web Bluetooth for the installed iOS app

Identity:
- Product: `37TSR Dyno`
- Bundle ID: `vn.tsr37.dyno`
- Version: `1.0 (1)`
- Minimum iOS: `15.0`
- Target: iPhone + iPad
- Current bundled UI: `PB 1.004`

Important iOS files:
- `ios/project.yml`
- `ios/prepare_xcode_project.sh`
- `ios/TSRDyno/AppDelegate.swift`
- `ios/TSRDyno/MainViewController.swift`
- `ios/TSRDyno/BLEBridge.swift`
- `ios/TSRDyno/Info.plist`
- `ios/TSRDyno/PrivacyInfo.xcprivacy`
- `ios/TSRDyno/LaunchScreen.storyboard`
- `ios/TSRDyno/Resources/native_bridge_ios.js`
- `ios/TSRDyno/Resources/ios_fullscreen_fix.js`
- `ios/tools/prepare_web.py`
- `ios/tools/make_icons.py`

BLE contract used by iOS:
- Service: `d7a10001-7c35-4a6d-9f0e-2ea3117f1000`
- LIVE: `d7a10002-7c35-4a6d-9f0e-2ea3117f1000`
- COMMAND: `d7a10003-7c35-4a6d-9f0e-2ea3117f1000`
- STATUS: `d7a10005-7c35-4a6d-9f0e-2ea3117f1000`

Build workflow:
- `.github/workflows/build-ios-ipa.yml`
- macOS runner
- XcodeGen
- unsigned Release iphoneos build
- artifact name: `37TSR-Dyno-iOS-PB-1.004-unsigned`

Verified successful workflow run:
- Run ID: `37438042617`
- Head: `d1dd7169a7ad58efaa3931e35434c705b6585f12`
- Xcode build: success
- IPA packaging: success
- Artifact upload: success

Unsigned IPA:
- Intended for sideload/signing workflows.
- It is not directly uploadable to TestFlight/App Store Connect without Apple distribution signing.
- For TestFlight, add the Apple signing/upload workflow or archive/sign in Xcode using the owner's Apple Developer Team.

The iOS bundle preparation script copies the current web UI and inlines the LIVE fragments so WKWebView does not depend on local `fetch(file://...)`.

- PB 1.005: removed two accidental literal \\n text tokens from HTML markup; one had been rendered by Chrome at the top-left above the app header.
