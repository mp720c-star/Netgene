/**
 * Linux-side validation that the iOS ATDD Connect tree is structurally buildable.
 * Does not run xcodebuild (requires macOS). Fails loud on missing Build 2 pieces.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ios = path.join(root, "ios");
const app = path.join(ios, "ios", "App");

const required = [
  path.join(app, "App.xcodeproj", "project.pbxproj"),
  path.join(app, "App.xcworkspace", "contents.xcworkspacedata"),
  path.join(app, "App", "Info.plist"),
  path.join(app, "App", "AppDelegate.swift"),
  path.join(app, "App", "ObdWifiPlugin.swift"),
  path.join(app, "Podfile"),
  path.join(ios, "capacitor.config.json"),
  path.join(ios, "package.json"),
  path.join(ios, "scripts", "sync-www.mjs"),
];

for (const file of required) {
  assert.ok(fs.existsSync(file), `missing required iOS file: ${file}`);
}

const pbx = fs.readFileSync(path.join(app, "App.xcodeproj", "project.pbxproj"), "utf8");
assert.match(pbx, /PRODUCT_BUNDLE_IDENTIFIER = com\.netgene\.atdd\.ble/);
assert.match(pbx, /MARKETING_VERSION = 1\.2\.0/);
assert.match(pbx, /CURRENT_PROJECT_VERSION = 2/);
assert.match(pbx, /ObdWifiPlugin\.swift/);

const plist = fs.readFileSync(path.join(app, "App", "Info.plist"), "utf8");
assert.match(plist, /NSBluetoothAlwaysUsageDescription/);
assert.match(plist, /NSLocalNetworkUsageDescription/);
assert.match(plist, /ATDD Connect/);

const pkg = JSON.parse(fs.readFileSync(path.join(ios, "package.json"), "utf8"));
assert.ok(pkg.dependencies["@capacitor-community/bluetooth-le"]);
assert.ok(pkg.dependencies["@capacitor/ios"]);

const cap = JSON.parse(fs.readFileSync(path.join(ios, "capacitor.config.json"), "utf8"));
assert.equal(cap.appId, "com.netgene.atdd.ble");
assert.equal(cap.appName, "ATDD Connect");

// Ensure www sync produces classic Bluetooth button.
const { spawnSync } = await import("node:child_process");
const sync = spawnSync(process.execPath, [path.join(ios, "scripts", "sync-www.mjs")], {
  encoding: "utf8",
});
assert.equal(sync.status, 0, sync.stderr || sync.stdout);
const wwwIndex = fs.readFileSync(path.join(ios, "www", "index.html"), "utf8");
assert.match(wwwIndex, /btnBluetoothTop/);
assert.match(wwwIndex, /Bluetooth · Connect Scanner/);
assert.match(wwwIndex, /atdd-shell/);
assert.match(wwwIndex, /1\.2\.0 Build 2/);
assert.ok(fs.existsSync(path.join(ios, "www", "bluetooth.js")));
assert.ok(fs.existsSync(path.join(ios, "www", "connect", "js", "scanner-ui.js")));
assert.ok(fs.existsSync(path.join(ios, "www", "connect", "js", "wifi-obd-transport.js")));
assert.ok(fs.existsSync(path.join(ios, "www", "connect", "data", "cdi-models.json")));

console.log(
  JSON.stringify(
    {
      ok: true,
      bundleId: "com.netgene.atdd.ble",
      marketingVersion: "1.2.0",
      buildNumber: 2,
      wwwHasBluetoothButton: true,
      obdWifiPlugin: true,
      xcodebuild: "NOT_RUN (Linux agent — macOS required)",
    },
    null,
    2,
  ),
);
