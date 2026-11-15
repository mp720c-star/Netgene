"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type ProjectRecord = {
  id?: string;
  name?: string;
  summary?: string;
  status?: string;
  [key: string]: unknown;
};

type ProjectsResponse = {
  ok: boolean;
  source: string;
  fileName: string | null;
  count: number;
  message: string;
  records: ProjectRecord[];
};

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectsResponse | null>(null);
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [chatHint, setChatHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [projectsRes, healthRes] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }),
      ]);
      const data = (await projectsRes.json()) as ProjectsResponse;
      const health = (await healthRes.json()) as { modelCredentials?: boolean };
      if (!cancelled) {
        setProjects(data);
        if (!health.modelCredentials) {
          setChatHint(
            "No OPENAI_API_KEY or AI_GATEWAY_API_KEY configured. Chat stays fail-closed — no fake replies.",
          );
        }
      }
    })().catch(() => {
      if (!cancelled) {
        setProjects({
          ok: false,
          source: "none",
          fileName: null,
          count: 0,
          message: "Failed to reach /api/projects.",
          records: [],
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setChatHint(null);

    try {
      const health = await fetch("/api/health", { cache: "no-store" });
      const healthJson = (await health.json()) as { modelCredentials?: boolean };
      if (!healthJson.modelCredentials) {
        setChatHint(
          "No OPENAI_API_KEY or AI_GATEWAY_API_KEY configured. Chat stays fail-closed — no fake replies.",
        );
        return;
      }
      await sendMessage({ text });
      setInput("");
    } catch (err) {
      setChatHint(err instanceof Error ? err.message : "Chat request failed.");
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.banner}>
        <strong>TEST DEPLOY ONLY.</strong> Production <code>mike-ai.vercel.app</code> is not
        modified. Drive/OneDrive backups are not overwritten or deleted. Project records load only
        from a real <code>AI_Platform_Project_Records_&lt;timestamp&gt;.json</code> file.
      </div>

      <h1 className={styles.brand}>Mike AI</h1>
      <p className={styles.lead}>
        Restored Netgene apps on a separate test surface. Chat stays fail-closed without real model
        credentials. Project memory stays empty until a real records export is dropped into{" "}
        <code>mike-ai/recovery/</code>.
      </p>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2>Chat</h2>
          <p className={styles.meta}>
            Status: <strong>{status}</strong>
            {error ? ` — ${error.message}` : ""}
          </p>
          {chatHint ? <p className={styles.error} role="alert">{chatHint}</p> : null}
          <div className={styles.chatLog}>
            {messages.length === 0 ? (
              <div className={styles.bubble}>No messages yet.</div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? styles.bubbleUser : styles.bubble}
                >
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
          <form className={styles.form} onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mike…"
              disabled={status !== "ready"}
              aria-label="Chat message"
            />
            <button type="submit" disabled={status !== "ready"}>
              Send
            </button>
          </form>
          {error ? <p className={styles.error}>{error.message}</p> : null}
          {chatHint ? <p className={styles.error}>{chatHint}</p> : null}
        </section>

        <section className={styles.panel}>
          <h2>Project records</h2>
          {!projects ? (
            <p className={styles.meta}>Loading…</p>
          ) : (
            <>
              <p className={styles.meta}>
                <span className={projects.ok ? styles.statusOk : styles.statusEmpty}>
                  {projects.ok ? `${projects.count} record(s)` : "No records loaded"}
                </span>
                {" · "}
                source: {projects.source}
                {projects.fileName ? ` · ${projects.fileName}` : ""}
              </p>
              <p className={styles.meta}>{projects.message}</p>
              {projects.records.length > 0 ? (
                <ul className={styles.list}>
                  {projects.records.map((record, index) => (
                    <li key={String(record.id ?? index)}>
                      <strong>{String(record.name ?? record.id ?? `Record ${index + 1}`)}</strong>
                      {record.summary ? (
                        <>
                          <br />
                          <small>{String(record.summary)}</small>
                        </>
                      ) : null}
                      {record.status ? (
                        <>
                          <br />
                          <small>status: {String(record.status)}</small>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        <h2>Netgene apps</h2>
        <p className={styles.meta}>Real restored apps from the Netgene workspace (test copies).</p>
        <div className={styles.apps}>
          <a className={styles.appLink} href="/apps">
            <strong>Hub</strong>
            <span>Project index</span>
          </a>
          <a className={styles.appLink} href="/apps/forma">
            <strong>Forma</strong>
            <span>On-device photo editor</span>
          </a>
          <a className={styles.appLink} href="/apps/vehicle-genius">
            <strong>Vehicle Genius</strong>
            <span>Offline symptom helper</span>
          </a>
          <a className={styles.appLink} href="/apps/cdi-genius">
            <strong>CDI Genius</strong>
            <span>Expo CDI diagnostic landing</span>
          </a>
        </div>
      </section>
    </main>
  );
}
