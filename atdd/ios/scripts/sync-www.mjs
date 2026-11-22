import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.resolve(root, "../web");
const classic = path.resolve(root, "../classic");
const out = path.join(root, "www");
const platform = process.argv[2] ?? "ios";
if (!["ios", "android"].includes(platform)) throw new Error("Choose ios or android");

function copySite(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (file) => !["sw.js", "tests", "SOURCE.txt"].includes(path.basename(file)),
  });
}

function replaceOnce(html, original, replacement) {
  if (html.split(original).length !== 2) throw new Error("Missing or repeated HTML anchor: " + original);
  return html.replace(original, () => replacement);
}

fs.rmSync(out, { recursive: true, force: true });
if (platform === "android") {
  copySite(web, out);
  const entry = path.join(out, "index.html");
  const html = fs.readFileSync(entry, "utf8");
  fs.writeFileSync(entry, replaceOnce(html, "</head>", '<meta name="atdd-shell" content="capacitor-ios-ble" />\n</head>'));
} else {
  copySite(classic, out);
  const tools = path.join(out, "tools");
  copySite(web, tools);
  fs.cpSync(path.join(root, "scanner"), path.join(out, "scanner"), { recursive: true });
  const entry = path.join(out, "index.html");
  let html = fs.readFileSync(entry, "utf8").replace(/\r\n/g, "\n");
  html = replaceOnce(html, '<script src="./bluetooth.js"></script>', '<script type="module" src="./scanner/iphone-scanner.js"></script>');
  html = replaceOnce(html, '<details class="extra card">\n        <summary>Privacy', '<p><a href="./tools/index.html#cdi">CDI ignition diagnostics</a></p>\n      <details class="extra card">\n        <summary>Privacy');
  fs.writeFileSync(entry, html);
  const cdi = path.join(tools, "index.html");
  let cdiHtml = fs.readFileSync(cdi, "utf8");
  cdiHtml = replaceOnce(cdiHtml, '<nav class="nav" aria-label="Primary">', '<nav class="nav" aria-label="Primary">\n    <a href="../index.html">Back to Auto/Truck Diagnostics</a>');
  cdiHtml = cdiHtml.replace(/^.*<link [^>]*https:\/\/fonts\.(googleapis|gstatic)\.com[^>]*>\r?\n/gm, "");
  cdiHtml = replaceOnce(cdiHtml, "if ('serviceWorker' in navigator)", "if (!window.Capacitor?.isNativePlatform?.() && 'serviceWorker' in navigator)");
  fs.writeFileSync(cdi, cdiHtml);
}
console.log("Packaged " + platform + " launch page from " + (platform === "ios" ? "atdd/classic" : "atdd/web"));
