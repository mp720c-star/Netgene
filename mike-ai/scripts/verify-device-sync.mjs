/**
 * Two clients, one local server. Does not read DATABASE_URL and does not call Supabase.
 * Windows uploads, iPhone opens the bytes, iPhone uploads, Windows sees both.
 * A peer push that tries to replace an existing file or project is kept beside the original.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const base = process.env.VERIFY_BASE;
if (!base) throw new Error("VERIFY_BASE is required");

const windows = { "User-Agent": "Windows-sync-check", Origin: base };
const iphone = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
  Origin: base,
};

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function json(path, options = {}, headers = windows) {
  const res = await fetch(`${base}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const body = await res.json();
  return { res, body };
}

const projects = await json("/api/projects");
assert.equal(projects.res.status, 200, JSON.stringify(projects.body));
assert.equal(projects.body.source, "pglite-local");
const platform = projects.body.projects.find((project) => project.id === "seed-ai-platform");
assert.ok(platform, "seed-ai-platform missing");
const originalSummary = platform.summary;

const windowsBytes = Buffer.from("windows-to-iphone\n", "utf8");
const form = new FormData();
form.set("projectId", platform.id);
form.set("file", new File([windowsBytes], "windows-note.txt", { type: "text/plain" }));
const uploaded = await fetch(`${base}/api/files`, { method: "POST", headers: windows, body: form });
const uploadedJson = await uploaded.json();
assert.equal(uploaded.status, 200, JSON.stringify(uploadedJson));
const windowsFile = uploadedJson.file;
assert.equal(windowsFile.checksum_sha256, sha256(windowsBytes));

const iphoneList = await json("/api/files", {}, iphone);
const seen = iphoneList.body.files.find((file) => file.id === windowsFile.id);
assert.ok(seen, "iPhone did not see the Windows file");

const opened = await fetch(
  `${base}/api/files/download?id=${encodeURIComponent(windowsFile.id)}&inline=1`,
  { headers: iphone },
);
const openedBytes = Buffer.from(await opened.arrayBuffer());
assert.equal(opened.status, 200);
assert.equal(opened.headers.get("x-preview-kind"), "text");
assert.match(opened.headers.get("content-disposition") || "", /^inline; filename="windows-note.txt"/);
assert.match(opened.headers.get("content-disposition") || "", /filename\*=UTF-8''/);
assert.equal(opened.headers.get("x-checksum-sha256"), windowsFile.checksum_sha256);
assert.equal(openedBytes.toString("utf8"), windowsBytes.toString("utf8"));

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const pngForm = new FormData();
pngForm.set("projectId", platform.id);
pngForm.set("file", new File([png], "pixel.png", { type: "image/png" }));
const pngUp = await fetch(`${base}/api/files`, { method: "POST", headers: iphone, body: pngForm });
const pngJson = await pngUp.json();
assert.equal(pngUp.status, 200, JSON.stringify(pngJson));
const pngOpen = await fetch(
  `${base}/api/files/download?id=${encodeURIComponent(pngJson.file.id)}&inline=1`,
  { headers: windows },
);
assert.equal(pngOpen.status, 200);
assert.equal(pngOpen.headers.get("content-type"), "image/png");
assert.match(pngOpen.headers.get("content-disposition") || "", /^inline;/);
assert.equal(Buffer.from(await pngOpen.arrayBuffer()).equals(png), true);

const zip = Buffer.from("not-a-real-zip");
const zipForm = new FormData();
zipForm.set("projectId", platform.id);
zipForm.set("file", new File([zip], "kit.bin", { type: "application/octet-stream" }));
const zipUp = await fetch(`${base}/api/files`, { method: "POST", headers: windows, body: zipForm });
const zipJson = await zipUp.json();
assert.equal(zipUp.status, 200, JSON.stringify(zipJson));
const zipOpen = await fetch(
  `${base}/api/files/download?id=${encodeURIComponent(zipJson.file.id)}&inline=1`,
  { headers: iphone },
);
assert.equal(zipOpen.status, 200);
assert.match(zipOpen.headers.get("content-disposition") || "", /^attachment; filename="kit.bin"/);
assert.equal(zipOpen.headers.get("x-preview-kind"), "none");
assert.equal(Buffer.from(await zipOpen.arrayBuffer()).equals(zip), true);

const iphoneBytes = Buffer.from("iphone-to-windows\n", "utf8");
const iphoneForm = new FormData();
iphoneForm.set("projectId", platform.id);
iphoneForm.set("file", new File([iphoneBytes], "iphone-note.txt", { type: "text/plain" }));
const iphoneUp = await fetch(`${base}/api/files`, { method: "POST", headers: iphone, body: iphoneForm });
const iphoneJson = await iphoneUp.json();
assert.equal(iphoneUp.status, 200, JSON.stringify(iphoneJson));

const windowsList = await json("/api/files?projectId=" + encodeURIComponent(platform.id), {}, windows);
const names = windowsList.body.files.map((file) => file.name);
assert.ok(names.includes("windows-note.txt"));
assert.ok(names.includes("iphone-note.txt"));
assert.ok(names.includes("pixel.png"));

const peer = await json(
  "/api/sync/peers",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projects: [
        {
          id: platform.id,
          name: platform.name,
          summary: "must-not-replace-original",
          status: "archived",
          tags: ["board-seed"],
          revision: 450,
          history: [{ revision: 449, note: "prior checkpoint" }],
        },
      ],
      files: [
        {
          id: windowsFile.id,
          projectId: platform.id,
          name: "windows-note.txt",
          mimeType: "text/plain",
          contentBase64: Buffer.from("replaced-bytes").toString("base64"),
        },
      ],
    }),
  },
  iphone,
);
assert.equal(peer.res.status, 200, JSON.stringify(peer.body));
assert.ok(peer.body.applied.insertedFiles >= 1);
assert.ok(peer.body.applied.preservedRevisions >= 1);
assert.equal(
  peer.body.snapshot.projects.find((project) => project.id === platform.id).summary,
  originalSummary,
);
assert.equal(
  peer.body.snapshot.projects.find((project) => project.id === platform.id).status,
  platform.status,
);

const still = await fetch(`${base}/api/files/download?id=${encodeURIComponent(windowsFile.id)}&inline=1`, {
  headers: windows,
});
assert.equal(Buffer.from(await still.arrayBuffer()).toString("utf8"), windowsBytes.toString("utf8"));

const preserved = peer.body.snapshot.files.filter(
  (file) => file.project_id === platform.id && file.name === "windows-note.txt" && file.id !== windowsFile.id,
);
assert.ok(preserved.length >= 1);
const preservedOpen = await fetch(
  `${base}/api/files/download?id=${encodeURIComponent(preserved[0].id)}`,
  { headers: iphone },
);
assert.equal(Buffer.from(await preservedOpen.arrayBuffer()).toString("utf8"), "replaced-bytes");

const home = await fetch(base, { headers: iphone });
const html = await home.text();
assert.equal(home.status, 200);
assert.match(html, /AI Project Platform/);
assert.doesNotMatch(html, /href="\/api\/files\/download/);

console.log(
  JSON.stringify({
    ok: true,
    source: projects.body.source,
    projectCount: projects.body.count,
    originalSummary,
    windowsFile: windowsFile.id,
    windowsSha256: windowsFile.checksum_sha256,
    iphoneFile: iphoneJson.file.id,
    preservedFile: preserved[0].id,
    applied: peer.body.applied,
  }),
);
