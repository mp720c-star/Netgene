import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { addMemory, listMemory, listProjectsNewestFirst } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const locked = requireUnlocked(req);
  if (locked) return locked;
  const limit = Number(new URL(req.url).searchParams.get("limit") || 40);
  return Response.json({ ok: true, entries: await listMemory(Math.min(Math.max(limit, 1), 200)) });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
  if (locked) return locked;
  const body = (await req.json()) as {
    title?: string;
    body?: string;
    kind?: string;
    projectId?: string;
  };
  if (!body.title?.trim() || !body.body?.trim()) {
    return Response.json({ error: "title_and_body_required" }, { status: 400 });
  }
  const entry = await addMemory({
    title: body.title,
    body: body.body,
    kind: body.kind,
    projectId: body.projectId,
    source: "platform",
  });
  return Response.json({ ok: true, entry });
}
