/**
 * ATDD classic Bluetooth · any ELM327-style BLE OBD-II reader
 * Non-module bridge for the v1.2.0 shell (CSP script-src 'self').
 *
 * A failed live connect does not invent codes.
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
    "0000ffe5-0000-1000-8000-00805f9b34fb",
    "0000fff0-0000-1000-8000-00805f9b34fb",
  ];
  const WRITE_HINTS = ["fff2", "ffe1", "ffe9", "2af1", "6e400002", "fff2"];
  const NOTIFY_HINTS = ["fff1", "ffe1", "ffe4", "2af0", "6e400003", "fff1"];
  const ELM_PROBE = ["ATZ", "ATI", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0", "ATDP", "0100"];
  const NAME_FILTERS = [
    { namePrefix: "FIXD" },
    { namePrefix: "fixd" },
    { namePrefix: "OBD" },
    { namePrefix: "ELM" },
    { namePrefix: "VEEPEAK" },
    { namePrefix: "Veepeak" },
    { namePrefix: "Vgate" },
    { namePrefix: "VGATE" },
    { namePrefix: "OBDLink" },
    { namePrefix: "OBDLINK" },
    { namePrefix: "OBDII" },
    { namePrefix: "OBD2" },
    { namePrefix: "Kiwi" },
    { namePrefix: "BAFX" },
    { namePrefix: "Carista" },
    { namePrefix: "LELink" },
    { namePrefix: "Scan" },
    { namePrefix: "Android-Vlink" },
    { namePrefix: "IOS-Vlink" },
    { namePrefix: "V-Link" },
    { namePrefix: "CN100" },
    { namePrefix: "DUN" },
  ];

  let device = null;
  let server = null;
  let writeChar = null;
  let notifyChar = null;
  let replyBuffer = "";
  let busy = false;
  let answeredNodes = [];

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
    const clear = byId("btnBtClearVehicle");
    const disc = byId("btnBtDisconnect");
    const webOk = webBluetoothAvailable();
    if (connect) connect.disabled = busy || !webOk;
    if (scanAll) scanAll.disabled = busy || !webOk;
    if (read) read.disabled = busy || !writeChar;
    if (clear) clear.disabled = busy || !writeChar;
    if (disc) disc.disabled = busy || !device;
  }

  function webBluetoothAvailable() {
    return typeof navigator !== "undefined" && !!navigator.bluetooth && typeof navigator.bluetooth.requestDevice === "function";
  }

  function webBluetoothBlockReason() {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (isiOS) {
      return "iPhone Safari / Home Screen PWA has no Web Bluetooth. Live OBD-II scanning needs the native ATDD TestFlight app (any ELM327-style BLE adapter).";
    }
    if (!window.isSecureContext) {
      return "Web Bluetooth requires HTTPS (or localhost).";
    }
    return "This browser does not support Web Bluetooth. Use Chrome or Edge on Android/desktop.";
  }

  function confirmClear() {
    const dialog = byId("clearCodesDialog");
    if (!dialog || typeof dialog.showModal !== "function") {
      return Promise.resolve(
        window.confirm(
          "Clear emissions and ABS/module codes this vehicle accepts? Park, key on, engine off."
        )
      );
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        dialog.close();
        resolve(value);
      };
      const form = byId("clearCodesForm");
      const cancel = byId("btnClearVehicleCancel");
      if (form) {
        form.addEventListener(
          "submit",
          (event) => {
            event.preventDefault();
            finish(true);
          },
          { once: true }
        );
      }
      if (cancel) cancel.addEventListener("click", () => finish(false), { once: true });
      dialog.addEventListener("cancel", () => finish(false), { once: true });
      dialog.showModal();
    });
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
            filters: NAME_FILTERS,
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
    log(
      "Probe finished. Adapter speaks ELM-style AT commands. FIXD brand protocol claim: " +
        FIXD_CLAIM +
        ". Tap Read codes for a full OBD scan (including chassis codes when that module answers)."
    );
    setBusy(false);
  }

  async function sendOptional(cmd, waitMs) {
    try {
      return await sendCommand(cmd, waitMs);
    } catch (err) {
      log("Optional command skipped: " + cmd + " (" + (err && err.message ? err.message : err) + ")");
      return "";
    }
  }

  async function probeClearNodes() {
    const scan = global.ATDDVehicleScan;
    if (!scan) return [];
    const found = [];
    const nodes = [].concat(scan.PHYSICAL_NODES || [], scan.EXTRA_NODES || []);
    for (const node of nodes) {
      for (const command of scan.adapterHeader(node)) {
        await sendOptional(command, 400);
      }
      const reply = await sendOptional("03", 1200);
      if (scan.replyHasVehicleData(reply)) found.push(node);
    }
    for (const command of scan.RESTORE_HEADER || []) await sendOptional(command, 400);
    return found;
  }

  function applyCodesToScanner(codes) {
    const field = byId("codes");
    if (!field) return;
    const next = codes.join("\n");
    field.value = next;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    log("Live codes written to scanner field: " + (codes.join(", ") || "(none returned)"));
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus();
  }

  function showLiveScanReadout(reply, codes, ok) {
    const api = global.ATDDScanReadout;
    if (!api) return;
    api.showScanReadout({ ok: !!ok, codes: codes || [], reply });
  }

  async function readCodesLive() {
    if (!writeChar) throw new Error("Connect a scanner first.");
    const scan = global.ATDDVehicleScan;
    if (!scan) {
      log("Reading Mode 03 DTCs…");
      const reply = await sendCommand("03", 1500);
      log(reply || "(empty Mode 03 reply)");
      const codes = parseMode03Response(reply);
      applyCodesToScanner(codes);
      showLiveScanReadout(reply, codes, /43/i.test(String(reply)));
      return;
    }
    const sections = [];
    for (const step of scan.FUNCTIONAL_READS) {
      log("Requesting " + step.label + ".");
      const reply = await sendCommand(step.command, Math.min(step.timeoutMs, 2500));
      log(reply || "(no reply)");
      sections.push({ label: step.label, raw: reply });
    }
    log("Probing chassis/ABS addresses the adapter will answer…");
    const nodes = [];
    const candidates = [].concat(scan.PHYSICAL_NODES || [], scan.EXTRA_NODES || []);
    for (const node of candidates) {
      for (const command of scan.adapterHeader(node)) await sendOptional(command, 350);
      for (const step of scan.MODULE_READS || []) {
        const reply = await sendOptional(step.command, Math.min(step.timeoutMs || 2000, 2000));
        if (reply) {
          sections.push({
            label: (node.request || "module") + " " + step.label,
            raw: reply,
          });
          log(node.request + " " + step.label + ": " + reply);
        }
        if (scan.replyHasVehicleData(reply)) {
          if (!nodes.some((n) => n.request === node.request)) nodes.push(node);
        }
      }
    }
    answeredNodes = nodes;
    for (const command of scan.RESTORE_HEADER || []) await sendOptional(command, 350);
    if (!nodes.length) {
      log("No chassis/ABS module answered. Only functional OBD codes are listed — nothing was invented.");
    } else {
      log("Modules that answered (eligible for clear): " + nodes.map((n) => n.request).join(", "));
    }
    const report = scan.buildReport(sections);
    applyCodesToScanner(report.uniqueCodes);
    const reply = sections.map((section) => section.raw).join("\n");
    const api = global.ATDDScanReadout;
    if (api) api.showScanReadout({ ok: true, codes: report.uniqueCodes, reply, report });
  }

  async function clearVehicleLive() {
    if (!writeChar) throw new Error("Connect a scanner first.");
    const accepted = await confirmClear();
    if (!accepted) {
      log("Clear cancelled. Nothing was sent to the vehicle.");
      return;
    }
    const scan = global.ATDDVehicleScan;
    log(
      "Clearing emissions (Mode 04) and sending a module clear to each computer that answered — including ABS/chassis when it answered. New scan does not send a clear."
    );
    if (scan && scan.RESTORE_HEADER) {
      for (const command of scan.RESTORE_HEADER) await sendOptional(command, 500);
    }
    const emissions = await sendCommand(scan ? scan.CLEAR_EMISSIONS : "04", 2500);
    log(emissions || "(no Mode 04 reply)");
    const nodes =
      answeredNodes && answeredNodes.length
        ? answeredNodes
        : await probeClearNodes();
    answeredNodes = nodes;
    if (scan && nodes.length) {
      for (const node of nodes) {
        for (const command of scan.adapterHeader(node)) await sendOptional(command, 400);
        const cleared = await sendOptional(scan.CLEAR_MODULE, 2000);
        log(
          "Module clear " +
            node.request +
            ": " +
            (cleared || "(no reply)")
        );
      }
      for (const command of scan.RESTORE_HEADER || []) await sendOptional(command, 400);
    } else {
      log("No answering modules remembered for ABS/module clear. Emissions clear still ran.");
    }
    await readCodesLive();
  }

  function showBluetoothPanel() {
    const card = byId("bluetoothCard");
    if (!card) return;
    if (typeof window.showAtddTab === "function") window.showAtddTab("scan", { scroll: false });
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
        ? "Web Bluetooth ready. Tap Connect OBD-II Scanner (or Scan any BLE device), pick your adapter, then Read codes."
        : webBluetoothBlockReason();
    }
    if (gate) {
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      if (!ok && isiOS) {
        gate.hidden = false;
        gate.textContent =
          "iPhone web shell cannot use Bluetooth. Keep using Diagnose / Listen / Look / Code here. Live scanning of any ELM327-style BLE OBD-II adapter needs the native ATDD TestFlight app — or use Chrome/Edge on Android/desktop for Web Bluetooth.";
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

    async function startConnect(scanAll) {
      if (busy) return;
      showBluetoothPanel();
      setBusy(true);
      try {
        await connectLive({ scanAll: !!scanAll });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        log(
          "OBD-II live connect failed:\n" +
            msg +
            "\n\nNo codes were invented. Fix Bluetooth, then tap Connect again — or use Scan any BLE device for adapters with odd names."
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
    const clear = byId("btnBtClearVehicle");
    if (clear) {
      clear.onclick = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await clearVehicleLive();
        } catch (err) {
          log("Clear failed: " + (err && err.message ? err.message : err));
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

    refreshSupportUi();
    setBusy(false);
  }

  global.ATDDBluetooth = {
    bind: bindBluetoothUi,
    show: showBluetoothPanel,
    claim: FIXD_CLAIM,
    parseMode03Response,
    decodeDtcPair,
    resetSession: disconnect,
  };
})(window);
