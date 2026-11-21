#!/bin/bash
set -euo pipefail
device=$(xcrun simctl list devices available --json | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
groups = sorted((key for key in devices if ".iOS-" in key), reverse=True)
phones = [d for key in groups for d in devices[key] if "iPhone" in d["name"] and d["isAvailable"]]
preferred = next((d for d in phones if d["name"] == "iPhone 17 Pro Max"), None)
print((preferred or phones[0])["udid"])
')
xcrun simctl bootstatus "$device" -b > "$RUNNER_TEMP/atdd-simulator-boot.log"
xcrun simctl status_bar "$device" override --time "9:41" || true
derived="$RUNNER_TEMP/ATDD-simulator"
if ! xcodebuild -workspace "$WORKSPACE" -scheme App -configuration Debug -destination "id=$device" \
    -derivedDataPath "$derived" CODE_SIGNING_ALLOWED=NO build >"$RUNNER_TEMP/atdd-simulator-build.log" 2>&1; then
  tail -60 "$RUNNER_TEMP/atdd-simulator-build.log"
  exit 1
fi
app="$derived/Build/Products/Debug-iphonesimulator/App.app"
node atdd/ios/scripts/verify-ios-content.mjs "$app/public"
xcrun simctl install "$device" "$app"
xcrun simctl launch "$device" "$BUNDLE_ID"
xcrun swiftc atdd/ios/tests/read-simulator-screen.swift -o "$RUNNER_TEMP/read-atdd-screen"
for attempt in {1..12}; do
  xcrun simctl io "$device" screenshot "$RUNNER_TEMP/ATDD-iPhone.png" > /dev/null 2>&1
  if "$RUNNER_TEMP/read-atdd-screen" "$RUNNER_TEMP/ATDD-iPhone.png"; then exit 0; fi
  sleep 3
done
exit 1
