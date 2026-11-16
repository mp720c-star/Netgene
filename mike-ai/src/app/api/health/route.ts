import { hasModelCredentials } from "@/lib/origin";
import { authReady, unlockCodeConfigured, sessionConfigured } from "@/lib/session";
import { cloudConfigStatus } from "@/lib/cloud/status";
import { usingHostedPostgres } from "@/lib/db";
import { hasFaceIdCredential } from "@/lib/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const faceIdRegistered = await hasFaceIdCredential().catch(() => false);
  return Response.json({
    ok: true,
    platform: "AI Project Platform",
    database: usingHostedPostgres() ? "postgres" : "pglite-local",
    authReady: authReady(),
    unlockCodeConfigured: unlockCodeConfigured(),
    sessionConfigured: sessionConfigured(),
    faceIdRegistered,
    modelCredentials: hasModelCredentials(),
    chatgptMemoryRequiresUnlock: true,
    cloud: cloudConfigStatus(),
  });
}
