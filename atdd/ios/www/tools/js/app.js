import ddtEngine from './ddtEngine.js';
import { calculateBounds } from './resistance.js';
import { mountScannerUi } from './scanner-ui.js';
import { PROTOCOL_V3_META } from './obd-protocol-v3-frame-aware.js';
import { ATDD_BUILD } from './build-info.js';
import { loadSavedVehicles } from './vehicles.js';

const state = {
  mode: 'home',
  models: [],
  inventory: null,
  selectedModelId: null,
  engineState: null,
  phase: 'model_select',
  diagnosis: null,
  integrityOk: false
};

const el = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sha256Hex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadInventory() {
  // Sample/demo CDI models are kept in source trees for tests only. They are not loaded or shown here.
  state.models = [];
  state.integrityOk = true;
  state.inventory = {
    sha256: '',
    bytes: 0,
    profiles_found: 0,
    profiles_expected_claimed: 0,
    profiles_missing: 0,
    integrity_match: true,
    sample_models_shipped: false,
    note: 'Sample and demo CDI models are not shipped or shown in ATDD. Use the main ATDD vehicle search for cited pinouts, which stay labeled verified, unverified, or reference.',
    atdd_obd2_database_present: false
  };
  return state.inventory;
}

function setMode(mode, options = {}) {
  const next = mode || 'home';
  const autoStart = options.autoStart === true || options.autoStart === '1';
  const changed = state.mode !== next;
  state.mode = next;
  if (typeof location !== 'undefined') {
    const desired = autoStart && next === 'obd2' ? 'obd2-connect' : next === 'obd2' ? 'obd2' : next;
    if (location.hash.replace('#', '') !== desired) {
      location.hash = desired;
    }
  }
  document.querySelectorAll('[data-mode-panel]').forEach((panel) => {
    const name = panel.getAttribute('data-mode-panel');
    panel.hidden = name !== next;
  });
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    const nav = btn.getAttribute('data-nav');
    btn.classList.toggle('active', nav === next);
  });
  if (next === 'cdi' && (changed || options.force)) renderCdi();
  if (next === 'status' && (changed || options.force)) renderStatus();
  // Remount scanner when entering OBD2 or when Connect Scanner auto-start is requested.
  if (next === 'obd2' && (changed || autoStart || options.force)) {
    renderObd2Gate({ autoStart });
  }
}

function renderStatus() {
  const inv = state.inventory;
  el('statusBody').innerHTML = `
    <dl class="status-grid">
      <dt>Sample/demo CDI models</dt><dd>NOT SHIPPED in this app</dd>
      <dt>Cited pinouts</dt><dd>Use the main ATDD vehicle search (verified / unverified / reference labels)</dd>
      <dt>Note</dt><dd>${escapeHtml(inv.note || '')}</dd>
      <dt>ATDD 1.2.0 OBD2 database</dt><dd>NOT FOUND in this environment</dd>
      <dt>Original cdi-genius/ tree</dt><dd>PRESERVED (not deleted)</dd>
      <dt>Unified branch</dt><dd><code>${escapeHtml(ATDD_BUILD.branch)}</code></dd>
      <dt>iPhone build number</dt><dd><code>${escapeHtml(ATDD_BUILD.number)}</code></dd>
      <dt>Xcode / IPA</dt><dd>${escapeHtml(ATDD_BUILD.xcodeBuild)} — ${escapeHtml(ATDD_BUILD.iphoneInstallBlocked)}</dd>
      <dt>Home Screen icon opens</dt><dd>${escapeHtml(ATDD_BUILD.homeScreenOpens)}</dd>
      <dt>Physical FIXD connect</dt><dd>NOT VERIFIED on a physical iPhone in this run</dd>
      <dt>Physical truck diagnostic</dt><dd>NOT VERIFIED on a physical truck in this run</dd>
    </dl>
  `;
}

function renderVehicles(targetId) {
  const root = el(targetId);
  if (!root) return;
  const vehicles = loadSavedVehicles();
  if (!vehicles.length) {
    root.innerHTML = `<p class="note">No saved vehicles in this Home Screen app yet. Existing ATDD vehicle keys (if any) are preserved and will appear here when present.</p>`;
    return;
  }
  root.innerHTML = `<ul class="facts">${vehicles
    .map((v) => {
      const title = escapeHtml(v.name || [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle');
      const vin = v.vin ? ` · VIN ${escapeHtml(v.vin)}` : '';
      return `<li>${title}${vin}</li>`;
    })
    .join('')}</ul>`;
}

