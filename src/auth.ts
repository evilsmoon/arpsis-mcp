// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import { randomBytes } from "node:crypto";
import { loadConfig, type ArpsisConfig } from "./config.js";
import { upsertEnvKey } from "./env-file.js";
import { loadProjectEnv } from "./load-env.js";
import { log } from "./log.js";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

const DEFAULT_STATIC_TOKEN_TTL_MS = 3_600_000;
const EXPIRY_SKEW_MS = 30_000;

/**
 * Abstraction over auth strategies used by ArpsisClient. Stdio uses ArpsisAuth
 * (refresh + cache); HTTP mode uses StaticBearerProvider (per-request bearer,
 * no state). Client asks getAccessToken() before every call, and only retries
 * a 401 when supportsRefresh is true.
 */
export interface TokenProvider {
  getAccessToken(): Promise<string>;
  readonly supportsRefresh: boolean;
  invalidate?(): void;
  refresh?(): Promise<string>;
}

export class ArpsisAuth implements TokenProvider {
  readonly supportsRefresh = true;
  private accessToken: string | null = null;
  private expiresAt = 0;
  private refreshToken: string | undefined;
  /** In-flight silent renew, shared so parallel tool calls trigger one authorize round-trip. */
  private renewing: Promise<string> | null = null;
  /** A token the API answered 401 for — skipped even if its `exp` says it is still valid. */
  private rejectedToken: string | null = null;

  constructor(config: ArpsisConfig) {
    this.refreshToken = config.refreshToken;
  }

  async getAccessToken(): Promise<string> {
    const config = this.reloadEnvAndConfig();

    const staticToken = this.getValidStaticToken(config);
    if (staticToken) {
      return staticToken;
    }

    if (
      this.accessToken &&
      this.accessToken !== this.rejectedToken &&
      Date.now() < this.expiresAt - EXPIRY_SKEW_MS
    ) {
      return this.accessToken;
    }

    return this.refresh();
  }

  async refresh(): Promise<string> {
    const config = this.reloadEnvAndConfig();

    const staticToken = this.getValidStaticToken(config);
    if (staticToken) {
      return staticToken;
    }

    const staticAccessToken = config.accessToken;
    const hasRefresh = Boolean(config.refreshToken ?? this.refreshToken);
    const hasClientSecret = Boolean(config.clientSecret);
    const hasSession = Boolean(config.sessionCookie);

    if (staticAccessToken && !hasRefresh && !hasClientSecret && !hasSession) {
      throw staticTokenExpiredError(staticAccessToken);
    }

    if (!hasRefresh && !hasClientSecret) {
      if (hasSession) {
        return this.renewFromSession(config);
      }
      throw new Error(
        "missing ARPSIS_ACCESS_TOKEN: run `bun run set-session` once, or set ARPSIS_ACCESS_TOKEN, ARPSIS_REFRESH_TOKEN, or ARPSIS_CLIENT_SECRET in .env or MCP env",
      );
    }

    const tokenUrl = `${config.authority}/connect/token`;
    const body = new URLSearchParams();
    const refreshToken = config.refreshToken ?? this.refreshToken;

    if (refreshToken) {
      body.set("grant_type", "refresh_token");
      body.set("refresh_token", refreshToken);
      body.set("client_id", config.clientId);
      if (config.clientSecret) {
        body.set("client_secret", config.clientSecret);
      }
    } else if (config.clientSecret) {
      body.set("grant_type", "client_credentials");
      body.set("client_id", config.clientId);
      body.set("client_secret", config.clientSecret);
      body.set("scope", config.scope);
    } else {
      throw new Error(
        "missing ARPSIS_ACCESS_TOKEN: set ARPSIS_ACCESS_TOKEN, ARPSIS_REFRESH_TOKEN, or ARPSIS_CLIENT_SECRET in .env or MCP env",
      );
    }

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token refresh failed (${res.status}): ${sanitizeError(text)}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }
    return this.accessToken;
  }

  invalidate(): void {
    // Called by ArpsisClient after a 401: whatever we last handed out was
    // rejected, so never serve it again even if its exp claims it is valid.
    this.rejectedToken = this.accessToken;
    this.accessToken = null;
    this.expiresAt = 0;
  }

  /** Re-read .env and rebuild config so MCP picks up token changes without restart. */
  private reloadEnvAndConfig(): ArpsisConfig {
    loadProjectEnv({ overwrite: true });
    const config = loadConfig();
    if (config.refreshToken) {
      this.refreshToken = config.refreshToken;
    }
    return config;
  }

  private getValidStaticToken(config: ArpsisConfig): string | null {
    const token = config.accessToken?.trim();
    if (!token || token === this.rejectedToken) {
      return null;
    }

    const expiresMs = resolveStaticExpiresAtMs(token, config.accessTokenExpiresAt);
    if (Date.now() >= expiresMs - EXPIRY_SKEW_MS) {
      return null;
    }

    this.accessToken = token;
    this.expiresAt = expiresMs;
    return token;
  }

  /**
   * Mint a new access token from the identity-server session cookie, then write
   * it (and any cookie the server rotated) back to .env so restarts and other
   * processes reuse it instead of renewing again.
   */
  private renewFromSession(config: ArpsisConfig): Promise<string> {
    this.renewing ??= renewWithSession(config)
      .then((renewal) => {
        this.accessToken = renewal.accessToken;
        this.expiresAt = renewal.expiresAtMs;
        persistRenewal(renewal);
        log.info("auth.silent_renew", {
          expiresAt: new Date(renewal.expiresAtMs).toISOString(),
          sessionRotated: renewal.cookieRotated,
        });
        return renewal.accessToken;
      })
      .finally(() => {
        this.renewing = null;
      });
    return this.renewing;
  }
}

