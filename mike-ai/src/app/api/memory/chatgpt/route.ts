import { timingSafeEqual, createHash } from "node:crypto";
import { listMemory, listProjectsNewestFirst, addMemory } from "@/lib/platform-store";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_TITLE = 200;
const MAX_BODY = 8_000;
const MAX_LIST = 20;

function authorize(req: Request): Response | null {
  const expected = process.env.CHATGPT_MEMORY_TOKEN?.trim();
  if (!expected) {
    return Response.json(
      {
        error: "chatgpt_memory_not_configured",
        message: "Set CHATGPT_MEMORY_TOKEN to enable the ChatGPT Actions memory API.",
      },
      { status: 503 },
    );
  }
  if (expected.length < 32) {
    return Response.json(
      {
        error: "chatgpt_memory_token_too_weak",
        message: "CHATGPT_MEMORY_TOKEN must be at least 32 characters.",
      },
      { status: 503 },
    );
  }
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token.length !== expected.length) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (!timingSafeEqual(a, b)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function tokenBucketKey(req: Request): string {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const digest = createHash("sha256").update(token || clientIp(req)).digest("hex").slice(0, 16);
  return `chatgpt-memory:${digest}:${clientIp(req)}`;
}

/** ChatGPT Custom GPT / Actions: read local project + memory context before answering. */
export async function GET(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  const limited = rateLimit({
    key: `${tokenBucketKey(req)}:get`,
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
  const denied = authorize(req);
  if (denied) return denied;
  const limited = rateLimit({
    key: `${tokenBucketKey(req)}:post`,
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