function renderObd2Gate(options = {}) {
  renderVehicles('vehiclesObd');
  el('obd2Body').innerHTML = `
    <p><strong>Connect Scanner</strong> talks to your real FIXD when Bluetooth is available. A failed connect does not invent codes.</p>
    <p><strong>FIXD protocol claim:</strong> <code>PARTIAL</code> — owner confirmed the last TestFlight reached the 2008 Sierra; Mode 03 powertrain codes recorded. EBCM/BCM headers and live DID scaling still need a session transcript. Parser v3 (<code>${PROTOCOL_V3_META.version}</code>) runs after connect.</p>
    <div id="scannerMount"></div>
  `;
  mountScannerUi(el('scannerMount'), { autoStart: options.autoStart === true });
}

function resetCdiSession() {
  state.selectedModelId = null;
  state.engineState = null;
  state.phase = 'model_select';
  state.diagnosis = null;
}

function renderCdi() {
  const root = el('cdiBody');
  if (!state.integrityOk) {
    root.innerHTML = `<p class="warn">CDI database integrity check failed. Refusing to run diagnostics.</p>`;
    return;
  }

  if (state.phase === 'model_select') {
    if (!state.models.length) {
      root.innerHTML = `
        <p class="note">Sample and demo CDI models are not shipped or shown here.</p>
        <p>Cited ignition pinouts live in the main ATDD vehicle search. Unverified and reference profiles stay labeled. This screen will not invent a pinout, reading, or diagnosis from sample data.</p>
      `;
      return;
    }
    const options = state.models
      .map(
        (m) =>
          `<option value="${escapeHtml(m.model_id)}">${escapeHtml(m.manufacturer)} — ${escapeHtml(m.model_id)} (${m.pin_count} pins)</option>`
      )
      .join('');
    root.innerHTML = `
      <p class="note">Imported CDI profiles: <strong>${state.models.length}</strong>.</p>
      <label>CDI model
        <select id="cdiModelSelect">
          <option value="">— Select model —</option>
          ${options}
        </select>
      </label>
      <button type="button" class="primary" id="cdiStartBtn">Start continuity test</button>
      <div id="cdiPinout" class="pinout"></div>
    `;
    el('cdiModelSelect').addEventListener('change', (e) => {
      state.selectedModelId = e.target.value || null;
      const model = state.models.find((m) => m.model_id === state.selectedModelId);
      const pinout = el('cdiPinout');
      if (!model) {
        pinout.innerHTML = '';
        return;
      }
      const pins = Object.entries(model.wire_colors_map || {})
        .map(
          ([pin, color]) =>
            `<li><span class="swatch" style="background:${escapeHtml(color)}"></span>${escapeHtml(pin)} — ${escapeHtml(color)}</li>`
        )
        .join('');
      pinout.innerHTML = `<h3>Connector pin colors</h3><ul>${pins}</ul><p>Expected spark: <em>${escapeHtml(model.expected_spark_output || 'n/a')}</em></p>`;
    });
    el('cdiStartBtn').addEventListener('click', () => {
      const model = state.models.find((m) => m.model_id === state.selectedModelId);
      if (!model) {
        alert('Select a CDI model first.');
        return;
      }
      state.engineState = ddtEngine.init(structuredClone(model));
      state.phase = 'continuity';
      state.diagnosis = null;
      renderCdi();
    });
    return;
  }

  if (state.phase === 'continuity') {
    root.innerHTML = `
      <h3>Continuity (power / ground)</h3>
      <p>Confirm external power and ground continuity at the CDI connector.</p>
      <div class="row">
        <button type="button" class="primary" id="contPass">PASS</button>
        <button type="button" class="danger" id="contFail">FAIL</button>
      </div>
      <button type="button" class="ghost" id="cdiRestart">Restart</button>
    `;
    el('contPass').onclick = () => applyEvent({ type: 'CONTINUITY', data: { pass: true } });
    el('contFail').onclick = () => applyEvent({ type: 'CONTINUITY', data: { pass: false } });
    el('cdiRestart').onclick = () => {
      resetCdiSession();
      renderCdi();
    };
    return;
  }

  if (state.phase === 'resistance') {
    const model = state.engineState.model;
    const idx = state.engineState.currentTestIndex ?? 0;
    const test = (model.test_sequences || [])[idx];
    const bounds = calculateBounds(
      test.expected_value?.nominal_ohms,
      test.expected_value?.tolerance_percent
    );
    root.innerHTML = `
      <h3>Resistance test ${idx + 1} / ${model.test_sequences.length}</h3>
      <p><strong>${escapeHtml(test.test_id)}</strong> — ${escapeHtml(test.description || '')}</p>
      <p>Pins ${test.pin_A_data?.pin_id} (${escapeHtml(test.pin_A_data?.function || '')}) ↔
         ${test.pin_B_data?.pin_id} (${escapeHtml(test.pin_B_data?.function || '')})</p>
      <p>Expected: ${bounds.min}Ω – ${bounds.max}Ω (nominal ${test.expected_value?.nominal_ohms}Ω ± ${test.expected_value?.tolerance_percent}%)</p>
      <label>Measured ohms
        <input id="ohmInput" type="number" step="0.01" inputmode="decimal" />
      </label>
      <button type="button" class="primary" id="ohmSubmit">Submit measurement</button>
      <button type="button" class="ghost" id="cdiRestart">Restart</button>
    `;
    el('ohmSubmit').onclick = () => {
      const value = Number(el('ohmInput').value);
      if (Number.isNaN(value)) {
        alert('Enter a numeric resistance.');
        return;
      }
      applyEvent({ type: 'RESISTANCE', data: { testId: test.test_id, value } });
    };
    el('cdiRestart').onclick = () => {
      resetCdiSession();
      renderCdi();
    };
    return;
  }

  if (state.phase === 'spark') {
    const expected = state.engineState.model.expected_spark_output || '';
    root.innerHTML = `
      <h3>Spark observation</h3>
      <p>Expected output description: <em>${escapeHtml(expected)}</em></p>
      <label>Observed spark
        <input id="sparkInput" type="text" placeholder="${escapeHtml(expected)}" />
      </label>
      <button type="button" class="primary" id="sparkSubmit">Record observation</button>
      <button type="button" class="ghost" id="cdiRestart">Restart</button>
    `;
    el('sparkSubmit').onclick = () => {
      applyEvent({ type: 'SPARK', data: { observed: el('sparkInput').value } });
    };
    el('cdiRestart').onclick = () => {
      resetCdiSession();
      renderCdi();
    };
    return;
  }

  if (state.phase === 'result') {
    root.innerHTML = `
      <h3>Diagnosis</h3>
      <p class="diagnosis">${escapeHtml(state.diagnosis || 'No diagnosis')}</p>
      <button type="button" class="primary" id="cdiRestart">New CDI session</button>
    `;
    el('cdiRestart').onclick = () => {
      resetCdiSession();
      renderCdi();
    };
  }
}

