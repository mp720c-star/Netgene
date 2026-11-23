import { requireUnlocked } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { listMemory, listProjectsNewestFirst, addMemory } from "@/lib/platform-store";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_TITLE = 200;
const MAX_BODY = 8_000;
const MAX_LIST = 20;

/**
 * ChatGPT-oriented memory export/import for an unlocked platform session.
 * Requires the same Face ID / password unlock cookie as the rest of the app —
 * no shared Bearer token that would grant database access without unlock.
 */
export async function GET(req: Request) {
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  const limited = rateLimit({
    key: `chatgpt-memory-session:get:${clientIp(req)}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  const projects = await listProjectsNewestFirst();
  const memory = await listMemory(MAX_LIST);
  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    instruction:
      "Use this local memory as authoritative context for Michael Paine before answering. Prefer newest entries. Do not invent project status.",
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      summary: (p.summary || "").slice(0, 500),
      status: p.status,
      updatedAt: p.updated_at,
    })),
    memory: memory.map((m) => ({
      id: m.id,
      projectId: m.project_id,
      kind: m.kind,
      title: (m.title || "").slice(0, MAX_TITLE),
      body: (m.body || "").slice(0, MAX_BODY),
      source: m.source,
      updatedAt: m.updated_at,
    })),
  });
}

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  const limited = rateLimit({
    key: `chatgpt-memory-session:post:${clientIp(req)}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  let body: {
    title?: string;
    body?: string;
    kind?: string;
    projectId?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const title = body.title?.trim() || "";
  const text = body.body?.trim() || "";
  if (!title || !text) {
    return Response.json({ error: "title_and_body_required" }, { status: 400 });
  }
  if (title.length > MAX_TITLE || text.length > MAX_BODY) {
    return Response.json(
      {
        error: "payload_too_large",
        message: `Title max ${MAX_TITLE} chars; body max ${MAX_BODY} chars.`,
      },
      { status: 413 },
    );
  }
  const entry = await addMemory({
    title,
    body: text,
    kind: body.kind || "chatgpt",
    projectId: body.projectId ?? null,
    source: "chatgpt",
  });
  return Response.json({
    ok: true,
    entry: {
      id: entry.id,
      title: entry.title,
      updated_at: entry.updated_at,
    },
  });
}
