"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { previewDecision, type PreviewKind } from "@/lib/file-preview";
import styles from "./page.module.css";

type AuthStatus = {
  authReady: boolean;
  unlockCodeConfigured: boolean;
  sessionConfigured: boolean;
  faceIdRegistered: boolean;
  unlocked: boolean;
  viewerName?: string;
};

type Project = {
  id: string;
  name: string;
  summary: string;
  status: string;
  updated_at: string;
};

type HubApp = {
  name: string;
  href: string;
  blurb: string;
};

type CatalogInfo = {
  expected: number;
  available: number;
  complete: boolean;
  ravinPaused: boolean;
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
  const [apps, setApps] = useState<HubApp[]>([]);
  const [catalog, setCatalog] = useState<CatalogInfo | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [sync, setSync] = useState<SyncProvider[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [tab, setTab] = useState<"projects" | "files" | "apps" | "chat" | "sync" | "memory" | "chatgpt">(
    "projects",
  );
  const [chatgptExport, setChatgptExport] = useState<string>("");
  const [recordSource, setRecordSource] = useState<string>("");
  const [opened, setOpened] = useState<{
    name: string;
    kind: PreviewKind | "download";
    url: string;
    text?: string;
    note?: string;
  } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHint, setChatHint] = useState<string | null>(null);
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );
  const { messages, sendMessage, status: chatStatus, error: chatError } = useChat({
    transport: chatTransport,
  });

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
    const pJson = (await pRes.json()) as {
      projects?: Project[];
      apps?: HubApp[];
      catalog?: CatalogInfo;
      source?: string;
    };
    const fJson = (await fRes.json()) as { files?: FileRow[] };
    const sJson = (await sRes.json()) as { providers?: SyncProvider[] };
    const mJson = (await mRes.json()) as { entries?: MemoryEntry[] };
    setProjects(pJson.projects || []);
    setApps(pJson.apps || []);
    setCatalog(pJson.catalog || null);
    setRecordSource(pJson.source || "");
    setFiles(fJson.files || []);
    setSync(sJson.providers || []);
    setMemory(mJson.entries || []);
    if (!projectId && pJson.projects?.[0]?.id) setProjectId(pJson.projects[0].id);
  }, [projectId, refreshAuth]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        const json = (await res.json()) as AuthStatus;
        if (!cancelled) setAuth(json);
      } catch {
        if (!cancelled) setError("Could not reach auth status.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!auth?.unlocked) return;
    let cancelled = false;
    const refresh = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      void loadWorkspace().catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [auth?.unlocked, loadWorkspace]);

  function closeOpened() {
    setOpened((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  async function saveBlob(blob: Blob, name: string): Promise<"shared" | "downloaded"> {
    const shareFile = new File([blob], name, { type: blob.type || "application/octet-stream" });
    if (navigator.canShare?.({ files: [shareFile] })) {
      await navigator.share({ files: [shareFile], title: name });
      return "shared";
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return "downloaded";
  }

  async function openStoredFile(file: FileRow) {
    setBusy(true);
    setError(null);
    try {
      const decision = previewDecision(file.mime_type, file.name);
      const inline = decision.kind !== "none";
      const res = await fetch(
        `/api/files/download?id=${encodeURIComponent(file.id)}${inline ? "&inline=1" : ""}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
        throw new Error(json?.message || json?.error || `Could not open file (${res.status})`);
      }
      const bytes = await res.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const actual = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
      const headerSum = res.headers.get("X-Checksum-SHA256");
      if (actual !== file.checksum_sha256 || (headerSum && headerSum !== actual)) {
        throw new Error("Checksum mismatch. The file was not opened.");
      }
      const blob = new Blob([bytes], { type: decision.mime || file.mime_type || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const next = {
        name: file.name,
        kind: decision.kind === "none" ? ("download" as const) : decision.kind,
        url,
        text: decision.kind === "text" ? new TextDecoder().decode(bytes.slice(0, 200_000)) : undefined,
        note: undefined as string | undefined,
      };
      if (decision.kind === "none") {
        const saved = await saveBlob(blob, file.name);
        next.note =
          saved === "shared"
            ? "The share sheet can save this file on this iPhone."
            : "Download started. If the phone did not save it, use Save file.";
      }
      setOpened((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return next;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not open file");
    } finally {
      setBusy(false);
    }
  }

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
            Open this app while signed in to Cursor. A password is optional and only works after
            unlock secrets are set.
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
          All Netgene / board projects in one place. OneDrive primary; Google Drive & iCloud
          backups. Hub apps stay available under Apps.
        </p>
        {catalog ? (
          <p className={styles.muted} style={{ marginTop: "0.55rem" }}>
            Catalog: {catalog.available}/{catalog.expected}{" "}
            {catalog.complete ? "complete" : "incomplete"}
            {catalog.ravinPaused ? " · Ravin paused" : ""}
            {recordSource ? ` · shared store ${recordSource}` : ""}
            {auth.viewerName ? ` · ${auth.viewerName}` : ""}
          </p>
        ) : null}
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
        {(
          [
            ["projects", "Projects"],
            ["apps", "Apps"],
            ["files", "Files"],
            ["chat", "Chat"],
            ["sync", "Sync"],
            ["memory", "Memory"],
            ["chatgpt", "ChatGPT memory"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? styles.tabOn : styles.tab}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "projects" && (
        <section className={styles.panel}>
          <ul className={styles.list}>
            {projects.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  <span className={styles.muted}>
                    {" "}
                    · {p.status} · {fmtWhen(p.updated_at)} CT
                  </span>
                  {p.summary ? <p className={styles.muted}>{p.summary}</p> : null}
                </div>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setProjectId(p.id);
                    setTab("files");
                  }}
                >
                  Open files
                </button>
              </li>
            ))}
            {projects.length === 0 && (
              <li className={styles.muted}>No projects loaded yet.</li>
            )}
          </ul>
        </section>
      )}

      {tab === "apps" && (
        <section className={styles.panel}>
          <ul className={styles.list}>
            {(apps.length
              ? apps
              : [
                  { name: "Apps hub", href: "/apps", blurb: "Netgene project index" },
                  { name: "Forma", href: "/apps/forma", blurb: "Photo editor" },
                  {
                    name: "Vehicle Genius",
                    href: "/apps/vehicle-genius",
                    blurb: "Offline symptom helper",
                  },
                  { name: "CDI Genius", href: "/apps/cdi-genius", blurb: "CDI diagnostics" },
                  { name: "Ravin downloads", href: "/downloads", blurb: "Windows installers" },
                ]
            ).map((app) => (
              <li key={app.href}>
                <div>
                  <strong>{app.name}</strong>
                  <p className={styles.muted}>{app.blurb}</p>
                </div>
                <a className={styles.secondary} href={app.href}>
                  Open
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "chat" && (
        <section className={styles.panel}>
          {chatHint ? <p className={styles.error}>{chatHint}</p> : null}
          {chatError ? <p className={styles.error}>{chatError.message}</p> : null}
          <div className={styles.list} style={{ marginBottom: "1rem" }}>
            {messages.length === 0 ? (
              <div className={styles.muted}>No messages yet. Ask about your projects.</div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                  <strong>{message.role === "user" ? "You" : "Mike"}</strong>
                  <div>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? <span key={index}>{part.text}</span> : null,
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            className={styles.form}
            onSubmit={async (e) => {
              e.preventDefault();
              const text = chatInput.trim();
              if (!text) return;
              setChatHint(null);
              try {
                const health = await fetch("/api/health", { cache: "no-store" });
                const healthJson = (await health.json()) as { modelCredentials?: boolean };
                if (!healthJson.modelCredentials) {
                  setChatHint(
                    "No OPENAI_API_KEY or AI_GATEWAY_API_KEY configured. Chat stays fail-closed.",
                  );
                  return;
                }
                await sendMessage({ text });
                setChatInput("");
              } catch (err) {
                setChatHint(err instanceof Error ? err.message : "Chat failed");
              }
            }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Mike…"
              disabled={chatStatus !== "ready"}
              aria-label="Chat message"
            />
            <button type="submit" className={styles.primary} disabled={chatStatus !== "ready"}>
              Send
            </button>
          </form>
        </section>
      )}

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
                <button
                  type="button"
                  className={styles.fileOpen}
                  disabled={busy}
                  onClick={() => void openStoredFile(f)}
                >
                  <span>
                    <strong>{f.name}</strong>
                    <span className={styles.muted}>
                      {" "}
                      · {fmtBytes(f.size_bytes)} · {fmtWhen(f.updated_at)} CT
                    </span>
                    <span className={styles.hash}>{f.checksum_sha256}</span>
                  </span>
                  <span className={styles.secondary}>Open</span>
                </button>
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
          <p className={styles.muted}>
            Windows and iPhone show the same projects and files when both are unlocked on this
            server ({recordSource || "unknown store"}). Returning to the app refreshes that list.
            Cloud copy below does not run unless you press it.
          </p>
          <div className={styles.syncActions}>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => void loadWorkspace()}>
              Refresh shared records
            </button>
            <button type="button" className={styles.primary} disabled={busy} onClick={runSync}>
              Sync now (OneDrive → Drive → iCloud)
            </button>
          </div>
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
          <h2>ChatGPT local memory</h2>
          <ol className={styles.steps}>
            <li>Stay unlocked on this device (Face ID or password session).</li>
            <li>
              Copy the export below and paste it into ChatGPT as grounding context — or call{" "}
              <code>GET /api/memory/chatgpt</code> from this same unlocked browser session.
            </li>
            <li>
              Shared Bearer tokens are not used; memory never opens without unlock.
            </li>
          </ol>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const res = await fetch("/api/memory/chatgpt", { cache: "no-store" });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || json.error || "Export failed");
                const text = JSON.stringify(json, null, 2);
                setChatgptExport(text);
                if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Export failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            Copy memory for ChatGPT
          </button>
          {chatgptExport && (
            <pre className={styles.muted} style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
              {chatgptExport.slice(0, 4000)}
              {chatgptExport.length > 4000 ? "\n…" : ""}
            </pre>
          )}
        </section>
      )}

      {opened && (
        <div className={styles.preview} role="dialog" aria-modal="true" aria-label={opened.name}>
          <div className={styles.previewCard}>
            <div className={styles.topRow}>
              <strong>{opened.name}</strong>
              <button type="button" className={styles.secondary} onClick={closeOpened}>
                Close
              </button>
            </div>
            {opened.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={opened.url} alt={opened.name} />
            )}
            {opened.kind === "pdf" && (
              <iframe title={opened.name} src={opened.url} className={styles.previewFrame} />
            )}
            {opened.kind === "text" && <pre className={styles.previewText}>{opened.text}</pre>}
            {opened.kind === "audio" && <audio controls src={opened.url} />}
            {opened.kind === "video" && <video controls src={opened.url} className={styles.previewFrame} />}
            {opened.kind === "download" && <p className={styles.muted}>{opened.note}</p>}
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                const blobUrl = opened.url;
                void fetch(blobUrl)
                  .then((res) => res.blob())
                  .then((blob) => saveBlob(blob, opened.name))
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "Could not save file");
                  });
              }}
            >
              Save file
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
