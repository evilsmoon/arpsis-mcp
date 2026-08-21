// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import { loadConfig, type ArpsisConfig } from "./config.js";
import { loadProjectEnv } from "./load-env.js";

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

  constructor(config: ArpsisConfig) {
    this.refreshToken = config.refreshToken;
  }

  async getAccessToken(): Promise<string> {
    const config = this.reloadEnvAndConfig();

    const staticToken = this.getValidStaticToken(config);
    if (staticToken) {
      return staticToken;
    }

    if (this.accessToken && Date.now() < this.expiresAt - EXPIRY_SKEW_MS) {
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

    if (staticAccessToken && !hasRefresh && !hasClientSecret) {
      throw staticTokenExpiredError(staticAccessToken);
    }

    if (!hasRefresh && !hasClientSecret) {
      throw new Error(
        "missing ARPSIS_ACCESS_TOKEN: set ARPSIS_ACCESS_TOKEN, ARPSIS_REFRESH_TOKEN, or ARPSIS_CLIENT_SECRET in .env or MCP env",
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
    if (!token) {
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
  if (jwtExpSec !== undefined) {
    const iso = new Date(jwtExpSec * 1000).toISOString();
    return new Error(
      `ARPSIS access token expired (jwt exp ${iso}, unix ${jwtExpSec}): paste a new ARPSIS_ACCESS_TOKEN in .env or set ARPSIS_REFRESH_TOKEN`,
    );
  }
  return new Error(
    "ARPSIS access token expired: paste a new ARPSIS_ACCESS_TOKEN in .env or set ARPSIS_REFRESH_TOKEN",
  );
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
