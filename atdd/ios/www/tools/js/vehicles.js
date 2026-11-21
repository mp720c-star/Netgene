/**
 * Saved vehicles — preserve any existing ATDD localStorage keys.
 * Never wipe unknown atdd.* keys; only read/write the vehicles list.
 */

const PRIMARY_KEY = "atdd.savedVehicles";
const LEGACY_KEYS = [
  "atdd.vehicles",
  "atdd.saved_vehicles",
  "ATDD_SAVED_VEHICLES",
  "savedVehicles",
  "vehicles",
];

function safeParse(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : Array.isArray(v?.vehicles) ? v.vehicles : null;
  } catch {
    return null;
  }
}

export function loadSavedVehicles() {
  if (typeof localStorage === "undefined") return [];
  const fromPrimary = safeParse(localStorage.getItem(PRIMARY_KEY));
  if (fromPrimary) return fromPrimary;
  for (const key of LEGACY_KEYS) {
    const found = safeParse(localStorage.getItem(key));
    if (found && found.length) {
      // Migrate forward without deleting the legacy key.
      try {
        localStorage.setItem(PRIMARY_KEY, JSON.stringify(found));
      } catch {
        /* quota */
      }
      return found;
    }
  }
  return [];
}

export function saveSavedVehicles(list) {
  if (typeof localStorage === "undefined") return;
  const next = Array.isArray(list) ? list : [];
  localStorage.setItem(PRIMARY_KEY, JSON.stringify(next));
}

export function upsertVehicle(vehicle) {
  const list = loadSavedVehicles();
  const id = String(vehicle.id || vehicle.vin || vehicle.name || Date.now());
  const row = {
    id,
    name: vehicle.name || "Saved vehicle",
    year: vehicle.year || "",
    make: vehicle.make || "",
    model: vehicle.model || "",
    vin: vehicle.vin || "",
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((v) => String(v.id) === id || (v.vin && v.vin === row.vin));
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.unshift(row);
  saveSavedVehicles(list);
  return list;
}
