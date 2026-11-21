import { requireUnlocked } from "@/lib/session";
import { getFileContent } from "@/lib/platform-store";
import { contentDisposition, previewDecision } from "@/lib/file-preview";
import { sha256Hex } from "@/lib/byte-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const item = await getFileContent(id);
  if (!item) return Response.json({ error: "not_found" }, { status: 404 });

  const digest = sha256Hex(item.content);
  if (digest !== item.row.checksum_sha256) {
    return Response.json(
      {
        error: "checksum_mismatch",
        message: "Stored bytes do not match recorded SHA-256. Download refused.",
        expected: item.row.checksum_sha256,
        actual: digest,
      },
      { status: 409 },
    );
  }

  const decision = previewDecision(item.row.mime_type, item.row.name);
  const inlineRequested = url.searchParams.get("inline") === "1";
  const mode = inlineRequested && decision.kind !== "none" ? "inline" : "attachment";
  const mime = mode === "inline" ? decision.mime : item.row.mime_type || "application/octet-stream";

  return new Response(new Uint8Array(item.content), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(item.content.length),
      "Content-Disposition": contentDisposition(item.row.name, mode),
      "X-Checksum-SHA256": digest,
      "X-Preview-Kind": decision.kind,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
