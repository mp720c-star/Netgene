
const APP_VERSION = (window.ATD_DESKTOP && window.ATD_DESKTOP.version) || (typeof DiagEngine !== 'undefined' && DiagEngine.APP_VERSION) || '1.2.0';

const state = {
  dtcDb: [],
  audioBlob: null,
  audioSummary: null,
  currentStream: null,
  imageSummary: null,
  lastAnalysis: null,
  lastAnalysisText: '',
  selectedVehicle: null
};

const symptoms = [
  'No crank','Cranks no start','Hard start','Stalling','Rough idle','Misfire','Low power','Poor fuel economy','Overheating','Tick','Knock','Rod knock','Low compression','Burns oil','Needs engine rebuild','Squeal','Hiss','Whine','Grind','Smoke','Fuel smell','Oil leak','Coolant loss','Electrical weirdness','Transmission slip','ABS / brake issue','Charging problem','Battery light','No heat','Won’t shift','Gauge acting weird'
];

function byId(id){ return document.getElementById(id); }
function text(el, value){ const node = byId(el); if(node) node.textContent = value; }
function html(el, value){ const node = byId(el); if(node) node.innerHTML = value; }
function value(id){ const node = byId(id); return node ? String(node.value || '').trim() : ''; }
function checkedSymptoms(){ return symptoms.filter((name, i) => byId(`sym_${i}`) && byId(`sym_${i}`).checked); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

function fillYears(){
  const sel = byId('year');
  sel.innerHTML = '<option value="">Select</option>';
  const top = new Date().getFullYear() + 1;
  for(let y = top; y >= 1980; y--){
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    sel.appendChild(opt);
  }
}

const SYMPTOM_GROUPS = [
  { title: 'Starting and running', names: ['No crank','Cranks no start','Hard start','Stalling','Rough idle','Misfire','Low power','Poor fuel economy'] },
  { title: 'Engine mechanical', names: ['Overheating','Tick','Knock','Rod knock','Low compression','Burns oil','Needs engine rebuild'] },
  { title: 'Noises', names: ['Squeal','Hiss','Whine','Grind'] },
  { title: 'Leaks and smells', names: ['Smoke','Fuel smell','Oil leak','Coolant loss'] },
  { title: 'Electrical and drivetrain', names: ['Electrical weirdness','Transmission slip','ABS / brake issue','Charging problem','Battery light','No heat','Won’t shift','Gauge acting weird'] }
];

function renderSymptoms(){
  const box = byId('symptoms');
  if(!box) return;
  const grouped = new Set(SYMPTOM_GROUPS.flatMap((g) => g.names));
  const leftover = symptoms.filter((name) => !grouped.has(name));
  const groups = leftover.length ? SYMPTOM_GROUPS.concat([{ title: 'Other', names: leftover }]) : SYMPTOM_GROUPS;
  box.innerHTML = '';
  groups.forEach((group) => {
    const names = group.names.filter((name) => symptoms.indexOf(name) >= 0);
    if(!names.length) return;
    const details = document.createElement('details');
    details.className = 'symptom-group';
    details.innerHTML = `<summary>${esc(group.title)} <span class="small">(${names.length})</span></summary><div class="symptom-group-body"></div>`;
    const body = details.querySelector('.symptom-group-body');
    names.forEach((name) => {
      const i = symptoms.indexOf(name);
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" id="sym_${i}"> <span>${esc(name)}</span>`;
      body.appendChild(label);
    });
    box.appendChild(details);
  });
}

function loadStats(){
  const stats = DiagEngine.computeStats(state.dtcDb);
  const extra = state.dtcBaselineCount && state.dtcDb.length > state.dtcBaselineCount
    ? ' (' + state.dtcBaselineCount.toLocaleString() + ' original + ' + (state.dtcDb.length - state.dtcBaselineCount).toLocaleString() + ' SAE generic additions)'
    : '';
  const symptomBit = typeof window.SymptomRepair !== 'undefined'
    ? ' · ' + window.SymptomRepair.stats().total.toLocaleString() + ' symptom repairs'
    : '';
  html('dbStats', `<div class="stat-line">${stats.total.toLocaleString()} codes ready offline${extra} · P ${stats.byFamily.Powertrain || 0} / B ${stats.byFamily.Body || 0} / C ${stats.byFamily.Chassis || 0} / U ${stats.byFamily.Network || 0}${symptomBit}</div>`);
}

function showStatus(message, kind){
  const banner = byId('statusBanner');
  if(!banner){
    if(message) alert(message);
    return;
  }
  if(!message){
    banner.hidden = true;
    banner.textContent = '';
    banner.className = 'status-banner';
    return;
  }
  banner.hidden = false;
  banner.textContent = message;
  banner.className = 'status-banner' + (kind ? ' ' + kind : '');
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    if(banner.textContent === message) showStatus('');
  }, 4500);
}

function restoreLegalAcceptance(){
  const box = byId('acceptLegal');
  if(!box) return;
  try{
    if(localStorage.getItem('atd_legal_ok') === '1') box.checked = true;
  }catch(_err){ /* ignore */ }
  box.addEventListener('change', () => {
    try{
      if(box.checked) localStorage.setItem('atd_legal_ok', '1');
      else localStorage.removeItem('atd_legal_ok');
    }catch(_err){ /* ignore */ }
  });
}

async function loadDb(){
  const baseline = window.DTC_DB_DATA || [];
  const additions = window.DTC_SAE_GENERIC_ADDITIONS || [];
  state.dtcBaselineCount = baseline.length;
  state.dtcDb = baseline.concat(additions);
}


function catalog(){
  return (typeof VehicleCatalog !== 'undefined') ? VehicleCatalog : null;
}

function catalogWorkflowNotice(analysis){
  const selected = state.selectedVehicle;
  const bits = [];
  if(selected && selected.workflow === 'generic_automotive'){
    bits.push('<div class="notice mt-8">DTC lookup, how-to jobs, and repair guides are generic automotive. They are not written for this exact year, make, and model.</div>');
  } else if(selected && selected.has_cdi_pinout){
    bits.push('<div class="notice mt-8">OBD diagnostic trouble codes are a separate workflow from CDI ignition pinouts. This diagnosis does not include a CDI pinout, and a pinout never emits a P, B, C, or U code.</div>');
  } else if(selected && selected.workflow === 'index_only'){
    bits.push('<div class="notice mt-8">This vehicle is in the index, but no CDI pinout is filed for it. DTC lookup and how-to jobs here are generic automotive and may not apply to this machine.</div>');
  } else {
    bits.push('<div class="notice mt-8">DTC lookup, how-to jobs, and repair guides are generic automotive. They are not written for one exact vehicle.</div>');
  }
  // Never attach pinout HTML to an OBD diagnosis result.
  return bits.join('');
}

function vehicleData(){
  return {
    year: value('year'), make: value('make'), model: value('model'), engine: value('engine'), mileage: value('mileage'),
    trans: value('trans'), fuel: value('fuel'), nickname: value('nickname')
  };
}

function parseCodes(){
  return Array.from(new Set(value('codes').toUpperCase().replace(/,/g,'\n').split(/\s+/).map(x => x.trim()).filter(Boolean)));
}

function fluidData(){
  const data = {
    type: value('fluidType'), level: value('fluidLevel'), color: value('fluidColor'), smell: value('fluidSmell'), capacity: value('fluidCapacity'), notes: value('fluidNotes')
  };
  const lines = [];
  if(!data.type){ text('fluidOut', 'Fluid guidance will show here.'); return data; }
  lines.push(`${data.type} review`);
  if(/Below|dry/i.test(data.level)) lines.push('- Danger: verify level before further operation. Add only in small measured amounts.');
  if(/add mark/i.test(data.level)) lines.push('- Slightly low: add carefully and re-check, do not dump a full container in blindly.');
  if(/Above full/i.test(data.level)) lines.push('- Overfill warning: too much fluid can cause damage.');
  if(/Milky/i.test(data.color)) lines.push('- Milky appearance can point to water or coolant contamination.');
  if(/Metallic/i.test(data.color)) lines.push('- Metallic glitter points to wear material.');
  if(/Burnt/i.test(data.smell)) lines.push('- Burnt smell points to overheating or friction damage.');
  if(/Fuel/i.test(data.smell)) lines.push('- Fuel smell can point to fuel dilution or rich running.');
  if(/Sweet coolant/i.test(data.smell)) lines.push('- Sweet coolant smell can point to a leak or cross-contamination.');
  if(data.capacity) lines.push(`- Capacity entered: ${data.capacity}`);
  if(data.notes) lines.push(`- Notes: ${data.notes}`);
  if(lines.length === 1) lines.push('- Level, color, and smell look unremarkable from the entries given. Recheck with the vehicle cold or at the specified operating temperature.');
  text('fluidOut', lines.join('\n'));
  return data;
}

function requireLegalAcceptance(){
  const box = byId('acceptLegal');
  if(box && box.checked) return true;
  showStatus('Check the box under the title first (“I know this is an assistant…”), then try again.', 'warn');
  if(box){
    box.focus();
    const accept = box.closest('.acceptance');
    if(accept) accept.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return false;
}

const ATDD_TABS = ['scan','vehicle','symptoms','results','more'];
const ATDD_TAB_FOR = {
  lookupCard:'scan', listenPanel:'scan', lookPanel:'scan', bluetoothCard:'scan', scanIntro:'scan',
  vehicleSearchCard:'vehicle', selectedVehiclePanel:'vehicle', cdiPinoutView:'vehicle',
  symptomRepairCard:'symptoms', symptomEntryView:'symptoms', symptomSearchResults:'symptoms',
  resultsCard:'results', results:'results',
  jobsCard:'more', howtoHubCard:'more', rebuildCard:'more', solutionsCardWrap:'more', computerCard:'more',
  vehicleFieldsCard:'more', fluidCard:'more', privacyCard:'more', moreIntro:'more'
};

function showTab(name, options){
  const opts = options || {};
  const tab = ATDD_TABS.indexOf(name) >= 0 ? name : 'scan';
  document.body.setAttribute('data-active-tab', tab);
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const on = panel.getAttribute('data-tab') === tab;
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
  });
  document.querySelectorAll('.tabbar [data-tab]').forEach((btn) => {
    const on = btn.getAttribute('data-tab') === tab;
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.classList.toggle('is-active', on);
  });
  if(opts.scroll !== false){
    window.scrollTo(0, 0);
  }
  try{
    if(location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
  }catch(_){ /* ignore */ }
  window.showAtddTab = showTab;
}

