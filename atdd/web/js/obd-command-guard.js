/**
 * OBD-II command allowlist for the ATDD TestFlight / native scanner.
 *
 * Reads: Mode 01 current data, Mode 03 stored DTCs, Mode 07 pending DTCs,
 * Mode 0A permanent DTCs, Mode 09 vehicle information, UDS 1902FF
 * (report DTC by status mask), and UDS Mode 22 DID reads (22xxxx) for
 * live-data probes. Adapter setup configures the dongle only.
 * Mode 04 and UDS 14FFFFFF clear codes. They are allowed only when the
 * operator confirms Clear vehicle codes / Clear All Supported Codes.
 * New scan does not send them.
 * 1003 / 1001 switch a module into the extended diagnostic session and back
 * so it can answer 1902FF. Programming session 1002 stays blocked.
 *
 * Blocked: ATMA, ATPP, every other AT command, and every other service.
 * FIXD compatibility is PARTIAL: owner-confirmed last TestFlight reached the
 * 2008 Sierra and Mode 03 returned real powertrain codes. EBCM/BCM headers
 * and live DID scaling remain unproven — never invent scanner data.
 */

export const FIXD_COMPATIBILITY = "PARTIAL";

export const ALLOWED_ELM_ADAPTER_INIT = Object.freeze([
  "ATZ",
  "ATE0",
  "ATL0",
  "ATS0",
  "ATH0",
  "ATSP0",
]);

const EXTRA_ADAPTER = new Set([
  "ATL1",
  "ATH1",
  "ATCAF1",
  "ATAT1",
  "ATAR",
  "ATFCSM0",
  "ATFCSM1",
  "ATCP18",
  "ATSH7DF",
  "ATFCSD300000",
  "ATI",
  "ATDP",
  "ATDPN",
  "ATRV",
]);

export function normalizeObdCommand(command) {
  return String(command ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Return the normalized command when it is a vehicle read, a confirmed clear,
 * or dongle setup. Throws otherwise. The trailing ELM CR is not part of the command.
 */
export function assertAllowedObdCommand(command) {
  const normalized = normalizeObdCommand(command);
  if (!normalized) {
    throw new Error("Blocked: an empty OBD command is not allowed.");
  }
  if (
    normalized === "03" ||
    normalized === "07" ||
    normalized === "0A" ||
    normalized === "04" ||
    normalized === "1902FF" ||
    normalized === "14FFFFFF" ||
    normalized === "1001" ||
    normalized === "1003" ||
    /^01[0-9A-F]{2}$/.test(normalized) ||
    /^09[0-9A-F]{2}$/.test(normalized) ||
    /^22[0-9A-F]{4}$/.test(normalized)
  ) {
    return normalized;
  }
  if (ALLOWED_ELM_ADAPTER_INIT.includes(normalized) || EXTRA_ADAPTER.has(normalized)) {
    return normalized;
  }
  if (/^AT(?:SH|CRA|FCSH)(?:[0-9A-F]{3}|[0-9A-F]{8})$/.test(normalized)) {
    return normalized;
  }
  if (
    normalized.startsWith("ATMA") ||
    normalized.startsWith("ATPP") ||
    normalized === "1002" ||
    normalized.startsWith("ATBD")
  ) {
    throw new Error(
      "Blocked: monitoring-all, programmable parameters, and the programming session are disabled. FIXD compatibility is PARTIAL.",
    );
  }
  throw new Error(
    "Blocked: that command is not a supported read or the confirmed clear. FIXD compatibility is PARTIAL.",
  );
}
