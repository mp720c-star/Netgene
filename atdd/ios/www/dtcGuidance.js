/* Tiered DTC repair guidance + per-cause tests.
   detailed-existing: keep ATDD's original detailed guides and add structured tests.
   detailed-cited: cause lists from obdex (CC0-1.0); test procedures written for this app.
   generated-general: structured from the code's system/subsystem/component meaning.
   No invented resistance, voltage, pressure, or torque values. */
(function (root) {
  const MANUAL = "per service manual";
  const GENERAL_LABEL = "General guidance – verify with service manual for your vehicle";
  const CITED_LABEL = "Cited generic guidance (obdex, CC0-1.0) – verify with service manual for your vehicle";
  const EXISTING_LABEL = "Detailed guide (existing ATDD) plus structured tests – verify with service manual for your vehicle";

  const FAMILY = { P: "Powertrain", B: "Body", C: "Chassis", U: "Network" };

  const DETAILED_EXISTING = new Set([
    "P0300","P0171","P0174","P0172","P0175","P0449","P0480","P0521","P0522","P0128",
    "P0335","P0336","P0700","U0100","U0101","U0073","U0121","C0035","C0040","P0420",
    "P0430","P0101","P0102","P0106","P0107","P0112","P0113","P0117","P0118","P0121",
    "P0122","P0131","P0133","P0134","P0135","P0137","P0138","P0141","P0155","P0191",
    "P0193","P0230","P0299","P0325","P0327","P0340","P0341","P0351","P0401","P0403",
    "P0440","P0441","P0442","P0443","P0446","P0455","P0456","P0463","P0500","P0505",
    "P0506","P0507","P0562","P0563","P0601","P0606","P0641","P0011","P0014","P0016",
    "P0087","P0685","P0705","P0706","P0715","P0720","P0730","P0740","P0741","P0750",
    "P2101","P2135","P2195"
  ]);
  for (let cyl = 1; cyl <= 12; cyl++) DETAILED_EXISTING.add("P0" + (300 + cyl));
  for (let cyl = 1; cyl <= 8; cyl++) {
    DETAILED_EXISTING.add("P0" + (200 + cyl));
    DETAILED_EXISTING.add("P0" + (350 + cyl));
  }

  function overlay() {
    return root.DTC_GUIDANCE_OVERLAY || {};
  }

  function overlayRow(code) {
    const pack = overlay();
    if (!pack || !pack.codes) return null;
    return pack.codes[code] || null;
  }

  function sourceUrls(row) {
    const pack = overlay();
    const urls = pack.urls || [];
    return ((row && row.u) || []).map((i) => urls[i]).filter(Boolean);
  }

  function detectFault(text) {
    const t = String(text || "").toLowerCase();
    if (/lost communication|bus off|bus performance|no communication/.test(t)) return "communication";
    if (/catalyst|efficiency below/.test(t)) return "efficiency";
    if (/misfire/.test(t)) return "misfire";
    if (/lean|fuel trim/.test(t)) return "fuel_trim";
    if (/random|intermittent/.test(t)) return "intermittent";
    if (/range\/performance|performance|correlation/.test(t)) return "performance";
    if (/circuit open|open circuit|open$/.test(t)) return "open";
    if (/short to (battery|voltage|b\+|power)|circuit high/.test(t)) return "high";
    if (/short to ground|circuit low/.test(t)) return "low";
    if (/circuit/.test(t)) return "circuit";
    return "general";
  }

  function safetyFor(code, description, subsystem) {
    const t = ((code || "") + " " + (description || "") + " " + (subsystem || "")).toLowerCase();
    const out = [];
    if (/airbag|srs|squib|restraint|pretensioner|occupan|seat belt|clock spring|b000|b001|air bag|airbag_safety/.test(t)) {
      out.push("SRS / airbag: disconnect the battery and wait the time the service manual calls for before unplugging yellow connectors. Do not probe airbag circuits with a test light. If a bag has deployed, this is not a driveway clear-the-light job.");
    }
    if (/fuel|injector|evap|vapor|pump|tank|rail|petrol|gasoline|diesel/.test(t) && !/airbag|srs/.test(t)) {
      out.push("Fuel system: no sparks or open flame. Relieve fuel pressure and work with a fire extinguisher nearby, following the service manual. Do evap or tank work in a ventilated area.");
    }
    if (/hybrid|high voltage|inverter|traction battery|orange (cable|wire)|electric drive|fuel cell|u3|bms |on.board charger/.test(t)) {
      out.push("High voltage (hybrid / EV): orange cables and high-voltage connectors are not a DIY probe job. Have the high-voltage system shut down and isolated per the service manual, or leave this to a qualified technician.");
    }
    if (/brake|abs|ebcm|wheel speed|stability|traction control|abs_brakes/.test(t)) {
      out.push("Brakes / ABS: support the vehicle safely. Do not drive if braking feel, a dragging caliper, or a warning lamp says the system is compromised. Bleed or module work follows the service manual.");
    }
    if (/cooling|overheat/.test(t)) {
      out.push("Cooling: never remove a hot cap. A scalding system can vent steam and coolant.");
    }
    return out;
  }

  function toolScan() { return "Scan tool with live data (and freeze-frame if available)"; }
  function toolMeter() { return "Digital multimeter (and a wiring diagram from the service manual)"; }
  function toolVisual() { return "Flashlight and inspection mirror (and a phone camera for connectors)"; }
  function toolSmoke() { return "EVAP or intake smoke tester, or an unlit-propane/carb-cleaner check done carefully per service-manual cautions"; }
  function toolHand() { return "Basic hand tools and the service-manual procedure for that fastener or connector"; }
  function toolStetho() { return "Mechanic's stethoscope or a long screwdriver used as a listening aid (engine parts may be hot)"; }
  function toolLift() { return "Jack, jack stands or a lift, and wheel chocks"; }

  function test(tool, check, good, bad, spec) {
    return { tool: tool, check: check, good: good, bad: bad, spec: spec || MANUAL };
  }

  function testsForKind(kind, ctx) {
    const part = ctx.part || "the named component";
    const fault = ctx.fault || "general";
    const tests = [];
    if (kind === "connector") {
      tests.push(test(toolVisual(),
        "With the ignition off (and SRS/high-voltage rules followed if they apply), unplug the connector at " + part + ". Look at both faces: pins, seals, corrosion, moisture, and whether a pin is backed out.",
        "Pins are straight and fully seated, the seal is intact, and there is no green or white corrosion or water in the cavity.",
        "Corrosion, water, a bent or backed-out pin, or a connector that will not click fully home.",
        MANUAL));
      tests.push(test(toolScan(),
        "After cleaning or reseating only what you found, clear the code if the manual allows, then run the monitor or a short drive and watch whether the same code returns.",
        "The code stays gone through the drive cycle or monitor completion described in the service manual.",
        "The same code returns immediately or in the same conditions as the freeze-frame.",
        MANUAL));
    } else if (kind === "wiring") {
      tests.push(test(toolVisual(),
        "Trace the harness for " + part + " as far as you can see. Look for chafe on sharp brackets, rodent damage, melted insulation, and poorly made splices.",
        "Insulation is intact, the harness is clipped, and there is no copper showing or burnt loom.",
        "Chafed, pinched, burnt, or chewed wiring, or a splice with exposed conductor.",
        MANUAL));
      tests.push(test(toolMeter(),
        "Using the service-manual pinout, check continuity of the signal, power, and ground circuits and check for a short to ground or power. Do this with the module disconnected where the manual requires it.",
        "Continuity is present on the assigned pins, and there is no short to ground or power, all per the values and pinout in the service manual.",
        "An open circuit, a short to ground or power, or a pin assignment that does not match the manual.",
        MANUAL));
    } else if (kind === "sensor") {
      tests.push(test(toolScan(),
        "Compare live data for " + part + " to a known-good related sensor or to the range chart in the service manual, at idle and under the condition in freeze-frame (warm-up, cruise, braking, etc.).",
        "The reading changes when the condition changes and stays within the service-manual range or tracks a related sensor as the manual describes.",
        "The reading is stuck, drops out, jumps wildly, or disagrees with a related sensor in a way the manual calls a fault.",
        MANUAL));
      tests.push(test(toolMeter(),
        "Back-probe only if the manual allows it. Confirm the sensor has the specified reference, ground, and a changing signal while you operate the system.",
        "Reference and ground are present, and the signal moves as the manual describes for that test.",
        "Missing reference or ground, or a signal that never moves.",
        MANUAL));
    } else if (kind === "actuator") {
      tests.push(test(toolScan(),
        "If the scan tool can command " + part + " (bi-directional control), command it on and off while you watch, listen, or feel for movement, and watch the related live data.",
        "The actuator responds each time it is commanded, and the related data or mechanical movement matches the service manual.",
        "No movement, a click with no effect, or related data that does not change.",
        MANUAL));
      tests.push(test(toolMeter(),
        "Measure circuit resistance and supply at " + part + " only with the connector and pins given in the service manual.",
        "Resistance and supply are within the service-manual specification for that part.",
        "Open, shorted, or out-of-range readings compared with the service manual, or no supply when it should be present.",
        MANUAL));
    } else if (kind === "module") {
      tests.push(test(toolScan(),
        "Check whether the module for " + part + " communicates, whether other codes in that module are stored, and whether battery voltage during the fault is recorded in freeze-frame.",
        "The module communicates, power and grounds meet the manual, and there is no low-voltage event explaining a reset.",
        "The module is offline, many unrelated codes appear after a low-voltage event, or communication is dropped on that bus.",
        MANUAL));
      tests.push(test(toolVisual() + "; " + toolMeter(),
        "Inspect module connectors, powers, and grounds. Do not replace a module until those checks and any required programming steps in the service manual are understood.",
        "Power and grounds are clean and within the manual's limits; the connector is dry and fully seated.",
        "Burnt pins, water in the module, or missing power/ground.",
        MANUAL));
    } else if (kind === "software") {
      tests.push(test(toolScan(),
        "Read the software / calibration ID and compare it with the latest service information for this exact vehicle. Look for a bulletin that names this code.",
        "The vehicle already has the calibration the service information calls for, or a documented update is applied and the code is retested per the bulletin.",
        "An older calibration is present and a bulletin ties this code to that software, or the update was not performed as written.",
        MANUAL));
    } else if (kind === "mechanical") {
      tests.push(test(toolVisual() + "; " + toolHand(),
        "Inspect the mechanical side of " + part + ": leaks, binding, broken mounts, damaged tone rings or reluctors, loose bolts, or obvious wear.",
        "The part is mounted solidly, moves or seals as designed, and has no obvious damage.",
        "A leak, crack, seized mechanism, damaged reluctor, or loose hardware.",
        MANUAL));
    } else if (kind === "fuel") {
      tests.push(test(toolScan(),
        "Watch fuel trims, desired versus actual rail data if the vehicle reports it, and misfire counters at idle and under load. Use freeze-frame as the snapshot of when the fault set.",
        "Trims and rail data stay in the service-manual range, and misfire counters do not climb with the same freeze-frame condition.",
        "Trims or rail data are out of the manual's range, or misfires climb with the condition that set the code.",
        MANUAL));
      tests.push(test("Fuel-pressure gauge only if the service manual provides a port and a specification",
        "Measure fuel pressure and leak-down exactly as the service manual describes for this engine. If the manual gives no procedure you can do safely, stop and use a shop.",
        "Pressure and leak-down meet the service-manual specification.",
        "Pressure is low, high, or bleeds down faster than the manual allows.",
        MANUAL));
    } else if (kind === "air_leak") {
      tests.push(test(toolVisual() + "; " + toolSmoke(),
        "Inspect intake ducts, the PCV path, and vacuum hoses after the airflow sensor. Use a smoke test or the manual's approved leak-check method.",
        "No smoke (or no RPM change on a careful unmetered-air check) leaves the intake, and hoses and ducts are intact.",
        "Smoke or a clear split after the airflow sensor, a loose oil cap path, or a torn duct.",
        MANUAL));
    } else if (kind === "exhaust") {
      tests.push(test(toolVisual() + "; " + toolStetho(),
        "With the exhaust cold enough to touch or with careful hot-engine caution, look and listen for leaks ahead of the downstream sensor, and inspect heat shields and converter damage.",
        "Joints are tight, there is no soot-stained leak, and the converter shell is not rattling or crushed.",
        "An exhaust leak upstream of the sensor, a rattling converter, or a crushed or contaminated catalyst (oil or coolant).",
        MANUAL));
    } else if (kind === "network") {
      tests.push(test(toolScan(),
        "See which modules are missing on the bus and whether one module or many dropped off. Note any low-voltage or aftermarket-device history.",
        "All expected modules communicate, and the fault cannot be reproduced by cycling a single aftermarket device.",
        "One module is silent, or the whole bus drops, or unplugging an aftermarket device restores communication.",
        MANUAL));
      tests.push(test(toolMeter(),
        "Measure bus termination and wiring only as the service manual describes (many buses are damaged by a test light or a wrong meter range).",
        "Bus voltage and resistance match the service-manual figures for that network.",
        "An open, short, or out-of-range bus measurement, or a module that pulls the bus down when connected.",
        MANUAL));
    } else if (kind === "power_ground") {
      tests.push(test(toolMeter() + "; " + toolVisual(),
        "Load-test the battery and clean, tight grounds and power feeds for " + part + " as the service manual shows. A voltage drop under load matters more than a pretty static reading.",
        "The battery and charging system meet the manual, and voltage drop on power and ground is within the manual's limit under load.",
        "A weak battery, a loose or rusty ground, or a large voltage drop under load.",
        MANUAL));
    } else if (kind === "fuse_relay") {
      tests.push(test(toolVisual() + "; " + toolMeter(),
        "Find the fuse and relay named in the owner's manual or service manual for " + part + ". Check the fuse visually and with a meter, and swap a relay only with the same part number.",
        "The fuse is intact and has battery voltage on the supply side when the circuit should be live; the relay clicks and outputs as the manual describes.",
        "A blown fuse (stop and find the short before fitting a larger fuse), a burnt socket, or a relay that does not close.",
        MANUAL));
    } else {
      tests.push(test(toolScan() + "; " + toolVisual(),
        "Confirm the exact code, freeze-frame, and any companion codes. Inspect " + part + " and its connector before replacing parts.",
        "You have a confirmed code and a clean, seated connector, and you know whether companion codes point to power, communication, or a related system.",
        "The code is unconfirmed, or a loose connector or obvious damage was skipped.",
        MANUAL));
      tests.push(test(toolMeter(),
        "Follow the service-manual tests for " + part + " and its circuit. Record results before you buy a part.",
        "Measured values match the service manual, or the manual's test points the next step clearly.",
        "You cannot complete the manual's test, or the result is out of the published range.",
        MANUAL));
    }

    if (fault === "intermittent" && kind !== "connector") {
      tests.push(test(toolScan() + "; wiggle test",
        "With live data or a min/max meter graphing the circuit, wiggle the harness and connector for " + part + " and tap nearby brackets. Watch for a dropout that matches the freeze-frame condition (heat, wet, bump).",
        "The signal stays stable through the wiggle and heat/wet check.",
        "The signal drops, the code sets, or a glitch appears only while the harness is moved or heated.",
        MANUAL));
    }
    return tests;
  }

  function classifyCause(id, label) {
    const s = String(id || "").toLowerCase() + " " + String(label || "").toLowerCase();
    if (/software|calibration|reflash|program/.test(s)) return "software";
    if (/clock.?spring/.test(s)) return "wiring";
    if (/fuse|relay|supply|power feed|b\+|ignition switch/.test(s)) return "fuse_relay";
    if (/ground|voltage drop|battery|charging|alternator/.test(s) && /module|ecm|pcm|power/.test(s)) return "power_ground";
    if (/can |bus |network|communication|lost comm|lin |module offline/.test(s)) return "network";
    if (/exhaust|catalyst|converter|manifold leak/.test(s)) return "exhaust";
    if (/vacuum|intake leak|pcv|unmetered|boost leak|smoke/.test(s)) return "air_leak";
    if (/fuel pump|fuel pressure|injector|rail|starvation|contaminated fuel/.test(s)) return "fuel";
    if (/mechanical|binding|seized|worn|tone ring|reluctor|mount|leak|gasket|belt|chain|carbon|valve stuck/.test(s) && !/solenoid|sensor/.test(s)) return "mechanical";
    if (/module|ecm|pcm|tcm|bcm|ebcm|srs|controller|internal fault/.test(s) && !/sensor|wiring|connector/.test(s)) return "module";
    if (/solenoid|actuator|valve|motor|pump|relay|purge|vent|throttle|clutch|injector/.test(s) && !/sensor|wiring|connector/.test(s)) return "actuator";
    if (/sensor|o2|oxygen|maf|map|tps|app|cks|crank|cam|knock|wheel speed|temperature|pressure sender|switch/.test(s) && !/wiring|connector|harness/.test(s)) return "sensor";
    if (/wiring|harness|open|short|chafe|splice|conductor|pin /.test(s) && !/connector|corrosion|moisture|water in/.test(s)) return "wiring";
    if (/connector|corrosion|moisture|water|loose terminal|pin fit|backed out/.test(s)) return "connector";
    if (/wiring|harness|short|open/.test(s)) return "wiring";
    if (/sensor/.test(s)) return "sensor";
    if (/module|software|ecm/.test(s)) return "module";
    return "general";
  }

  function partFromText(description, components) {
    if (components && components.length) {
      return String(components[0]).replace(/_/g, " ");
    }
    const d = String(description || "").replace(/not documented.*$/i, "").trim();
    const m = d.split(/[,(]/)[0].trim();
    if (!m || m.length > 80) return "the component named by this code";
    return m;
  }

  function generatedCauses(code, description, subsystem, fault) {
    const part = partFromText(description, []);
    const out = [];
    function add(id, title, kind) { out.push({ id: id, title: title, kind: kind, likelihood: "" }); }
    add("connector", "Loose, corroded, or poorly seated connector at " + part, "connector");
    add("wiring", "Open, short, or chafed wiring in the " + part + " circuit", "wiring");
    if (fault === "communication" || subsystem === "network") {
      add("network", "Bus wiring, termination, or another module pulling down the network", "network");
      add("power_ground", "Missing power or ground at the module, or a low-voltage event", "power_ground");
      add("module", "Internal module fault or a module that no longer communicates", "module");
    } else if (fault === "misfire") {
      add("ignition", "Ignition coil, spark plug, or plug-wire problem on the affected cylinder", "actuator");
      add("fuel", "Fuel delivery or injector problem on the affected cylinder", "fuel");
      add("air_leak", "Vacuum or intake leak, or a mechanical problem on that cylinder", "air_leak");
    } else if (fault === "efficiency") {
      add("exhaust", "Exhaust leak, aged catalyst, or a downstream sensor that is not telling the truth", "exhaust");
      add("sensor", "Upstream or downstream oxygen (or equivalent) sensor problem", "sensor");
    } else if (fault === "fuel_trim") {
      add("air_leak", "Unmetered air after the airflow sensor, or a PCV/vacuum leak", "air_leak");
      add("sensor", "Airflow or oxygen sensor reading that does not match engine conditions", "sensor");
      add("fuel", "Fuel delivery or fuel-quality problem", "fuel");
    } else if (fault === "high" || fault === "low" || fault === "open" || fault === "circuit") {
      add("sensor_or_load", "Failed " + part + " (the sensor, switch, or actuator itself)", fault === "open" ? "actuator" : "sensor");
      add("module", "Module driver or internal module fault — last, after the circuit tests", "module");
    } else {
      add("component", "Failed or out-of-range " + part, "sensor");
      add("related", "A related mechanical or fluid problem that makes " + part + " look faulty", "mechanical");
    }
    if (fault === "intermittent") {
      add("intermittent_harness", "Heat-, moisture-, or motion-related intermittent in the harness", "wiring");
    }
    return out;
  }

  function citedCauses(row) {
    return (row.c || []).map((item, i) => {
      const id = item[0] || "cause_" + i;
      const likelihood = item[1] || "";
      const title = item[2] || id.replace(/_/g, " ");
      return { id: id, title: title, likelihood: likelihood, kind: classifyCause(id, title) };
    });
  }

  function likelihoodLabel(value) {
    const v = String(value || "").toLowerCase();
    if (v === "h" || v === "high") return "high";
    if (v === "m" || v === "medium") return "medium";
    if (v === "l" || v === "low") return "low";
    return "";
  }

  function sourcesFor(code, tier, row) {
    const list = [];
    if (tier === "detailed-existing") {
      list.push({ name: "Existing ATDD detailed guide in this app", url: "", license: "original ATDD content" });
    }
    if (row) {
      list.push({
        name: "obdex generic OBD-II data",
        url: "https://github.com/foerbsnavi/obdex",
        license: "CC0-1.0"
      });
      sourceUrls(row).forEach((url) => list.push({ name: "Cited document used by obdex", url: url, license: "see source document (obdex cites it; this app does not reproduce that document)" }));
    }
    if (tier === "generated-general") {
      list.push({
        name: "Code meaning taken from this app's DTC description and subsystem, not a vehicle-specific procedure",
        url: "",
        license: "generated-general"
      });
    }
    list.push({ name: "Vehicle service manual for exact test values and pinouts", url: "", license: "manufacturer documentation" });
    return list;
  }

  function tierFor(code, row) {
    if (DETAILED_EXISTING.has(code)) return "detailed-existing";
    if (row) return "detailed-cited";
    return "generated-general";
  }

  function tierLabel(tier) {
    if (tier === "detailed-existing") return EXISTING_LABEL;
    if (tier === "detailed-cited") return CITED_LABEL;
    return GENERAL_LABEL;
  }

  function componentsOf(row) {
    const pack = overlay();
    const names = pack.components || [];
    return ((row && row.p) || []).map((i) => (typeof i === "number" ? names[i] : i)).filter(Boolean);
  }

  function guidanceFor(code, record) {
    const rec = record || findRecord(code) || { code: code, description: "", family: FAMILY[(code || "")[0]] || "", subsystem: "" };
    const row = overlayRow(code);
    const description = rec.description || "";
    const subsystem = rec.subsystem || "";
    const fault = detectFault(description + " " + code);
    const comps = componentsOf(row);
    const part = partFromText(description, comps);
    const cited = row ? citedCauses(row) : [];
    const causeList = cited.length ? cited : generatedCauses(code, description, subsystem, fault);
    const rowForTier = cited.length ? row : (DETAILED_EXISTING.has(code) ? row : null);
    const tier = tierFor(code, rowForTier);
    const ctx = { part: part, fault: fault, subsystem: subsystem, code: code };
    const causes = causeList.map((cause) => ({
      id: cause.id,
      title: cause.title,
      likelihood: likelihoodLabel(cause.likelihood),
      tests: testsForKind(cause.kind || classifyCause(cause.id, cause.title), ctx)
    }));
    return {
      code: code,
      description: description,
      family: rec.family || "",
      subsystem: subsystem,
      tier: tier,
      tierLabel: tierLabel(tier),
      sources: sourcesFor(code, tier, row),
      safety: safetyFor(code, description, subsystem),
      causes: causes,
      existingDetailed: DETAILED_EXISTING.has(code)
    };
  }

  function findRecord(code) {
    const lists = [];
    if (root.DTC_DB_DATA) lists.push(root.DTC_DB_DATA);
    if (root.DTC_SAE_GENERIC_ADDITIONS) lists.push(root.DTC_SAE_GENERIC_ADDITIONS);
    for (const list of lists) {
      const hit = list.find((row) => row.code === code);
      if (hit) return hit;
    }
    return null;
  }

  function allCodes() {
    const map = new Map();
    (root.DTC_DB_DATA || []).forEach((row) => map.set(row.code, row));
    (root.DTC_SAE_GENERIC_ADDITIONS || []).forEach((row) => {
      if (!map.has(row.code)) map.set(row.code, row);
    });
    return [...map.values()];
  }

  const api = {
    MANUAL,
    GENERAL_LABEL,
    CITED_LABEL,
    EXISTING_LABEL,
    DETAILED_EXISTING,
    guidanceFor,
    allCodes,
    findRecord,
    detectFault,
    safetyFor,
    classifyCause
  };
  root.DtcGuidance = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