function initTabs(){
  document.querySelectorAll('.tabbar [data-tab]').forEach((btn) => {
    btn.onclick = () => showTab(btn.getAttribute('data-tab'));
  });
  window.addEventListener('hashchange', () => {
    const name = (location.hash || '').replace(/^#/, '');
    if(ATDD_TABS.indexOf(name) >= 0) showTab(name);
  });
  const initial = (location.hash || '').replace(/^#/, '');
  showTab(ATDD_TABS.indexOf(initial) >= 0 ? initial : 'scan', { scroll:false });
}

function tabForNode(id, node){
  if(id && ATDD_TAB_FOR[id]) return ATDD_TAB_FOR[id];
  const panel = node && node.closest && node.closest('.tab-panel');
  return panel ? panel.getAttribute('data-tab') : null;
}

function showEl(id){
  const node = byId(id);
  const tab = tabForNode(id, node);
  const sectionIds = ['resultsCard','results','lookupCard','vehicleSearchCard','symptomRepairCard','scanIntro','moreIntro'];
  if(tab) showTab(tab, { scroll: sectionIds.indexOf(id) >= 0 });
  if(!node) return;
  if(node.tagName === 'DETAILS') node.open = true;
  const wrap = node.closest && node.closest('details');
  if(wrap) wrap.open = true;
  if(sectionIds.indexOf(id) === -1){
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


function renderStructuredGuidance(code, record){
  if(typeof window.DtcGuidance === 'undefined' || !window.DtcGuidance.guidanceFor) return '';
  if(record && (record.inDatabase === false || (record.detailed && record.detailed.unknown))) return '';
  const g = window.DtcGuidance.guidanceFor(code, record || { code: code, description: '', family: '', subsystem: '' });
  if(g.unknown || g.tier === 'unknown'){
    return `<div class="guidance-tier mt-10"><span class="badge generic">Unknown</span><div class="small mt-6"><strong>Unknown code – not in database</strong></div><div class="small mt-6">No cause, test, or fix was invented for this identifier.</div></div>`;
  }
  const sources = (g.sources || []).map((s) => {
    const bit = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name);
    return `<li>${bit}${s.license ? ' <span class="small">(' + esc(s.license) + ')</span>' : ''}</li>`;
  }).join('');
  const safety = (g.safety || []).map((s) => `<div class="notice mt-8">${esc(s)}</div>`).join('');
  const causes = (g.causes || []).map((cause, i) => {
    const like = cause.likelihood ? ` <span class="badge">${esc(cause.likelihood)} likelihood</span>` : '';
    const tests = (cause.tests || []).map((t, j) => `
      <div class="test-step">
        <div><span class="label">Test ${j + 1}.</span> <span class="label">Tool:</span> ${esc(t.tool)}</div>
        <div class="mt-6"><span class="label">Check:</span> ${esc(t.check)}</div>
        <div class="mt-6"><span class="label">Good:</span> ${esc(t.good)}</div>
        <div class="mt-6"><span class="label">Bad:</span> ${esc(t.bad)}</div>
        <div class="mt-6"><span class="label">Spec:</span> ${esc(t.spec)}</div>
      </div>
    `).join('');
    return `<div class="cause-block"><h4>Cause ${i + 1}: ${esc(cause.title)}${like}</h4>${tests}</div>`;
  }).join('');
  return `
    <div class="guidance-tier mt-10">
      <span class="badge ${g.tier === 'generated-general' ? 'generic' : 'cited'}">${esc(g.tier)}</span>
      <div class="small mt-6"><strong>${esc(g.tierLabel)}</strong></div>
      ${safety}
      <div class="mt-8"><strong>How to test each listed cause</strong></div>
      ${causes || '<div class="small">No structured tests are available for this identifier.</div>'}
      <div class="small mt-8"><strong>Sources</strong></div>
      <ul class="source-list">${sources}</ul>
    </div>
  `;
}


function openSymptomEntry(id){
  const card = byId('symptomRepairCard');
  if(card) showEl('symptomRepairCard');
  renderSymptomEntry(id);
  const view = byId('symptomEntryView');
  if(view) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function relatedSymptomLinks(entries){
  if(!entries || !entries.length) return '';
  return `<div class="mt-8"><strong>Related symptoms</strong>
    <div class="mt-6">${entries.map((e) => `<button type="button" class="chip" data-open-symptom="${esc(e.id)}">${esc(e.title)}</button>`).join('')}</div>
  </div>`;
}

function bindSymptomButtons(root){
  const box = typeof root === 'string' ? byId(root) : root;
  if(!box || !box.querySelectorAll) return;
  box.querySelectorAll('[data-open-symptom]').forEach((btn) => {
    btn.onclick = () => openSymptomEntry(btn.getAttribute('data-open-symptom'));
  });
}

function renderSymptomEntryHtml(entry){
  if(!entry) return '<div class="small">That symptom entry was not found.</div>';
  const sources = (entry.sources || []).map((s) => {
    const bit = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name);
    return `<li>${bit}${s.license ? ' <span class="small">(' + esc(s.license) + ')</span>' : ''}${s.used_for ? ' — ' + esc(s.used_for) : ''}</li>`;
  }).join('');
  const safety = (entry.safety || []).map((s) => `<div class="notice mt-8">${esc(s)}</div>`).join('');
  const causes = (entry.causes || []).map((cause, i) => {
    const like = cause.likelihood ? ` <span class="badge">${esc(cause.likelihood)} likelihood</span>` : '';
    const tests = (cause.tests || []).map((t, j) => `
      <div class="test-step">
        <div><span class="label">Test ${j + 1}.</span> <span class="label">Tool:</span> ${esc(t.tool)}</div>
        <div class="mt-6"><span class="label">Check:</span> ${esc(t.check)}</div>
        <div class="mt-6"><span class="label">Good:</span> ${esc(t.good)}</div>
        <div class="mt-6"><span class="label">Bad:</span> ${esc(t.bad)}</div>
        <div class="mt-6"><span class="label">Spec:</span> ${esc(t.spec)}</div>
      </div>
    `).join('');
    const fix = (cause.fix || []).map((s) => `<li>${esc(s)}</li>`).join('');
    return `<div class="cause-block"><h4>Cause ${i + 1}: ${esc(cause.title)}${like}</h4>${tests}${fix ? `<div class="small mt-8"><strong>Fix</strong></div><ol class="checks diy-list">${fix}</ol>` : ''}</div>`;
  }).join('');
  const dtcs = (entry.related_dtcs || []).map((c) => `<button type="button" class="chip" data-use-dtc="${esc(c)}">${esc(c)}</button>`).join('');
  const cdi = entry.cdi_workflow ? '<div class="notice mt-8">This entry can use the CDI pinout workflow. Select the machine in Vehicle search to open a pinout if one is filed. A pinout is not an OBD code.</div>' : '';
  return `
    <div class="code-card" id="symptom-entry-${esc(entry.id)}">
      <div><span class="badge ${entry.tier === 'generated-general' ? 'generic' : 'cited'}">${esc(entry.tier)}</span><span class="badge">${esc(entry.systemLabel || entry.system)}</span><span class="badge">${esc(entry.difficulty || '')}</span></div>
      <h3>${esc(entry.title)}</h3>
      <div class="small mt-6"><strong>${esc(entry.tierLabel || '')}</strong></div>
      <div class="mt-8"><strong>Symptom</strong><div class="small mt-6">${esc(entry.symptom)}</div></div>
      <div class="mt-8"><strong>What this is</strong><div class="small mt-6">${esc(entry.means)}</div></div>
      ${safety}
      <div class="small mt-8"><strong>Time:</strong> ${esc(entry.time || '')}</div>
      ${(entry.tools || []).length ? `<div class="small mt-6"><strong>Tools:</strong> ${esc(entry.tools.join(', '))}</div>` : ''}
      ${(entry.parts || []).length ? `<div class="small mt-6"><strong>Parts:</strong> ${esc(entry.parts.join(', '))}</div>` : ''}
      <div class="mt-10"><strong>How to test each listed cause</strong></div>
      ${causes}
      ${dtcs ? `<div class="mt-8"><strong>Related codes</strong><div class="chip-row mt-6">${dtcs}</div></div>` : ''}
      ${cdi}
      <div class="small mt-8"><strong>Sources and licenses</strong></div>
      <ul class="source-list">${sources}</ul>
    </div>
  `;
}

function currentSymptomFilters(){
  const audience = (state.selectedVehicle && typeof window.SymptomRepair !== 'undefined')
    ? window.SymptomRepair.audienceForVehicle(state.selectedVehicle)
    : '';
  return {
    system: value('symptomSystemFilter'),
    tier: value('symptomTierFilter'),
    audience: audience || 'all'
  };
}

function renderSymptomSearch(){
  if(typeof window.SymptomRepair === 'undefined') return;
  const stats = byId('symptomSearchStats');
  const box = byId('symptomSearchResults');
  if(!box) return;
  const q = value('symptomQuery');
  const filters = currentSymptomFilters();
  const all = window.SymptomRepair.stats();
  const hasIntent = !!(q || filters.system);
  if(!hasIntent){
    if(stats) stats.textContent = all.total + ' symptom entries offline · ' + all.byTier.cited + ' cited / ' + all.byTier['generated-general'] + ' general. Search or pick a system to see entries.';
    box.innerHTML = '<div class="small">No list yet. Type a symptom or pick a system above.</div>';
    return;
  }
  const hits = window.SymptomRepair.search(q, filters);
  if(stats){
    stats.textContent = hits.length + ' shown · ' + all.total + ' symptom entries offline · ' + all.byTier.cited + ' cited / ' + all.byTier['generated-general'] + ' general';
  }
  const limit = 25;
  const shown = hits.slice(0, limit);
  if(!shown.length){
    box.innerHTML = '<div class="small">No symptom entry matches that search. Try a system chip or a shorter word (smoke, crank, leak).</div>';
    return;
  }
  box.innerHTML = shown.map((e) => `
    <button type="button" class="symptom-card" data-open-symptom="${esc(e.id)}">
      <h3>${esc(e.title)}</h3>
      <div class="symptom-meta"><span class="badge ${e.tier === 'generated-general' ? 'generic' : 'cited'}">${esc(e.tier)}</span> ${esc(e.systemLabel)} — ${esc(e.symptom)}</div>
    </button>
  `).join('') + (hits.length > limit ? `<div class="small">Showing ${limit} of ${hits.length}. Narrow the search or pick a system.</div>` : '');
  bindSymptomButtons(box);
}

function renderSymptomEntry(id){
  const view = byId('symptomEntryView');
  if(!view || typeof window.SymptomRepair === 'undefined') return;
  const entry = window.SymptomRepair.byId(id);
  view.hidden = !entry;
  view.innerHTML = entry ? renderSymptomEntryHtml(entry) : '';
  if(!entry) return;
  bindSymptomButtons(view);
  view.querySelectorAll('[data-use-dtc]').forEach((btn) => {
    btn.onclick = () => {
      const field = byId('codes');
      if(field) field.value = btn.getAttribute('data-use-dtc');
      showEl('lookupCard');
      quickLookup();
    };
  });
}

function fillSymptomFilters(){
  if(typeof window.SymptomRepair === 'undefined') return;
  const sel = byId('symptomSystemFilter');
  const chips = byId('symptomSystemChips');
  const systems = window.SymptomRepair.systems().filter((s) => s.count);
  if(sel && sel.options.length <= 1){
    systems.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label + ' (' + s.count + ')';
      sel.appendChild(opt);
    });
  }
  if(chips){
    const current = value('symptomSystemFilter');
    chips.innerHTML = systems.map((s) => `<button type="button" class="system-chip${current === s.id ? ' is-on' : ''}" data-system="${esc(s.id)}">${esc(s.label)} (${s.count})</button>`).join('');
    chips.querySelectorAll('[data-system]').forEach((btn) => {
      btn.onclick = () => {
        if(byId('symptomSystemFilter')) byId('symptomSystemFilter').value = btn.getAttribute('data-system');
        renderSymptomSearch();
        fillSymptomFilters();
      };
    });
  }
}

function initSymptomRepair(){
  if(typeof window.SymptomRepair === 'undefined' || !byId('symptomRepairCard')) return;
  fillSymptomFilters();
  renderSymptomSearch();
  const q = byId('symptomQuery');
  const sys = byId('symptomSystemFilter');
  const tier = byId('symptomTierFilter');
  if(q) q.oninput = renderSymptomSearch;
  if(sys) sys.onchange = () => { fillSymptomFilters(); renderSymptomSearch(); };
  if(tier) tier.onchange = renderSymptomSearch;
}

function renderLookupCards(items){
  if(!items.length){ html('codeResults','<div class="code-card">No matching codes.</div>'); showEl('codeResults'); return; }
  html('codeResults', items.map(item => {
    const detailed = item.detailed || {};
    if(item.inDatabase === false || detailed.unknown){
      return `
        <div class="code-card">
          <div><span class="badge">${esc(item.code)}</span><span class="badge generic">Unknown</span></div>
          <div><strong>${esc(item.description || 'Unknown code – not in database')}</strong></div>
          <div class="small mt-8">This identifier is not in the bundled database. No cause, reading, or fix was invented for it.</div>
        </div>
      `;
    }
    const genericLabel = detailed.generic
      ? `<div class="small mt-8"><span class="badge generic">General guidance</span> ${esc(detailed.guidanceLabel || 'General guidance – not a diagnosis for this exact vehicle')}</div>`
      : '';
    const diy = (detailed.diySteps && detailed.diySteps.length)
      ? `<div class="diy mt-10"><strong>${detailed.generic ? 'General repair steps' : 'DIY repair steps'}</strong><ol class="checks">${detailed.diySteps.map(step => `<li>${esc(step)}</li>`).join('')}</ol></div>`
      : '';
    const checks = (detailed.firstChecks || []).length
      ? `<div class="small mt-8"><strong>${detailed.generic ? 'General checks:' : 'What to check first:'}</strong> ${esc(detailed.firstChecks.join(' | '))}</div>`
      : '';
    const parts = (detailed.likelyParts || []).length
      ? `<div class="small mt-6"><strong>${detailed.generic ? 'Common parts in this system (general guidance):' : 'Parts listed for this code:'}</strong> ${esc(detailed.likelyParts.join(' | '))}</div>`
      : '';
    return `
      <div class="code-card">
        <div><span class="badge">${esc(item.code)}</span><span class="badge">${esc(item.family)}</span><span class="badge">${esc(item.subsystem)}</span></div>
        <div><strong>${esc(item.description)}</strong></div>
        ${genericLabel}
        <div class="small mt-8"><strong>${esc(detailed.title || 'Guidance')}</strong></div>
        ${checks}
        ${parts}
        ${diy}
        ${renderStructuredGuidance(item.code, item)}
        ${typeof window.SymptomRepair !== 'undefined' ? relatedSymptomLinks(window.SymptomRepair.byDtc(item.code)) : ''}
      </div>
    `;
  }).join(''));
  showEl('lookupCard');
  bindSymptomButtons('codeResults');
}

function quickLookup(){
  const codes = parseCodes();
  if(!codes.length){
    html('codeResults','<div class="code-card">Enter at least one code (example <strong>P0300</strong>), or tap an example chip.</div>');
    showStatus('Type a code first, then tap Quick Lookup.', 'warn');
    const field = byId('codes');
    if(field) field.focus();
    return;
  }
  const results = DiagEngine.lookupCodes(state.dtcDb, codes);
  renderLookupCards(results || []);
  if(results && results.length){
    const known = results.filter((row) => row.inDatabase !== false && !(row.detailed && row.detailed.unknown)).length;
    const unknown = results.length - known;
    if(known && !unknown) showStatus('Found ' + known + ' code' + (known === 1 ? '' : 's') + ' in the database.', 'ok');
    else if(!known && unknown) showStatus('Unknown code – not in database. No diagnosis was invented.', 'warn');
    else showStatus(known + ' in the database, ' + unknown + ' unknown. Unknown identifiers have no invented diagnosis.', 'warn');
  }else{
    showStatus('No match for those codes in the offline library.', 'warn');
  }
}

function useExampleCode(code){
  const field = byId('codes');
  if(!field) return;
  field.value = code;
  if(byId('acceptLegal') && byId('acceptLegal').checked) runDiagnosis();
  else {
    quickLookup();
    showStatus('Code loaded. Check the legal box, then tap Diagnose now for the full repair plan.', 'warn');
  }
}

function maybeAutoDiagnose(source){
  const legal = byId('acceptLegal');
  if(!legal || !legal.checked){
    showStatus('Evidence captured from ' + source + '. Check the legal box, then tap Diagnose now.', 'warn');
    return;
  }
  const hasMedia = !!(state.audioSummary || state.imageSummary);
  const hasCodes = parseCodes().length > 0;
  const hasSymptoms = checkedSymptoms().length > 0 || rebuildFlagSymptoms().length > 0;
  if(!hasMedia && !hasCodes && !hasSymptoms){
    showStatus('Add sound, a photo, a code, or a symptom before diagnosing.', 'warn');
    return;
  }
  showStatus('Running diagnosis from ' + source + '…', 'ok');
  runDiagnosis();
}

function searchLocalDb(){
  const q = value('dbQuery');
  if(!q){ html('codeResults','<div class="code-card">Enter a code or keyword.</div>'); showEl('codeResults'); return; }
  if(/rebuild|short block|bottom end|ring job|rod knock/i.test(q)){
    renderRebuildGuide();
    showEl('rebuildCard');
  }
  if(/starter|alternator|valve cover|stereo|amp|subwoofer|exhaust|headlight|tail light|hub|flat|spark plug|oil|brake|tranny|trans fluid|windshield|injector|control arm|axle|rotor|pad/i.test(q)){
    renderCommonJobs(q);
    showEl('jobsCard');
  }
  const results = DiagEngine.searchDtc(state.dtcDb, q);
  renderLookupCards(results);
}

function saveCase(){
  const payload = currentCase();
  localStorage.setItem('atd_case_latest', JSON.stringify(payload));
  showStatus('Case saved on this device.', 'ok');
}

function loadCase(){
  const raw = localStorage.getItem('atd_case_latest');
  if(!raw){ showStatus('No saved case on this device yet.', 'warn'); return; }
  const saved = JSON.parse(raw);
  Object.entries(saved.vehicle || {}).forEach(([k,v]) => { if(byId(k)) byId(k).value = v || ''; });
  byId('codes').value = (saved.dtcs || []).join('\n');
  byId('notes').value = saved.notes || '';
  Object.entries(saved.fluid || {}).forEach(([k,v]) => {
    const map = { type:'fluidType', level:'fluidLevel', color:'fluidColor', smell:'fluidSmell', capacity:'fluidCapacity', notes:'fluidNotes' };
    if(map[k] && byId(map[k])) byId(map[k]).value = v || '';
  });
  symptoms.forEach((name, i) => { byId(`sym_${i}`).checked = (saved.symptoms || []).includes(name); });
  fluidData();
  if(saved.lastAnalysis){
    state.lastAnalysis = saved.lastAnalysis;
    state.lastAnalysisText = saved.lastAnalysisText || '';
    renderAnalysis(saved.lastAnalysis);
    if(typeof showTab === 'function') showTab('results', { scroll:false });
  }
  showStatus('Saved case loaded.', 'ok');
}

function clearCase(){
  if(!confirm('Clear the on-screen form and delete the locally saved case?')) return;
  localStorage.removeItem('atd_case_latest');
  ['make','model','engine','mileage','nickname','codes','notes','dbQuery','fluidCapacity','fluidNotes'].forEach(id => { if(byId(id)) byId(id).value = ''; });
  ['year','trans','fuel','fluidType','fluidLevel','fluidColor','fluidSmell'].forEach(id => { if(byId(id)) byId(id).value = ''; });
  clearSelectedVehicle();
  symptoms.forEach((_, i) => { if(byId(`sym_${i}`)) byId(`sym_${i}`).checked = false; });
  ['flagRodKnock','flagLowCompression','flagBurnsOil','flagMetalInOil','flagNeedRebuild'].forEach(id => { if(byId(id)) byId(id).checked = false; });
  state.lastAnalysis = null;
  state.lastAnalysisText = '';
  state.audioSummary = null;
  state.imageSummary = null;
  html('codeResults', '');
  text('fluidOut', 'Fluid guidance will show here.');
  text('audioSummary', 'No audio yet.');
  text('imageSummary', 'No photo or frame yet.');
  html('results', 'Nothing yet. Capture sound or a photo, or enter a code, then tap <strong>Diagnose now</strong>.');
  showStatus('Saved case cleared.', 'ok');
}

function currentCase(){
  return {
    savedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    vehicle: vehicleData(),
    dtcs: parseCodes(),
    symptoms: Array.from(new Set(checkedSymptoms().concat(rebuildFlagSymptoms()))),
    notes: value('notes'),
    fluid: {
      type: value('fluidType'), level: value('fluidLevel'), color: value('fluidColor'), smell: value('fluidSmell'), capacity: value('fluidCapacity'), notes: value('fluidNotes')
    },
    mediaSummary: { audio: state.audioSummary, image: state.imageSummary, video: state.imageSummary },
    lastAnalysis: state.lastAnalysis,
    lastAnalysisText: state.lastAnalysisText
  };
}

function analysisToText(analysis){
  const lines = [];
  lines.push(`Auto/Truck Diagnostics for Dummies v${APP_VERSION}`);
  lines.push(`Generated: ${analysis.generatedAt || new Date().toISOString()}`);
  const v = analysis.vehicle || vehicleData();
  lines.push(`Vehicle: ${[v.year, v.make, v.model, v.engine, v.nickname].filter(Boolean).join(' ') || '(not entered)'}`);
  lines.push(`Primary finding: ${analysis.summary.primaryFinding}`);
  lines.push(`Confidence: ${analysis.summary.confidence}%`);
  lines.push(`Reason: ${analysis.summary.shortReason}`);
  lines.push('');
  lines.push('Top ranked causes');
  (analysis.rankedHypotheses || []).forEach((item, i) => {
    lines.push(`${i+1}. ${item.title} — ${item.confidence}%`);
    lines.push(`   Evidence: ${(item.reasons || []).join(' | ')}`);
  });
  lines.push('');
  lines.push(`DIY repair steps${analysis.diyTitle ? ' — ' + analysis.diyTitle : ''}`);
  (analysis.diySteps || []).forEach((x, i) => lines.push(`${i+1}. ${x}`));
  if(analysis.rebuildGuide && analysis.rebuildGuide.stages){
    lines.push('');
    lines.push('Engine rebuild stages');
    analysis.rebuildGuide.stages.forEach((stage) => {
      lines.push(stage.title);
      (stage.steps || []).forEach((x, i) => lines.push(`  ${i+1}. ${x}`));
    });
  }
  if(analysis.relatedJobs && analysis.relatedJobs.length){
    lines.push('');
    lines.push('Related how-to jobs');
    analysis.relatedJobs.forEach((job) => {
      lines.push(job.title);
      (job.steps || []).forEach((x, i) => lines.push(`  ${i+1}. ${x}`));
    });
  }
  lines.push('');
  lines.push('First checks');
  (analysis.firstChecks || []).forEach((x, i) => lines.push(`${i+1}. ${x}`));
  lines.push('');
  lines.push('Likely parts / paths');
  (analysis.likelyParts || []).forEach((x, i) => lines.push(`${i+1}. ${x}`));
  if((analysis.warnings || []).length){
    lines.push('');
    lines.push('Warnings');
    analysis.warnings.forEach((x, i) => lines.push(`${i+1}. ${x}`));
  }
  if((analysis.codeCards || []).length){
    lines.push('');
    lines.push('Code cards');
    analysis.codeCards.forEach(card => {
      lines.push(`- ${card.code}: ${card.description}`);
      if(card.guidance){
        lines.push(`  ${card.guidance.title || 'Guidance'}`);
        lines.push(`  First checks: ${card.guidance.firstChecks.join(' | ')}`);
        if(card.guidance.likelyParts) lines.push(`  Likely parts: ${card.guidance.likelyParts.join(' | ')}`);
      }
    });
  }
  lines.push('');
  lines.push('Disclaimers');
  (analysis.disclaimers || []).forEach((x, i) => lines.push(`${i+1}. ${x}`));
  return lines.join('\n');
}

function exportReport(){
  const payload = currentCase();
  const reportText = payload.lastAnalysisText || 'No diagnosis has been run yet. Vehicle, codes, symptoms, and fluid notes are included below.';
  const body = `${reportText}\n\n--- Case JSON ---\n${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([body], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `atd-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function fileToArrayBuffer(file){ return await file.arrayBuffer(); }

async function analyzeAudioBuffer(buffer){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await ctx.decodeAudioData(buffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    let sum = 0, zc = 0;
    for(let i=0;i<channel.length;i++){
      const s = channel[i];
      sum += s*s;
      if(i>0 && ((channel[i-1] <= 0 && s > 0) || (channel[i-1] >= 0 && s < 0))) zc++;
    }
    const rms = Math.sqrt(sum / channel.length);
    const zeroCrossRate = zc / (channel.length / sampleRate);
    const summary = {
      durationSec: Number(audioBuffer.duration.toFixed(2)),
      rms: Number(rms.toFixed(4)),
      zeroCrossRate: Number(zeroCrossRate.toFixed(1)),
      cue: 'undetermined — raw level and crossing rate only, not a diagnosis'
    };
    state.audioSummary = summary;
    text('audioSummary', `Audio measurements (not a diagnosis): ${summary.durationSec}s | RMS ${summary.rms} | ZCR ${summary.zeroCrossRate}. ${summary.cue}`);
    maybeAutoDiagnose('microphone');
  }catch(err){
    text('audioSummary', 'Audio loaded, but browser decoding failed for deeper analysis.');
    state.audioSummary = { cue:'' };
    maybeAutoDiagnose('microphone');
  }
}

async function handleAudioFile(file){
  byId('audioPreview').src = URL.createObjectURL(file);
  const buffer = await fileToArrayBuffer(file);
  state.audioBlob = file;
  await analyzeAudioBuffer(buffer);
}

function imageMetricsFromCanvas(canvas){
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let white = 0, blue = 0, dark = 0, hot = 0, total = width * height;
  for(let i=0;i<data.length;i+=4){
    const r = data[i], g = data[i+1], b = data[i+2];
    const avg = (r+g+b)/3;
    if(avg > 205 && Math.abs(r-g) < 22 && Math.abs(g-b) < 22) white++;
    if(b > r+10 && b > g+10 && avg > 80 && avg < 210) blue++;
    if(avg < 55) dark++;
    if(r > 180 && g > 90 && b < 120) hot++;
  }
  const ratio = x => Number((x / total).toFixed(4));
  const summary = {
    whiteRatio: ratio(white),
    blueRatio: ratio(blue),
    darkRatio: ratio(dark),
    hotRatio: ratio(hot),
    smokeHint: ''
  };
  state.imageSummary = summary;
  text('imageSummary', `Image measurements (not a smoke diagnosis): white ${summary.whiteRatio} | blue ${summary.blueRatio} | dark ${summary.darkRatio} | warm ${summary.hotRatio}. No color classification was turned into a finding.`);
  maybeAutoDiagnose('camera');
  return summary;
}

async function drawImageFileToCanvas(file){
  const img = new Image();
  img.onload = () => {
    const canvas = byId('frameCanvas');
    const maxW = 640;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    byId('photoPreview').src = img.src;
    byId('photoPreview').hidden = false;
    imageMetricsFromCanvas(canvas);
  };
  img.src = URL.createObjectURL(file);
}

async function startCamera(){
  try{
    state.currentStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
    const video = byId('videoPreview');
    video.srcObject = state.currentStream;
    await video.play();
  }catch(err){
    alert('Camera not available or permission denied.');
  }
}

function stopCamera(){
  if(state.currentStream){ state.currentStream.getTracks().forEach(t => t.stop()); state.currentStream = null; }
  const video = byId('videoPreview');
  video.pause();
  video.srcObject = null;
}

function captureFrame(){
  const video = byId('videoPreview');
  if(!(video.videoWidth > 0)) { alert('Start camera or load a video first.'); return; }
  const canvas = byId('frameCanvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  byId('frameImage').src = canvas.toDataURL('image/jpeg', 0.9);
  byId('frameImage').hidden = false;
  imageMetricsFromCanvas(canvas);
}

let mediaRecorder = null;
let mediaChunks = [];
async function toggleAudioRecord(){
  const btn = byId('btnAudioRecord');
  if(mediaRecorder && mediaRecorder.state === 'recording'){
    mediaRecorder.stop();
    btn.textContent = 'Start Audio Recording';
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    mediaChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => mediaChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(mediaChunks, { type:'audio/webm' });
      const file = new File([blob], 'audio.webm', { type:'audio/webm' });
      await handleAudioFile(file);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    btn.textContent = 'Stop Audio Recording';
    text('audioSummary', 'Recording...');
  }catch(err){
    alert('Microphone not available or permission denied.');
  }
}

function rebuildFlagSymptoms(){
  const extra = [];
  if(byId('flagRodKnock') && byId('flagRodKnock').checked) extra.push('Rod knock');
  if(byId('flagLowCompression') && byId('flagLowCompression').checked) extra.push('Low compression');
  if(byId('flagBurnsOil') && byId('flagBurnsOil').checked) extra.push('Burns oil');
  if(byId('flagNeedRebuild') && byId('flagNeedRebuild').checked) extra.push('Needs engine rebuild');
  if(byId('flagMetalInOil') && byId('flagMetalInOil').checked) extra.push('Needs engine rebuild');
  return extra;
}

function markSymptom(name, on){
  const i = symptoms.indexOf(name);
  const el = i >= 0 ? byId('sym_' + i) : null;
  if(el) el.checked = !!on;
}

function startRebuildDiagnosis(){
  if(!byId('flagRodKnock').checked && !byId('flagLowCompression').checked && !byId('flagBurnsOil').checked && !byId('flagMetalInOil').checked && !byId('flagNeedRebuild').checked){
    showStatus('No data – not enough information. Select a rebuild clue you actually observed first.', 'warn');
    return;
  }
  markSymptom('Rod knock', byId('flagRodKnock').checked);
  markSymptom('Low compression', byId('flagLowCompression').checked);
  markSymptom('Burns oil', byId('flagBurnsOil').checked);
  markSymptom('Needs engine rebuild', byId('flagNeedRebuild').checked);
  if(byId('flagMetalInOil').checked){
    markSymptom('Needs engine rebuild', byId('flagNeedRebuild').checked || true);
  }
  runDiagnosis();
}

async function runDiagnosis(){
  if(!requireLegalAcceptance()) return;
  fluidData();
  const payload = {
    vehicle: vehicleData(),
    dtcs: parseCodes(),
    symptoms: Array.from(new Set(checkedSymptoms().concat(rebuildFlagSymptoms()))),
    notes: value('notes'),
    fluid: {
      type: value('fluidType'), level: value('fluidLevel'), color: value('fluidColor'), smell: value('fluidSmell'), capacity: value('fluidCapacity'), notes: value('fluidNotes')
    },
    mediaSummary: {
      audio: state.audioSummary,
      image: state.imageSummary,
      video: state.imageSummary
    }
  };
  const analysis = DiagEngine.buildAnalysis(payload, state.dtcDb);
  state.lastAnalysis = analysis;
  renderAnalysis(analysis);
}

function evidenceKey(s){
  return String(s || '').replace(/[—–-]/g, ' ').replace(/^code:\s*/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function dedupeEvidence(items){
  const seen = new Set();
  const out = [];
  (items || []).forEach((item) => {
    const key = evidenceKey(item);
    if(!key || seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
}

function topCauseLines(analysis, outcome){
  const lines = [];
  (analysis.rankedHypotheses || []).forEach((h) => { if(h && h.title) lines.push(h.title); });
  ((outcome && outcome.likelyParts) || []).forEach((part) => lines.push(part));
  const seen = new Set();
  return lines.filter((line) => {
    const key = String(line).replace(/\s+/g, ' ').trim().toLowerCase();
    if(!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function resultDetails(title, inner, open){
  if(!inner) return '';
  return `<details class="result-details"${open ? ' open' : ''}><summary>${title}</summary>${inner}</details>`;
}

function renderAnalysis(analysis){
  state.lastAnalysisText = analysisToText(analysis);
  const v = analysis.vehicle || {};
  const vehicleLine = [v.year, v.make, v.model, v.engine, v.nickname].filter(Boolean).join(' ') || '';
  const outcome = analysis.outcome || (typeof DiagEngine !== 'undefined' && DiagEngine.resolveOutcome ? DiagEngine.resolveOutcome(analysis) : null);
  const evidence = dedupeEvidence((() => {
    const items = [];
    if(state.audioSummary && state.audioSummary.durationSec != null) items.push('Mic measurements: ' + state.audioSummary.durationSec + 's, RMS ' + state.audioSummary.rms + ', ZCR ' + state.audioSummary.zeroCrossRate + ' (not a diagnosis)');
    if(state.imageSummary && (state.imageSummary.whiteRatio != null)) items.push('Camera measurements: white ' + state.imageSummary.whiteRatio + ', blue ' + state.imageSummary.blueRatio + ', dark ' + state.imageSummary.darkRatio + ' (not a diagnosis)');
    (analysis.codeCards || []).slice(0, 3).forEach((card) => items.push('Code: ' + card.code + ' — ' + card.description));
    (analysis.rankedHypotheses || []).slice(0, 2).forEach((h) => {
      if(h.reasons && h.reasons[0]) items.push(h.reasons[0]);
    });
    return items;
  })());
  const list = (items) => (items || []).map(x => `<li>${esc(x)}</li>`).join('') || '<li>None listed for this finding.</li>';

  if(!outcome || outcome.kind === 'needs_more_evidence' || outcome.kind === 'unknown_code'){
    const unknown = outcome && outcome.kind === 'unknown_code';
    html('results', `
      <div class="outcome-banner">
        <div class="kind">${unknown ? 'Unknown code' : 'No data'}</div>
        <h3>${esc((outcome && outcome.title) || 'No data – not enough information')}</h3>
        <div class="small">${esc((outcome && outcome.reason) || (analysis.summary && analysis.summary.shortReason) || 'No data – not enough information')}</div>
        ${vehicleLine ? `<div class="small mt-6">${esc(vehicleLine)}</div>` : ''}
      ${catalogWorkflowNotice(analysis)}
      </div>
      <div class="result-block"><h3>${unknown ? 'Unknown code – not in database' : 'What to capture next'}</h3><ol class="checks diy-list">${list((outcome && outcome.instructions) || [])}</ol></div>
      ${evidence.length ? resultDetails('Evidence so far', `<ul class="evidence-list">${evidence.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
    `);
    showEl('resultsCard');
    if(typeof showTab === 'function') showTab('results', { scroll:false });
    showStatus(unknown ? 'Unknown code – not in database. No diagnosis was invented.' : 'No data – not enough information.', 'warn');
    return;
  }

  const relatedJobs = (outcome.relatedJobs || []).map((job) => `
    <details class="playbook" id="result-job-${esc(job.id)}">
      <summary>${esc(job.title)} <span class="small">(related to this diagnosis)</span></summary>
      ${job.time ? `<div class="small mt-8"><strong>Typical time:</strong> ${esc(job.time)}</div>` : ''}
      ${job.tools && job.tools.length ? `<div class="small mt-8"><strong>Tools:</strong> ${esc(job.tools.join(', '))}</div>` : ''}
      ${job.parts && job.parts.length ? `<div class="small mt-8"><strong>Parts:</strong> ${esc(job.parts.join(', '))}</div>` : ''}
      ${job.warnings && job.warnings.length ? `<div class="notice mt-8">${job.warnings.map((w) => esc(w)).join(' ')}</div>` : ''}
      <ol class="checks diy-list mt-8">${(job.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
    </details>
  `).join('');

  let rebuildHtml = '';
  if(outcome.kind === 'rebuild' && outcome.playbook && outcome.playbook.stages){
    rebuildHtml = `<div class="result-block"><h3>Engine rebuild stages</h3>${(outcome.playbook.stages || []).map((stage, idx) => `
      <details class="playbook"${idx === 0 ? ' open' : ''}>
        <summary>${esc(stage.title)}</summary>
        <ol class="checks diy-list">${(stage.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
      </details>
    `).join('')}</div>`;
  }

  const otherCodes = (outcome.codeCards || []).slice(outcome.kind === 'code' ? 1 : 0).map((card) => `
    <div class="code-card">
      <div><span class="badge">${esc(card.code)}</span><span class="badge">${esc(card.family || '')}</span></div>
      <div><strong>${esc(card.description)}</strong></div>
    </div>
  `).join('');

  const primaryCard = (analysis.codeCards || [])[0];
  const causes = topCauseLines(analysis, outcome);
  const general = (outcome.likelyParts && outcome.kind !== 'code') || (analysis.rankedHypotheses && analysis.rankedHypotheses[0] && analysis.rankedHypotheses[0].generic);
  const relatedSymptoms = typeof window.SymptomRepair !== 'undefined'
    ? relatedSymptomLinks((() => { const fromCodes = (analysis.codeCards || []).flatMap((c) => window.SymptomRepair.byDtc(c.code)); const fromSym = window.SymptomRepair.byKeywords((analysis.symptoms || []).concat(checkedSymptoms())); const seen = new Set(); return fromCodes.concat(fromSym).filter((e) => { if(seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0, 8); })())
    : '';
  html('results', `
    <div class="outcome-banner">
      <div class="kind">${esc(outcome.kind)}</div>
      <h3>${esc(outcome.title)}</h3>
      ${primaryCard && !(outcome.title || '').includes(primaryCard.code) ? `<div class="small mt-6"><strong>${esc(primaryCard.code)}</strong> — ${esc(primaryCard.description)}</div>` : ''}
      <div class="small mt-6">${esc(outcome.reason || '')}${outcome.confidence ? ' (score ' + esc(outcome.confidence) + ')' : ''}</div>
      ${general ? `<div class="small mt-6">General guidance – not a diagnosis for this exact vehicle.</div>` : ''}
      ${vehicleLine ? `<div class="small mt-6">${esc(vehicleLine)}</div>` : ''}
      ${catalogWorkflowNotice(analysis)}
      ${(outcome.warnings || []).length ? `<div class="notice mt-8">${(outcome.warnings || []).map((w) => esc(w)).join(' ')}</div>` : ''}
      ${causes.length ? `<div class="mt-8"><strong>Top causes</strong><ul class="top-causes">${causes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    </div>
    ${evidence.length ? resultDetails('Evidence used', `<ul class="evidence-list">${evidence.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
    ${resultDetails('Repair instructions — ' + esc(outcome.instructionTitle || outcome.title), `<ol class="checks diy-list">${list(outcome.instructions)}</ol>`)}
    ${rebuildHtml}
    ${(outcome.firstChecks || []).length ? resultDetails('First checks', `<ol class="checks">${list(outcome.firstChecks)}</ol>`) : ''}
    ${(outcome.likelyParts || []).length ? resultDetails('Likely parts / paths', `<ol class="checks">${list(outcome.likelyParts)}</ol>`) : ''}
    ${relatedJobs ? resultDetails('Related jobs for this diagnosis only', relatedJobs) : ''}
    ${otherCodes ? resultDetails('Other codes in this case', `<div class="cards">${otherCodes}</div>`) : ''}
    ${primaryCard ? resultDetails('Tests and fixes', renderStructuredGuidance(primaryCard.code, primaryCard)) : ''}
    ${relatedSymptoms ? resultDetails('Related symptom repairs', relatedSymptoms) : ''}
    ${resultDetails('Disclaimers', `<ol class="checks">${list(analysis.disclaimers)}</ol>`)}
  `);
  showEl('resultsCard');
  if(typeof showTab === 'function') showTab('results', { scroll:false });
  bindSymptomButtons('results');
  showStatus('Diagnosis ready: ' + outcome.title, 'ok');
}


function stopCaptureMedia(){
  if(mediaRecorder){
    try{
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      if(mediaRecorder.state === 'recording') mediaRecorder.stop();
    }catch(_){ /* ignore */ }
    mediaRecorder = null;
    mediaChunks = [];
  }
  if(typeof stopCamera === 'function'){
    try{ stopCamera(); }catch(_){ /* preview nodes may be absent in tests */ }
  }
  state.audioBlob = null;
}

async function resetScannerSession(){
  if(window.ATDDBluetooth && typeof window.ATDDBluetooth.resetSession === 'function'){
    await window.ATDDBluetooth.resetSession();
  }
  if(window.ATDDIphoneScanner && typeof window.ATDDIphoneScanner.resetSession === 'function'){
    await window.ATDDIphoneScanner.resetSession();
  }
}

function openNewScanDialog(){
  const dialog = byId('newScanDialog');
  const box = byId('chkDeleteSavedHistory');
  if(box) box.checked = false;
  if(!dialog){
    const ok = confirm('Start a new scan / new vehicle? This clears the current codes, readings, diagnosis, symptoms, notes, and selected vehicle. Saved vehicles and history are kept.');
    if(ok) confirmNewScan({ deleteSaved: false });
    return;
  }
  if(typeof dialog.showModal === 'function'){
    if(!dialog.open) dialog.showModal();
  } else {
    dialog.hidden = false;
  }
}

function closeNewScanDialog(){
  const dialog = byId('newScanDialog');
  if(!dialog) return;
  if(typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.hidden = true;
}

async function confirmNewScan(options){
  const checked = !!(byId('chkDeleteSavedHistory') && byId('chkDeleteSavedHistory').checked);
  const deleteSaved = options && Object.prototype.hasOwnProperty.call(options, 'deleteSaved')
    ? !!options.deleteSaved
    : checked;
  closeNewScanDialog();
  stopCaptureMedia();
  const Reset = window.ATDDSessionReset;
  if(!Reset || typeof Reset.clearCurrentSession !== 'function'){
    showStatus('Could not reset the current scan.', 'warn');
    return;
  }
  Reset.clearCurrentSession({
    storage: window.localStorage,
    deleteSaved,
    byId,
    state,
    symptomCount: symptoms.length
  });
  await resetScannerSession();
  if(typeof refreshVehicleFilters === 'function') refreshVehicleFilters(true);
  if(typeof renderVehicleSearch === 'function') renderVehicleSearch();
  if(typeof fillSymptomFilters === 'function') fillSymptomFilters();
  if(typeof renderSymptomSearch === 'function') renderSymptomSearch();
  const vehicleCard = byId('vehicleSearchCard');
  if(vehicleCard && typeof vehicleCard.scrollIntoView === 'function'){
    vehicleCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if(typeof showTab === 'function') showTab('scan');
  showStatus(deleteSaved
    ? 'Started a new scan. Current data and saved vehicles/history were deleted.'
    : 'Started a new scan. Current data was cleared. Saved vehicles and history were kept.',
    'ok');
}

function bindNewScanButtons(){
  ['btnNewScanTop','btnNewScanVehicle','btnNewScanResults'].forEach((id) => {
    const btn = byId(id);
    if(btn) btn.onclick = openNewScanDialog;
  });
  const cancel = byId('btnNewScanCancel');
  if(cancel) cancel.onclick = (e) => { e.preventDefault(); closeNewScanDialog(); };
  const form = byId('newScanForm');
  if(form) form.addEventListener('submit', (e) => { e.preventDefault(); confirmNewScan(); });
  const dialog = byId('newScanDialog');
  if(dialog){
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeNewScanDialog(); });
  }
}

function bindEvents(){
  initTabs();
  if(byId('btnLookup')) byId('btnLookup').onclick = quickLookup;
  if(byId('btnLookupTop')) byId('btnLookupTop').onclick = () => { showEl('listenPanel'); const btn = byId('btnAudioRecord'); if(btn) btn.focus(); };
  if(byId('btnSearchDtc')) byId('btnSearchDtc').onclick = searchLocalDb;
  if(byId('btnClearCodes')) byId('btnClearCodes').onclick = () => { byId('codes').value = ''; html('codeResults',''); showStatus(''); };
  if(byId('btnRunDiagnosis')) byId('btnRunDiagnosis').onclick = runDiagnosis;
  if(byId('btnRunDiagnosisTop')) byId('btnRunDiagnosisTop').onclick = runDiagnosis;
  const rebuildBtn = byId('btnRebuildTop');
  if(rebuildBtn) rebuildBtn.onclick = () => { showEl('codes'); const field = byId('codes'); if(field){ field.focus(); } };
  if(window.ATDDBluetooth && typeof window.ATDDBluetooth.bind === 'function') window.ATDDBluetooth.bind();
  bindNewScanButtons();
  const jobsBtn = byId('btnJobsTop');
  if(jobsBtn) jobsBtn.onclick = () => { showEl('lookPanel'); const btn = byId('btnStartCamera'); if(btn) btn.focus(); };
  const computerBtn = byId('btnComputerTop');
  if(computerBtn) computerBtn.onclick = () => showEl('computerCard');
  const rebuildDiag = byId('btnRebuildDiagnosis');
  if(rebuildDiag) rebuildDiag.onclick = startRebuildDiagnosis;
  if(byId('btnSaveCase')) byId('btnSaveCase').onclick = saveCase;
  if(byId('btnSaveCaseTop')) byId('btnSaveCaseTop').onclick = saveCase;
  if(byId('btnLoadCase')) byId('btnLoadCase').onclick = loadCase;
  if(byId('btnClearCase')) byId('btnClearCase').onclick = clearCase;
  if(byId('btnExport')) byId('btnExport').onclick = exportReport;
  if(byId('btnExportTop')) byId('btnExportTop').onclick = exportReport;
  document.querySelectorAll('[data-code]').forEach((chip) => {
    chip.addEventListener('click', () => useExampleCode(chip.getAttribute('data-code')));
  });
  const codesField = byId('codes');
  if(codesField){
    codesField.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        runDiagnosis();
      }
    });
  }
  byId('btnAudioUpload').onclick = () => byId('audioFile').click();
  byId('audioFile').onchange = async (e) => { const file = e.target.files[0]; if(file) await handleAudioFile(file); };
  byId('btnPhotoUpload').onclick = () => byId('photoFile').click();
  byId('photoFile').onchange = async (e) => { const file = e.target.files[0]; if(file) await drawImageFileToCanvas(file); };
  byId('btnVideoUpload').onclick = () => byId('videoFile').click();
  byId('videoFile').onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    stopCamera();
    const video = byId('videoPreview');
    video.srcObject = null;
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration || 0);
    };
    video.onseeked = () => captureFrame();
  };
  byId('btnStartCamera').onclick = startCamera;
  byId('btnStopCamera').onclick = stopCamera;
  byId('btnCaptureFrame').onclick = captureFrame;
  byId('btnAudioRecord').onclick = toggleAudioRecord;
  ['fluidType','fluidLevel','fluidColor','fluidSmell','fluidCapacity','fluidNotes'].forEach(id => {
    const el = byId(id);
    if(el) el.addEventListener('input', fluidData);
    if(el) el.addEventListener('change', fluidData);
  });
  byId('dbQuery').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); searchLocalDb(); } });
  const solutionQuery = byId('solutionQuery');
  if(solutionQuery){
    solutionQuery.addEventListener('input', () => renderAllSolutions(solutionQuery.value));
    solutionQuery.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); renderAllSolutions(solutionQuery.value); } });
  }
  const jobQuery = byId('jobQuery');
  if(jobQuery){
    jobQuery.addEventListener('input', () => renderCommonJobs(jobQuery.value));
    jobQuery.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); renderCommonJobs(jobQuery.value); } });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-job]');
    if(!a) return;
    e.preventDefault();
    openJob(a.getAttribute('data-job'));
  });
}

function openJob(id){
  if(byId('jobQuery')) byId('jobQuery').value = '';
  renderCommonJobs('');
  showEl('jobsCard');
  const node = byId('job-' + id);
  if(node){
    node.open = true;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function howtoHubPack(){
  return (typeof window !== 'undefined' && window.HOWTO_HUB_DATA) || (typeof globalThis !== 'undefined' && globalThis.HOWTO_HUB_DATA) || null;
}

function renderHowtoHub(categoryId){
  const pack = howtoHubPack();
  const catBox = byId('howtoHubCats');
  const artBox = byId('howtoHubArticles');
  if(!pack || !catBox || !artBox) return;
  const cats = pack.categories || [];
  if(!cats.length){
    artBox.innerHTML = '<div class="small">How-to hub content is not loaded.</div>';
    return;
  }
  const selected = cats.find((c) => c.id === categoryId) || cats[0];
  catBox.innerHTML = cats.map((cat) => (
    `<button type="button" class="chip${cat.id === selected.id ? ' is-active' : ''}" data-howto-cat="${esc(cat.id)}">${esc(cat.title)}</button>`
  )).join('');
  artBox.innerHTML = `<div class="small">${esc(selected.blurb || '')}</div>` + (selected.articles || []).map((article) => `
    <details class="playbook" id="howto-${esc(article.id)}">
      <summary>${esc(article.title)}</summary>
      <div class="small mt-8">${esc(article.summary || '')}</div>
      ${article.steps && article.steps.length ? `<ol class="checks diy-list mt-8">${article.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : ''}
      ${article.links && article.links.length ? `<div class="chip-row mt-8">${article.links.map((link) => {
        const kind = link.kind || 'tab';
        const target = link.target || '';
        const label = link.label || target;
        if(kind === 'code') return `<button type="button" class="chip" data-howto-code="${esc(target)}">${esc(label)}</button>`;
        if(kind === 'job') return `<button type="button" class="chip" data-howto-job="${esc(target)}">${esc(label)}</button>`;
        if(kind === 'scroll') return `<button type="button" class="chip" data-howto-scroll="${esc(target)}">${esc(label)}</button>`;
        return `<button type="button" class="chip" data-howto-tab="${esc(target)}">${esc(label)}</button>`;
      }).join('')}</div>` : ''}
    </details>
  `).join('');
}

function wireHowtoHub(){
  const card = byId('howtoHubCard');
  if(!card || card.getAttribute('data-wired') === '1') return;
  card.setAttribute('data-wired', '1');
  card.addEventListener('click', (e) => {
    const catBtn = e.target.closest && e.target.closest('[data-howto-cat]');
    if(catBtn){
      e.preventDefault();
      renderHowtoHub(catBtn.getAttribute('data-howto-cat'));
      return;
    }
    const codeBtn = e.target.closest && e.target.closest('[data-howto-code]');
    if(codeBtn){
      e.preventDefault();
      const code = codeBtn.getAttribute('data-howto-code');
      if(typeof useExampleCode === 'function') useExampleCode(code);
      else if(byId('codes')){
        byId('codes').value = code;
        showTab('scan');
        showEl('lookupCard');
      }
      return;
    }
    const jobBtn = e.target.closest && e.target.closest('[data-howto-job]');
    if(jobBtn){
      e.preventDefault();
      openJob(jobBtn.getAttribute('data-howto-job'));
      return;
    }
    const tabBtn = e.target.closest && e.target.closest('[data-howto-tab]');
    if(tabBtn){
      e.preventDefault();
      showTab(tabBtn.getAttribute('data-howto-tab'));
      return;
    }
    const scrollBtn = e.target.closest && e.target.closest('[data-howto-scroll]');
    if(scrollBtn){
      e.preventDefault();
      const id = scrollBtn.getAttribute('data-howto-scroll');
      if(id === 'jobsCard' || id === 'howtoHubCard') showTab('more');
      else if(id === 'bluetoothCard' || id === 'scanReadoutCard') showTab('scan');
      showEl(id);
      const node = byId(id);
      if(node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  renderHowtoHub('scanners');
}

function renderCommonJobs(filter){
  const box = byId('commonJobs');
  if(!box || typeof DiagEngine === 'undefined' || !DiagEngine.listCommonJobs) return;
  const q = String(filter != null ? filter : (byId('jobQuery') && byId('jobQuery').value) || '').trim().toLowerCase();
  const jobs = DiagEngine.listCommonJobs().filter((job) => {
    if(!q) return true;
    const hay = (job.title + ' ' + (job.keywords || []).join(' ') + ' ' + (job.steps || []).join(' ')).toLowerCase();
    return hay.includes(q);
  });
  if(!jobs.length){
    box.innerHTML = '<div class="small">No job matches that search. Try starter, brakes, oil, or axle.</div>';
    return;
  }
  box.innerHTML = jobs.map((job) => `
    <details class="playbook" id="job-${esc(job.id)}"${q ? ' open' : ''}>
      <summary>${esc(job.title)}</summary>
      ${job.time ? `<div class="small mt-8"><strong>Typical time:</strong> ${esc(job.time)}</div>` : ''}
      ${job.tools && job.tools.length ? `<div class="small mt-8"><strong>Tools:</strong> ${esc(job.tools.join(', '))}</div>` : ''}
      ${job.parts && job.parts.length ? `<div class="small mt-8"><strong>Parts:</strong> ${esc(job.parts.join(', '))}</div>` : ''}
      ${job.warnings && job.warnings.length ? `<div class="notice mt-8">${job.warnings.map((w) => esc(w)).join(' ')}</div>` : ''}
      <ol class="checks diy-list mt-8">${(job.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
    </details>
  `).join('');
}

function renderRebuildGuide(){
  const box = byId('rebuildStages');
  const summary = byId('rebuildSummary');
  if(!box || typeof DiagEngine === 'undefined' || !DiagEngine.engineRebuildGuide) return;
  const guide = DiagEngine.engineRebuildGuide();
  if(summary) summary.textContent = guide.summary || summary.textContent;
  box.innerHTML = (guide.warnings && guide.warnings.length ? `<div class="notice">${guide.warnings.map((w) => esc(w)).join(' ')}</div>` : '') +
    (guide.stages || []).map((stage, idx) => `
    <details class="playbook"${idx === 0 ? ' open' : ''}>
      <summary>${esc(stage.title)}</summary>
      <ol class="checks diy-list">${(stage.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
    </details>
  `).join('');
}

function renderAllSolutions(filter){
  const box = byId('allSolutions');
  if(!box || typeof DiagEngine === 'undefined' || !DiagEngine.listRepairPlaybooks) return;
  const q = String(filter != null ? filter : (byId('solutionQuery') && byId('solutionQuery').value) || '').trim().toLowerCase();
  const plans = DiagEngine.listRepairPlaybooks().filter((plan) => {
    if(!q) return true;
    const hay = (plan.labels.join(' ') + ' ' + (plan.diySteps || []).join(' ')).toLowerCase();
    return hay.includes(q);
  });
  if(!plans.length){
    box.innerHTML = '<div class="small">No playbook matches that search. Try a code like P0442 or a word like MAF.</div>';
    return;
  }
  box.innerHTML = plans.map(plan => `
    <details class="playbook">
      <summary>${esc(plan.labels.join(', '))}</summary>
      <ol class="checks diy-list">${(plan.diySteps || []).map(step => `<li>${esc(step)}</li>`).join('')}</ol>
    </details>
  `).join('');
}

function fillSelect(id, values, blankLabel, selected){
  const sel = byId(id);
  if(!sel) return;
  const current = selected != null ? selected : sel.value;
  sel.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = blankLabel;
  sel.appendChild(blank);
  values.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    sel.appendChild(opt);
  });
  if(current && values.includes(current)) sel.value = current;
}

function refreshVehicleFilters(resetMake){
  const cat = catalog();
  if(!cat) return;
  const type = value('vehicleTypeFilter');
  const typeSel = byId('vehicleTypeFilter');
  if(typeSel && typeSel.options.length <= 1){
    typeSel.innerHTML = '<option value="">All types</option>' + cat.types().map((t) => `<option value="${esc(t)}">${esc(cat.typeLabel(t))}</option>`).join('');
  }
  const makes = cat.makes(type);
  if(resetMake && byId('vehicleMakeFilter')) byId('vehicleMakeFilter').value = '';
  fillSelect('vehicleMakeFilter', makes, 'All makes');
  const years = cat.years(type, value('vehicleMakeFilter'));
  fillSelect('vehicleYearFilter', years.map(String), 'Any year');
}

function renderVehicleSearch(){
  const cat = catalog();
  const box = byId('vehicleSearchResults');
  const stats = byId('vehicleSearchStats');
  if(!cat || !box) return;
  const filters = {
    type: value('vehicleTypeFilter'),
    make: value('vehicleMakeFilter'),
    year: value('vehicleYearFilter'),
    query: value('vehicleQuery')
  };
  const matches = cat.search(filters);
  const counts = cat.data().counts || {};
  if(stats){
    stats.textContent = matches.length + ' shown · ' + (counts.entries || matches.length) + ' index entries · ' + (counts.cdi_profiles_represented || 0) + ' CDI pinout profiles · near-matches flagged, not merged';
  }
  const limit = 40;
  const shown = matches.slice(0, limit);
  if(!shown.length){
    box.innerHTML = '<div class="small">No index entry matches that search.</div>';
    return;
  }
  box.innerHTML = shown.map((entry) => {
    const selected = state.selectedVehicle && state.selectedVehicle.id === entry.id;
    const badges = [];
    if(entry.workflow === 'generic_automotive') badges.push('<span class="badge generic">Generic automotive</span>');
    if(entry.has_cdi_pinout){
      const pinouts = cat.pinoutsFor(entry);
      pinouts.forEach((profile) => {
        const b = cat.badge(profile);
        if(b) badges.push(`<span class="badge ${esc(b.tone)}">${esc(b.label)}</span>`);
      });
    } else if(entry.workflow === 'index_only'){
      badges.push('<span class="badge reference">In index · no CDI pinout filed</span>');
    }
    if(entry.near_matches && entry.near_matches.length){
      badges.push('<span class="badge">Near-match flagged</span>');
    }
    return `<button type="button" class="vehicle-result${selected ? ' is-selected' : ''}" data-vehicle-id="${esc(entry.id)}" role="option" aria-selected="${selected ? 'true' : 'false'}">
      ${esc(cat.entryLabel(entry) || entry.display_name)}
      <span class="meta">${esc(cat.typeLabel(entry.type))}${entry.cdi_system ? ' · ' + esc(entry.cdi_system) : ''}</span>
      <span class="meta">${badges.join(' ')}</span>
    </button>`;
  }).join('') + (matches.length > limit ? `<div class="small">Showing ${limit} of ${matches.length}. Narrow the search to see the rest.</div>` : '');
  box.querySelectorAll('[data-vehicle-id]').forEach((btn) => {
    btn.onclick = () => selectVehicle(btn.getAttribute('data-vehicle-id'));
  });
}

function selectVehicle(id){
  const cat = catalog();
  if(!cat) return;
  const entry = cat.get(id);
  if(!entry) return;
  state.selectedVehicle = entry;
  if(byId('year') && entry.year) byId('year').value = String(entry.year);
  else if(byId('year') && entry.year_start && entry.year_start === entry.year_end) byId('year').value = String(entry.year_start);
  if(byId('make')) byId('make').value = entry.make || '';
  if(byId('model')) byId('model').value = entry.model || '';
  renderSelectedVehicle();
  renderCdiPinout();
  renderVehicleSearch();
  if(typeof renderSymptomSearch === 'function') renderSymptomSearch();
}

function clearSelectedVehicle(){
  state.selectedVehicle = null;
  const panel = byId('selectedVehiclePanel');
  const pin = byId('cdiPinoutView');
  if(panel){ panel.hidden = true; panel.innerHTML = ''; }
  if(pin){ pin.hidden = true; pin.innerHTML = ''; }
  if(byId('vehicleSearchResults')) renderVehicleSearch();
  if(typeof renderSymptomSearch === 'function') renderSymptomSearch();
}

function renderSelectedVehicle(){
  const panel = byId('selectedVehiclePanel');
  const cat = catalog();
  const entry = state.selectedVehicle;
  if(!panel || !cat || !entry){
    if(panel){ panel.hidden = true; panel.innerHTML = ''; }
    return;
  }
  panel.hidden = false;
  const near = (entry.near_matches || []).map((n) => `<div class="near-match">Not merged: ${esc(n.label)} — ${esc(n.reason)}</div>`).join('');
  let workflow = '';
  if(entry.workflow === 'generic_automotive'){
    workflow = '<p class="small">Use Diagnose, Listen, Look, and Code as usual. Guides and jobs stay generic automotive. <button type="button" class="chip" id="btnBrowseAutoSymptoms">Browse automotive symptoms</button></p>';
  } else if(entry.has_cdi_pinout){
    workflow = '<p class="small">CDI ignition pinout is shown below. It is not an OBD code and is not mixed into a DTC diagnosis. <button type="button" class="chip" id="btnBrowsePowerSymptoms">Browse powersports symptoms (including CDI / stator)</button></p>';
  } else {
    workflow = '<p class="small">No CDI pinout is filed for this vehicle. Generic automotive DTC and job content may not apply. <button type="button" class="chip" id="btnBrowsePowerSymptoms">Browse powersports symptoms</button></p>';
  }
  panel.innerHTML = `
    <div class="notice">
      <strong>Selected:</strong> ${esc(cat.entryLabel(entry) || entry.display_name)}
      <div class="small mt-6">${esc(cat.typeLabel(entry.type))}${entry.cdi_system ? ' · ' + esc(entry.cdi_system) : ''}</div>
      ${workflow}
      <div class="row mt-8"><button type="button" class="secondary" id="btnClearSelectedVehicle">Clear selected vehicle</button></div>
      ${near}
    </div>
  `;
  const clearBtn = byId('btnClearSelectedVehicle');
  if(clearBtn) clearBtn.onclick = clearSelectedVehicle;
  const browseAuto = byId('btnBrowseAutoSymptoms');
  const browsePower = byId('btnBrowsePowerSymptoms');
  const openBrowse = () => {
    renderSymptomSearch();
    const card = byId('symptomRepairCard');
    if(card) showEl('symptomRepairCard');
    if(card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if(browseAuto) browseAuto.onclick = openBrowse;
  if(browsePower) browsePower.onclick = openBrowse;
}

function renderCdiPinout(){
  const box = byId('cdiPinoutView');
  const cat = catalog();
  const entry = state.selectedVehicle;
  if(!box || !cat) return;
  // Only show pinouts from a selected CDI-backed vehicle. Never from an OBD code.
  const pinouts = entry && entry.has_cdi_pinout ? cat.pinoutsFor(entry) : [];
  if(!pinouts.length){
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  box.innerHTML = pinouts.map((profile) => {
    const badge = cat.badge(profile);
    const unverified = badge && (badge.tone === 'unverified' || badge.tone === 'simulated' || badge.tone === 'reference');
    const slots = (profile.slots || []).map((slot) => `
      <tr>
        <td>${esc(slot.pin)}</td>
        <td>${esc(slot.label)}</td>
        <td>${esc(slot.role)}</td>
        <td>${esc((slot.colors || []).join(', '))}</td>
        <td>${esc(slot.volt)}</td>
        <td>${esc(slot.desc)}</td>
      </tr>
    `).join('');
    const caution = unverified
      ? '<div class="notice mt-8">These electrical values are <strong>not verified / not available for action</strong>. Do not copy them as an approved repair specification.</div>'
      : '<div class="small mt-8">Possible checks from a cited source, not a definite repair. Confirm against a primary service manual before you work on the machine.</div>';
    return `
      <div class="code-card">
        <h3>CDI ignition pinout — ${esc(profile.name)}</h3>
        ${badge ? `<span class="badge ${esc(badge.tone)}">${esc(badge.label)}</span>` : ''}
        <span class="badge">${esc(profile.system || '')}</span>
        <span class="badge">${esc(profile.category || '')}</span>
        <div class="pinout-source mt-8"><strong>Source:</strong> ${esc(profile.source || 'not available')}</div>
        ${caution}
        <div class="mt-10" style="overflow:auto">
          <table class="pinout-table">
            <thead><tr><th>Pin</th><th>Label</th><th>Role</th><th>Colors</th><th>Volt</th><th>Description</th></tr></thead>
            <tbody>${slots}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function initVehicleSearch(){
  const cat = catalog();
  if(!cat || !byId('vehicleSearchCard')) return;
  refreshVehicleFilters();
  renderVehicleSearch();
  const typeSel = byId('vehicleTypeFilter');
  const makeSel = byId('vehicleMakeFilter');
  const yearSel = byId('vehicleYearFilter');
  const query = byId('vehicleQuery');
  if(typeSel) typeSel.onchange = () => { refreshVehicleFilters(true); renderVehicleSearch(); };
  if(makeSel) makeSel.onchange = () => { refreshVehicleFilters(false); renderVehicleSearch(); };
  if(yearSel) yearSel.onchange = renderVehicleSearch;
  if(query) query.oninput = renderVehicleSearch;
}


async function init(){
  fillYears();
  renderSymptoms();
  restoreLegalAcceptance();
  bindEvents();
  initVehicleSearch();
  initSymptomRepair();
  text('appVersion', 'v' + APP_VERSION);
  text('footerVersion', 'v' + APP_VERSION);
  await loadDb();
  if(typeof DiagEngine === 'undefined'){
    html('results', 'Diagnostics engine failed to load. Confirm diagnosticsEngine.js is next to index.html.');
    return;
  }
  if(!state.dtcDb.length){
    html('dbStats', '<div class="stat"><strong>0</strong><div class="small">DTC database missing — data/dtc-db.js did not load</div></div>');
    html('results', 'The bundled DTC database did not load. Confirm data/dtc-db.js defines window.DTC_DB_DATA.');
    return;
  }
  loadStats();
  if(window.ATD_DESKTOP){
    const status = byId('computerStatus');
    if(status) status.textContent = 'This is already the computer copy. Same diagnose-first camera/mic flow as the phone page.';
  }
  // Browse libraries stay collapsed — diagnosis pulls only what is needed.
  document.querySelectorAll('details.extra, details.collapsible').forEach((el) => { el.open = false; });
  wireHowtoHub();
  const howtoHubCard = byId('howtoHubCard');
  if(howtoHubCard){
    howtoHubCard.addEventListener('toggle', () => { if(howtoHubCard.open) renderHowtoHub(); });
  }
  const jobsCard = byId('jobsCard');
  if(jobsCard){
    jobsCard.addEventListener('toggle', () => { if(jobsCard.open) renderCommonJobs(); });
  }
  const rebuildCard = byId('rebuildCard');
  if(rebuildCard){
    rebuildCard.addEventListener('toggle', () => { if(rebuildCard.open) renderRebuildGuide(); });
  }
  const solutionsWrap = byId('solutionsCardWrap');
  if(solutionsWrap){
    solutionsWrap.addEventListener('toggle', () => { if(solutionsWrap.open) renderAllSolutions(); });
  }
}

init();
