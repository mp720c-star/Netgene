import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { contentDisposition, previewDecision } from "../src/lib/file-preview.ts";
import { decodeStoredBytes, sha256Hex } from "../src/lib/byte-content.ts";
import { planPreserveMerge } from "../src/lib/reconcile.ts";

const text = Buffer.from("windows-to-iphone\n", "utf8");
const textSum = sha256Hex(text);

assert.equal(previewDecision("text/plain", "note.txt").kind, "text");
assert.equal(previewDecision("application/octet-stream", "scan.pdf").kind, "pdf");
assert.equal(previewDecision("application/octet-stream", "scan.pdf").mime, "application/pdf");
assert.equal(previewDecision("text/html", "page.html").kind, "none");
assert.equal(previewDecision("image/svg+xml", "icon.svg").kind, "none");
assert.equal(previewDecision("application/zip", "kit.zip").kind, "none");

const disposition = contentDisposition("Quarterly “notes”.txt", "inline");
assert.match(disposition, /^inline; filename="/);
assert.match(disposition, /filename\*=UTF-8''/);

const decoded = decodeStoredBytes(`\\x${text.toString("hex")}`, textSum);
assert.ok(decoded);
assert.equal(sha256Hex(decoded), textSum);
const asBuffer = decodeStoredBytes(text, textSum);
assert.ok(asBuffer);
assert.equal(sha256Hex(asBuffer), textSum);

const original = {
  id: "seed-ai-platform",
  name: "AI Project Platform",
  summary: "original summary",
  status: "active",
  tags: ["board-seed"],
};
const plan = planPreserveMerge({
  projects: [original],
  files: [
    {
      id: "file-original",
      project_id: original.id,
      name: "note.txt",
      checksum_sha256: textSum,
    },
  ],
  incomingProjects: [
    {
      id: original.id,
      name: original.name,
      summary: "replacement that must not overwrite",
      status: "archived",
      tags: ["board-seed"],
      revision: 450,
      history: [{ revision: 449, note: "prior" }],
      files: [
        {
          name: "metadata-only.txt",
          checksum_sha256: textSum,
        },
      ],
    },
    {
      id: "archived-extra",
      name: "Archived extra record",
      summary: "kept beside the original",
      status: "archived",
      tags: ["archive"],
    },
  ],
  incomingFiles: [
    {
      id: "file-original",
      projectId: original.id,
      name: "note.txt",
      mimeType: "text/plain",
      contentBase64: Buffer.from("different bytes").toString("base64"),
    },
  ],
});

assert.equal(plan.insertProjects.length, 1);
assert.equal(plan.insertProjects[0].id, "archived-extra");
assert.equal(plan.insertProjects[0].status, "archived");
assert.ok(plan.keptProjectIds.includes(original.id));
assert.equal(
  plan.insertProjects.some((project) => project.id === original.id),
  false,
);
assert.equal(plan.insertFiles.length, 1);
assert.notEqual(plan.insertFiles[0].id, "file-original");
assert.equal(plan.insertFiles[0].preservedFromId, "file-original");
assert.ok(plan.appendRevisions.some((row) => row.projectId === original.id));
assert.ok(plan.appendRevisions.some((row) => row.body.includes("metadata-only.txt")));
assert.equal(
  plan.refusedFiles.some((file) => file.reason === "checksum_mismatch"),
  false,
);

const mismatch = planPreserveMerge({
  projects: [original],
  files: [],
  incomingFiles: [
    {
      projectId: original.id,
      name: "bad.txt",
      checksum: "00",
      contentBase64: text.toString("base64"),
    },
  ],
});
assert.equal(mismatch.insertFiles.length, 0);
assert.equal(mismatch.refusedFiles[0].reason, "checksum_mismatch");

const same = planPreserveMerge({
  projects: [original],
  files: [
    {
      id: "file-original",
      project_id: original.id,
      name: "note.txt",
      checksum_sha256: textSum,
    },
  ],
  incomingProjects: [
    {
      id: original.id,
      name: original.name,
      summary: original.summary,
      status: original.status,
      tags: ["board-seed"],
    },
  ],
  incomingFiles: [
    {
      id: "file-original",
      projectId: original.id,
      name: "note.txt",
      contentBase64: text.toString("base64"),
    },
  ],
});
assert.equal(same.insertProjects.length, 0);
assert.equal(same.insertFiles.length, 0);
assert.equal(
  same.appendRevisions.filter((row) => row.body.includes("replacement")).length,
  0,
);

console.log(
  JSON.stringify({
    ok: true,
    textSha256: textSum,
    disposition,
    preservedFileId: plan.insertFiles[0].id,
    revisionCount: plan.appendRevisions.length,
    emptySha256: createHash("sha256").update("").digest("hex"),
  }),
);
