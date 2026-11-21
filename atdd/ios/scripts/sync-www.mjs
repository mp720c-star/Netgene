/**
 * Assemble Capacitor www for ATDD Connect Build 2.
 * Primary UI = classic ATDD diagnostic shell (Bluetooth · Connect Scanner on main screen).
 * Secondary = prior Connect Scanner + CDI Genius at ./connect/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atdd = path.resolve(root, "..");
const classic = path.join(atdd, "classic");
const web = path.join(atdd, "web");
const ble = path.join(atdd, "ble");
const obd = path.join(atdd, "obd");
const www = path.join(root, "www");

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dest, { skip = [] } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to, { skip });
    else fs.copyFileSync(from, to);
  }
}

rmrf(www);
fs.mkdirSync(www, { recursive: true });

// 1) Classic diagnostic shell = native home
copyDir(classic, www, { skip: ["tests", "SOURCE.txt"] });

// 2) Prior ATDD+CDI Connect Scanner under /connect/
copyDir(web, path.join(www, "connect"), { skip: ["sw.js"] });

// 3) Keep shared BLE/OBD modules available to connect/ for ESM imports
for (const file of [
  "capacitor-ble-transport.js",
  "web-bluetooth-transport.js",
  "scanner-session.js",
  "scanner-ui.js",
  "fixd-protocol-probe.js",
  "wifi-obd-transport.js",
  "vehicles.js",
  "build-info.js",
]) {
  const src = path.join(ble, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(www, "connect", "js", file));
  }
}
fs.copyFileSync(
  path.join(obd, "obd-protocol-v3-frame-aware.js"),
  path.join(www, "connect", "js", "obd-protocol-v3-frame-aware.js"),
);
fs.copyFileSync(path.join(obd, "pids.js"), path.join(www, "connect", "js", "pids.js"));

// 4) Mark native shell + Build 2 stamp in classic index
const indexPath = path.join(www, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes('name="atdd-shell"')) {
  html = html.replace(
    "</head>",
    `  <meta name="atdd-shell" content="capacitor-ios-ble" />\n  <meta name="atdd-build" content="1.2.0-build.2" />\n</head>`,
  );
}
html = html.replace(
  /<span class="ver" id="appVersion">v1\.2\.0<\/span>/,
  '<span class="ver" id="appVersion">v1.2.0 Build 2</span>',
);
html = html.replace(
  /<span id="footerVersion">v1\.2\.0<\/span>/,
  '<span id="footerVersion">v1.2.0 Build 2</span>',
);
// Classic CSP blocks nothing needed for Cap bridge (capacitor injects before page scripts).
fs.writeFileSync(indexPath, html);

// 5) Relax connect/index apple title consistency
const connectIndex = path.join(www, "connect", "index.html");
if (fs.existsSync(connectIndex)) {
  let chtml = fs.readFileSync(connectIndex, "utf8");
  if (!chtml.includes('name="atdd-shell"')) {
    chtml = chtml.replace(
      "</head>",
      `  <meta name="atdd-shell" content="capacitor-ios-ble" />\n</head>`,
    );
  }
  fs.writeFileSync(connectIndex, chtml);
}

// 6) Mirror into Xcode App/public so the tree is consistent before `cap sync`
const appPublic = path.join(root, "ios", "App", "App", "public");
rmrf(appPublic);
copyDir(www, appPublic);
console.log("sync-www: classic → www (home), web → www/connect, mirrored → ios/App/App/public");