export interface SessionRenewal {
  accessToken: string;
  expiresAtMs: number;
  /** Cookie header after merging any Set-Cookie the identity server sent back. */
  cookie: string;
  /** true when the server re-issued a cookie (sliding session) — persist it or the session ends at its original expiry. */
  cookieRotated: boolean;
}

/**
 * The silent renew the ARPSIS web app does every hour: an implicit-flow
 * authorize request with `prompt=none`, authenticated only by the session
 * cookie. The identity server answers with a redirect whose URL fragment
 * carries the new access_token, or `error=login_required` once the session is gone.
 */
export async function renewWithSession(
  config: ArpsisConfig,
  cookie: string | undefined = config.sessionCookie,
): Promise<SessionRenewal> {
  if (!cookie) {
    throw new Error("missing ARPSIS_SESSION_COOKIE: run `bun run set-session` with the identity.citytech.ec cookie");
  }
  if (!config.clientId) {
    throw new Error("missing ARPSIS_CLIENT_ID (vue.client) — required for silent renew");
  }

  const state = randomBytes(12).toString("base64url");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "id_token token",
    scope: config.scope,
    prompt: "none",
    state,
    nonce: randomBytes(12).toString("base64url"),
  });

  const res = await fetch(`${config.authority}/connect/authorize?${params}`, {
    redirect: "manual",
    headers: { Cookie: cookie },
  });

  const merged = mergeSetCookies(cookie, res.headers.getSetCookie());
  const location = res.headers.get("location");
  if (!location) {
    throw new Error(`Silent renew failed: identity server answered ${res.status} without a redirect`);
  }

  const target = new URL(location, config.authority);
  if (!`${target.origin}${target.pathname}`.startsWith(config.redirectUri)) {
    // Never echo the query/fragment: it may carry tokens or error ids.
    throw new Error(`Silent renew failed: unexpected redirect to ${target.origin}${target.pathname}`);
  }

  const fragment = new URLSearchParams(target.hash.slice(1));
  const error = fragment.get("error");
  if (error === "login_required" || error === "interaction_required" || error === "consent_required") {
    throw sessionExpiredError(error);
  }
  if (error) {
    throw new Error(`Silent renew rejected by identity server: ${error}`);
  }
  if (fragment.get("state") !== state) {
    throw new Error("Silent renew failed: state mismatch in authorize response");
  }

  const accessToken = fragment.get("access_token");
  if (!accessToken) {
    throw new Error("Silent renew failed: authorize response carried no access_token");
  }

  const expSec = decodeJwtExpSec(accessToken);
  const expiresIn = Number(fragment.get("expires_in"));
  const expiresAtMs =
    expSec !== undefined
      ? expSec * 1000
      : Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000;

  return { accessToken, expiresAtMs, cookie: merged, cookieRotated: merged !== cookie };
}

