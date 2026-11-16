import { sql } from "../db";
import { getFileContent, listFiles } from "../platform-store";
import { cloudConfigStatus } from "./status";
import { googleDriveConfigured, googleDrivePing, googleDriveUpload } from "./google-drive";
import { oneDriveConfigured, oneDrivePing, oneDriveUpload } from "./onedrive";
import { iCloudConfigured, iCloudPing, iCloudUpsertFileRecord } from "./icloud";

async function recordSync(provider: string, status: string, detail: string) {
  await sql(
    `INSERT INTO sync_state (provider, status, detail, last_attempt_at, last_success_at)
     VALUES ($1, $2, $3, NOW(), CASE WHEN $2 = 'ok' THEN NOW() ELSE NULL END)
     ON CONFLICT (provider) DO UPDATE SET
       status = EXCLUDED.status,
       detail = EXCLUDED.detail,
       last_attempt_at = NOW(),
       last_success_at = CASE WHEN EXCLUDED.status = 'ok' THEN NOW() ELSE sync_state.last_success_at END`,
    [provider, status, detail],
  );
}

export async function syncStatusReport() {
  const config = cloudConfigStatus();
  const rows = await sql<{
    provider: string;
    status: string;
    detail: string;
    last_success_at: string | null;
    last_attempt_at: string | null;
  }>(
    `SELECT provider, status, detail, last_success_at::text, last_attempt_at::text FROM sync_state`,
  );
  const by = Object.fromEntries(rows.map((r) => [r.provider, r]));
  return config.map((c) => ({
    ...c,
    last: by[c.provider] ?? null,
  }));
}

export async function runCloudSync(fileId?: string): Promise<{
  results: Record<string, { ok: boolean; detail: string }>;
}> {
  const results: Record<string, { ok: boolean; detail: string }> = {};
  const files = fileId
    ? [await getFileContent(fileId)].filter(Boolean)
    : await Promise.all((await listFiles({})).map((f) => getFileContent(f.id)));
  const payloads = files.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getFileContent>>>[];

  // iCloud primary — metadata records prove connectivity; binary assets also mirror to Drive/OneDrive
  if (iCloudConfigured()) {
    const ping = await iCloudPing();
    if (!ping.ok) {
      results.icloud = { ok: false, detail: ping.error };
      await recordSync("icloud", "error", ping.error);
    } else {
      let okCount = 0;
      let lastErr = "";
      for (const item of payloads) {
        const up = await iCloudUpsertFileRecord({
          recordName: item.row.id,
          projectId: item.row.project_id,
          fileName: item.row.name,
          checksum: item.row.checksum_sha256,
          sizeBytes: Number(item.row.size_bytes),
          updatedAt: item.row.updated_at,
        });
        if (up.ok) okCount += 1;
        else lastErr = up.error;
      }
      const detail =
        payloads.length === 0
          ? "connected; no files to sync yet"
          : lastErr && okCount === 0
            ? lastErr
            : `synced_metadata=${okCount}/${payloads.length}`;
      const ok = !lastErr || okCount > 0 || payloads.length === 0;
      results.icloud = { ok, detail };
      await recordSync("icloud", ok ? "ok" : "error", detail);
    }
  } else {
    results.icloud = { ok: false, detail: "not_configured" };
    await recordSync("icloud", "not_configured", "missing CloudKit secrets");
  }

  if (googleDriveConfigured()) {
    const ping = await googleDrivePing();
    if (!ping.ok) {
      results.google_drive = { ok: false, detail: ping.error };
      await recordSync("google_drive", "error", ping.error);
    } else {
      let okCount = 0;
      let lastErr = "";
      for (const item of payloads) {
        const up = await googleDriveUpload({
          name: `${item.row.project_id}__${item.row.name}`,
          mimeType: item.row.mime_type,
          bytes: item.content,
        });
        if (up.ok) okCount += 1;
        else lastErr = up.error;
      }
      const detail =
        payloads.length === 0
          ? `connected${ping.email ? ` as ${ping.email}` : ""}; no files yet`
          : `uploaded=${okCount}/${payloads.length}${lastErr ? ` last_error=${lastErr}` : ""}`;
      const ok = payloads.length === 0 || okCount > 0;
      results.google_drive = { ok, detail };
      await recordSync("google_drive", ok ? "ok" : "error", detail);
    }
  } else {
    results.google_drive = { ok: false, detail: "not_configured" };
    await recordSync("google_drive", "not_configured", "missing Google OAuth secrets");
  }

  if (oneDriveConfigured()) {
    const ping = await oneDrivePing();
    if (!ping.ok) {
      results.onedrive = { ok: false, detail: ping.error };
      await recordSync("onedrive", "error", ping.error);
    } else {
      let okCount = 0;
      let lastErr = "";
      for (const item of payloads) {
        const up = await oneDriveUpload({
          path: `AI-Platform/${item.row.project_id}/${item.row.name}`,
          bytes: item.content,
          mimeType: item.row.mime_type,
        });
        if (up.ok) okCount += 1;
        else lastErr = up.error;
      }
      const detail =
        payloads.length === 0
          ? `connected${ping.displayName ? ` as ${ping.displayName}` : ""}; no files yet`
          : `uploaded=${okCount}/${payloads.length}${lastErr ? ` last_error=${lastErr}` : ""}`;
      const ok = payloads.length === 0 || okCount > 0;
      results.onedrive = { ok, detail };
      await recordSync("onedrive", ok ? "ok" : "error", detail);
    }
  } else {
    results.onedrive = { ok: false, detail: "not_configured" };
    await recordSync("onedrive", "not_configured", "missing Microsoft OAuth secrets");
  }

  return { results };
}
