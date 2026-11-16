import { authReady, createSessionToken, sessionCookieHeader } from "@/lib/session";
import { verifyAuthentication } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  if (!authReady()) {
    return Response.json({ error: "auth_not_configured" }, { status: 503 });
  }
  const limited = rateLimit({
    key: `webauthn-login:${clientIp(req)}`,
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) return limited;

  const body = (await req.json()) as {
    response?: unknown;
    challenge?: string;
  };
  if (!body.response || !body.challenge) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await verifyAuthentication({
    req,
    response: body.response,
    expectedChallenge: body.challenge,
  });
  if (!result.ok) return Response.json(result, { status: 401 });
  const token = createSessionToken("webauthn");
  return Response.json(
    { ok: true, method: "webauthn" },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
