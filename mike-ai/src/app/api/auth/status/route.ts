import { authReady, unlockCodeConfigured, sessionConfigured, readSessionCookie, verifySessionToken } from "@/lib/session";
import { hasFaceIdCredential } from "@/lib/webauthn";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = readSessionCookie(req.headers.get("cookie"));
  const unlocked = verifySessionToken(token);
  const faceIdRegistered = await hasFaceIdCredential().catch(() => false);
  return Response.json({
    ok: true,
    authReady: authReady(),
    unlockCodeConfigured: unlockCodeConfigured(),
    sessionConfigured: sessionConfigured(),
    faceIdRegistered,
    unlocked,
    platform: "AI Project Platform",
  });
}
