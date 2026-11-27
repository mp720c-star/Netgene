/**
 * FIXD protocol probe — does NOT assume ELM327.
 *
 * Public research notes that FIXD hardware may use application-specific
 * pairing/communication. Until a live FIXD GATT inspection + successful
 * Mode 03 (or vendor equivalent) round-trip is recorded, compatibility is
 * UNVERIFIED and ATDD must not claim FIXD support.
 */

export const FIXD_STATUS = {
  claim: "UNVERIFIED",
  elm327Assumed: false,
  lastProbe: null
};

/** Common BLE-ELM profiles (candidates only — not FIXD proof). */
export const CANDIDATE_GATT_PROFILES = [
  {
    id: "vlinker-18f0",
    service: "000018f0-0000-1000-8000-00805f9b34fb",
    notify: "00002af0-0000-1000-8000-00805f9b34fb",
    write: "00002af1-0000-1000-8000-00805f9b34fb"
  },
  {
    id: "clone-fff0",
    service: "0000fff0-0000-1000-8000-00805f9b34fb",
    notify: "0000fff1-0000-1000-8000-00805f9b34fb",
    write: "0000fff2-0000-1000-8000-00805f9b34fb"
  },
  {
    id: "clone-ffe0",
    service: "0000ffe0-0000-1000-8000-00805f9b34fb",
    notify: "0000ffe1-0000-1000-8000-00805f9b34fb",
    write: "0000ffe1-0000-1000-8000-00805f9b34fb"
  },
  {
    id: "nordic-uart",
    service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    notify: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
    write: "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
  }
];

/** Adapter identity + init. ATI / ATDP are logged for acceptance rows A3 / A4. */
export const ELM_PROBE_SEQUENCE = [
  "ATZ",
  "ATI",
  "ATE0",
  "ATL0",
  "ATS0",
  "ATH0",
  "ATSP0",
  "ATDP",
  "0100",
];

/**
 * Match discovered GATT services/characteristics to candidate profiles.
 */
export function matchGattProfiles(services) {
  const matches = [];
  const normalized = (services || []).map((s) => ({
    uuid: String(s.uuid || s).toLowerCase(),
    characteristics: (s.characteristics || []).map((c) => ({
      uuid: String(c.uuid || c).toLowerCase(),
      properties: c.properties || {}
    }))
  }));

  for (const profile of CANDIDATE_GATT_PROFILES) {
    const svc = normalized.find((s) => s.uuid.includes(profile.service.replace(/-/g, "").slice(-8)) || s.uuid === profile.service);
    // softer match by trailing short uuid
    const short = profile.service.split("-")[0].replace(/^0000/, "");
    const svc2 =
      svc ||
      normalized.find((s) => s.uuid.replace(/-/g, "").includes(short));
    if (!svc2) continue;
    const hasNotify = svc2.characteristics.some((c) => c.uuid.includes(profile.notify.slice(-8).replace("-", "")) || c.uuid === profile.notify || (c.properties.notify || c.properties.indicate));
    const hasWrite = svc2.characteristics.some((c) => c.properties.write || c.properties.writeWithoutResponse);
    if (hasNotify && hasWrite) {
      matches.push({ ...profile, matchedService: svc2.uuid });
    }
  }
  return matches;
}

/**
 * Evaluate ELM-style probe replies. Success here proves ELM-like UART, NOT FIXD brand support.
 */
export function evaluateElmProbe(transcript) {
  const text = String(transcript || "").toUpperCase();
  const sawAtOk = /\bOK\b/.test(text) || /\bELM\b/.test(text) || /\bV\d\.\d/.test(text);
  const sawPid = /41\s*00/.test(text) || /4100/.test(text);
  const sawNoData = /\bNO DATA\b/.test(text);
  const sawError = /\bERROR\b|\bUNABLE\b|\bCAN ERROR\b|\bBUS INIT\b/.test(text);

  let verdict = "INCONCLUSIVE";
  if (sawAtOk && sawPid) verdict = "ELM_LIKE_OK";
  else if (sawAtOk && sawNoData) verdict = "ELM_LIKE_LINK_NO_ECU";
  else if (sawError && !sawAtOk) verdict = "NOT_ELM_OR_FAILED";
  else if (!sawAtOk) verdict = "NOT_ELM_TEXT_PROTOCOL";

  return {
    verdict,
    sawAtOk,
    sawPid,
    sawNoData,
    sawError,
    fixdClaim: "UNVERIFIED",
    note:
      verdict === "ELM_LIKE_OK"
        ? "Adapter answered ELM-style AT/PID probes. Still not a FIXD brand certification."
        : "FIXD support remains unverified. Do not claim FIXD compatibility."
  };
}

/**
 * Build a structured probe report for the status board / Verify tab.
 */
export function buildProbeReport({ deviceName, services, transcript, connectionState }) {
  const matches = matchGattProfiles(services || []);
  const elm = evaluateElmProbe(transcript || "");
  const report = {
    timestamp: new Date().toISOString(),
    deviceName: deviceName || null,
    connectionState: connectionState || "unknown",
    gattProfileMatches: matches.map((m) => m.id),
    elmProbe: elm,
    fixdCompatibility: "UNVERIFIED",
    allowedClaims: [],
    deniedClaims: ["FIXD official protocol support", "Simulated readings as live vehicle data"]
  };
  if (elm.verdict === "ELM_LIKE_OK" || elm.verdict === "ELM_LIKE_LINK_NO_ECU") {
    report.allowedClaims.push("ELM-like AT command transport (candidate)");
  }
  FIXD_STATUS.lastProbe = report;
  return report;
}

export function nameLooksLikeFixd(name) {
  return /fixd/i.test(String(name || ""));
}
