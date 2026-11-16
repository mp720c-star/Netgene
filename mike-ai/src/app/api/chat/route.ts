import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { assertTrustedOrigin, hasModelCredentials } from "@/lib/origin";
import { requireUnlocked, readSessionCookie } from "@/lib/session";
import { recordUsage } from "@/lib/usage";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const maxDuration = 30;
export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_CHARS = 20_000;

export async function POST(req: Request) {
  const originError = assertTrustedOrigin(req);
  if (originError) {
    recordUsage({ kind: "chat", ok: false, detail: "origin_rejected" });
    return originError;
  }

  const locked = requireUnlocked(req);
  if (locked) {
    recordUsage({ kind: "chat", ok: false, detail: "locked" });
    return locked;
  }

  const session = readSessionCookie(req.headers.get("cookie")) || "anon";
  const limited = rateLimit({
    key: `chat:${session.slice(0, 24)}:${clientIp(req)}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    recordUsage({ kind: "chat", ok: false, detail: "rate_limited" });
    return limited;
  }

  if (!hasModelCredentials()) {
    recordUsage({ kind: "chat", ok: false, detail: "missing_model_credentials" });
    return Response.json(
      {
        error: "model_credentials_missing",
        message:
          "No OPENAI_API_KEY or AI_GATEWAY_API_KEY configured. Chat stays fail-closed until real credentials are added — no fake replies.",
      },
      { status: 503 },
    );
  }

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (messages.length === 0) {
    return Response.json({ error: "messages_required" }, { status: 400 });
  }
  const approxChars = JSON.stringify(messages).length;
  if (approxChars > MAX_CHARS) {
    return Response.json(
      { error: "payload_too_large", message: "Chat payload exceeds the size limit." },
      { status: 413 },
    );
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    instructions:
      "You are the AI Project Platform assistant for Michael Paine. Be concise and practical. Do not invent project records that are not in context.",
    messages: await convertToModelMessages(messages),
  });

  recordUsage({ kind: "chat", ok: true, detail: "stream_started" });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
