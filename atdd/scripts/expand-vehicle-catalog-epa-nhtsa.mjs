#!/usr/bin/env node
/**
 * Expand vehicle-genius Car/Truck coverage to every EPA-listed make sold in the
 * last 15 model years, with NHTSA model names for that make/year.
 *
 * Preserves Dirt Bike / ATV sections and any Car/Truck rows older than the window.
 * Does not invent vehicles — only public EPA + NHTSA menu data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vehiclesPath = path.join(root, "vehicle-genius/vehicles.js");
const cachePath = path.join(root, "atdd/scripts/.vehicle-catalog-cache.json");

const NOW = new Date();
const CALENDAR_YEAR = NOW.getUTCFullYear();
const CURRENT_MODEL_YEAR = NOW.getUTCMonth() >= 7 ? CALENDAR_YEAR + 1 : CALENDAR_YEAR;
// Cars/trucks made in the last 15 calendar years, plus the current model year if ahead.
const WINDOW_START = CALENDAR_YEAR - 14;
const WINDOW_END = Math.max(CALENDAR_YEAR, CURRENT_MODEL_YEAR);

const EPA_HEADERS = { Accept: "application/json", "User-Agent": "ATDD-vehicle-catalog/1.0" };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: EPA_HEADERS });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(400 * (attempt + 1) ** 2);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`Failed after retries: ${url}`);
}

function menuItems(payload) {
  const raw = payload?.menuItem;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function titleCaseMake(name) {
  const special = {
    bmw: "BMW",
    gmc: "GMC",
    "mercedes-benz": "Mercedes-Benz",
    mini: "MINI",
    "land rover": "Land Rover",
    "alfa romeo": "Alfa Romeo",
    "rolls-royce": "Rolls-Royce",
    "aston martin": "Aston Martin",
    "ineos automotive": "INEOS",
    vinfast: "VinFast",
  };
  const key = String(name || "").trim().toLowerCase();
  if (special[key]) return special[key];
  return String(name || "")
    .trim()
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(name.includes("-") ? "-" : " ")
    .replace(/^Mercedes-benz$/i, "Mercedes-Benz");
}

function cleanModel(name) {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadCache() {
  if (!fs.existsSync(cachePath)) return { epaMakes: {}, nhtsaModels: {} };
  return JSON.parse(fs.readFileSync(cachePath, "utf8"));
}

function saveCache(cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
}

function parseVehiclesJs(text) {
  const match = text.match(/window\.VG_VEHICLES\s*=\s*(\{[\s\S]*\})\s*;\s*$/);
  if (!match) throw new Error("Could not parse VG_VEHICLES object");
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${match[1]});`)();
}

function serializeVehicles(data) {
  const lines = ['/* Vehicle Genius — offline vehicle catalog (EPA/NHTSA last-15-years Car/Truck + preserved powersports) */', "window.VG_VEHICLES = {"];
  const cats = Object.keys(data);
  cats.forEach((cat, ci) => {
    lines.push(`  ${JSON.stringify(cat)}: {`);
    const makes = Object.keys(data[cat]).sort((a, b) => a.localeCompare(b));
    makes.forEach((make, mi) => {
      const rows = [...new Set(data[cat][make])].sort((a, b) => {
        const ya = Number((a.match(/(\d{4})$/) || [])[1] || 0);
        const yb = Number((b.match(/(\d{4})$/) || [])[1] || 0);
        if (ya !== yb) return ya - yb;
        return a.localeCompare(b);
      });
      lines.push(`    ${JSON.stringify(make)}: [`);
      rows.forEach((row, ri) => {
        const comma = ri < rows.length - 1 ? "," : "";
        lines.push(`      ${JSON.stringify(row)}${comma}`);
      });
      lines.push(mi < makes.length - 1 ? "    ]," : "    ]");
    });
    lines.push(ci < cats.length - 1 ? "  }," : "  }");
  });
  lines.push("};", "");
  return lines.join("\n");
}

async function epaMakesForYear(year, cache) {
  const key = String(year);
  if (cache.epaMakes[key]) return cache.epaMakes[key];
  const data = await fetchJson(`https://www.fueleconomy.gov/ws/rest/vehicle/menu/make?year=${year}`);
  const makes = menuItems(data).map((item) => item.text || item.value).filter(Boolean);
  cache.epaMakes[key] = makes;
  saveCache(cache);
  await sleep(80);
  return makes;
}

async function nhtsaModels(make, year, cache) {
  const key = `${make}|${year}`;
  if (cache.nhtsaModels[key]) return cache.nhtsaModels[key];
  const url =
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
    encodeURIComponent(make) +
    "/modelyear/" +
    year +
    "?format=json";
  try {
    const data = await fetchJson(url);
    const models = (data.Results || [])
      .map((row) => cleanModel(row.Model_Name))
      .filter(Boolean);
    cache.nhtsaModels[key] = [...new Set(models)].sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.warn("NHTSA miss", make, year, err.message);
    cache.nhtsaModels[key] = [];
  }
  saveCache(cache);
  await sleep(60);
  return cache.nhtsaModels[key];
}

async function main() {
  const cache = loadCache();
  const original = fs.readFileSync(vehiclesPath, "utf8");
  const data = parseVehiclesJs(original);
  if (!data["Car/Truck"]) data["Car/Truck"] = {};

  // Keep pre-window Car/Truck rows; rebuild in-window from EPA/NHTSA.
  const kept = {};
  for (const [make, rows] of Object.entries(data["Car/Truck"])) {
    for (const row of rows) {
      const year = Number((String(row).match(/(\d{4})$/) || [])[1] || 0);
      if (year && year < WINDOW_START) {
        if (!kept[make]) kept[make] = [];
        kept[make].push(row);
      }
    }
  }

  const fresh = {};
  const years = [];
  for (let y = WINDOW_START; y <= WINDOW_END; y++) years.push(y);

  const makeSet = new Set();
  for (const year of years) {
    const makes = await epaMakesForYear(year, cache);
    for (const make of makes) makeSet.add(make);
    console.log("EPA makes", year, makes.length);
  }

  const makes = [...makeSet].sort((a, b) => a.localeCompare(b));
  for (const epaMake of makes) {
    const displayMake = titleCaseMake(epaMake);
    for (const year of years) {
      const yearMakes = await epaMakesForYear(year, cache);
      if (!yearMakes.some((m) => m.toLowerCase() === epaMake.toLowerCase())) continue;
      const models = await nhtsaModels(epaMake, year, cache);
      if (!models.length) continue;
      if (!fresh[displayMake]) fresh[displayMake] = [];
      for (const model of models) {
        fresh[displayMake].push(`${model} ${year}`);
      }
    }
    console.log("built", displayMake, (fresh[displayMake] || []).length);
  }

  const merged = {};
  for (const make of new Set([...Object.keys(kept), ...Object.keys(fresh)])) {
    merged[make] = [...new Set([...(kept[make] || []), ...(fresh[make] || [])])];
  }
  data["Car/Truck"] = merged;

  const next = serializeVehicles(data);
  fs.writeFileSync(vehiclesPath, next);

  let carTruckRows = 0;
  let makeCount = 0;
  for (const rows of Object.values(merged)) {
    makeCount += 1;
    carTruckRows += rows.length;
  }
  console.log(
    JSON.stringify(
      {
        window_start: WINDOW_START,
        window_end: WINDOW_END,
        current_model_year: CURRENT_MODEL_YEAR,
        car_truck_makes: makeCount,
        car_truck_year_rows: carTruckRows,
        vehicles_path: vehiclesPath,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
