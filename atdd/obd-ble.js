/* Web Bluetooth ELM327 helper for ATDD — classic script (window.AtddObd). */
(function (global) {
  "use strict";

  const OPTIONAL_SERVICES = [
    0xfff0,
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    0xffe0
  ];
  const WRITE_HINTS = ["fff2", "ffe1", "6e400002"];
  const NOTIFY_HINTS = ["fff1", "ffe1", "6e400003"];

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
      if (!notify && NOTIFY_HINTS.some((h) => id.includes(h)) && props.notify) {
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
    if (bytes.length && bytes[0] <= 16 && bytes.length === 1 + bytes[0] * 2) start = 1;

    const codes = [];
    for (let i = start; i + 1 < bytes.length; i += 2) {
      const code = decodeDtcPair(bytes[i], bytes[i + 1]);
      if (code) codes.push(code);
    }
    return [...new Set(codes)];
  }

  function buildDemoMode03() {
    return "43 02 03 01 04 20\r\n>";
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function createSession() {
    const state = {
      mode: "idle",
      device: null,
      writeChar: null,
      notifyChar: null,
      encoder: new TextEncoder(),
      decoder: new TextDecoder(),
      buffer: "",
      pendingResolve: null,
      pendingReject: null,
      responseTimer: null,
      commandChain: Promise.resolve(),
      log: []
    };

    function log(dir, msg) {
      state.log.push({ t: Date.now(), dir, msg: String(msg) });
      if (state.log.length > 200) state.log.shift();
    }

    function available() {
      return typeof navigator !== "undefined" && !!navigator.bluetooth;
    }

    async function discoverChars(server) {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        let chars;
        try {
          chars = await service.getCharacteristics();
        } catch {
          continue;
        }
        const picked = pickCharacteristics(chars);
        if (picked.write && picked.notify) return picked;
      }
      return { write: null, notify: null };
    }

    function onNotify(event) {
      const chunk = state.decoder.decode(event.target.value);
      state.buffer += chunk;
      if (state.buffer.includes(">")) {
        const full = state.buffer;
        state.buffer = "";
        if (state.responseTimer) {
          clearTimeout(state.responseTimer);
          state.responseTimer = null;
        }
        if (state.pendingResolve) {
          const resolve = state.pendingResolve;
          state.pendingResolve = null;
          state.pendingReject = null;
          resolve(full);
        }
      }
    }

    function hardReset() {
      if (state.responseTimer) clearTimeout(state.responseTimer);
      if (state.pendingReject) state.pendingReject(new Error("Disconnected"));
      state.mode = "idle";
      state.device = null;
      state.writeChar = null;
      state.notifyChar = null;
      state.pendingResolve = null;
      state.pendingReject = null;
      state.buffer = "";
      state.responseTimer = null;
    }

    async function connectBle() {
      if (!available()) throw new Error("Web Bluetooth unavailable. Use Chrome/Edge on HTTPS, or Demo mode.");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES
      });
      device.addEventListener("gattserverdisconnected", () => {
        log("SYS", "Adapter disconnected");
        hardReset();
      });
      const server = await device.gatt.connect();
      const { write, notify } = await discoverChars(server);
      if (!write || !notify) throw new Error("No UART write/notify characteristics on this adapter.");
      await notify.startNotifications();
      notify.addEventListener("characteristicvaluechanged", onNotify);
      state.mode = "ble";
      state.device = device;
      state.writeChar = write;
      state.notifyChar = notify;
      log("SYS", "Connected to " + (device.name || device.id));
      return { name: device.name || "BLE adapter", mode: "ble" };
    }

    async function connectDemo() {
      state.mode = "demo";
      log("SYS", "Demo mode — simulated adapter");
      return { name: "Demo ELM327", mode: "demo" };
    }

    async function disconnect() {
      try {
        if (state.notifyChar) {
          try {
            state.notifyChar.removeEventListener("characteristicvaluechanged", onNotify);
            await state.notifyChar.stopNotifications();
          } catch (_) {}
        }
        if (state.device && state.device.gatt && state.device.gatt.connected) state.device.gatt.disconnect();
      } finally {
        hardReset();
      }
    }

    async function sendCommand(cmd, timeoutMs) {
      timeoutMs = timeoutMs || 4000;
      const run = async () => {
        const line = cmd.endsWith("\r") ? cmd : cmd + "\r";
        log("TX", cmd);
        if (state.mode === "demo") {
          const c = cmd.trim().toUpperCase();
          let response = "NO DATA\r\n>";
          if (c.startsWith("AT")) response = "OK\r\n>";
          else if (c === "03") response = buildDemoMode03();
          log("RX", response.replace(/\r/g, "\\r"));
          await delay(80);
          return response;
        }
        if (!state.writeChar) throw new Error("Not connected");
        state.buffer = "";
        const responsePromise = new Promise((resolve, reject) => {
          state.pendingResolve = resolve;
          state.pendingReject = reject;
          state.responseTimer = setTimeout(() => {
            state.pendingResolve = null;
            state.pendingReject = null;
            reject(new Error("Timeout waiting for " + cmd));
          }, timeoutMs);
        });
        const payload = state.encoder.encode(line);
        if (state.writeChar.properties.writeWithoutResponse) {
          await state.writeChar.writeValueWithoutResponse(payload);
        } else {
          await state.writeChar.writeValue(payload);
        }
        const response = await responsePromise;
        log("RX", response.replace(/\r/g, "\\r"));
        return response;
      };
      const next = state.commandChain.then(run, run);
      state.commandChain = next.catch(function () {});
      return next;
    }

    async function initializeAdapter() {
      const steps = ["ATZ", "ATE0", "ATL0", "ATH0", "ATS0", "ATSP0"];
      for (let i = 0; i < steps.length; i++) {
        await sendCommand(steps[i], steps[i] === "ATZ" ? 6000 : 3000);
      }
    }

    async function readStoredDtcs() {
      const response = await sendCommand("03", 8000);
      const codes = parseMode03Response(response);
      return { codes: codes, isSimulated: state.mode === "demo", raw: response };
    }

    return {
      available: available,
      connectBle: connectBle,
      connectDemo: connectDemo,
      disconnect: disconnect,
      initializeAdapter: initializeAdapter,
      readStoredDtcs: readStoredDtcs,
      getMode: function () {
        return state.mode;
      },
      getLog: function () {
        return state.log.slice();
      }
    };
  }

  global.AtddObd = {
    createSession: createSession,
    parseMode03Response: parseMode03Response
  };
})(window);
