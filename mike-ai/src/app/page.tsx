"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

type AuthStatus = {
  authReady: boolean;
  unlockCodeConfigured: boolean;
  sessionConfigured: boolean;
  faceIdRegistered: boolean;
  unlocked: boolean;
};

type Project = {
  id: string;
  name: string;
  summary: string;
  status: string;
  updated_at: string;
};

type FileRow = {
  id: string;
  project_id: string;
  name: string;
  mime_type: string;
  size_bytes: string;
  checksum_sha256: string;
  updated_at: string;
};

type SyncProvider = {
  provider: string;
  role: string;
  configured: boolean;
  missing: string[];
  last: { status: string; detail: string; last_success_at: string | null } | null;
};

type MemoryEntry = {
  id: string;
  title: string;
  body: string;
  source: string;
  updated_at: string;
};

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fmtBytes(n: string | number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone: "America/Chicago" });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [sync, setSync] = useState<SyncProvider[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [tab, setTab] = useState<"files" | "sync" | "memory" | "chatgpt">("files");

  const refreshAuth = useCallback(async () => {
    const res = await fetch("/api/auth/status", { cache: "no-store" });
    const json = (await res.json()) as AuthStatus;
    setAuth(json);
    return json;
  }, []);

  const loadWorkspace = useCallback(async () => {
    const [pRes, fRes, sRes, mRes] = await Promise.all([
      fetch("/api/projects", { cache: "no-store" }),
      fetch("/api/files", { cache: "no-store" }),
      fetch("/api/sync", { cache: "no-store" }),
      fetch("/api/memory", { cache: "no-store" }),
    ]);
    if (pRes.status === 401 || fRes.status === 401) {
      await refreshAuth();
      return;
    }
    const pJson = (await pRes.json()) as { projects?: Project[] };
    const fJson = (await fRes.json()) as { files?: FileRow[] };
    const sJson = (await sRes.json()) as { providers?: SyncProvider[] };
    const mJson = (await mRes.json()) as { entries?: MemoryEntry[] };
    setProjects(pJson.projects || []);
    setFiles(fJson.files || []);
    setSync(sJson.providers || []);
    setMemory(mJson.entries || []);
    if (!projectId && pJson.projects?.[0]?.id) setProjectId(pJson.projects[0].id);
  }, [projectId, refreshAuth]);

  useEffect(() => {
    refreshAuth().catch(() => setError("Could not reach auth status."));
  }, [refreshAuth]);

  useEffect(() => {
    if (auth?.unlocked) {
      loadWorkspace().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
    }
  }, [auth?.unlocked, loadWorkspace]);

  async function unlockWithPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Unlock failed");
      setCode("");
      await refreshAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithFaceId() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/login/options", { method: "POST" });
      const optJson = await optRes.json();
      if (!optRes.ok) throw new Error(optJson.message || optJson.error || "Face ID unavailable");
      const options = optJson.options;
      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(
            atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0),
          ),
          rpId: options.rpId,
          timeout: options.timeout,
          userVerification: "required",
          allowCredentials: (options.allowCredentials || []).map(
            (c: { id: string; transports?: string[] }) => ({
              type: "public-key" as const,
              id: Uint8Array.from(atob(c.id.replace(/-/g, "+").replace(/_/g, "/")), (x) =>
                x.charCodeAt(0),
              ),
              transports: c.transports as AuthenticatorTransport[] | undefined,
            }),
          ),
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error("Face ID cancelled");
      const resp = cred.response as AuthenticatorAssertionResponse;
      const verify = await fetch("/api/auth/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: options.challenge,
          response: {
            id: cred.id,
            rawId: b64url(cred.rawId),
            type: cred.type,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
              clientDataJSON: b64url(resp.clientDataJSON),
              authenticatorData: b64url(resp.authenticatorData),
              signature: b64url(resp.signature),
              userHandle: resp.userHandle ? b64url(resp.userHandle) : undefined,
            },
          },
        }),
      });
      const vJson = await verify.json();
      if (!verify.ok) throw new Error(vJson.error || "Face ID verify failed");
      await refreshAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Face ID failed");
    } finally {
      setBusy(false);
    }
  }

  async function registerFaceId() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/register/options", { method: "POST" });
      const optJson = await optRes.json();
      if (!optRes.ok) throw new Error(optJson.message || optJson.error || "Register unavailable");
      const options = optJson.options;
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(
            atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0),
          ),
          rp: options.rp,
          user: {
            id: Uint8Array.from(
              atob(options.user.id.replace(/-/g, "+").replace(/_/g, "/")),
              (c) => c.charCodeAt(0),
            ),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          authenticatorSelection: options.authenticatorSelection,
          excludeCredentials: (options.excludeCredentials || []).map(
            (c: { id: string; transports?: string[] }) => ({
              type: "public-key" as const,
              id: Uint8Array.from(atob(c.id.replace(/-/g, "+").replace(/_/g, "/")), (x) =>
                x.charCodeAt(0),
              ),
              transports: c.transports as AuthenticatorTransport[] | undefined,
            }),
          ),
          attestation: options.attestation || "none",
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error("Registration cancelled");
      const resp = cred.response as AuthenticatorAttestationResponse;
      const transports =
        typeof resp.getTransports === "function" ? resp.getTransports() : [];
      const verify = await fetch("/api/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: options.challenge,
          response: {
            id: cred.id,
            rawId: b64url(cred.rawId),
            type: cred.type,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
              clientDataJSON: b64url(resp.clientDataJSON),
              attestationObject: b64url(resp.attestationObject),
              transports,
            },
          },
        }),
      });
      const vJson = await verify.json();
      if (!verify.ok) throw new Error(vJson.error || "Register failed");
      await refreshAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Face ID register failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProjects([]);
    setFiles([]);
    await refreshAuth();
  }

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId) {
      setError("Choose a project first.");
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("projectId", projectId);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/files", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Upload failed");
      form.reset();
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Sync failed");
      setSync(json.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(fd.get("title") || ""),
          body: String(fd.get("body") || ""),
          projectId: projectId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      e.currentTarget.reset();
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const visibleFiles = projectId
    ? files.filter((f) => f.project_id === projectId)
    : files;

  if (!auth) {
    return (
      <main className={styles.shell}>
        <p className={styles.muted}>Loading AI Project Platform…</p>
      </main>
    );
  }

  if (!auth.unlocked) {
    return (
      <main className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.brand}>AI Project Platform</p>
          <h1>Unlock</h1>
          <p className={styles.lede}>
            Face ID / platform authenticator, or your password. Access from any phone or computer.
          </p>
        </header>

        {!auth.authReady && (
          <div className={styles.warn}>
            Set <code>PLATFORM_UNLOCK_CODE</code> and <code>SESSION_SECRET</code> in Cursor secrets /
            app env. There is no bypass.
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.unlock}>
          {auth.faceIdRegistered && (
            <button type="button" className={styles.primary} disabled={busy} onClick={unlockWithFaceId}>
              Unlock with Face ID
            </button>
          )}
          <form onSubmit={unlockWithPassword} className={styles.form}>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <button type="submit" className={styles.secondary} disabled={busy || !auth.authReady}>
              Unlock with password
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.topRow}>
          <p className={styles.brand}>AI Project Platform</p>
          <button type="button" className={styles.linkish} onClick={logout}>
            Lock
          </button>
        </div>
        <h1>Projects & files</h1>
        <p className={styles.lede}>
          Organized by project, newest first. Download anywhere. iCloud primary; Google Drive &
          OneDrive replicas.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.bar}>
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </label>
        {!auth.faceIdRegistered && (
          <button type="button" className={styles.secondary} disabled={busy} onClick={registerFaceId}>
            Register Face ID on this device
          </button>
        )}
      </section>

      <nav className={styles.tabs}>
        {(["files", "sync", "memory", "chatgpt"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? styles.tabOn : styles.tab}
            onClick={() => setTab(t)}
          >
            {t === "chatgpt" ? "ChatGPT memory" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "files" && (
        <section className={styles.panel}>
          <form className={styles.upload} onSubmit={onUpload}>
            <input name="file" type="file" required />
            <button type="submit" className={styles.primary} disabled={busy}>
              Upload to project
            </button>
          </form>
          <ul className={styles.list}>
            {visibleFiles.map((f) => (
              <li key={f.id}>
                <div>
                  <strong>{f.name}</strong>
                  <span className={styles.muted}>
                    {" "}
                    · {fmtBytes(f.size_bytes)} · {fmtWhen(f.updated_at)} CT
                  </span>
                  <div className={styles.hash}>{f.checksum_sha256}</div>
                </div>
                <a className={styles.secondary} href={`/api/files/download?id=${encodeURIComponent(f.id)}`}>
                  Download
                </a>
              </li>
            ))}
            {visibleFiles.length === 0 && (
              <li className={styles.muted}>No files in this project yet.</li>
            )}
          </ul>
        </section>
      )}

      {tab === "sync" && (
        <section className={styles.panel}>
          <button type="button" className={styles.primary} disabled={busy} onClick={runSync}>
            Sync now (iCloud → Drive → OneDrive)
          </button>
          <ul className={styles.list}>
            {sync.map((p) => (
              <li key={p.provider}>
                <div>
                  <strong>
                    {p.provider} ({p.role})
                  </strong>
                  <div className={styles.muted}>
                    {p.configured
                      ? p.last
                        ? `${p.last.status}: ${p.last.detail}`
                        : "configured — not synced yet"
                      : `missing: ${p.missing.join(", ") || "secrets"}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "memory" && (
        <section className={styles.panel}>
          <form className={styles.form} onSubmit={addNote}>
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Note
              <textarea name="body" rows={4} required />
            </label>
            <button type="submit" className={styles.primary} disabled={busy}>
              Save memory
            </button>
          </form>
          <ul className={styles.list}>
            {memory.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.title}</strong>
                  <span className={styles.muted}>
                    {" "}
                    · {m.source} · {fmtWhen(m.updated_at)} CT
                  </span>
                  <p>{m.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "chatgpt" && (
        <section className={styles.panel}>
          <h2>Link ChatGPT as local memory</h2>
          <ol className={styles.steps}>
            <li>Set secret <code>CHATGPT_MEMORY_TOKEN</code> on this app.</li>
            <li>
              In a Custom GPT, add an Action that <code>GET</code>s{" "}
              <code>/api/memory/chatgpt</code> with header{" "}
              <code>Authorization: Bearer &lt;token&gt;</code> before answering.
            </li>
            <li>
              Optional: <code>POST</code> the same path to append memory after a useful turn.
            </li>
          </ol>
          <p className={styles.muted}>
            Fail-closed: without the token the endpoint returns 503 — no fake memory.
          </p>
        </section>
      )}
    </main>
  );
}
