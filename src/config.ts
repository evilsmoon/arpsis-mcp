// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

export interface ArpsisConfig {
  authority: string;
  apiBase: string;
  clientId: string;
  clientSecret?: string;
  refreshToken?: string;
  /** Static bearer token fallback when no refresh_token is available */
  accessToken?: string;
  /** @deprecated Optional fallback when JWT has no exp claim; prefer JWT exp */
  accessTokenExpiresAt?: number;
  /**
   * Cookie header for identity.citytech.ec (the browser login session). Lets
   * ArpsisAuth mint fresh access tokens via `prompt=none`, the same silent
   * renew the ARPSIS web app uses — vue.client is implicit-only, so no refresh_token exists.
   */
  sessionCookie?: string;
  /** Must be a redirect_uri registered for clientId; silent renew reads the token from its fragment. */
  redirectUri: string;
  scope: string;
  defaultProjectId?: string;
  defaultDepartmentId?: string;
}

export function loadConfig(): ArpsisConfig {
  const authority = process.env.ARPSIS_AUTHORITY ?? "https://identity.citytech.ec";
  const apiBase = process.env.ARPSIS_API_BASE ?? "https://project.citytech.ec/api/v1";
  const clientId = process.env.ARPSIS_CLIENT_ID ?? "";
  const scope = process.env.ARPSIS_SCOPE ?? "openid profile email projects";

  const accessToken = process.env.ARPSIS_ACCESS_TOKEN;
  const expiresAtRaw = process.env.ARPSIS_ACCESS_TOKEN_EXPIRES_AT;
  const sessionCookie = process.env.ARPSIS_SESSION_COOKIE?.trim() || undefined;

  if (!clientId && !process.env.ARPSIS_REFRESH_TOKEN && !accessToken && !sessionCookie) {
    console.error(
      "ARPSIS MCP: set ARPSIS_CLIENT_ID plus ARPSIS_SESSION_COOKIE, ARPSIS_REFRESH_TOKEN or ARPSIS_ACCESS_TOKEN",
    );
  }

  return {
    authority: authority.replace(/\/$/, ""),
    apiBase: apiBase.replace(/\/$/, ""),
    clientId,
    clientSecret: process.env.ARPSIS_CLIENT_SECRET,
    refreshToken: process.env.ARPSIS_REFRESH_TOKEN,
    accessToken,
    accessTokenExpiresAt: expiresAtRaw ? Number(expiresAtRaw) : undefined,
    sessionCookie,
    redirectUri: process.env.ARPSIS_REDIRECT_URI ?? "https://project.citytech.ec/callback",
    scope,
    defaultProjectId: process.env.ARPSIS_DEFAULT_PROJECT_ID,
    defaultDepartmentId: process.env.ARPSIS_DEFAULT_DEPARTMENT_ID,
  };
}
