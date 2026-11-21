import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.resolve(root, "../web");
const www = path.join(root, "www");

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "sw.js") continue; // native app: no stale SW
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

rmrf(www);
copyDir(web, www);
// Mark native shell in index for diagnostics
const indexPath = path.join(www, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(
  "</head>",
  `<meta name="atdd-shell" content="capacitor-ios-ble" />\n</head>`,
);
fs.writeFileSync(indexPath, html);
console.log("sync-www: copied atdd/web → atdd/ios/www");