/** Apply Set-Cookie headers to a Cookie header string (add/replace/delete by name). */
export function mergeSetCookies(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }

  for (const setCookie of setCookies) {
    const [pair = "", ...attributes] = setCookie.split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();

    const deleted =
      !value ||
      attributes.some((attr) => {
        const sep = attr.indexOf("=");
        const key = (sep === -1 ? attr : attr.slice(0, sep)).trim().toLowerCase();
        const val = sep === -1 ? "" : attr.slice(sep + 1).trim();
        if (key === "max-age") return Number(val) <= 0;
        if (key === "expires") return Date.parse(val) <= Date.now();
        return false;
      });

    if (deleted) jar.delete(name);
    else jar.set(name, value);
  }

  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

export function sessionExpiredError(reason = "login_required"): Error {
  return new Error(
    `ARPSIS session expired (identity server: ${reason}): log in again at https://project.citytech.ec and run \`bun run set-session\` with the new identity.citytech.ec cookie`,
  );
}

function persistRenewal(renewal: SessionRenewal): void {
  try {
    upsertEnvKey("ARPSIS_ACCESS_TOKEN", renewal.accessToken);
    process.env.ARPSIS_ACCESS_TOKEN = renewal.accessToken;
    if (renewal.cookieRotated) {
      upsertEnvKey("ARPSIS_SESSION_COOKIE", renewal.cookie);
      process.env.ARPSIS_SESSION_COOKIE = renewal.cookie;
    }
  } catch (e) {
    // The token still lives in memory for this process; only reuse across restarts is lost.
    log.warn("auth.persist_failed", { reason: e instanceof Error ? e.message : String(e) });
  }
}

function resolveStaticExpiresAtMs(
  token: string,
  envExpiresAtSec: number | undefined,
): number {
  const jwtExpSec = decodeJwtExpSec(token);

  if (jwtExpSec !== undefined) {
    return jwtExpSec * 1000;
  }

  if (envExpiresAtSec !== undefined && Number.isFinite(envExpiresAtSec)) {
    return envExpiresAtSec * 1000;
  }

  return Date.now() + DEFAULT_STATIC_TOKEN_TTL_MS;
}

function staticTokenExpiredError(token: string): Error {
  const jwtExpSec = decodeJwtExpSec(token);
  const hint = "run `bun run set-session` once for automatic renewal, or paste a new ARPSIS_ACCESS_TOKEN in .env";
  if (jwtExpSec !== undefined) {
    const iso = new Date(jwtExpSec * 1000).toISOString();
    return new Error(`ARPSIS access token expired (jwt exp ${iso}, unix ${jwtExpSec}): ${hint}`);
  }
  return new Error(`ARPSIS access token expired: ${hint}`);
}

/** Decode JWT payload `exp` (seconds) without verifying signature — static-token TTL only. */
function decodeJwtExpSec(token: string): number | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return undefined;
  }

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { exp?: unknown };
    if (typeof parsed.exp === "number" && Number.isFinite(parsed.exp)) {
      return parsed.exp;
    }
  } catch {
    // Malformed JWT segment — fall through to env/default TTL.
  }
  return undefined;
}

function sanitizeError(text: string): string {
  return text
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/g, '"refresh_token":"[REDACTED]"')
    .slice(0, 500);
}

/**
 * HTTP-mode provider: the bearer arrives per-request from the client's
 * Authorization header. No refresh, no cache — if the token expires the caller
 * (Cursor / etc.) must renew it and retry.
 */
export class StaticBearerProvider implements TokenProvider {
  readonly supportsRefresh = false;
  constructor(private readonly token: string) {}
  async getAccessToken(): Promise<string> {
    return this.token;
  }
}
