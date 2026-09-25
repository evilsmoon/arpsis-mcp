#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/**
 * Replace ARPSIS_ACCESS_TOKEN in .env without opening the file.
 * Accepts a bare JWT, an "Authorization: Bearer ..." header, a full
 * "ARPSIS_ACCESS_TOKEN=..." line, or the oidc-client JSON blob from
 * Session Storage. Never prints the token itself.
 *
 *   bun run set-token              # interactive paste (stays out of shell history)
 *   bun run set-token <token>      # argv (lands in history — warned)
 *   cat tok.txt | bun run set-token
 */

import { existsSync, readFileSync } from "node:fs";
import { ENV_PATH, upsertEnvKey } from "../src/env-file.js";

const KEY = "ARPSIS_ACCESS_TOKEN";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function readInput(): Promise<{ raw: string; fromArgv: boolean }> {
  const argv = process.argv.slice(2).join(" ").trim();
  if (argv) return { raw: argv, fromArgv: true };

  if (process.stdin.isTTY) {
    process.stderr.write(
      "Pega el access_token (o el header Authorization completo) y Enter:\n> ",
    );
    for await (const line of console) {
      if (line.trim()) return { raw: line.trim(), fromArgv: false };
    }
    return { raw: "", fromArgv: false };
  }

  return { raw: (await Bun.stdin.text()).trim(), fromArgv: false };
}

/** Pull a JWT out of whatever shape the user pasted. */
function extractToken(raw: string): string {
  const fromJson = raw.match(/"access_token"\s*:\s*"(eyJ[\w-]+\.[\w-]+\.[\w-]+)"/);
  if (fromJson?.[1]) return fromJson[1];

  let s = raw.trim();
  s = s.replace(/^ARPSIS_ACCESS_TOKEN\s*=\s*/i, "");
  s = s.replace(/^Authorization\s*:\s*/i, "");
  s = s.replace(/^Bearer\s+/i, "");
  s = s.replace(/^['"]|['"]$/g, "").trim();

  const bare = s.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
  if (bare?.[0]) return bare[0];

  return s;
}

interface Claims {
  exp?: number;
  iat?: number;
  sub?: string;
  client_id?: string;
}

function decodeClaims(token: string): Claims {
  const parts = token.split(".");
  if (parts.length !== 3) fail("No parece un JWT (se esperaban 3 segmentos separados por '.').");
  try {
    return JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as Claims;
  } catch {
    fail("El payload del JWT no es JSON válido — ¿se cortó al copiar?");
  }
}

function humanize(deltaMs: number): string {
  const mins = Math.round(Math.abs(deltaMs) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

const { raw, fromArgv } = await readInput();
if (!raw) fail("No se recibió ningún token.");

const token = extractToken(raw);
if (!token.startsWith("eyJ")) {
  fail("No se encontró un JWT en la entrada (debería empezar con 'eyJ').");
}

const claims = decodeClaims(token);
if (!claims.exp) fail("El JWT no trae claim 'exp'.");

const expMs = claims.exp * 1000;
const now = Date.now();
if (expMs <= now) {
  fail(
    `Ese token YA está vencido (exp ${new Date(expMs).toISOString()}, hace ${humanize(expMs - now)}). Saca uno nuevo.`,
  );
}

if (!existsSync(ENV_PATH)) {
  fail(`No existe ${ENV_PATH}. Copia .env.example a .env primero.`);
}

const original = readFileSync(ENV_PATH, "utf8");
const { replaced, duplicates: matches } = upsertEnvKey(KEY, token);

console.error(`✓ ${KEY} actualizado en .env (${replaced ? "línea reemplazada" : "línea agregada"})`);
console.error(`  expira  ${new Date(expMs).toISOString()}  (en ${humanize(expMs - now)})`);
if (claims.sub) console.error(`  sub     ${claims.sub}`);
if (matches > 1) {
  console.error(`  ⚠ hay ${matches} líneas ${KEY} en .env; load-env usa la primera. Borra las demás.`);
}
if (fromArgv) {
  console.error("  ⚠ pasaste el token por argumento: queda en el historial del shell.");
}

// Live check against the OIDC provider — non-fatal if the network is down.
const authority = original
  .split("\n")
  .find((l) => l.startsWith("ARPSIS_AUTHORITY="))
  ?.slice("ARPSIS_AUTHORITY=".length)
  .trim()
  .replace(/\/+$/, "");

if (authority) {
  try {
    const res = await fetch(`${authority}/connect/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.error(
      res.ok
        ? `✓ verificado contra ${authority}/connect/userinfo (200)`
        : `⚠ el proveedor respondió ${res.status} — el token no fue aceptado`,
    );
  } catch {
    console.error("⚠ no se pudo verificar en línea (sin red); el .env quedó escrito igual.");
  }
}

if (!/^\s*ARPSIS_SESSION_COOKIE\s*=\s*\S/m.test(original)) {
  console.error("💡 para no repetir esto cada hora: `bun run set-session` guarda tu sesión y el MCP renueva el token solo.");
}
