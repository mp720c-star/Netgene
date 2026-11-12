(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const canvas = $("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const dropZone = $("dropZone");
  const emptyState = $("emptyState");
  const cropOverlay = $("cropOverlay");
  const cropBox = $("cropBox");
  const fileInput = $("fileInput");
  const statusText = $("statusText");
  const metaText = $("metaText");
  const exportDialog = $("exportDialog");
  const exportFormat = $("exportFormat");
  const exportQuality = $("exportQuality");
  const qualityWrap = $("qualityWrap");

  const controls = {
    exposure: $("exposure"),
    contrast: $("contrast"),
    highlights: $("highlights"),
    shadows: $("shadows"),
    temperature: $("temperature"),
    tint: $("tint"),
    saturation: $("saturation"),
    vibrance: $("vibrance"),
    clarity: $("clarity"),
    soften: $("soften"),
    vignette: $("vignette"),
  };

  const valueLabels = {
    exposure: $("v-exposure"),
    contrast: $("v-contrast"),
    highlights: $("v-highlights"),
    shadows: $("v-shadows"),
    temperature: $("v-temperature"),
    tint: $("v-tint"),
    saturation: $("v-saturation"),
    vibrance: $("v-vibrance"),
    clarity: $("v-clarity"),
    soften: $("v-soften"),
    vignette: $("v-vignette"),
  };

  let source = null;
  let basePixels = null;
  let working = null;
  let compareMode = false;
  let aspect = "free";
  let rotation = 0;
  let flipH = false;
  let crop = null;
  let renderToken = 0;
  let drag = null;

  const buttons = [
    $("btnCompare"),
    $("btnReset"),
    $("btnExport"),
    $("btnRotate"),
    $("btnFlip"),
    $("btnApplyCrop"),
    ...document.querySelectorAll(".chip"),
  ];

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function enableUi(on) {
    Object.values(controls).forEach((el) => {
      el.disabled = !on;
    });
    buttons.forEach((el) => {
      el.disabled = !on;
    });
  }

  function readAdjustments() {
    return {
      exposure: Number(controls.exposure.value),
      contrast: Number(controls.contrast.value),
      highlights: Number(controls.highlights.value),
      shadows: Number(controls.shadows.value),
      temperature: Number(controls.temperature.value),
      tint: Number(controls.tint.value),
      saturation: Number(controls.saturation.value),
      vibrance: Number(controls.vibrance.value),
      clarity: Number(controls.clarity.value),
      soften: Number(controls.soften.value),
      vignette: Number(controls.vignette.value),
    };
  }

  function updateLabels() {
    const a = readAdjustments();
    Object.keys(valueLabels).forEach((k) => {
      valueLabels[k].textContent = String(a[k]);
    });
    $("v-quality").textContent = exportQuality.value;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function createOrientedCanvas(img, rot, flip) {
    const turns = ((rot % 360) + 360) % 360;
    const swap = turns === 90 || turns === 270;
    const w = swap ? img.height : img.width;
    const h = swap ? img.width : img.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cctx = c.getContext("2d");
    cctx.translate(w / 2, h / 2);
    cctx.rotate((turns * Math.PI) / 180);
    cctx.scale(flip ? -1 : 1, 1);
    cctx.drawImage(img, -img.width / 2, -img.height / 2);
    return c;
  }

  function rebuildBase() {
    if (!source) return;
    const oriented = createOrientedCanvas(source, rotation, flipH);
    let sx = 0;
    let sy = 0;
    let sw = oriented.width;
    let sh = oriented.height;

    if (crop) {
      sx = Math.round(crop.x);
      sy = Math.round(crop.y);
      sw = Math.round(crop.w);
      sh = Math.round(crop.h);
      sx = clamp(sx, 0, oriented.width - 1);
      sy = clamp(sy, 0, oriented.height - 1);
      sw = clamp(sw, 1, oriented.width - sx);
      sh = clamp(sh, 1, oriented.height - sy);
    }

    const maxEdge = 2200;
    const scale = Math.min(1, maxEdge / Math.max(sw, sh));
    const tw = Math.max(1, Math.round(sw * scale));
    const th = Math.max(1, Math.round(sh * scale));

    working = document.createElement("canvas");
    working.width = tw;
    working.height = th;
    const wctx = working.getContext("2d", { willReadFrequently: true });
    wctx.drawImage(oriented, sx, sy, sw, sh, 0, 0, tw, th);
    basePixels = wctx.getImageData(0, 0, tw, th);

    canvas.width = tw;
    canvas.height = th;
    canvas.hidden = false;
    emptyState.hidden = true;
    metaText.textContent = `${tw} × ${th}px`;
    initCropUi();
  }

  function softBlur(src, width, height, radius) {
    if (radius <= 0) return src;
    const r = Math.max(1, Math.round(radius));
    const tmp = new Float32Array(width * height * 4);
    const out = new Uint8ClampedArray(src.length);
    const pass = (input, output, horizontal) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rs = 0;
          let gs = 0;
          let bs = 0;
          let as = 0;
          let count = 0;
          for (let k = -r; k <= r; k++) {
            const xx = horizontal ? clamp(x + k, 0, width - 1) : x;
            const yy = horizontal ? y : clamp(y + k, 0, height - 1);
            const i = (yy * width + xx) * 4;
            rs += input[i];
            gs += input[i + 1];
            bs += input[i + 2];
            as += input[i + 3];
            count++;
          }
          const o = (y * width + x) * 4;
          output[o] = rs / count;
          output[o + 1] = gs / count;
          output[o + 2] = bs / count;
          output[o + 3] = as / count;
        }
      }
    };

    const mid = new Float32Array(width * height * 4);
    pass(src, mid, true);
    pass(mid, tmp, false);

    for (let i = 0; i < out.length; i++) out[i] = tmp[i];
    return out;
  }

  function applyPipeline(adj) {
    const { width, height, data } = basePixels;
    const out = new ImageData(width, height);
    const dest = out.data;
    const src = data;

    const exp = Math.pow(2, adj.exposure / 50);
    const contrast = adj.contrast / 100;
    const hi = adj.highlights / 100;
    const sh = adj.shadows / 100;
    const temp = adj.temperature / 100;
    const tint = adj.tint / 100;
    const sat = adj.saturation / 100;
    const vib = adj.vibrance / 100;
    const clarity = adj.clarity / 100;
    const vig = adj.vignette / 100;

    let softened = src;
    if (adj.soften > 0) {
      const radius = 1 + Math.round((adj.soften / 100) * 2);
      softened = softBlur(src, width, height, radius);
    }

    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let i = 0; i < src.length; i += 4) {
      let r = softened[i];
      let g = softened[i + 1];
      let b = softened[i + 2];
      const a = src[i + 3];

      if (adj.soften > 0) {
        const t = adj.soften / 100;
        r = src[i] * (1 - t * 0.65) + r * (t * 0.65);
        g = src[i + 1] * (1 - t * 0.65) + g * (t * 0.65);
        b = src[i + 2] * (1 - t * 0.65) + b * (t * 0.65);
      }

      r *= exp;
      g *= exp;
      b *= exp;

      r = (r - 128) * (1 + contrast) + 128;
      g = (g - 128) * (1 + contrast) + 128;
      b = (b - 128) * (1 + contrast) + 128;

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum > 140 && hi !== 0) {
        const k = ((lum - 140) / 115) * hi;
        r -= k * 40;
        g -= k * 40;
        b -= k * 40;
      }
      if (lum < 120 && sh !== 0) {
        const k = ((120 - lum) / 120) * sh;
        r += k * 45;
        g += k * 45;
        b += k * 45;
      }

      r += temp * 28;
      b -= temp * 28;
      g += tint * 22;
      r -= tint * 10;
      b -= tint * 10;

      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray + (r - gray) * (1 + sat);
      g = gray + (g - gray) * (1 + sat);
      b = gray + (b - gray) * (1 + sat);

      if (vib !== 0) {
        gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const maxc = Math.max(r, g, b);
        const minc = Math.min(r, g, b);
        const chroma = maxc - minc;
        const amount = vib * (1 - chroma / 255);
        r = gray + (r - gray) * (1 + amount);
        g = gray + (g - gray) * (1 + amount);
        b = gray + (b - gray) * (1 + amount);
      }

      if (clarity !== 0) {
        gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const boost = (gray - 128) * clarity * 0.35;
        r += boost;
        g += boost;
        b += boost;
      }

      if (vig > 0) {
        const px = (i / 4) % width;
        const py = Math.floor(i / 4 / width);
        const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxDist;
        const darken = Math.pow(d, 1.6) * vig * 0.85;
        r *= 1 - darken;
        g *= 1 - darken;
        b *= 1 - darken;
      }

      dest[i] = clamp(r, 0, 255);
      dest[i + 1] = clamp(g, 0, 255);
      dest[i + 2] = clamp(b, 0, 255);
      dest[i + 3] = a;
    }

    return out;
  }

  function render() {
    if (!basePixels) return;
    const token = ++renderToken;
    const adj = readAdjustments();
    updateLabels();

    const run = () => {
      if (token !== renderToken) return;
      if (compareMode) {
        ctx.putImageData(basePixels, 0, 0);
        setStatus("Original");
        return;
      }
      setStatus("Rendering…");
      const out = applyPipeline(adj);
      if (token !== renderToken) return;
      ctx.putImageData(out, 0, 0);
      setStatus("Ready");
    };

    if (adj.soften > 30) {
      setTimeout(run, 0);
    } else {
      requestAnimationFrame(run);
    }
  }

  function loadImage(img, label) {
    source = img;
    rotation = 0;
    flipH = false;
    crop = null;
    Object.values(controls).forEach((el) => {
      el.value = 0;
    });
    rebuildBase();
    enableUi(true);
    render();
    setStatus(`Loaded ${label}`);
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please choose an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      loadImage(img, file.name);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus("Could not read that image");
    };
    img.src = url;
  }

  async function loadFromUrl(path, label) {
    try {
      setStatus("Loading…");
      const res = await fetch(path);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);
      loadImage(img, label || path);
    } catch (err) {
      setStatus("Could not load sample image");
    }
  }

  function resetAdjustments() {
    Object.values(controls).forEach((el) => {
      el.value = 0;
    });
    crop = null;
    rotation = 0;
    flipH = false;
    rebuildBase();
    render();
    setStatus("Reset");
  }

  function initCropUi() {
    cropOverlay.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const stageRect = dropZone.getBoundingClientRect();
    const left = rect.left - stageRect.left;
    const top = rect.top - stageRect.top;
    cropBox.style.left = `${left + rect.width * 0.08}px`;
    cropBox.style.top = `${top + rect.height * 0.08}px`;
    cropBox.style.width = `${rect.width * 0.84}px`;
    cropBox.style.height = `${rect.height * 0.84}px`;
    enforceAspect();
  }

  function enforceAspect() {
    if (aspect === "free") return;
    const ratio = Number(aspect);
    const w = cropBox.offsetWidth;
    const h = w / ratio;
    cropBox.style.height = `${h}px`;
    const maxH = canvas.clientHeight;
    if (h > maxH * 0.92) {
      const nh = maxH * 0.84;
      cropBox.style.height = `${nh}px`;
      cropBox.style.width = `${nh * ratio}px`;
    }
  }

  function applyCropFromUi() {
    if (!working) return;
    const stageRect = dropZone.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const boxRect = cropBox.getBoundingClientRect();

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const x = (boxRect.left - canvasRect.left) * scaleX;
    const y = (boxRect.top - canvasRect.top) * scaleY;
    const w = boxRect.width * scaleX;
    const h = boxRect.height * scaleY;

    const oriented = createOrientedCanvas(source, rotation, flipH);
    let baseX = 0;
    let baseY = 0;
    let baseW = oriented.width;
    let baseH = oriented.height;
    if (crop) {
      baseX = crop.x;
      baseY = crop.y;
      baseW = crop.w;
      baseH = crop.h;
    }

    const scale = Math.min(1, 2200 / Math.max(baseW, baseH));
    crop = {
      x: baseX + x / scale,
      y: baseY + y / scale,
      w: w / scale,
      h: h / scale,
    };
    rebuildBase();
    render();
    setStatus("Crop applied");
  }

  // Events
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) loadFile(file);
  });

  $("btnSample").addEventListener("click", () => {
    loadFromUrl("forma-sample.png", "sample");
  });

  window.FormaEditor = { loadFromUrl, loadFile };

  ["dragenter", "dragover"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  Object.values(controls).forEach((el) => {
    el.addEventListener("input", render);
  });

  $("btnReset").addEventListener("click", resetAdjustments);

  const compareBtn = $("btnCompare");
  compareBtn.addEventListener("mousedown", () => {
    compareMode = true;
    render();
  });
  compareBtn.addEventListener("mouseup", () => {
    compareMode = false;
    render();
  });
  compareBtn.addEventListener("mouseleave", () => {
    if (compareMode) {
      compareMode = false;
      render();
    }
  });
  compareBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    compareMode = true;
    render();
  });
  compareBtn.addEventListener("touchend", () => {
    compareMode = false;
    render();
  });

  $("btnRotate").addEventListener("click", () => {
    rotation = (rotation + 90) % 360;
    crop = null;
    rebuildBase();
    render();
  });

  $("btnFlip").addEventListener("click", () => {
    flipH = !flipH;
    crop = null;
    rebuildBase();
    render();
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      aspect = chip.dataset.aspect;
      enforceAspect();
    });
  });

  $("btnApplyCrop").addEventListener("click", applyCropFromUi);

  $("btnExport").addEventListener("click", () => {
    exportDialog.showModal();
  });

  exportFormat.addEventListener("change", () => {
    qualityWrap.hidden = exportFormat.value !== "image/jpeg";
  });
  exportQuality.addEventListener("input", updateLabels);

  exportDialog.addEventListener("close", () => {
    if (exportDialog.returnValue !== "export" || !basePixels) return;
    const adj = readAdjustments();
    const out = applyPipeline(adj);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = out.width;
    exportCanvas.height = out.height;
    exportCanvas.getContext("2d").putImageData(out, 0, 0);
    const type = exportFormat.value;
    const quality = Number(exportQuality.value) / 100;
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        const ext = type === "image/png" ? "png" : "jpg";
        a.href = URL.createObjectURL(blob);
        a.download = `forma-edit.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus("Exported");
      },
      type,
      quality
    );
  });

  // Crop drag
  cropBox.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("handle")) return;
    const box = cropBox.getBoundingClientRect();
    drag = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    };
    e.preventDefault();
  });

  cropBox.querySelectorAll(".handle").forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      const box = cropBox.getBoundingClientRect();
      drag = {
        mode: handle.dataset.handle,
        startX: e.clientX,
        startY: e.clientY,
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      };
      e.preventDefault();
      e.stopPropagation();
    });
  });

  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    const stage = dropZone.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    let left = drag.left - stage.left;
    let top = drag.top - stage.top;
    let width = drag.width;
    let height = drag.height;
    const minSize = 40;

    if (drag.mode === "move") {
      left += dx;
      top += dy;
    } else {
      if (drag.mode.includes("e")) width = Math.max(minSize, drag.width + dx);
      if (drag.mode.includes("s")) height = Math.max(minSize, drag.height + dy);
      if (drag.mode.includes("w")) {
        width = Math.max(minSize, drag.width - dx);
        left = drag.left - stage.left + (drag.width - width);
      }
      if (drag.mode.includes("n")) {
        height = Math.max(minSize, drag.height - dy);
        top = drag.top - stage.top + (drag.height - height);
      }
      if (aspect !== "free") {
        const ratio = Number(aspect);
        height = width / ratio;
      }
    }

    const cLeft = canvasRect.left - stage.left;
    const cTop = canvasRect.top - stage.top;
    left = clamp(left, cLeft, cLeft + canvasRect.width - width);
    top = clamp(top, cTop, cTop + canvasRect.height - height);

    cropBox.style.left = `${left}px`;
    cropBox.style.top = `${top}px`;
    cropBox.style.width = `${width}px`;
    cropBox.style.height = `${height}px`;
  });

  window.addEventListener("mouseup", () => {
    drag = null;
  });

  window.addEventListener("resize", () => {
    if (source) initCropUi();
  });

  enableUi(false);
  updateLabels();
  setStatus("Open a photo to begin");
})();
