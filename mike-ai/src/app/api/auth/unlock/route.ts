import {
  authReady,
  checkUnlockCode,
  createSessionToken,
  sessionCookieHeader,
} from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  if (!authReady()) {
    return Response.json(
      {
        error: "auth_not_configured",
        message: "PLATFORM_UNLOCK_CODE and SESSION_SECRET must be set.",
      },
      { status: 503 },
    );
  }
  const limited = rateLimit({
    key: `unlock:${clientIp(req)}`,
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) return limited;
  let body: { code?: string };
  try {
    body = (await req.json()) as { code?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.code || !checkUnlockCode(body.code)) {
    return Response.json({ error: "invalid_code" }, { status: 401 });
  }
  const token = createSessionToken("passcode");
  return Response.json(
    { ok: true, method: "passcode" },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
