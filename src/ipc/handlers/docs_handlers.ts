import { app } from "electron";
import { createLoggedHandler } from "./safe_handle";
import log from "electron-log";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import crypto from "node:crypto";

const logger = log.scope("docs_handlers");
const handle = createLoggedHandler(logger);

const ALLOWLIST = new Set(["docs.stripe.com", "stripe.com", "resend.com", "www.resend.com"]);

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function sanitizeHtml(html: string): string {
  // Extremely defensive, simple sanitizer: remove scripts/iframes/style and inline event handlers
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove on*="..." handlers
  out = out.replace(/ on[a-zA-Z]+="[^"]*"/g, "");
  out = out.replace(/ on[a-zA-Z]+='[^']*'/g, "");
  // Remove javascript: URLs
  out = out.replace(/href\s*=\s*"javascript:[^"]*"/gi, "");
  out = out.replace(/src\s*=\s*"javascript:[^"]*"/gi, "");
  return out;
}

export function registerDocsHandlers() {
  handle("docs:fetch", async (_evt, payload: { url: string; force?: boolean }) => {
    const url = String(payload?.url || "");
    const force = Boolean(payload?.force);
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new Error("Invalid URL");
    }
    if (!ALLOWLIST.has(u.hostname)) {
      throw new Error(`Domain not allowed: ${u.hostname}`);
    }

    const cacheDir = path.join(app.getPath("userData"), "docs-cache");
    const key = hash(url);
    const htmlFile = path.join(cacheDir, `${key}.html`);
    const metaFile = path.join(cacheDir, `${key}.json`);

    await fs.mkdir(cacheDir, { recursive: true }).catch(() => {});

    const now = Date.now();
    const ttlMs = 6 * 60 * 60 * 1000; // 6 hours

    if (!force) {
      try {
        const [htmlBuf, metaBuf] = await Promise.all([
          fs.readFile(htmlFile),
          fs.readFile(metaFile),
        ]);
        const meta = JSON.parse(String(metaBuf || "{}")) as { fetchedAt?: number };
        if (meta?.fetchedAt && now - meta.fetchedAt < ttlMs) {
          return { html: String(htmlBuf), fetchedAt: meta.fetchedAt, cached: true };
        }
      } catch {}
    }

    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.text();
    const html = sanitizeHtml(raw);
    await Promise.all([
      fs.writeFile(htmlFile, html),
      fs.writeFile(metaFile, JSON.stringify({ fetchedAt: now }, null, 2)),
    ]);
    return { html, fetchedAt: now, cached: false };
  });
}
