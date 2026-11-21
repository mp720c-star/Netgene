import { hasModelCredentials } from "@/lib/origin";
import { authReady, unlockCodeConfigured, sessionConfigured } from "@/lib/session";
import { cloudConfigStatus } from "@/lib/cloud/status";
import { databaseInfo } from "@/lib/db";
import { hasFaceIdCredential } from "@/lib/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const faceIdRegistered = await hasFaceIdCredential().catch(() => false);
  const db = databaseInfo();
  return Response.json({
    ok: true,
    platform: "AI Project Platform",
    database: db.mode,
    supabase: db.supabase,
    supabaseHost: db.supabaseHost,
    authReady: authReady(),
    unlockCodeConfigured: unlockCodeConfigured(),
    sessionConfigured: sessionConfigured(),
    faceIdRegistered,
    modelCredentials: hasModelCredentials(),
    chatgptMemoryRequiresUnlock: true,
    cloud: cloudConfigStatus(),
  });
}