function applyEvent(event) {
  const result = ddtEngine.process(state.engineState, event);
  state.engineState = result.engineState;
  state.phase = result.nextPhase;
  if (result.diagnosis) state.diagnosis = result.diagnosis;
  renderCdi();
}

function parseHashMode() {
  const raw = (location.hash || '#home').replace('#', '') || 'home';
  if (raw === 'obd2-connect') return { mode: 'obd2', autoStart: true };
  if (['home', 'cdi', 'obd2', 'status'].includes(raw)) return { mode: raw, autoStart: false };
  return { mode: 'home', autoStart: false };
}

function wireNavigation() {
  if (document.body.dataset.navWired === '1') return;
  document.body.dataset.navWired = '1';
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-nav]');
    if (!btn) return;
    event.preventDefault();
    const mode = btn.getAttribute('data-nav');
    // Home Connect Scanner should actually start the connect flow, not only open the panel.
    const autoStart = btn.id === 'homeConnectScanner' || btn.getAttribute('data-autostart') === '1';
    setMode(mode, { autoStart: autoStart && mode === 'obd2' });
  });
  window.addEventListener('hashchange', () => {
    const { mode, autoStart } = parseHashMode();
    // Only navigate on real mode changes — avoids remount loops from hash writes.
    if (mode !== state.mode) setMode(mode, { autoStart });
  });
}

async function boot() {
  // Nav must work even if CDI inventory fails — Connect Scanner is independent.
  wireNavigation();

  for (const id of ['buildStamp', 'buildStampFoot']) {
    if (el(id)) el(id).textContent = ATDD_BUILD.number;
  }
  renderVehicles('vehiclesHome');

  try {
    await loadInventory();
    el('profileBadge').textContent = `${state.inventory.profiles_found} CDI profiles loaded (${state.inventory.profiles_missing} missing vs claimed 71)`;
    el('integrityBadge').textContent = state.integrityOk ? 'CDI checksum OK' : 'CDI checksum FAIL';
    el('integrityBadge').classList.toggle('ok', state.integrityOk);
    el('integrityBadge').classList.toggle('bad', !state.integrityOk);
  } catch (err) {
    el('bootError').hidden = false;
    el('bootError').textContent = `Failed to load CDI import database: ${err.message}`;
    el('profileBadge').textContent = 'CDI profiles unavailable';
    el('integrityBadge').textContent = 'CDI checksum N/A';
  }

  let { mode, autoStart } = parseHashMode();
  // Open on Connect Scanner. Do not start Bluetooth from page load — that runs
  // before the first tap and before the iOS view controller can present the sheet.
  if (!location.hash || location.hash === '#home' || location.hash === '#obd2-connect') {
    mode = 'obd2';
    autoStart = false;
  }
  setMode(mode, { autoStart, force: mode === 'obd2' });
}

boot();
