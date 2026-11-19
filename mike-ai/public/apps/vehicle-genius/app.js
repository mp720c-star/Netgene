(() => {
  "use strict";

  const vehicles = window.VG_VEHICLES;
  const HISTORY_KEY = "vehicleGeniusHistory";

  const rules = [
    {
      keywords: ["won't start", "does not start", "no power", "no crank"],
      diagnosis: "Check battery voltage, ignition switch, starter circuit, and fuel supply."
    },
    {
      keywords: ["squeak", "squeaking", "noise", "rattle"],
      diagnosis: "Check belts, pulleys, brake pads, and suspension bushings."
    },
    {
      keywords: ["overheating", "hot engine", "engine too hot", "temp high"],
      diagnosis: "Check coolant level, radiator, fans, water pump, and thermostat."
    },
    {
      keywords: ["misfire", "stumbles", "rough running", "rough idle"],
      diagnosis: "Check spark plugs, ignition coils, injectors, and vacuum leaks."
    },
    {
      keywords: ["lights not working", "headlights", "taillights", "blinker"],
      diagnosis: "Check fuses, bulbs, ground points, and wiring connectors."
    },
    {
      keywords: ["brake", "soft pedal", "spongy", "brake noise"],
      diagnosis: "Check brake fluid, pads, rotors, calipers, and for air in lines."
    },
    {
      keywords: ["transmission", "gear slipping", "clutch", "won't shift"],
      diagnosis: "Check transmission fluid level/condition, clutch adjustment, and linkages."
    },
    {
      keywords: ["won't idle", "stalls", "dies"],
      diagnosis: "Check idle air control, throttle body cleanliness, and fuel pressure."
    }
  ];

  const typeSelect = document.getElementById("vehicleType");
  const brandSelect = document.getElementById("vehicleBrand");
  const modelSelect = document.getElementById("vehicleModel");
  const symptomEl = document.getElementById("symptom");
  const resultsEl = document.getElementById("results");
  const historyEl = document.getElementById("history");
  const videoEl = document.getElementById("videoElement");
  let cameraStream = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function diagnose(symptom) {
    const text = symptom.toLowerCase();
    const matches = [];
    for (const rule of rules) {
      if (rule.keywords.some((kw) => text.includes(kw))) {
        matches.push(rule.diagnosis);
      }
    }
    return matches.length
      ? [...new Set(matches)].join(" | ")
      : "No diagnosis found. Try more specific symptoms (e.g. won't start, overheating, misfire).";
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function renderHistory() {
    const history = loadHistory();
    if (!history.length) {
      historyEl.textContent = "No previous diagnoses.";
      return;
    }
    historyEl.innerHTML = history
      .map(
        (h) => `<div class="history-item">
      <strong>${escapeHtml(h.date)}</strong><br>
      <span>Vehicle:</span> ${escapeHtml(h.vehicle)}<br>
      <span>Symptom:</span> ${escapeHtml(h.symptom)}<br>
      <span>Diagnosis:</span> ${escapeHtml(h.diagnosis)}
    </div>`
      )
      .join("");
  }

  function saveHistory(vehicle, symptom, diagnosis) {
    const history = loadHistory();
    history.unshift({
      vehicle,
      symptom,
      diagnosis,
      date: new Date().toLocaleString()
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    renderHistory();
  }

  function fillOptions(select, values, placeholder) {
    select.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    select.appendChild(ph);
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  typeSelect.addEventListener("change", () => {
    const type = typeSelect.value;
    fillOptions(brandSelect, type && vehicles[type] ? Object.keys(vehicles[type]) : [], "-- Select Brand --");
    fillOptions(modelSelect, [], "-- Select Model --");
  });

  brandSelect.addEventListener("change", () => {
    const type = typeSelect.value;
    const brand = brandSelect.value;
    const models =
      type && brand && vehicles[type] && vehicles[type][brand] ? vehicles[type][brand] : [];
    fillOptions(modelSelect, models, "-- Select Model --");
  });

  document.getElementById("voiceBtn").addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      symptomEl.value = event.results[0][0].transcript;
    };
    recognition.onerror = () => {
      alert("Voice recognition failed. Type the symptom instead.");
    };
    recognition.start();
  });

  document.getElementById("diagnoseBtn").addEventListener("click", () => {
    const type = typeSelect.value;
    const brand = brandSelect.value;
    const model = modelSelect.value;
    const vehicle =
      type && brand && model ? `${type} — ${brand} ${model}` : "Unknown Vehicle";
    const symptom = symptomEl.value.trim();
    if (!symptom) {
      alert("Please enter a symptom.");
      return;
    }
    const result = diagnose(symptom);
    resultsEl.textContent = result;
    saveHistory(vehicle, symptom, result);
  });

  document.getElementById("startCameraBtn").addEventListener("click", async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera API not available in this browser.");
      return;
    }
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
      }
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      videoEl.srcObject = cameraStream;
    } catch (err) {
      alert("Camera access denied: " + (err && err.message ? err.message : err));
    }
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  fillOptions(brandSelect, [], "-- Select Brand --");
  fillOptions(modelSelect, [], "-- Select Model --");
  renderHistory();
})();
