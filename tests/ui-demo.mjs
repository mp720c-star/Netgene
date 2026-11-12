import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: ["--window-size=1100,1000"]
});
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
await page.goto("http://127.0.0.1:8765/Index.html", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

const title = await page.locator("#appTitle").innerText();
if (title !== "Ravin Lookup") {
  throw new Error(`Unexpected title: ${title}`);
}

async function runCase({ type, brand, model, symptom, expect, shot }) {
  await page.selectOption("#vehicleType", type);
  await page.selectOption("#vehicleBrand", brand);
  await page.selectOption("#vehicleModel", model);
  await page.fill("#symptom", symptom);
  await page.click("#diagnoseBtn");
  const results = await page.locator("#results").innerText();
  if (!results.toLowerCase().includes(expect.toLowerCase())) {
    throw new Error(`Diagnosis mismatch for ${type}: ${results}`);
  }
  await page.screenshot({ path: path.join(outDir, shot), fullPage: true });
  console.log(`PASS ${type}: ${results}`);
  await page.waitForTimeout(1200);
}

await runCase({
  type: "Car/Truck",
  brand: "Toyota",
  model: "RAV4 1995",
  symptom: "won't start",
  expect: "battery",
  shot: "ravin-demo-car-truck.png"
});

await runCase({
  type: "Dirt Bike/Moto",
  brand: "Yamaha",
  model: "YZ250F 2021",
  symptom: "no spark",
  expect: "CDI",
  shot: "ravin-demo-dirt-bike.png"
});

await runCase({
  type: "ATV/4-Wheeler",
  brand: "Can-Am",
  model: "Maverick X3 2021",
  symptom: "overheating",
  expect: "coolant",
  shot: "ravin-demo-atv.png"
});

await page.locator("#history").scrollIntoViewIfNeeded();
await page.screenshot({
  path: path.join(outDir, "ravin-demo-history-all-three.png"),
  fullPage: true
});

const history = await page.locator("#history").innerText();
for (const needle of ["RAV4 1995", "YZ250F 2021", "Maverick X3 2021"]) {
  if (!history.includes(needle)) {
    throw new Error(`History missing ${needle}`);
  }
}

console.log("UI demo complete — all three categories OK");
await page.waitForTimeout(4000);
await browser.close();
