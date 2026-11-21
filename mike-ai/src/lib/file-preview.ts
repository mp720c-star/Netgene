export type PreviewKind = "image" | "pdf" | "text" | "audio" | "video" | "none";

const BY_MIME: Record<string, PreviewKind> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "text/plain": "text",
  "text/markdown": "text",
  "text/csv": "text",
  "application/json": "text",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "video/mp4": "video",
  "video/quicktime": "video",
};

const BY_EXT: Record<string, { mime: string; kind: PreviewKind }> = {
  png: { mime: "image/png", kind: "image" },
  jpg: { mime: "image/jpeg", kind: "image" },
  jpeg: { mime: "image/jpeg", kind: "image" },
  gif: { mime: "image/gif", kind: "image" },
  webp: { mime: "image/webp", kind: "image" },
  pdf: { mime: "application/pdf", kind: "pdf" },
  txt: { mime: "text/plain", kind: "text" },
  md: { mime: "text/markdown", kind: "text" },
  csv: { mime: "text/csv", kind: "text" },
  json: { mime: "application/json", kind: "text" },
  mp3: { mime: "audio/mpeg", kind: "audio" },
  m4a: { mime: "audio/mp4", kind: "audio" },
  wav: { mime: "audio/wav", kind: "audio" },
  mp4: { mime: "video/mp4", kind: "video" },
  mov: { mime: "video/quicktime", kind: "video" },
};

/** Types that must never render inside the home-screen shell. */
const UNSAFE = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
]);

function extensionOf(name: string): string {
  const base = name.trim().toLowerCase().split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1);
}

export function previewDecision(mime: string | null | undefined, name: string): {
  kind: PreviewKind;
  mime: string;
} {
  const raw = (mime || "").split(";")[0].trim().toLowerCase();
  const ext = BY_EXT[extensionOf(name)];
  if (UNSAFE.has(raw) || ["html", "htm", "svg", "js", "mjs"].includes(extensionOf(name))) {
    return { kind: "none", mime: raw || "application/octet-stream" };
  }
  if (raw && BY_MIME[raw]) return { kind: BY_MIME[raw], mime: raw };
  if ((!raw || raw === "application/octet-stream") && ext) return ext;
  return { kind: "none", mime: raw || ext?.mime || "application/octet-stream" };
}

/** Both filename forms. iOS Home Screen ignores filename* alone. */
export function contentDisposition(name: string, mode: "inline" | "attachment"): string {
  const cleaned = (name || "download").replace(/[\r\n"]/g, "_").slice(0, 180);
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_") || "download";
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}
