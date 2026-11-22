/**
 * Explicit setup for an identified ELM-compatible adapter. These commands change
 * serial/protocol settings on the adapter, never vehicle fault memory.
 */
export const ELM_CONNECTION_SETTINGS = Object.freeze(["ATE0", "ATL0", "ATS1", "ATH0", "ATSP0"]);

export function adapterAcknowledged(reply, command) {
  const value = String(reply).trim().toUpperCase();
  if (!/^[^>]*>$/.test(value)) return false;
  const lines = value.slice(0, -1).split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) => line !== command).join("") === "OK";
}

export async function prepareElmAdapter(scanner, record = () => {}) {
  const identity = await scanner.identifyAdapter();
  record("Adapter identified: " + identity);
  for (const command of ELM_CONNECTION_SETTINGS) {
    const reply = await scanner.configureAdapter(command);
    record(command + ": " + String(reply).trim());
    if (!adapterAcknowledged(reply, command)) throw new Error("The adapter did not accept " + command + ". Connection setup stopped.");
  }
  record("ELM connection settings are ready. The vehicle has not been read yet.");
  return identity;
}
