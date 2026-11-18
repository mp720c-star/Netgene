import { authReady, unlockCodeConfigured, sessionConfigured, hasPlatformAccess } from "@/lib/session";
import { hasFaceIdCredential } from "@/lib/webauthn";
import { getIdentity } from "../../../../../cursor/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const identity = await getIdentity(req);
  const cursorSignedIn = identity.verified && identity.kind === "person";
  const unlocked = await hasPlatformAccess(req);
  const faceIdRegistered = await hasFaceIdCredential().catch(() => false);
  return Response.json(
    {
      ok: true,
      authReady: authReady() || cursorSignedIn,
      unlockCodeConfigured: unlockCodeConfigured(),
      sessionConfigured: sessionConfigured(),
      faceIdRegistered,
      unlocked,
      viewerName: cursorSignedIn ? identity.name : "",
      platform: "AI Project Platform",
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
