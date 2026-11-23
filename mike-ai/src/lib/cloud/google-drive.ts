/**
 * Real Google Drive sync via OAuth refresh token + Drive API v3.
 * No-op mock is forbidden — callers must check configured() first.
 */

export function googleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim(),
  );
}

async function accessToken(): Promise<string> {
  if (!googleDriveConfigured()) {
    throw new Error("google_drive_not_configured");
  }
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!.trim(),
    client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!.trim(),
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN!.trim(),
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`google_token_${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("google_token_missing");
  return json.access_token;
}

export async function googleDrivePing(): Promise<{ ok: true; email?: string } | { ok: false; error: string }> {
  try {
    const token = await accessToken();
    const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: `drive_about_${res.status}` };
    const json = (await res.json()) as { user?: { emailAddress?: string } };
    return { ok: true, email: json.user?.emailAddress };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "google_drive_error" };
  }
}

export async function googleDriveUpload(params: {
  name: string;
  mimeType: string;
  bytes: Buffer;
  folderId?: string;
}): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  try {
    const token = await accessToken();
    const metadata: Record<string, unknown> = {
      name: params.name,
      mimeType: params.mimeType,
    };
    if (params.folderId) metadata.parents = [params.folderId];

    const boundary = "aiplatform_" + Date.now();
    const metaPart =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n`;
    const binHeader = `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`;
    const end = `\r\n--${boundary}--`;
    const body = Buffer.concat([
      Buffer.from(metaPart, "utf8"),
      Buffer.from(binHeader, "utf8"),
      params.bytes,
      Buffer.from(end, "utf8"),
    ]);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: new Uint8Array(body),
      },
    );
    if (!res.ok) return { ok: false, error: `drive_upload_${res.status}` };
    const json = (await res.json()) as { id?: string };
    if (!json.id) return { ok: false, error: "drive_upload_no_id" };
    return { ok: true, fileId: json.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "google_drive_error" };
  }
}
