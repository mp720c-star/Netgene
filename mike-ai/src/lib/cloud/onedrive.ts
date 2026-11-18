/**
 * Real OneDrive / Microsoft Graph sync via OAuth refresh token.
 */

export function oneDriveConfigured(): boolean {
  return Boolean(
    process.env.ONEDRIVE_CLIENT_ID?.trim() &&
      process.env.ONEDRIVE_CLIENT_SECRET?.trim() &&
      process.env.ONEDRIVE_REFRESH_TOKEN?.trim(),
  );
}

async function accessToken(): Promise<string> {
  if (!oneDriveConfigured()) throw new Error("onedrive_not_configured");
  const body = new URLSearchParams({
    client_id: process.env.ONEDRIVE_CLIENT_ID!.trim(),
    client_secret: process.env.ONEDRIVE_CLIENT_SECRET!.trim(),
    refresh_token: process.env.ONEDRIVE_REFRESH_TOKEN!.trim(),
    grant_type: "refresh_token",
    scope: "offline_access Files.ReadWrite.All User.Read",
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`onedrive_token_${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("onedrive_token_missing");
  return json.access_token;
}

export async function oneDrivePing(): Promise<{ ok: true; displayName?: string } | { ok: false; error: string }> {
  try {
    const token = await accessToken();
    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: `graph_me_${res.status}` };
    const json = (await res.json()) as { displayName?: string };
    return { ok: true, displayName: json.displayName };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "onedrive_error" };
  }
}

export async function oneDriveUpload(params: {
  path: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const token = await accessToken();
    const encoded = params.path
      .split("/")
      .filter(Boolean)
      .map((p) => encodeURIComponent(p))
      .join("/");
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encoded}:/content`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": params.mimeType,
        },
        body: new Uint8Array(params.bytes),
      },
    );
    if (!res.ok) return { ok: false, error: `onedrive_upload_${res.status}` };
    const json = (await res.json()) as { id?: string };
    if (!json.id) return { ok: false, error: "onedrive_upload_no_id" };
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "onedrive_error" };
  }
}
