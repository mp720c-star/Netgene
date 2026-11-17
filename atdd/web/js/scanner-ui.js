import { createScannerSession, createSimulatedTransport } from "./scanner-session.js";

export function mountScannerUi(root) {
  const session = createScannerSession(createSimulatedTransport());
  root.innerHTML = `
    <div class="scanner-ui">
      <p><strong>Connect Scanner</strong> — FIXD protocol support is <code>UNVERIFIED</code>. Simulated transport is labeled and never shown as live vehicle data.</p>
      <p class="note">Capacitor iOS BLE project from OneDrive (<code>ATDD_BLE_IPHONE_REVIEW_20261117/ios</code>) is not in this environment yet. Drop it into <code>mike-ai/recovery/private/inbox/</code> to continue native work.</p>
      <div class="row">
        <button type="button" id="scanBtn" class="primary">Scan devices</button>
        <button type="button" id="probeBtn" class="ghost" disabled>Probe protocol</button>
        <button type="button" id="dtcBtn" class="ghost" disabled>Read DTCs</button>
        <button type="button" id="discBtn" class="ghost" disabled>Disconnect</button>
      </div>
      <p id="scanStatus" class="note">Status: idle</p>
      <ul id="deviceList" class="facts"></ul>
      <pre id="scanOut" class="log"></pre>
    </div>
  `;

  const statusEl = root.querySelector("#scanStatus");
  const listEl = root.querySelector("#deviceList");
  const outEl = root.querySelector("#scanOut");
  const probeBtn = root.querySelector("#probeBtn");
  const dtcBtn = root.querySelector("#dtcBtn");
  const discBtn = root.querySelector("#discBtn");

  session.subscribe((s) => {
    statusEl.textContent = `Status: ${s.status}${s.lastError ? " — " + s.lastError : ""}${s.provenance === "simulated" ? " (SIMULATED transport)" : ""}`;
    probeBtn.disabled = !(s.status === "connected" || s.status === "ready");
    dtcBtn.disabled = !(s.status === "ready" || s.status === "connected");
    discBtn.disabled = !(s.selected);
  });

  root.querySelector("#scanBtn").addEventListener("click", async () => {
    const devices = await session.scan();
    listEl.innerHTML = devices
      .map(
        (d) =>
          `<li><button type="button" data-id="${d.id}">Connect: ${d.name}</button></li>`
      )
      .join("");
    listEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await session.connect(btn.getAttribute("data-id"));
        outEl.textContent = "Connected. Run Probe protocol before claiming compatibility.\n";
      });
    });
  });

  probeBtn.addEventListener("click", async () => {
    const report = await session.probeProtocol();
    outEl.textContent = JSON.stringify(report, null, 2);
  });

  dtcBtn.addEventListener("click", async () => {
    const dtcs = await session.readStoredDtcs();
    const banner = dtcs.isSimulated
      ? "⚠ SIMULATED RESULTS — not live FIXD/vehicle data\n"
      : "Live adapter payload\n";
    outEl.textContent = banner + JSON.stringify(dtcs, null, 2);
  });

  discBtn.addEventListener("click", async () => {
    await session.disconnect();
    outEl.textContent += "\nDisconnected.\n";
  });
}
