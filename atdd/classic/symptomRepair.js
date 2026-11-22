/* Symptom- and system-based repair database engine.
   Tiers: cited (meaning / cause ranking supported by a license-compatible source)
          generated-general (structured from the symptom's system meaning).
   Test procedures are original wording. Numeric specs are "per service manual"
   unless a cited universal value is attached to that test. */
(function (root) {
  const MANUAL = "per service manual";
  const CITED_LABEL = "Cited meaning from a license-compatible public source – tests are original wording; verify values with the service manual for your vehicle";
  const GENERAL_LABEL = "General guidance – verify with service manual for your vehicle";

  const SYSTEM_LABELS = {
    engine_no_start: "Engine / no-start / won't crank",
    misfire: "Misfire",
    cooling: "Overheating / cooling",
    fuel: "Fuel",
    ignition: "Ignition",
    starting_charging: "Charging / starting / battery",
    electrical: "Electrical / lighting",
    transmission_auto: "Automatic transmission",
    transmission_manual: "Manual transmission / clutch",
    four_wd: "4WD / transfer case",
    drivetrain: "Drivetrain / axles / CV",
    brakes: "Brakes / ABS",
    steering_suspension: "Steering / suspension / tires",
    hvac: "HVAC",
    exhaust_emissions: "Exhaust / emissions",
    leaks: "Leaks by fluid color",
    noises_vibrations: "Noises / vibrations",
    smells: "Smells",
    smoke: "Smoke color",
    body_srs: "Body / SRS",
    powersports_engine: "Powersports: 2-stroke / 4-stroke engine",
    powersports_carb: "Powersports: carburetor",
    powersports_cdi: "Powersports: CDI / stator ignition",
    powersports_snowmobile: "Powersports: snowmobile clutch / track"
  };

  function pack() {
    return root.SYMPTOM_REPAIR_DB || { entries: [], sources: [], manifest: {} };
  }

  function allEntries() {
    return pack().entries || [];
  }

  function sourceMap() {
    const list = pack().sources || [];
    const map = {};
    list.forEach((s) => { map[s.id] = s; });
    return map;
  }

  function resolveSources(entry) {
    const map = sourceMap();
    return (entry.sources || []).map((id) => {
      if (typeof id === "string" && map[id]) return map[id];
      if (id && id.name) return id;
      return { id: String(id), name: String(id), url: "", license: "see manifest" };
    });
  }

  function tierLabel(tier) {
    return tier === "cited" ? CITED_LABEL : GENERAL_LABEL;
  }

  function hydrate(entry) {
    if (!entry) return null;
    return Object.assign({}, entry, {
      systemLabel: SYSTEM_LABELS[entry.system] || entry.system,
      tierLabel: tierLabel(entry.tier),
      sources: resolveSources(entry)
    });
  }

  function tokens(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9+\/]+/g, " ").trim().split(/\s+/).filter(Boolean);
  }

  function haystack(entry) {
    const parts = [
      entry.id, entry.title, entry.symptom, entry.means, entry.system, SYSTEM_LABELS[entry.system] || "",
      (entry.keywords || []).join(" "),
      (entry.causes || []).map((c) => c.title).join(" "),
      (entry.related_dtcs || []).join(" ")
    ];
    return parts.join(" ").toLowerCase();
  }

  function search(query, filters) {
    const q = String(query || "").trim().toLowerCase();
    const words = tokens(q);
    const system = filters && filters.system;
    const tier = filters && filters.tier;
    const audience = filters && filters.audience;
    const dtc = filters && filters.dtc ? String(filters.dtc).toUpperCase() : "";
    return allEntries().filter((entry) => {
      if (system && entry.system !== system) return false;
      if (tier && entry.tier !== tier) return false;
      if (audience && audience !== "all") {
        const allowed = entry.audience || ["automotive"];
        if (allowed.indexOf(audience) === -1 && allowed.indexOf("all") === -1) return false;
      }
      if (dtc && !(entry.related_dtcs || []).some((c) => String(c).toUpperCase() === dtc)) return false;
      if (!words.length) return true;
      const text = haystack(entry);
      return words.every((w) => text.indexOf(w) !== -1);
    }).map(hydrate);
  }

  function byId(id) {
    return hydrate(allEntries().find((e) => e.id === id) || null);
  }

  function byDtc(code) {
    const c = String(code || "").toUpperCase();
    if (!c) return [];
    return allEntries().filter((e) => (e.related_dtcs || []).some((x) => String(x).toUpperCase() === c)).map(hydrate);
  }

  function byKeywords(names) {
    const list = (names || []).map((n) => String(n).toLowerCase());
    if (!list.length) return [];
    return allEntries().filter((e) => {
      const text = haystack(e);
      return list.some((n) => text.indexOf(n.toLowerCase()) !== -1);
    }).map(hydrate);
  }

  function audienceForVehicle(entry) {
    if (!entry) return "all";
    const type = String(entry.type || "").toLowerCase();
    if (type === "snowmobile") return "snowmobile";
    if (entry.has_cdi_pinout || entry.workflow === "cdi_pinout" || entry.workflow === "index_only") return "powersports";
    if (["dirt_bike", "atv", "atc", "motorcycle", "snowmobile"].indexOf(type) !== -1) return "powersports";
    if (type === "car_truck" || entry.workflow === "generic_automotive") return "automotive";
    return "all";
  }

  function forVehicle(vehicle) {
    const audience = audienceForVehicle(vehicle);
    return search("", { audience: audience === "snowmobile" ? "snowmobile" : audience });
  }

  function systems() {
    const counts = {};
    allEntries().forEach((e) => { counts[e.system] = (counts[e.system] || 0) + 1; });
    return Object.keys(SYSTEM_LABELS).map((id) => ({
      id: id,
      label: SYSTEM_LABELS[id],
      count: counts[id] || 0
    }));
  }

  function stats() {
    const entries = allEntries();
    const bySystem = {};
    const byTier = { cited: 0, "generated-general": 0 };
    entries.forEach((e) => {
      bySystem[e.system] = (bySystem[e.system] || 0) + 1;
      byTier[e.tier] = (byTier[e.tier] || 0) + 1;
    });
    return { total: entries.length, bySystem: bySystem, byTier: byTier };
  }

  const api = {
    MANUAL,
    CITED_LABEL,
    GENERAL_LABEL,
    SYSTEM_LABELS,
    allEntries: function () { return allEntries().map(hydrate); },
    search,
    byId,
    byDtc,
    byKeywords,
    forVehicle,
    audienceForVehicle,
    systems,
    stats,
    hydrate
  };
  root.SymptomRepair = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
