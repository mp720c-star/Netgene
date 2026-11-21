import { requireUnlocked, createSessionToken, sessionCookieHeader } from "@/lib/session";
import { verifyRegistration } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = await requireUnlocked(req);
  if (locked) return locked;
  const limited = rateLimit({
    key: `webauthn-reg:${clientIp(req)}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  const body = (await req.json()) as {
    response?: unknown;
    challenge?: string;
  };
  if (!body.response || !body.challenge) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await verifyRegistration({
    req,
    response: body.response,
    expectedChallenge: body.challenge,
  });
  if (!result.ok) return Response.json(result, { status: 400 });
  const token = createSessionToken("webauthn");
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
