/**
 * Read-only OBD-II command allowlist for the ATDD TestFlight / native scanner.
 *
 * Allowed: Mode 01 (show current data, e.g. 0100), Mode 03 (stored DTCs), and a
 * strict ELM327 adapter-setup whitelist (ATZ, ATE0, ATL0, ATS0, ATH0, ATSP0).
 * Those AT commands configure the dongle only: they are not vehicle writes and
 * they do not clear diagnostic trouble codes. Shipping this whitelist in a
 * TestFlight build needs an explicit operator OK.
 *
 * Blocked: Mode 04 (clear codes), every other AT command (ATMA, ATPP, ATS1, …),
 * and every other service. FIXD compatibility stays UNVERIFIED until a real-device
 * Mode 03 round-trip is confirmed. Do not invent scanner data here.
 */

export const FIXD_COMPATIBILITY = "UNVERIFIED";

export const ALLOWED_ELM_ADAPTER_INIT = Object.freeze([
  "ATZ",
  "ATE0",
  "ATL0",
  "ATS0",
  "ATH0",
  "ATSP0",
]);

export function normalizeObdCommand(command) {
  return String(command ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Return the normalized command if it is a read-only Mode 01 or Mode 03
 * request, or one of the exact ELM adapter-setup commands above.
 * Throws otherwise. The trailing ELM CR is not part of the command.
 */
export function assertAllowedObdCommand(command) {
  const normalized = normalizeObdCommand(command);
  if (!normalized) {
    throw new Error("Blocked: an empty OBD command is not allowed.");
  }
  if (normalized === "03" || /^01[0-9A-F]{2}$/.test(normalized)) {
    return normalized;
  }
  if (ALLOWED_ELM_ADAPTER_INIT.includes(normalized)) {
    return normalized;
  }
  if (normalized.startsWith("AT") || normalized === "04" || /^04[0-9A-F]*$/.test(normalized)) {
    throw new Error(
      "Blocked: only read-only Mode 01, Mode 03, and the ELM adapter-setup set ATZ/ATE0/ATL0/ATS0/ATH0/ATSP0 are allowed. Mode 04 clear-codes and other AT commands (including ATMA and ATPP) are disabled. FIXD compatibility is UNVERIFIED.",
    );
  }
  throw new Error(
    "Blocked: only read-only Mode 01, Mode 03, and the ELM adapter-setup set ATZ/ATE0/ATL0/ATS0/ATH0/ATSP0 are allowed. FIXD compatibility is UNVERIFIED.",
  );
}
