#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/**
 * Save the identity.citytech.ec login session so ArpsisAuth can mint access
 * tokens on its own (silent renew, the same thing the ARPSIS web app does
 * every hour). Run it once per login session instead of once per hour.
 *
 * How to get the cookie (Chrome/Edge, already logged in to project.citytech.ec):
 *   1. Open https://identity.citytech.ec/.well-known/openid-configuration in a tab
 *   2. DevTools (F12) → Network → reload → click the request
 *   3. Headers → Request Headers → right-click `cookie` → Copy value
 *   4. bun run set-session          (reads the clipboard; nothing to paste)
 *
 * Also accepts a "Copy as cURL" of any identity.citytech.ec request, a
 * "Cookie: ..." line, or piped stdin. Never prints cookie or token values.
 */

import "../src/load-env.js";
import { renewWithSession, type SessionRenewal } from "../src/auth.js";
import { loadConfig } from "../src/config.js";
import { ENV_PATH, upsertEnvKey } from "../src/env-file.js";

const KNOWN_SESSION_COOKIE = /^(idsrv|\.AspNetCore\.)/;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function readClipboard(): string {
  const commands: string[][] =
    process.platform === "win32"
      ? [["powershell", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"]]
      : process.platform === "darwin"
        ? [["pbpaste"]]
        : [["wl-paste", "--no-newline"], ["xclip", "-o", "-selection", "clipboard"]];

  for (const cmd of commands) {
    try {
      const out = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "ignore" });
      if (out.exitCode === 0) return out.stdout.toString().trim();
    } catch {
      // Tool not installed — try the next one.
    }
  }
  return "";
}

/** Pull a Cookie header value out of whatever shape the user copied. */
function extractCookie(raw: string): string {
  let s = raw.trim();

  // "Copy as cURL" (bash or cmd flavour): -H 'cookie: ...' / -H ^"cookie: ...^" / -b '...'
  const curlHeader = s.match(/-H\s+\^?["']cookie:\s*([\s\S]*?)\^?["']/i);
  const curlJar = s.match(/(?:-b|--cookie)\s+\^?["']([\s\S]*?)\^?["']/i);
  const fromCurl = curlHeader?.[1] ?? curlJar?.[1];
  if (fromCurl) s = fromCurl.replace(/\^/g, "");

  s = s.replace(/^ARPSIS_SESSION_COOKIE\s*=\s*/i, "");
  s = s.replace(/^cookie\s*:\s*/i, "");
  s = s.replace(/^['"]|['"]$/g, "");
  return s.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

function cookieNames(cookie: string): string[] {
  return cookie
    .split(";")
    .map((p) => p.slice(0, p.indexOf("=")).trim())
    .filter(Boolean);
}

function humanize(deltaMs: number): string {
  const mins = Math.round(Math.abs(deltaMs) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

async function readInput(): Promise<{ raw: string; source: string }> {
  const argv = process.argv.slice(2).join(" ").trim();
  if (argv) return { raw: argv, source: "argumento" };

  if (process.stdin.isTTY) {
    const clip = readClipboard();
    if (clip && cookieNames(extractCookie(clip)).length > 0) {
      return { raw: clip, source: "portapapeles" };
    }
    process.stderr.write(
      "No encontré una cookie en el portapapeles.\nPega el valor del header `cookie` de identity.citytech.ec y Enter:\n> ",
    );
    for await (const line of console) {
      if (line.trim()) return { raw: line.trim(), source: "pegado" };
    }
    return { raw: "", source: "pegado" };
  }

  return { raw: (await Bun.stdin.text()).trim(), source: "stdin" };
}

const { raw, source } = await readInput();
if (!raw) fail("No se recibió ninguna cookie.");

const cookie = extractCookie(raw);
const names = cookieNames(cookie);
if (names.length === 0) {
  fail("No encontré pares nombre=valor — copia el valor del header `cookie`, no la URL.");
}

console.error(`• cookie leída desde ${source}: ${names.length} cookie(s) → ${names.join(", ")}`);
if (!names.some((n) => KNOWN_SESSION_COOKIE.test(n))) {
  console.error(
    "  ⚠ no veo cookies de sesión conocidas (idsrv*, .AspNetCore.*) — ¿la copiaste de project.citytech.ec en vez de identity.citytech.ec?",
  );
}

const config = loadConfig();
console.error(`• probando la sesión contra ${config.authority} (prompt=none, sin pedir login)...`);

let renewal: SessionRenewal;
try {
  renewal = await renewWithSession(config, cookie);
} catch (e) {
  fail(
    `${e instanceof Error ? e.message : String(e)}\n  No se guardó nada. Vuelve a iniciar sesión en https://project.citytech.ec y copia la cookie otra vez.`,
  );
}

upsertEnvKey("ARPSIS_SESSION_COOKIE", renewal.cookie);
const tokenWrite = upsertEnvKey("ARPSIS_ACCESS_TOKEN", renewal.accessToken);

const now = Date.now();
console.error(`✓ sesión válida — ARPSIS_SESSION_COOKIE y ARPSIS_ACCESS_TOKEN guardados en ${ENV_PATH}`);
console.error(`  token nuevo expira ${new Date(renewal.expiresAtMs).toISOString()} (en ${humanize(renewal.expiresAtMs - now)})`);
console.error(
  renewal.cookieRotated
    ? "  el servidor renovó la cookie (sesión deslizante): cada renovación extiende la sesión"
    : "  el servidor no renovó la cookie: la sesión dura lo que dure desde tu login",
);
if (tokenWrite.duplicates > 1) {
  console.error(`  ⚠ hay ${tokenWrite.duplicates} líneas ARPSIS_ACCESS_TOKEN en .env; load-env usa la primera. Borra las demás.`);
}
if (source === "argumento") {
  console.error("  ⚠ pasaste la cookie por argumento: queda en el historial del shell.");
}

try {
  const res = await fetch(`${config.authority}/connect/userinfo`, {
    headers: { Authorization: `Bearer ${renewal.accessToken}` },
  });
  if (res.ok) {
    const info = (await res.json()) as { name?: string; preferred_username?: string };
    console.error(`✓ verificado en /connect/userinfo como ${info.name ?? info.preferred_username ?? "(sin nombre)"}`);
  } else {
    console.error(`⚠ /connect/userinfo respondió ${res.status} con el token nuevo`);
  }
} catch {
  console.error("⚠ no se pudo verificar en línea (sin red); el .env quedó escrito igual.");
}

console.error("Listo: el MCP renovará el token solo cuando venza, hasta que la sesión de identity.citytech.ec expire.");
