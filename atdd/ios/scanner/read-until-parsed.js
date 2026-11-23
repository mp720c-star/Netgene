/**
 * Request Mode 03 until the reply parses or the caller stops the read.
 * A thrown parser error and a failed send are both tries, not a finished scan.
 * The caller supplies the request, so this module cannot send Mode 04.
 */
export async function readUntilParsed({ request, parse, shouldContinue, onFailure, pause }) {
  let attempt = 0;
  while (shouldContinue()) {
    attempt += 1;
    let reply = "";
    try {
      reply = await request();
    } catch (error) {
      if (!shouldContinue()) return { ok: false, stopped: true, attempt };
      await onFailure({ attempt, kind: "send", error, reply: "" });
      if (!shouldContinue()) return { ok: false, stopped: true, attempt };
      await pause();
      continue;
    }
    if (!shouldContinue()) return { ok: false, stopped: true, attempt };
    try {
      const codes = parse(reply);
      return { ok: true, codes, reply, attempt };
    } catch (error) {
      await onFailure({ attempt, kind: "parse", error, reply });
      if (!shouldContinue()) return { ok: false, stopped: true, attempt };
      await pause();
    }
  }
  return { ok: false, stopped: true, attempt };
}
