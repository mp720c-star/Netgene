import { capacitorBleAvailable, createCapacitorBleTransport } from "../tools/js/capacitor-ble-transport.js";
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
      requireKnownProfile: true,
      onDisconnect() {
        if (active !== scanner) return;
        log("Scanner disconnected.");
        void release(scanner).finally(buttons);
      },
    });
    active = scanner;
    log("Choose the scanner plugged into your vehicle.");
    const [device] = await scanner.scan();
    await scanner.connect(device.id);
    if (active !== scanner) throw new Error("Scanner disconnected.");
    ready = true;
    log("Connected to " + device.name + ". Tap Read codes to ask the vehicle for stored faults.");
  });
}

async function readVehicle() {
  if (!ready) return;
  await perform(async () => {
    const scanner = active;
    // These commands set the adapter's text format and select automatic OBD protocol.
    // Mode 03 is the only vehicle diagnostic request in this workflow.
    for (const command of ["ATE0", "ATL0", "ATS1", "ATH0", "ATSP0"]) {
      const reply = await scanner.send(command);
      if (!/\bOK\b/i.test(reply)) throw new Error("Scanner did not accept " + command + ".");
    }
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

panel.querySelector(".lead").textContent = "Choose your Bluetooth OBD scanner, then read stored codes from the vehicle.";
panel.querySelector("h2").textContent = "Bluetooth scanner";
panel.querySelector("p.small.mt-8").textContent = "A successful read shows the vehicle’s reply here and sends its codes to the offline lookup.";
connect.textContent = "Connect scanner";
top.textContent = "Connect Scanner";
el("btnBtScanAll").hidden = true;
el("btnBtDemo").hidden = true;
el("btIphoneGate").hidden = true;
try { available = capacitorBleAvailable(); } catch { available = false; }
el("btSupport").textContent = available ? "iPhone Bluetooth is available." : "The native Bluetooth connection is unavailable in this copy.";
top.onclick = connect.onclick = choose;
read.onclick = readVehicle;
disconnect.onclick = () => perform(async () => {
  await release(active);
  log("Disconnected.");
});
buttons();
