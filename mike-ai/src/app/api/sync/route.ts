import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { runCloudSync, syncStatusReport } from "@/lib/cloud/sync";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const locked = requireUnlocked(req);
  if (locked) return locked;
  return Response.json({ ok: true, providers: await syncStatusReport() });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
  if (locked) return locked;
  let fileId: string | undefined;
  try {
    const body = (await req.json()) as { fileId?: string };
    fileId = body.fileId;
  } catch {
    fileId = undefined;
  }
  const result = await runCloudSync(fileId);
  return Response.json({ ok: true, ...result, providers: await syncStatusReport() });
}
