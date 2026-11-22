/**
 * Read-only OBD-II command allowlist for the ATDD TestFlight / native scanner.
 *
 * Allowed: Mode 01 (show current data, e.g. 0100) and Mode 03 (stored DTCs).
 * Blocked: Mode 04 (clear codes), AT writes (ATZ, ATE0, ATSP0, …), and every
 * other service. FIXD compatibility stays UNVERIFIED until a real-device
 * Mode 03 round-trip is confirmed. Do not invent scanner data here.
 */

export const FIXD_COMPATIBILITY = "UNVERIFIED";

export function normalizeObdCommand(command) {
  return String(command ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Return the normalized command if it is a read-only Mode 01 or Mode 03 request.
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
  if (normalized.startsWith("AT") || normalized === "04" || /^04[0-9A-F]*$/.test(normalized)) {
    throw new Error(
      "Blocked: only read-only Mode 01 and Mode 03 are allowed. Mode 04 clear-codes and AT writes are disabled. FIXD compatibility is UNVERIFIED.",
    );
  }
  throw new Error(
    "Blocked: only read-only Mode 01 and Mode 03 commands are allowed. FIXD compatibility is UNVERIFIED.",
  );
}
