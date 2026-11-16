import { authenticationOptions, hasFaceIdCredential } from "@/lib/webauthn";
import { authReady } from "@/lib/session";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  if (!authReady()) {
    return Response.json({ error: "auth_not_configured" }, { status: 503 });
  }
  if (!(await hasFaceIdCredential())) {
    return Response.json(
      { error: "no_faceid", message: "Register Face ID after unlocking with your password." },
      { status: 404 },
    );
  }
  return Response.json({ ok: true, options: await authenticationOptions(req) });
}
