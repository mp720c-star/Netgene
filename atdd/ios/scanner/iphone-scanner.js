import { capacitorBleAvailable, createCapacitorBleTransport } from "../tools/js/capacitor-ble-transport.js";
import { FIXD_COMPATIBILITY } from "../tools/js/obd-command-guard.js";
import { storedCodes } from "./stored-codes.js";

const el = (id) => document.getElementById(id);
const panel = el("bluetoothCard");
const field = el("codes");
const connect = el("btnBtConnect");
const top = el("btnBluetoothTop");
const read = el("btnBtReadCodes");
const disconnect = el("btnBtDisconnect");
const output = el("btLog");
let active;
let ready = false;
let busy = false;
let available = false;

function buttons() {
  top.disabled = busy;
  connect.disabled = busy || !available || Boolean(active);
  read.disabled = busy || !ready;
  disconnect.disabled = busy || !ready;
}

function log(message) {
  output.textContent += (output.textContent ? "\n" : "") + message;
  output.scrollTop = output.scrollHeight;
}

async function release(scanner) {
  if (active === scanner) {
    active = undefined;
    ready = false;
  }
  if (scanner) await scanner.disconnect();
}

async function perform(action) {
  if (busy) return;
  busy = true;
  buttons();
  try {
    await action();
  } catch (error) {
    log(error?.message || String(error));
    await release(active);
  } finally {
    busy = false;
    buttons();
  }
}

async function choose() {
  panel.hidden = false;
  panel.scrollIntoView({ block: "start" });
  if (active || !available) return;
  await perform(async () => {
    output.textContent = "";
    const scanner = createCapacitorBleTransport({
      // Prefer known FIXD/ELM GATT profiles, then fall back to a generic UART
      // service so off-brand ELM327-style BLE adapters can still be chosen.
      requireKnownProfile: false,
      onDisconnect() {
        if (active !== scanner) return;
        log("Scanner disconnected.");
        void release(scanner).finally(buttons);
      },
    });
    active = scanner;
    log("Choose a FIXD or generic ELM327-style BLE OBD-II adapter plugged into the vehicle.");
    log("FIXD compatibility is " + FIXD_COMPATIBILITY + " until a real-device Mode 03 round-trip is confirmed.");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    const name = device.name || "BLE adapter";
    const fixdName = device.isFixdName ? " (FIXD-named device; protocol still " + FIXD_COMPATIBILITY + ")" : "";
    log("Connected to " + name + fixdName + ". Tap Read codes to request stored faults (Mode 03 only).");
  });
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    // Read-only: Mode 03 stored DTCs only. No AT init, no Mode 04 clear.
    const reply = await scanner.send("03");
    log("Vehicle reply for Mode 03\n" + reply.trim());
    const codes = storedCodes(reply);
    if (active !== scanner) throw new Error("Scanner disconnected before the read finished.");
    field.value = codes.join("\n");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    if (codes.length) {
      log("Stored codes from the vehicle: " + codes.join(", "));
      el("btnLookup").click();
    } else {
      log("The vehicle reported no stored fault codes.");
    }
  });
}

panel.querySelector(".lead").textContent =
  "Connect a FIXD or generic ELM327-style BLE OBD-II scanner, then read stored codes (Mode 01/03 only). FIXD compatibility is " +
  FIXD_COMPATIBILITY +
  ".";
panel.querySelector("h2").textContent = "Connect OBD-II Scanner";
panel.querySelector("p.small.mt-8").textContent =
  "A successful Mode 03 read shows the vehicle’s reply here and sends its codes to the offline lookup. Mode 04 clear-codes and AT writes are blocked. No simulated scanner data is used.";
connect.textContent = "Connect OBD-II Scanner";
top.textContent = "Connect Scanner";
el("btnBtScanAll").hidden = true;
el("btnBtDemo").hidden = true;
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available
  ? "iPhone Bluetooth is available. FIXD compatibility is " + FIXD_COMPATIBILITY + "."
  : "The native Bluetooth connection is unavailable in this copy.";
top.onclick = connect.onclick = choose;
read.onclick = readVehicle;
disconnect.onclick = () => perform(async () => {
  await release(active);
  log("Disconnected.");
});
buttons();
