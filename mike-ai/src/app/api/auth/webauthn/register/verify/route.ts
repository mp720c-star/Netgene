import { requireUnlocked, createSessionToken, sessionCookieHeader } from "@/lib/session";
import { verifyRegistration } from "@/lib/webauthn";
import { assertTrustedOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originBlock = assertTrustedOrigin(req);
  if (originBlock) return originBlock;
  const locked = requireUnlocked(req);
  if (locked) return locked;
  const body = (await req.json()) as {
    id?: string;
    clientDataJSON?: string;
    publicKey?: string;
    transports?: string[];
    challenge?: string;
  };
  if (!body.id || !body.clientDataJSON || !body.publicKey || !body.challenge) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await verifyRegistration({
    id: body.id,
    clientDataJSON: body.clientDataJSON,
    publicKey: body.publicKey,
    transports: body.transports,
    challenge: body.challenge,
  });
  if (!result.ok) return Response.json(result, { status: 400 });
  const token = createSessionToken("webauthn");
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
