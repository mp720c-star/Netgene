const assert = require("assert");
const path = require("path");
const fs = require("fs");
const vm = require("vm");

function loadVehicles() {
  const code = fs.readFileSync(path.join(__dirname, "..", "vehicles-data.js"), "utf8");
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(code, context);
  return context.module.exports.vehicles;
}

function loadDiagnose() {
  const code = fs.readFileSync(path.join(__dirname, "..", "app-logic.js"), "utf8");
  const context = {
    module: { exports: {} },
    exports: {},
    document: { addEventListener() {} },
    window: {},
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    }
  };
  vm.runInNewContext(code, context);
  return context.module.exports;
}

const vehicles = loadVehicles();
const { diagnose } = loadDiagnose();

const TYPES = ["Car/Truck", "Dirt Bike/Moto", "ATV/4-Wheeler"];

for (const type of TYPES) {
  assert.ok(vehicles[type], `missing vehicle type: ${type}`);
  const brands = Object.keys(vehicles[type]);
  assert.ok(brands.length > 0, `${type} has no brands`);
  for (const brand of brands) {
    assert.ok(
      Array.isArray(vehicles[type][brand]) && vehicles[type][brand].length > 0,
      `${type}/${brand} has no models`
    );
  }
}

assert.ok(vehicles["Car/Truck"]["Kia"].includes("Sorento 2003"));
assert.ok(vehicles["Car/Truck"]["Toyota"].some((m) => m.startsWith("RAV4")));
assert.ok(!String(vehicles["Dirt Bike/Moto"]["Honda"][0]).includes("placeholder"));
assert.ok(!String(vehicles["ATV/4-Wheeler"]["Polaris"][0]).includes("placeholder"));

assert.match(diagnose("won't start"), /battery/i);
assert.match(diagnose("no spark on dirt bike"), /CDI|ignition/i);
assert.match(diagnose("completely unknown xyz"), /No diagnosis found/i);

const indexHtml = fs.readFileSync(path.join(__dirname, "..", "Index.html"), "utf8");
assert.ok(indexHtml.includes("ravin-lock.js"));
assert.ok(indexHtml.includes("vehicles-data.js"));
assert.ok(indexHtml.includes("app-logic.js"));
assert.ok(indexHtml.includes("Ravin Lookup"));
assert.ok(indexHtml.includes("Car/Truck"));
assert.ok(indexHtml.includes("Dirt Bike/Moto"));
assert.ok(indexHtml.includes("ATV/4-Wheeler"));

const { execFileSync } = require("child_process");
execFileSync(process.execPath, [path.join(__dirname, "..", "scripts", "set-lock.js"), "Car/Truck"], {
  stdio: "pipe"
});
const lockJs = fs.readFileSync(path.join(__dirname, "..", "ravin-lock.js"), "utf8");
assert.ok(lockJs.includes("Car/Truck"));
execFileSync(process.execPath, [path.join(__dirname, "..", "scripts", "set-lock.js"), ""], {
  stdio: "pipe"
});


const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
assert.ok(pkg.scripts["pack:win:car"]);
assert.ok(pkg.scripts["pack:win:moto"]);
assert.ok(pkg.scripts["pack:win:atv"]);
assert.ok(pkg.scripts["pack:win:all"]);
assert.ok(pkg.build.win.target.some((t) => t.target === "nsis"));
assert.ok(pkg.build.win.target.some((t) => t.target === "portable"));
assert.ok(pkg.build.win.target.some((t) => t.target === "msi"));
assert.strictEqual(pkg.build.win.signAndEditExecutable, false);

console.log("All Ravin lookup tests passed.");
console.log(`Types OK: ${TYPES.join(", ")}`);
console.log(
  `Brand counts — Car/Truck: ${Object.keys(vehicles["Car/Truck"]).length}, Dirt Bike/Moto: ${Object.keys(vehicles["Dirt Bike/Moto"]).length}, ATV/4-Wheeler: ${Object.keys(vehicles["ATV/4-Wheeler"]).length}`
);
