/* Shared vehicle index + CDI pinout lookup. Browser script and Node-testable. */
(function (root) {
  const TYPE_LABELS = {
    car_truck: "Cars / trucks",
    motorcycle: "Motorcycles / bikes",
    dirt_bike: "Dirt bikes / dual-sport",
    atv: "ATVs / 4-wheelers",
    atc: "3-wheelers / ATCs",
    snowmobile: "Snowmobiles / sleds",
    generic_reference: "Generic CDI reference",
    simulated: "Simulated CDI demo"
  };

  const TYPE_ORDER = [
    "car_truck",
    "dirt_bike",
    "motorcycle",
    "atv",
    "atc",
    "snowmobile",
    "generic_reference",
    "simulated"
  ];

  function data() {
    const index = (root.VEHICLE_INDEX_DATA || {});
    const pinout = (root.CDI_PINOUT_DB || {});
    return {
      entries: Array.isArray(index.entries) ? index.entries : [],
      near_matches: Array.isArray(index.near_matches) ? index.near_matches : [],
      counts: index.counts || {},
      profiles: pinout.profiles || {}
    };
  }

  function typeLabel(type) {
    return TYPE_LABELS[type] || type;
  }

  function types() {
    const present = new Set(data().entries.map((e) => e.type));
    return TYPE_ORDER.filter((t) => present.has(t));
  }

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function makes(type) {
    return uniqueSorted(data().entries.filter((e) => !type || e.type === type).map((e) => e.make));
  }

  function models(type, make) {
    return uniqueSorted(
      data().entries
        .filter((e) => (!type || e.type === type) && (!make || e.make === make))
        .map((e) => e.model)
    );
  }

  function years(type, make, model) {
    const nums = data().entries
      .filter((e) => (!type || e.type === type) && (!make || e.make === make) && (!model || e.model === model))
      .flatMap((e) => {
        const out = [];
        if (e.year != null) out.push(e.year);
        if (e.year_start != null) out.push(e.year_start);
        if (e.year_end != null) out.push(e.year_end);
        return out;
      });
    return [...new Set(nums)].sort((a, b) => b - a);
  }

  function get(id) {
    return data().entries.find((e) => e.id === id) || null;
  }

  function coversYear(entry, year) {
    if (year == null || year === "") return true;
    const y = Number(year);
    if (!Number.isFinite(y)) return true;
    if (entry.year != null) return entry.year === y;
    if (entry.year_start != null) {
      const end = entry.year_end == null ? Infinity : entry.year_end;
      return y >= entry.year_start && y <= end;
    }
    // Yearless source rows are not claimed to cover every year.
    return false;
  }

  function haystack(entry) {
    const sources = (entry.sources || []).map((s) => s.label + " " + s.id).join(" ");
    return [
      entry.display_name,
      entry.make,
      entry.model,
      entry.type,
      typeLabel(entry.type),
      entry.year,
      entry.year_text,
      entry.cdi_system,
      entry.category,
      sources
    ]
      .filter((v) => v != null && v !== "")
      .join(" ")
      .toLowerCase();
  }

  function search(filters) {
    const f = filters || {};
    const query = String(f.query || "").trim().toLowerCase();
    const year = f.year === "" || f.year == null ? null : Number(f.year);
    return data().entries.filter((entry) => {
      if (f.type && entry.type !== f.type) return false;
      if (f.make && entry.make !== f.make) return false;
      if (f.model && entry.model !== f.model) return false;
      if (year != null) {
        if (!coversYear(entry, year) && entry.year != null) return false;
        if (!coversYear(entry, year) && (entry.year_start != null || entry.year != null)) return false;
        if (!coversYear(entry, year) && entry.year == null && entry.year_start == null) {
          // Keep yearless rows visible when the user also filtered make/model or is text-searching,
          // but not when only a year is chosen for a broad type list.
          if (!f.make && !f.model && !query) return false;
        }
      }
      if (query && !haystack(entry).includes(query)) return false;
      return true;
    });
  }

  function cdiSourceKeys(entry) {
    return (entry && entry.sources ? entry.sources : [])
      .filter((s) => s.kind === "cdi")
      .map((s) => String(s.id).replace(/^cdi:profile:/, ""));
  }

  function pinoutsFor(entry) {
    if (!entry) return [];
    const profiles = data().profiles;
    return cdiSourceKeys(entry)
      .map((key) => profiles[key] ? { source_key: key, ...profiles[key] } : null)
      .filter(Boolean);
  }

  function badge(profile) {
    if (!profile) return null;
    const provenance = profile.provenance;
    const category = profile.category || "";
    const name = profile.name || "";
    if (category === "Simulated Generic Profiles" || /^SIMULATED:/i.test(name) || /^SIM_/.test(profile.source_key || "")) {
      return { tone: "simulated", label: "SIMULATED / DEMO" };
    }
    if (provenance === "unverified") return { tone: "unverified", label: "UNVERIFIED" };
    if (provenance === "reference" || category === "Core / Generic Reference") {
      return { tone: "reference", label: "REFERENCE" };
    }
    if (provenance === "verified") {
      return { tone: "cited", label: "Cited source (not independently OEM-verified)" };
    }
    return { tone: "unverified", label: "UNVERIFIED" };
  }

  // Hard rule: a CDI profile never yields an OBD code, and an OBD code never selects a pinout.
  function pinoutsForObdCode() {
    return [];
  }

  function obdCodesForPinout() {
    return [];
  }

  function entryLabel(entry) {
    if (!entry) return "";
    const yearBit = entry.year_text || entry.year || "";
    return [entry.make, entry.model, yearBit].filter(Boolean).join(" ");
  }

  const api = {
    TYPE_LABELS,
    TYPE_ORDER,
    data,
    typeLabel,
    types,
    makes,
    models,
    years,
    get,
    search,
    pinoutsFor,
    pinoutsForObdCode,
    obdCodesForPinout,
    badge,
    cdiSourceKeys,
    entryLabel,
    coversYear
  };

  root.VehicleCatalog = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
