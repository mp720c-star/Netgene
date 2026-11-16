import { authReady, createSessionToken, sessionCookieHeader } from "@/lib/session";
import { verifyAuthentication } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  if (!authReady()) {
    return Response.json({ error: "auth_not_configured" }, { status: 503 });
  }
  const body = (await req.json()) as {
    id?: string;
    clientDataJSON?: string;
    authenticatorData?: string;
    signature?: string;
    challenge?: string;
  };
  if (
    !body.id ||
    !body.clientDataJSON ||
    !body.authenticatorData ||
    !body.signature ||
    !body.challenge
  ) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await verifyAuthentication({
    id: body.id,
    clientDataJSON: body.clientDataJSON,
    authenticatorData: body.authenticatorData,
    signature: body.signature,
    challenge: body.challenge,
  });
  if (!result.ok) return Response.json(result, { status: 401 });
  const token = createSessionToken("webauthn");
  return Response.json(
    { ok: true, method: "webauthn" },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
