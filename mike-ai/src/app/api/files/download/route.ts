import { requireUnlocked } from "@/lib/session";
import { getFileContent } from "@/lib/platform-store";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const locked = requireUnlocked(req);
  if (locked) return locked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id_required" }, { status: 400 });
  const item = await getFileContent(id);
  if (!item) return Response.json({ error: "not_found" }, { status: 404 });

  const digest = createHash("sha256").update(item.content).digest("hex");
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

  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(item.row.name)}`;
  return new Response(new Uint8Array(item.content), {
    status: 200,
    headers: {
      "Content-Type": item.row.mime_type || "application/octet-stream",
      "Content-Length": String(item.content.length),
      "Content-Disposition": disposition,
      "X-Checksum-SHA256": digest,
      "Cache-Control": "no-store",
    },
  });
}
