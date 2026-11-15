import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { assertTrustedOrigin, hasModelCredentials } from "@/lib/origin";
import { recordUsage } from "@/lib/usage";

export const maxDuration = 30;

export async function POST(req: Request) {
  const originError = assertTrustedOrigin(req);
  if (originError) {
    recordUsage({ kind: "chat", ok: false, detail: "origin_rejected" });
    return originError;
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

  const { messages }: { messages: UIMessage[] } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    instructions:
      "You are Mike AI for the Netgene / AI platform test deployment. Be concise and practical. Do not invent project records that are not in context.",
    messages: await convertToModelMessages(messages),
  });

  recordUsage({ kind: "chat", ok: true, detail: "stream_started" });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
