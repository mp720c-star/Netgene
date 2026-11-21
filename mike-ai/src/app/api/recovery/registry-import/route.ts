import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  checkRegistryImportBearer,
  registryImportConfigured,
} from "@/lib/registry-import-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

function privateDirs() {
  const root = path.join(process.cwd(), "recovery", "private");
  return {
    inbox: path.join(root, "inbox"),
    accepted: path.join(root, "accepted"),
  };
}

function ensureDirs() {
  const { inbox, accepted } = privateDirs();
  fs.mkdirSync(inbox, { recursive: true });
  fs.mkdirSync(accepted, { recursive: true });
  return { inbox, accepted };
}

/**
 * Append-only authenticated import of authoritative registry JSON.
 * Does not overwrite prior inbox/accepted files. Does not publish contents.
 */
export async function POST(req: Request) {
  if (!registryImportConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "registry_import_token_not_configured",
        message:
          "Set REGISTRY_IMPORT_TOKEN (min 24 chars) in secrets, then retry.",
      },
      { status: 503 },
    );
  }
  if (!checkRegistryImportBearer(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) {
    return Response.json({ ok: false, error: "empty_body" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(buf.toString("utf8"));
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Count records without returning private fields
  let count = 0;
  if (Array.isArray(parsed)) count = parsed.length;
  else if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    for (const k of ["records", "projects", "items", "data", "memories"]) {
      if (Array.isArray(o[k])) {
        count = (o[k] as unknown[]).length;
        break;
      }
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const name = `registry_import_${stamp}.json`;
  const { inbox } = ensureDirs();
  const dest = path.join(inbox, name);
  // Append-only: refuse if somehow exists
  if (fs.existsSync(dest)) {
    return Response.json({ ok: false, error: "file_exists" }, { status: 409 });
  }
  fs.writeFileSync(dest, buf);
  const sha256 = createHash("sha256").update(buf).digest("hex");

  return Response.json({
    ok: true,
    storedAs: `mike-ai/recovery/private/inbox/${name}`,
    bytes: buf.length,
    sha256,
    recordCountObserved: count,
    note: "Private append-only inbox. Contents are not returned and must not be committed to git.",
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/recovery/registry-import",
    method: "POST",
    auth: "Authorization: Bearer <REGISTRY_IMPORT_TOKEN>",
    configured: registryImportConfigured(),
    maxBytes: MAX_BYTES,
    appendOnly: true,
    privateStorage: "mike-ai/recovery/private/inbox/",
  });
}
