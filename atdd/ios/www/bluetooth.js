/**
 * ATDD classic Bluetooth / Wi-Fi · Connect Scanner
 * Non-module bridge for the v1.2.0 shell (CSP script-src 'self').
 *
 * Transports (priority):
 *  1) Capacitor BluetoothLe (native iOS/Android CoreBluetooth / Android BLE)
 *  2) Web Bluetooth (Chrome/Edge desktop & Android)
 *  3) Wi-Fi OBD TCP via native ObdWifi plugin (ELM327-class adapters)
 *
 * Bluetooth Classic (SPP) is NOT supported by iOS apps — documented in UI.
 * Live connect never silently falls back to Demo.
 * FIXD protocol claim stays UNVERIFIED until a live Mode 03 round-trip succeeds
 * against real FIXD-advertised GATT UUIDs (none verified in this repo).
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
  const CANDIDATE_SERVICES = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  ];
  const WRITE_HINTS = ["fff2", "ffe1", "2af1", "6e400002"];
  const NOTIFY_HINTS = ["fff1", "ffe1", "2af0", "6e400003"];
  const ELM_PROBE = ["ATZ", "ATE0", "ATL0", "ATH1", "ATSP0", "0100"];

  let transportKind = "none"; // capacitor-ble | web-bluetooth | wifi-obd | simulated
  let device = null;
  let server = null;
  let writeChar = null;
  let notifyChar = null;
  let capDeviceId = null;
  let capWrite = null;
  let capNotify = null;
  let replyBuffer = "";
  let busy = false;
  let pendingResolve = null;
  let pendingReject = null;
  let responseTimer = null;
  let lastLiveReadings = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function log(msg) {
    const el = byId("btLog");
    if (!el) return;
    const line = String(msg);
    const idle =
      "Idle. Tap Bluetooth in the top bar, then Connect Scanner with the adapter powered in the OBD port.";
    el.textContent = el.textContent && el.textContent !== idle ? el.textContent + "\n" + line : line;
    el.scrollTop = el.scrollHeight;
  }

  function getCapacitor() {
    return global.Capacitor || null;
  }

  function capacitorBleAvailable() {
    const cap = getCapacitor();
    if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return false;
    return !!(cap.Plugins && (cap.Plugins.BluetoothLe || cap.Plugins.BleClient));
  }

  function wifiObdAvailable() {
    const cap = getCapacitor();
    if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return false;
    return !!(cap.Plugins && cap.Plugins.ObdWifi);
  }

  function blePlugin() {
    const cap = getCapacitor();
    const ble = cap && cap.Plugins && cap.Plugins.BluetoothLe;
    if (!ble) {
      throw new Error(
        "Capacitor BluetoothLe plugin missing. Rebuild ATDD Connect with @capacitor-community/bluetooth-le."
      );
    }
    return ble;
  }

  function liveTransportAvailable() {
    return capacitorBleAvailable() || webBluetoothAvailable() || wifiObdAvailable();
  }

  function setBusy(next) {
    busy = next;
    const connect = byId("btnBtConnect");
    const scanAll = byId("btnBtScanAll");
    const wifi = byId("btnBtWifi");
    const read = byId("btnBtReadCodes");
    const pids = byId("btnBtReadPids");
    const disc = byId("btnBtDisconnect");
    const demo = byId("btnBtDemo");
    const liveOk = liveTransportAvailable();
    if (connect) connect.disabled = busy || !(capacitorBleAvailable() || webBluetoothAvailable());
    if (scanAll) scanAll.disabled = busy || !(capacitorBleAvailable() || webBluetoothAvailable());
    if (wifi) wifi.disabled = busy || !wifiObdAvailable();
    if (demo) demo.disabled = busy;
    const linked = !!(writeChar || capWrite || transportKind === "wifi-obd");
    if (read) read.disabled = busy || !linked;
    if (pids) pids.disabled = busy || !linked;
    if (disc) disc.disabled = busy || !(device || capDeviceId || transportKind === "wifi-obd");
    void liveOk;
  }

  function webBluetoothAvailable() {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.bluetooth &&
      typeof navigator.bluetooth.requestDevice === "function"
    );
  }

  function webBluetoothBlockReason() {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (capacitorBleAvailable()) return null;
    if (isiOS) {
      return "iPhone Safari / Home Screen PWA has no Web Bluetooth. Use this native ATDD Connect build for CoreBluetooth, or Wi-Fi OBD.";
    }
    if (!window.isSecureContext) {
      return "Web Bluetooth requires HTTPS (or localhost).";
    }
    return "This browser does not support Web Bluetooth. Use Chrome or Edge on Android/desktop, or the native app.";
  }

  function normalizeUuid(uuid) {
    return String(uuid).toLowerCase().replace(/-/g, "");
  }

  function pickCharacteristics(characteristics) {
    let write = null;
    let notify = null;
    for (const ch of characteristics) {
      const id = normalizeUuid(ch.uuid || ch);
      const props = ch.properties || {};
      if (!write && WRITE_HINTS.some((h) => id.includes(h)) && (props.write || props.writeWithoutResponse || props.write === undefined)) {
        write = ch;
      }
      if (!notify && NOTIFY_HINTS.some((h) => id.includes(h)) && (props.notify || props.indicate || props.notify === undefined)) {
        notify = ch;
      }
    }
    if (!write) {
      write =
        characteristics.find(
          (c) => c.properties && (c.properties.write || c.properties.writeWithoutResponse)
        ) || characteristics[characteristics.length - 1] || null;
    }
    if (!notify) {
      notify =
        characteristics.find(
          (c) => c.properties && (c.properties.notify || c.properties.indicate)
        ) || characteristics[0] || null;
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

  function extractHexPayload(text) {
    const cleaned = String(text || "")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter(
        (l) =>
          !/^SEARCHING/i.test(l) &&
          l !== ">" &&
          !/^OK$/i.test(l) &&
          !/^AT/i.test(l)
      );
    const hexChunks = [];
    for (const line of cleaned) {
      const noSpaces = line.replace(/\s+/g, "").toUpperCase();
      if (!/^[0-9A-F]+$/.test(noSpaces)) continue;
      hexChunks.push(noSpaces);
    }
    return hexChunks.join("");
  }

  function parseRpm(text) {
    const hex = extractHexPayload(text);
    const idx = hex.indexOf("410C");
    if (idx < 0) return null;
    const a = parseInt(hex.slice(idx + 4, idx + 6), 16);
    const b = parseInt(hex.slice(idx + 6, idx + 8), 16);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return ((a << 8) + b) / 4;
  }

  function parseCoolant(text) {
    const hex = extractHexPayload(text);
    const idx = hex.indexOf("4105");
    if (idx < 0) return null;
    const a = parseInt(hex.slice(idx + 4, idx + 6), 16);
    if (Number.isNaN(a)) return null;
    return a - 40;
  }

  function parseVin(text) {
    const hex = extractHexPayload(text);
    const idx = hex.indexOf("4902");
    if (idx < 0) return null;
    const bytes = [];
    const payload = hex.slice(idx + 4);
    for (let i = 0; i + 1 < payload.length; i += 2) {
      bytes.push(parseInt(payload.slice(i, i + 2), 16));
    }
    let chars = "";
    for (const b of bytes) {
      if ((b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a)) {
        chars += String.fromCharCode(b).toUpperCase();
      }
    }
    const m = chars.match(/[A-HJ-NPR-Z0-9]{17}/);
    return m ? m[0] : null;
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
      maybeResolveReply();
    } catch (err) {
      log("Notify decode error: " + (err && err.message ? err.message : err));
    }
  }

  function onCapNotify(value) {
    let chunk = "";
    if (typeof value === "string") {
      try {
        const bin = atob(value);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        chunk = decoder().decode(bytes);
      } catch (_) {
        chunk = value;
      }
    } else if (value && value.buffer) {
      chunk = decoder().decode(value);
    }
    replyBuffer += chunk;
    maybeResolveReply();
  }

  function maybeResolveReply() {
    if (replyBuffer.includes(">") && pendingResolve) {
      const full = replyBuffer;
      replyBuffer = "";
      if (responseTimer) {
        clearTimeout(responseTimer);
        responseTimer = null;
      }
      const resolve = pendingResolve;
      pendingResolve = null;
      pendingReject = null;
      resolve(full);
    }
  }

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function sendCommand(cmd, waitMs) {
    if (transportKind === "capacitor-ble") {
      return sendCapCommand(cmd, waitMs || 8000);
    }
    if (transportKind === "wifi-obd") {
      return sendWifiCommand(cmd, waitMs || 8000);
    }
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

  async function sendCapCommand(cmd, timeoutMs) {
    if (!capWrite || !capDeviceId) throw new Error("Not connected");
    const ble = blePlugin();
    const payload = String(cmd).trim() + "\r";
    const bytes = encoder().encode(payload);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const value = btoa(binary);
    replyBuffer = "";
    return new Promise((resolve, reject) => {
      pendingResolve = resolve;
      pendingReject = reject;
      ble
        .write({
          deviceId: capDeviceId,
          service: capWrite.service,
          characteristic: capWrite.characteristic,
          value,
        })
        .catch(reject);
      responseTimer = setTimeout(() => {
        if (pendingReject) {
          const partial = replyBuffer;
          replyBuffer = "";
          if (partial) {
            pendingResolve(partial);
          } else {
            pendingReject(
              new Error("Adapter response timeout (no data). Adapter may not speak ELM AT commands.")
            );
          }
          pendingResolve = null;
          pendingReject = null;
        }
      }, timeoutMs || 8000);
    });
  }

  async function sendWifiCommand(cmd, timeoutMs) {
    const cap = getCapacitor();
    const wifi = cap && cap.Plugins && cap.Plugins.ObdWifi;
    if (!wifi) throw new Error("ObdWifi plugin missing");
    const result = await wifi.send({
      data: String(cmd).trim() + "\r",
      waitForPrompt: true,
      timeoutMs: timeoutMs || 8000,
    });
    return result && result.data != null ? String(result.data) : "";
  }

  async function disconnect() {
    try {
      if (transportKind === "capacitor-ble" && capDeviceId) {
        const ble = blePlugin();
        if (capNotify) {
          await ble
            .stopNotifications({
              deviceId: capDeviceId,
              service: capNotify.service,
              characteristic: capNotify.characteristic,
            })
            .catch(function () {});
        }
        await ble.disconnect({ deviceId: capDeviceId }).catch(function () {});
      } else if (transportKind === "wifi-obd") {
        const cap = getCapacitor();
        if (cap && cap.Plugins && cap.Plugins.ObdWifi) {
          await cap.Plugins.ObdWifi.disconnect().catch(function () {});
        }
      } else {
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
      }
    } finally {
      device = null;
      server = null;
      writeChar = null;
      notifyChar = null;
      capDeviceId = null;
      capWrite = null;
      capNotify = null;
      replyBuffer = "";
      transportKind = "none";
      setBusy(false);
      log("Disconnected.");
      updateStatusBanner("Disconnected");
    }
  }

  function updateStatusBanner(text) {
    const el = byId("btStatusLive");
    if (el) el.textContent = text;
  }

  function renderLiveReadings(readings) {
    lastLiveReadings = readings;
    const el = byId("btLiveReadings");
    if (!el) return;
    if (!readings) {
      el.innerHTML = "";
      return;
    }
    const rows = [];
    if (readings.vin) rows.push("<li><strong>VIN</strong> " + escapeHtml(readings.vin) + "</li>");
    else if (readings.vinError) rows.push("<li><strong>VIN</strong> " + escapeHtml(readings.vinError) + "</li>");
    if (readings.rpm != null) rows.push("<li><strong>RPM</strong> " + escapeHtml(String(readings.rpm)) + "</li>");
    if (readings.coolant != null)
      rows.push("<li><strong>Coolant</strong> " + escapeHtml(String(readings.coolant)) + " °C</li>");
    if (readings.codes && readings.codes.length)
      rows.push("<li><strong>DTCs</strong> " + escapeHtml(readings.codes.join(", ")) + "</li>");
    else if (readings.codes) rows.push("<li><strong>DTCs</strong> (none returned)</li>");
    el.innerHTML = rows.length
      ? "<ul class=\"facts\">" + rows.join("") + "</ul>"
      : "<p class=\"small\">No PID values parsed yet.</p>";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function discoverCapServices(ble, deviceId) {
    const services = await ble.getServices({ deviceId: deviceId });
    const serviceList = (services && services.services) || services || [];
    const inspected = [];
    for (let i = 0; i < serviceList.length; i++) {
      const svc = serviceList[i];
      const uuid = svc.uuid || svc;
      let characteristics = svc.characteristics || [];
      if (!characteristics.length) {
        try {
          const got = await ble.getCharacteristics({ deviceId: deviceId, service: uuid });
          characteristics = (got && got.characteristics) || got || [];
        } catch (_) {
          characteristics = [];
        }
      }
      const mapped = characteristics.map(function (c) {
        return {
          uuid: c.uuid || c,
          properties: c.properties || { notify: true, write: true, writeWithoutResponse: true },
        };
      });
      inspected.push({ uuid: uuid, characteristics: mapped });
      const picked = pickCharacteristics(mapped);
      if (picked.write && picked.notify) {
        return {
          write: { service: uuid, characteristic: picked.write.uuid || picked.write },
          notify: { service: uuid, characteristic: picked.notify.uuid || picked.notify },
          inspected: inspected,
        };
      }
    }
    return { write: null, notify: null, inspected: inspected };
  }

  async function connectCapacitorBle(options) {
    const scanAll = !!(options && options.scanAll);
    const ble = blePlugin();
    transportKind = "capacitor-ble";
    log("Initializing native Bluetooth (CoreBluetooth / Android BLE)…");
    updateStatusBanner("Scanning…");
    await ble.initialize({ androidNeverForLocation: true });
    const optionalServices = CANDIDATE_SERVICES.concat(
      OPTIONAL_SERVICES.filter(function (u) {
        return typeof u === "string";
      })
    );
    log(
      scanAll
        ? "Opening native device chooser (all BLE devices)…"
        : "Opening native device chooser (FIXD / OBD named devices preferred when the OS allows)…"
    );
    const deviceResult = await ble.requestDevice({
      optionalServices: Array.from(new Set(optionalServices)),
      allowDuplicates: false,
    });
    capDeviceId = deviceResult.deviceId || (deviceResult.device && deviceResult.device.deviceId) || deviceResult.id;
    const name = deviceResult.name || (deviceResult.device && deviceResult.device.name) || "BLE adapter";
    if (!capDeviceId) throw new Error("Native BLE chooser returned no deviceId");
    log("Connecting to " + name + "…");
    updateStatusBanner("Connecting to " + name + "…");
    await ble.connect({ deviceId: capDeviceId });
    const found = await discoverCapServices(ble, capDeviceId);
    if (!found.write || !found.notify) {
      const seen = (found.inspected || []).map(function (s) {
        return s.uuid;
      }).join(", ") || "(none)";
      throw new Error(
        "Native BLE connected to " +
          name +
          ", but no UART write/notify characteristics found. Services: " +
          seen +
          ". FIXD claim remains " +
          FIXD_CLAIM +
          " (no verified FIXD proprietary UUIDs in this build)."
      );
    }
    capWrite = found.write;
    capNotify = found.notify;
    await ble.startNotifications(
      {
        deviceId: capDeviceId,
        service: capNotify.service,
        characteristic: capNotify.characteristic,
      },
      function (event) {
        onCapNotify(event && (event.value != null ? event.value : event));
      }
    );
    log(
      "Linked GATT service " +
        found.write.service +
        ". Running ELM probe (does not prove FIXD brand)…"
    );
    updateStatusBanner("Connected · probing");
    for (let i = 0; i < ELM_PROBE.length; i++) {
      const cmd = ELM_PROBE[i];
      const reply = await sendCommand(cmd, cmd === "ATZ" ? 1200 : 800);
      log("> " + cmd + "\n" + (reply || "(no reply)"));
    }
    log("Probe finished. FIXD protocol claim: " + FIXD_CLAIM + ". Use Read codes / Read live PIDs.");
    updateStatusBanner("Connected · " + name + " · claim " + FIXD_CLAIM);
    setBusy(false);
  }

  async function connectLiveWeb(options) {
    const scanAll = !!(options && options.scanAll);
    if (!webBluetoothAvailable()) {
      throw new Error(webBluetoothBlockReason());
    }
    transportKind = "web-bluetooth";
    log(
      scanAll
        ? "Requesting any Bluetooth device (picker)…"
        : "Requesting Bluetooth device (FIXD / ELM-class)…"
    );
    updateStatusBanner("Scanning…");
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
    device.addEventListener("gattserverdisconnected", function () {
      log("GATT disconnected.");
      writeChar = null;
      notifyChar = null;
      setBusy(false);
      updateStatusBanner("Disconnected");
    });
    log("Connecting to " + (device.name || "adapter") + "…");
    updateStatusBanner("Connecting…");
    server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    let picked = null;
    for (let i = 0; i < services.length; i++) {
      const svc = services[i];
      const chars = await svc.getCharacteristics();
      const pair = pickCharacteristics(chars);
      if (pair.write && pair.notify) {
        picked = { write: pair.write, notify: pair.notify, service: svc.uuid };
        break;
      }
    }
    if (!picked) {
      throw new Error(
        "No writable/notify UART characteristics found. FIXD claim remains " + FIXD_CLAIM + "."
      );
    }
    writeChar = picked.write;
    notifyChar = picked.notify;
    await notifyChar.startNotifications();
    notifyChar.addEventListener("characteristicvaluechanged", onNotify);
    log("Linked GATT service " + picked.service + ". Running ELM probe (does not prove FIXD brand)…");
    for (let i = 0; i < ELM_PROBE.length; i++) {
      const cmd = ELM_PROBE[i];
      const reply = await sendCommand(cmd, cmd === "ATZ" ? 1200 : 700);
      log("> " + cmd + "\n" + (reply || "(no reply)"));
    }
    log("Probe finished. FIXD protocol claim: " + FIXD_CLAIM + ". Tap Read codes for Mode 03.");
    updateStatusBanner("Connected · " + (device.name || "adapter") + " · claim " + FIXD_CLAIM);
    setBusy(false);
  }

  async function connectWifiObd() {
    const cap = getCapacitor();
    const wifi = cap && cap.Plugins && cap.Plugins.ObdWifi;
    if (!wifi) {
      throw new Error(
        "Wi-Fi OBD requires the native ObdWifi plugin. Join the adapter Wi-Fi (often a soft-AP), then retry in ATDD Connect."
      );
    }
    transportKind = "wifi-obd";
    const hostInput = byId("btWifiHost");
    const portInput = byId("btWifiPort");
    const host = (hostInput && hostInput.value.trim()) || "192.168.0.10";
    const port = Number((portInput && portInput.value.trim()) || 35000);
    log("Connecting Wi-Fi OBD TCP " + host + ":" + port + "…");
    updateStatusBanner("Connecting Wi-Fi OBD…");
    await wifi.connect({ host: host, port: port, timeoutMs: 8000 });
    log("Wi-Fi TCP linked. Running ELM probe…");
    for (let i = 0; i < ELM_PROBE.length; i++) {
      const cmd = ELM_PROBE[i];
      const reply = await sendCommand(cmd, cmd === "ATZ" ? 1200 : 800);
      log("> " + cmd + "\n" + (reply || "(no reply)"));
    }
    log("Wi-Fi probe finished. FIXD claim still " + FIXD_CLAIM + " (Wi-Fi path is ELM-class, not FIXD-branded).");
    updateStatusBanner("Connected · Wi-Fi " + host + ":" + port);
    setBusy(false);
  }

  async function connectLive(options) {
    if (capacitorBleAvailable()) {
      await connectCapacitorBle(options);
      return;
    }
    await connectLiveWeb(options);
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
    const linked = writeChar || capWrite || transportKind === "wifi-obd";
    if (!linked) throw new Error("Connect Scanner first.");
    log("Reading Mode 03 DTCs…");
    const reply = await sendCommand("03", 1500);
    log(reply || "(empty Mode 03 reply)");
    const codes = parseMode03Response(reply);
    applyCodesToScanner(codes, false);
    renderLiveReadings(Object.assign({}, lastLiveReadings || {}, { codes: codes }));
    if (!codes.length) {
      log(
        "No DTCs parsed. Adapter replied, but FIXD application protocol is still " +
          FIXD_CLAIM +
          " until a known-good Mode 03 match is confirmed on hardware."
      );
    } else {
      log("Parsed " + codes.length + " code(s). You can tap Diagnose now.");
    }
  }

  async function readLivePids() {
    const linked = writeChar || capWrite || transportKind === "wifi-obd";
    if (!linked) throw new Error("Connect Scanner first.");
    log("Reading verified PIDs (VIN 0902, RPM 010C, coolant 0105) — read-only…");
    const readings = { codes: (lastLiveReadings && lastLiveReadings.codes) || null };
    try {
      const vinReply = await sendCommand("0902", 2000);
      log("> 0902\n" + (vinReply || "(empty)"));
      const vin = parseVin(vinReply);
      if (vin) readings.vin = vin;
      else readings.vinError = "VIN not returned / incomplete (common when ECU ignores Mode 09)";
    } catch (err) {
      readings.vinError = err && err.message ? err.message : String(err);
    }
    try {
      const rpmReply = await sendCommand("010C", 1200);
      log("> 010C\n" + (rpmReply || "(empty)"));
      const rpm = parseRpm(rpmReply);
      if (rpm != null) readings.rpm = rpm;
    } catch (err) {
      log("RPM read failed: " + (err && err.message ? err.message : err));
    }
    try {
      const coolReply = await sendCommand("0105", 1200);
      log("> 0105\n" + (coolReply || "(empty)"));
      const cool = parseCoolant(coolReply);
      if (cool != null) readings.coolant = cool;
    } catch (err) {
      log("Coolant read failed: " + (err && err.message ? err.message : err));
    }
    renderLiveReadings(readings);
    if (readings.vin) {
      const nick = byId("nickname");
      // Do not overwrite vehicle fields aggressively — only fill empty VIN-ish note.
      const notes = byId("notes");
      if (notes && !notes.value) notes.value = "VIN " + readings.vin;
    }
    log("Live PID pass complete.");
  }

  async function runDemo() {
    transportKind = "simulated";
    log("Demo only (SIMULATED). This does not pair to FIXD or your vehicle.");
    await sleep(400);
    applyCodesToScanner(["P0300", "P0420"], true);
    renderLiveReadings({
      vin: null,
      vinError: "SIMULATED — no VIN",
      rpm: 780,
      coolant: 88,
      codes: ["P0300", "P0420"],
    });
    updateStatusBanner("SIMULATED demo (not live)");
    log("SIMULATED session complete. Live Connect Scanner was not used.");
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
    const classicNote = byId("btClassicLimit");
    const connect = byId("btnBtConnect");
    const wifi = byId("btnBtWifi");
    const capOk = capacitorBleAvailable();
    const webOk = webBluetoothAvailable();
    const wifiOk = wifiObdAvailable();

    if (support) {
      if (capOk) {
        support.textContent =
          "Native Bluetooth ready (CoreBluetooth). Tap Connect Scanner with the adapter powered in the OBD port.";
      } else if (webOk) {
        support.textContent =
          "Web Bluetooth ready. Tap Connect Scanner, pick your adapter, then Read codes / Read live PIDs.";
      } else if (wifiOk) {
        support.textContent =
          "BLE chooser unavailable here, but Wi-Fi OBD is available. Join the adapter Wi-Fi, then tap Connect Wi-Fi OBD.";
      } else {
        support.textContent = webBluetoothBlockReason();
      }
    }
    if (gate) {
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      if (!capOk && !webOk && isiOS) {
        gate.hidden = false;
        gate.textContent =
          "This web shell cannot use Bluetooth. Install / open the native ATDD Connect app (com.netgene.atdd.ble) for CoreBluetooth, or use a Wi-Fi ELM327-class adapter with the ObdWifi plugin.";
      } else {
        gate.hidden = true;
      }
    }
    if (classicNote) {
      classicNote.hidden = false;
      classicNote.textContent =
        "iOS limitation: Bluetooth Classic (SPP) OBD adapters cannot be used by App Store apps. Use BLE adapters, Wi-Fi OBD (TCP), or adapters that expose a BLE UART. Universal Bluetooth compatibility is not claimed.";
    }
    if (connect) connect.disabled = !(capOk || webOk);
    if (wifi) wifi.disabled = !wifiOk;
  }

  function bindBluetoothUi() {
    const top = byId("btnBluetoothTop");
    if (top) {
      top.onclick = function () {
        showBluetoothPanel();
        refreshSupportUi();
      };
    }
    const connect = byId("btnBtConnect");
    const read = byId("btnBtReadCodes");
    const pids = byId("btnBtReadPids");
    const disc = byId("btnBtDisconnect");
    const demo = byId("btnBtDemo");
    const wifi = byId("btnBtWifi");

    async function startConnect(scanAll) {
      if (busy) return;
      showBluetoothPanel();
      setBusy(true);
      try {
        await connectLive({ scanAll: !!scanAll });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        log(
          "Live connect failed:\n" +
            msg +
            "\n\nDemo was NOT started. Fix Bluetooth/Wi-Fi, then tap Connect Scanner again."
        );
        updateStatusBanner("Error — " + msg);
        await disconnect();
      } finally {
        setBusy(false);
      }
    }

    if (connect) {
      connect.onclick = function () {
        startConnect(false);
      };
    }
    const scanAllBtn = byId("btnBtScanAll");
    if (scanAllBtn) {
      scanAllBtn.onclick = function () {
        startConnect(true);
      };
    }

    if (wifi) {
      wifi.onclick = async function () {
        if (busy) return;
        showBluetoothPanel();
        setBusy(true);
        try {
          await connectWifiObd();
        } catch (err) {
          const msg = err && err.message ? err.message : String(err);
          log("Wi-Fi OBD connect failed:\n" + msg + "\n\nDemo was NOT started.");
          updateStatusBanner("Error — " + msg);
          await disconnect();
        } finally {
          setBusy(false);
        }
      };
    }

    if (read) {
      read.onclick = async function () {
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

    if (pids) {
      pids.onclick = async function () {
        if (busy) return;
        setBusy(true);
        try {
          await readLivePids();
        } catch (err) {
          log("Read live PIDs failed: " + (err && err.message ? err.message : err));
        } finally {
          setBusy(false);
        }
      };
    }

    if (disc) {
      disc.onclick = async function () {
        setBusy(true);
        await disconnect();
      };
    }

    if (demo) {
      demo.onclick = async function () {
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

    // Native shell: open the Bluetooth panel immediately so the button path is obvious.
    const shell = document.querySelector('meta[name="atdd-shell"]');
    if (shell && /capacitor/i.test(shell.getAttribute("content") || "")) {
      showBluetoothPanel();
      updateStatusBanner("Native shell ready — tap Connect Scanner");
    }
  }

  global.ATDDBluetooth = {
    bind: bindBluetoothUi,
    show: showBluetoothPanel,
    claim: FIXD_CLAIM,
    parseMode03Response: parseMode03Response,
    decodeDtcPair: decodeDtcPair,
    parseRpm: parseRpm,
    parseCoolant: parseCoolant,
    parseVin: parseVin,
  };
})(window);
