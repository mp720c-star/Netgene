/**
 * ATDD classic Bluetooth · Connect FIXD
 * Non-module bridge for the v1.2.0 shell (CSP script-src 'self').
 *
 * Live connect never silently falls back to Demo.
 * FIXD protocol claim stays UNVERIFIED until a live Mode 03 round-trip succeeds.
 */
(function (global) {
  "use strict";

  const FIXD_CLAIM = "UNVERIFIED";
  const OPTIONAL_SERVICES = [
    0xfff0,
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "000018f0-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  ];
  const WRITE_HINTS = ["fff2", "ffe1", "2af1", "6e400002"];
  const NOTIFY_HINTS = ["fff1", "ffe1", "2af0", "6e400003"];
  const ELM_PROBE = ["ATZ", "ATE0", "ATL0", "ATH1", "ATSP0", "0100"];

  let device = null;
  let server = null;
  let writeChar = null;
  let notifyChar = null;
  let replyBuffer = "";
  let busy = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function log(msg) {
    const el = byId("btLog");
    if (!el) return;
    const line = String(msg);
    el.textContent = el.textContent && el.textContent !== "Idle. Tap Connect, with the adapter powered in the OBD port."
      ? el.textContent + "\n" + line
      : line;
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(next) {
    busy = next;
    const connect = byId("btnBtConnect");
    const scanAll = byId("btnBtScanAll");
    const read = byId("btnBtReadCodes");
    const disc = byId("btnBtDisconnect");
    const demo = byId("btnBtDemo");
    const webOk = webBluetoothAvailable();
    if (connect) connect.disabled = busy || !webOk;
    if (scanAll) scanAll.disabled = busy || !webOk;
    if (demo) demo.disabled = busy;
    if (read) read.disabled = busy || !writeChar;
    if (disc) disc.disabled = busy || !device;
  }

  function webBluetoothAvailable() {
    return typeof navigator !== "undefined" && !!navigator.bluetooth && typeof navigator.bluetooth.requestDevice === "function";
  }

  function webBluetoothBlockReason() {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (isiOS) {
      return "iPhone Safari / Home Screen PWA has no Web Bluetooth. Live FIXD needs the native ATDD Connect app (com.netgene.atdd.ble) via TestFlight when signing is ready.";
    }
    if (!window.isSecureContext) {
      return "Web Bluetooth requires HTTPS (or localhost).";
    }
    return "This browser does not support Web Bluetooth. Use Chrome or Edge on Android/desktop.";
  }

  function normalizeUuid(uuid) {
    return String(uuid).toLowerCase().replace(/-/g, "");
  }

  function pickCharacteristics(characteristics) {
    let write = null;
    let notify = null;
    for (const ch of characteristics) {
      const id = normalizeUuid(ch.uuid);
      const props = ch.properties || {};
      if (!write && WRITE_HINTS.some((h) => id.includes(h)) && (props.write || props.writeWithoutResponse)) {
        write = ch;
      }
      if (!notify && NOTIFY_HINTS.some((h) => id.includes(h)) && (props.notify || props.indicate)) {
        notify = ch;
      }
    }
    if (!write) {
      write = characteristics.find((c) => c.properties && (c.properties.write || c.properties.writeWithoutResponse)) || null;
    }
    if (!notify) {
      notify = characteristics.find((c) => c.properties && (c.properties.notify || c.properties.indicate)) || null;
    }
    return { write, notify };
  }

  function decodeDtcPair(a, b) {
    if ((a === 0 && b === 0) || a == null || b == null) return null;
    const typeBits = (a & 0xc0) >> 6;
    const type = ["P", "C", "B", "U"][typeBits];
    const firstDigit = (a & 0x30) >> 4;
    const secondDigit = a & 0x0f;
    const thirdDigit = (b & 0xf0) >> 4;
    const fourthDigit = b & 0x0f;
    return (
      type +
      firstDigit +
      secondDigit.toString(16).toUpperCase() +
      thirdDigit.toString(16).toUpperCase() +
      fourthDigit.toString(16).toUpperCase()
    );
  }

  function parseMode03Response(text) {
    const cleaned = String(text)
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^SEARCHING/i.test(l) && l !== ">" && !/^OK$/i.test(l) && !/^AT/i.test(l));

    const hexChunks = [];
    for (const line of cleaned) {
      const noSpaces = line.replace(/\s+/g, "").toUpperCase();
      if (!/^[0-9A-F]+$/.test(noSpaces)) continue;
      hexChunks.push(noSpaces);
    }

    const joined = hexChunks.join("");
    let payload = joined;
    const idx = joined.indexOf("43");
    if (idx >= 0) payload = joined.slice(idx + 2);

    const bytes = [];
    for (let i = 0; i + 1 < payload.length; i += 2) {
      bytes.push(parseInt(payload.slice(i, i + 2), 16));
    }

    let start = 0;
    if (bytes.length && bytes[0] <= 16 && bytes.length === 1 + bytes[0] * 2) {
      start = 1;
    }

    const codes = [];
    for (let i = start; i + 1 < bytes.length; i += 2) {
      const code = decodeDtcPair(bytes[i], bytes[i + 1]);
      if (code) codes.push(code);
    }
    return [...new Set(codes)];
  }

  function encoder() {
    return new TextEncoder();
  }

  function decoder() {
    return new TextDecoder();
  }

  function onNotify(ev) {
    try {
      const value = ev.target.value;
      replyBuffer += decoder().decode(value.buffer ? value.buffer : value);
    } catch (err) {
      log("Notify decode error: " + (err && err.message ? err.message : err));
    }
  }

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function sendCommand(cmd, waitMs) {
    if (!writeChar) throw new Error("Not connected");
    replyBuffer = "";
    const payload = encoder().encode(cmd + "\r");
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(payload);
    } else {
      await writeChar.writeValue(payload);
    }
    await sleep(waitMs || 600);
    return replyBuffer;
  }

  async function disconnect() {
    try {
      if (notifyChar) {
        try {
          notifyChar.removeEventListener("characteristicvaluechanged", onNotify);
          await notifyChar.stopNotifications();
        } catch (_) {
          /* ignore */
        }
      }
      if (device && device.gatt && device.gatt.connected) {
        device.gatt.disconnect();
      }
    } finally {
      device = null;
      server = null;
      writeChar = null;
      notifyChar = null;
      replyBuffer = "";
      setBusy(false);
      log("Disconnected.");
    }
  }

  async function connectLive(options) {
    const scanAll = !!(options && options.scanAll);
    if (!webBluetoothAvailable()) {
      throw new Error(webBluetoothBlockReason());
    }
    log(
      scanAll
        ? "Requesting any Bluetooth device (picker)…"
        : "Requesting Bluetooth device (FIXD / ELM-class)…"
    );
    device = await navigator.bluetooth.requestDevice(
      scanAll
        ? { acceptAllDevices: true, optionalServices: OPTIONAL_SERVICES }
        : {
            acceptAllDevices: false,
            filters: [
              { namePrefix: "FIXD" },
              { namePrefix: "fixd" },
              { namePrefix: "OBD" },
              { namePrefix: "ELM" },
              { namePrefix: "VEEPEAK" },
              { namePrefix: "Vgate" },
              { namePrefix: "OBDLink" },
            ],
            optionalServices: OPTIONAL_SERVICES,
          }
    );
    device.addEventListener("gattserverdisconnected", () => {
      log("GATT disconnected.");
      writeChar = null;
      notifyChar = null;
      setBusy(false);
    });
    log("Connecting to " + (device.name || "adapter") + "…");
    server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    let picked = null;
    for (const svc of services) {
      const chars = await svc.getCharacteristics();
      const { write, notify } = pickCharacteristics(chars);
      if (write && notify) {
        picked = { write, notify, service: svc.uuid };
        break;
      }
    }
    if (!picked) {
      throw new Error("No writable/notify UART characteristics found. FIXD claim remains " + FIXD_CLAIM + ".");
    }
    writeChar = picked.write;
    notifyChar = picked.notify;
    await notifyChar.startNotifications();
    notifyChar.addEventListener("characteristicvaluechanged", onNotify);
    log("Linked GATT service " + picked.service + ". Running ELM probe (does not prove FIXD brand)…");
    for (const cmd of ELM_PROBE) {
      const reply = await sendCommand(cmd, cmd === "ATZ" ? 1200 : 700);
      log("> " + cmd + "\n" + (reply || "(no reply)"));
    }
    log("Probe finished. FIXD protocol claim: " + FIXD_CLAIM + ". Tap Read codes for Mode 03.");
    setBusy(false);
  }

  function applyCodesToScanner(codes, simulated) {
    const field = byId("codes");
    if (!field) return;
    const next = codes.join("\n");
    field.value = next;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    if (simulated) {
      log("SIMULATED codes written to scanner field (not from FIXD): " + (codes.join(", ") || "(none)"));
    } else {
      log("Live codes written to scanner field: " + (codes.join(", ") || "(none returned)"));
    }
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus();
  }

  async function readCodesLive() {
    if (!writeChar) throw new Error("Connect FIXD first.");
    log("Reading Mode 03 DTCs…");
    const reply = await sendCommand("03", 1500);
    log(reply || "(empty Mode 03 reply)");
    const codes = parseMode03Response(reply);
    applyCodesToScanner(codes, false);
    if (!codes.length) {
      log("No DTCs parsed. Adapter replied, but FIXD application protocol is still " + FIXD_CLAIM + " until a known-good Mode 03 match is confirmed.");
    } else {
      log("Parsed " + codes.length + " code(s). You can tap Diagnose now.");
    }
  }

  async function runDemo() {
    log("Demo only (SIMULATED). This does not pair to FIXD or your vehicle.");
    await sleep(400);
    applyCodesToScanner(["P0300", "P0420"], true);
    log("SIMULATED session complete. Live Connect FIXD was not used.");
  }

  function showBluetoothPanel() {
    const card = byId("bluetoothCard");
    if (!card) return;
    card.hidden = false;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function refreshSupportUi() {
    const support = byId("btSupport");
    const gate = byId("btIphoneGate");
    const connect = byId("btnBtConnect");
    const ok = webBluetoothAvailable();
    if (support) {
      support.textContent = ok
        ? "Web Bluetooth ready. Tap Connect FIXD, pick your adapter, then Read codes."
        : webBluetoothBlockReason();
    }
    if (gate) {
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      if (!ok && isiOS) {
        gate.hidden = false;
        gate.textContent =
          "iPhone web shell cannot use Bluetooth. Keep using Diagnose / Listen / Look / Code here. Live FIXD needs native ATDD Connect (com.netgene.atdd.ble) when TestFlight signing is ready — or use Chrome/Edge on Android/desktop for Web Bluetooth.";
      } else {
        gate.hidden = true;
      }
    }
    if (connect) connect.disabled = !ok;
  }

  function bindBluetoothUi() {
    const connect = byId("btnBtConnect");
    const read = byId("btnBtReadCodes");
    const disc = byId("btnBtDisconnect");
    const demo = byId("btnBtDemo");

    async function startConnect(scanAll) {
      if (busy) return;
      showBluetoothPanel();
      setBusy(true);
      try {
        await connectLive({ scanAll: !!scanAll });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        log(
          "FIXD/live connect failed:\n" +
            msg +
            "\n\nDemo was NOT started. Fix Bluetooth, then tap Connect FIXD again."
        );
        await disconnect();
      } finally {
        setBusy(false);
      }
    }

    const top = byId("btnBluetoothTop");
    if (top) {
      top.onclick = () => startConnect(false);
    }
    if (connect) {
      connect.onclick = () => startConnect(false);
    }
    const scanAllBtn = byId("btnBtScanAll");
    if (scanAllBtn) {
      scanAllBtn.onclick = () => startConnect(true);
    }

    if (read) {
      read.onclick = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await readCodesLive();
        } catch (err) {
          log("Read codes failed: " + (err && err.message ? err.message : err));
        } finally {
          setBusy(false);
        }
      };
    }

    if (disc) {
      disc.onclick = async () => {
        setBusy(true);
        await disconnect();
      };
    }

    if (demo) {
      demo.onclick = async () => {
        if (busy) return;
        showBluetoothPanel();
        setBusy(true);
        try {
          await runDemo();
        } finally {
          setBusy(false);
        }
      };
    }

    refreshSupportUi();
    setBusy(false);
  }

  global.ATDDBluetooth = {
    bind: bindBluetoothUi,
    show: showBluetoothPanel,
    claim: FIXD_CLAIM,
    parseMode03Response,
    decodeDtcPair,
  };
})(window);
