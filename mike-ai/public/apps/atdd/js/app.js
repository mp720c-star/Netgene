import ddtEngine from './ddtEngine.js';
import { calculateBounds } from './resistance.js';
import { mountScannerUi } from './scanner-ui.js';
import { PROTOCOL_V3_META } from './obd-protocol-v3-frame-aware.js';

const EXPECTED_CDI_SHA256 =
  '7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee';
const EXPECTED_PROFILE_COUNT_CLAIMED = 71;

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
  const res = await fetch('./data/cdi-models.json', { cache: 'no-store' });
  const buf = await res.arrayBuffer();
  const sha = await sha256Hex(buf);
  const data = JSON.parse(new TextDecoder().decode(buf));
  const models = Array.isArray(data.models) ? data.models : [];
  state.models = models;
  state.integrityOk = sha === EXPECTED_CDI_SHA256;
  state.inventory = {
    sha256: sha,
    bytes: buf.byteLength,
    profiles_found: models.length,
    profiles_expected_claimed: EXPECTED_PROFILE_COUNT_CLAIMED,
    profiles_missing: Math.max(0, EXPECTED_PROFILE_COUNT_CLAIMED - models.length),
    integrity_match: state.integrityOk,
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
      <dt>CDI database SHA-256</dt><dd><code>${escapeHtml(inv.sha256)}</code></dd>
      <dt>Integrity vs frozen import</dt><dd>${inv.integrity_match ? 'MATCH' : 'MISMATCH'}</dd>
      <dt>CDI profiles found</dt><dd>${inv.profiles_found} / ${inv.profiles_expected_claimed} claimed</dd>
      <dt>CDI profiles missing</dt><dd>${inv.profiles_missing}</dd>
      <dt>ATDD 1.2.0 OBD2 database</dt><dd>NOT FOUND in this environment</dd>
      <dt>Original cdi-genius/ tree</dt><dd>PRESERVED (not deleted)</dd>
      <dt>Unified branch</dt><dd><code>cursor/complete-platform-atdd-scanner-e3f0</code></dd>
    </dl>
  `;
}

function renderObd2Gate(options = {}) {
  el('obd2Body').innerHTML = `
    <p><strong>Connect FIXD</strong> is the live Bluetooth path for your real scanner. It will not silently switch to Demo if pairing fails.</p>
    <p><strong>FIXD protocol claim:</strong> <code>UNVERIFIED</code> until a live GATT + Mode 03 (or vendor) round-trip is recorded. Parser v3 (<code>${PROTOCOL_V3_META.version}</code>) still runs after connect.</p>
    <p><strong>iPhone note:</strong> Safari cannot do Web Bluetooth. Use Chrome on Android/Windows/Mac for this web connect, or the native ATDD iOS BLE build when imported.</p>
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
    const options = state.models
      .map(
        (m) =>
          `<option value="${escapeHtml(m.model_id)}">${escapeHtml(m.manufacturer)} — ${escapeHtml(m.model_id)} (${m.pin_count} pins)</option>`
      )
      .join('');
    root.innerHTML = `
      <p class="note">Imported CDI profiles: <strong>${state.models.length}</strong> verified (claimed complete set: 71). Missing: <strong>${state.inventory.profiles_missing}</strong>.</p>
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

  const { mode, autoStart } = parseHashMode();
  setMode(mode, { autoStart });
}

boot();
