// ===================== RAVIN LOOKUP — DIAGNOSTIC RULES =====================
const rules = [
  { keywords: ["won't start", "does not start", "no power", "no crank"], diagnosis: "Check battery, ignition switch, starter, and fuel supply." },
  { keywords: ["squeak", "squeaking", "noise", "rattle"], diagnosis: "Check belts, pulleys, brake pads, and suspension components." },
  { keywords: ["overheating", "hot engine", "engine too hot", "temp high"], diagnosis: "Check coolant level, radiator, fans, and thermostat." },
  { keywords: ["engine misfire", "stumbles", "rough running", "rough idle"], diagnosis: "Check spark plugs, ignition coils, and fuel system." },
  { keywords: ["lights not working", "headlights", "taillights", "no lights"], diagnosis: "Check fuses, bulbs, and wiring connections." },
  { keywords: ["brake failure", "soft brakes", "brake noise", "spongy pedal"], diagnosis: "Check brake fluid, pads, rotors, and calipers." },
  { keywords: ["transmission", "gear slipping", "clutch problem", "won't shift"], diagnosis: "Check transmission fluid, clutch system, and linkages." },
  { keywords: ["no spark", "weak spark", "cdi", "ignition"], diagnosis: "Check CDI/ignition module, kill switch, coil, and plug wire." },
  { keywords: ["stall", "dies", "cuts out", "bog"], diagnosis: "Check fuel delivery, air filter, idle mixture, and ignition timing." },
  { keywords: ["hard start", "hard to start", "long crank"], diagnosis: "Check battery health, spark plug condition, fuel pressure, and choke/enrichment." }
];

function diagnose(symptom) {
  const text = String(symptom || "").toLowerCase();
  const matches = [];
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        matches.push(rule.diagnosis);
        break;
      }
    }
  }
  return matches.length > 0
    ? matches.join(" | ")
    : "No diagnosis found. Please describe more specifically.";
}

function saveHistory(vehicle, symptom, diagnosis) {
  const history = JSON.parse(localStorage.getItem("ravinLookupHistory") || "[]");
  history.unshift({
    vehicle,
    symptom,
    diagnosis,
    date: new Date().toLocaleString()
  });
  localStorage.setItem("ravinLookupHistory", JSON.stringify(history.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("ravinLookupHistory") || "[]");
  const historyDiv = document.getElementById("history");
  if (!historyDiv) return;
  if (history.length === 0) {
    historyDiv.innerHTML = "No previous diagnoses.";
    return;
  }
  historyDiv.innerHTML = history
    .map(
      (h) => `<div class="history-item">
      <b>${escapeHtml(h.date)}</b><br>
      <b>Vehicle:</b> ${escapeHtml(h.vehicle)}<br>
      <b>Symptom:</b> ${escapeHtml(h.symptom)}<br>
      <b>Diagnosis:</b> ${escapeHtml(h.diagnosis)}
    </div>`
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function populateBrands(type) {
  const brandSelect = document.getElementById("vehicleBrand");
  const modelSelect = document.getElementById("vehicleModel");
  brandSelect.innerHTML = '<option value="">-- Select Brand --</option>';
  modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
  if (!vehicles[type]) return;
  Object.keys(vehicles[type])
    .sort()
    .forEach((brand) => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });
}

function populateModels(type, brand) {
  const modelSelect = document.getElementById("vehicleModel");
  modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
  if (!vehicles[type] || !vehicles[type][brand]) return;
  vehicles[type][brand].forEach((model) => {
    const opt = document.createElement("option");
    opt.value = model;
    opt.textContent = model;
    modelSelect.appendChild(opt);
  });
}

function initRavinLookup() {
  const typeSelect = document.getElementById("vehicleType");
  const brandSelect = document.getElementById("vehicleBrand");
  const modelSelect = document.getElementById("vehicleModel");

  // Optional lock to one of the three category installers via query/?lock= or Electron env
  const params = new URLSearchParams(window.location.search);
  const lockedType =
    params.get("lock") ||
    (window.ravinConfig && window.ravinConfig.lockType) ||
    "";

  if (lockedType && vehicles[lockedType]) {
    typeSelect.value = lockedType;
    typeSelect.disabled = true;
    populateBrands(lockedType);
    const title = document.getElementById("appTitle");
    if (title) title.textContent = `Ravin Lookup — ${lockedType}`;
  }

  typeSelect.addEventListener("change", function () {
    populateBrands(this.value);
  });

  brandSelect.addEventListener("change", function () {
    populateModels(typeSelect.value, this.value);
  });

  document.getElementById("voiceBtn").addEventListener("click", () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported on this device.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      document.getElementById("symptom").value = event.results[0][0].transcript;
    };
    recognition.start();
  });

  document.getElementById("diagnoseBtn").addEventListener("click", () => {
    const type = typeSelect.value;
    const brand = brandSelect.value;
    const model = modelSelect.value;
    const vehicle =
      type && brand && model ? `${type} - ${brand} ${model}` : "Unknown Vehicle";
    const symptom = document.getElementById("symptom").value.trim();
    if (!symptom) {
      alert("Please enter a symptom.");
      return;
    }
    if (!type || !brand || !model) {
      alert("Please select vehicle type, brand, and model.");
      return;
    }
    const result = diagnose(symptom);
    document.getElementById("results").innerText = result;
    saveHistory(vehicle, symptom, result);
  });

  document.getElementById("startCameraBtn").addEventListener("click", () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera is not available in this environment.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        document.getElementById("videoElement").srcObject = stream;
      })
      .catch((err) => {
        alert("Camera access denied: " + err);
      });
  });

  // Search/filter box for model lookup
  const searchInput = document.getElementById("modelSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const q = this.value.trim().toLowerCase();
      const type = typeSelect.value;
      const brand = brandSelect.value;
      if (!type || !brand || !vehicles[type] || !vehicles[type][brand]) return;
      const models = vehicles[type][brand].filter((m) =>
        m.toLowerCase().includes(q)
      );
      modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
      models.forEach((model) => {
        const opt = document.createElement("option");
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
      });
    });
  }

  renderHistory();
}

document.addEventListener("DOMContentLoaded", initRavinLookup);

if (typeof module !== "undefined" && module.exports) {
  module.exports = { diagnose, rules };
}
