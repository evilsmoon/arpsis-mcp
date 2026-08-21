# arpsis-mcp

MCP server for [ARPSIS](https://project.citytech.ec) (CityTech project management).

Transport: **stdio** (same pattern as the [MCP TypeScript server guide](https://modelcontextprotocol.io/docs/develop/build-server)) — Cursor spawns a subprocess and talks JSON-RPC over stdin/stdout. There is no HTTP port or shared IP to configure.

## Setup

1. Copy `.env.example` → `.env` and fill credentials (never commit `.env`).
2. Place HAR fixtures in `fixtures/` (gitignored) or run capture from Chrome.
3. `bun install`
4. Register in `%USERPROFILE%\.cursor\mcp.json` (see below).

### Environment variables

| Variable | Description |
|----------|-------------|
| `ARPSIS_AUTHORITY` | `https://identity.citytech.ec` |
| `ARPSIS_API_BASE` | `https://project.citytech.ec/api/v1` |
| `ARPSIS_CLIENT_ID` | OIDC client id from Local Storage (`vue.client`) |
| `ARPSIS_REFRESH_TOKEN` | Refresh token from OIDC storage (recommended) |
| `ARPSIS_ACCESS_TOKEN` | Static bearer token when no refresh token (short sessions) |
| `ARPSIS_ACCESS_TOKEN_EXPIRES_AT` | **Optional / deprecated** — expiry is read from JWT `exp` automatically |
| `ARPSIS_SCOPE` | OIDC scopes (default: `openid profile email projects`) |

### Auth modes

1. **`ARPSIS_REFRESH_TOKEN`** (best) — MCP refreshes access tokens automatically.
2. **`ARPSIS_ACCESS_TOKEN`** — paste `access_token` from browser OIDC storage; expiry comes from the JWT `exp` claim. Update `.env` when it expires (~1 h). The server re-reads `.env` on each API call, so you do **not** need to restart Cursor after updating the token.
3. **`ARPSIS_CLIENT_SECRET`** — client credentials (confidential clients only).

#### Getting tokens from the browser

1. Log in to [ARPSIS](https://project.citytech.ec).
2. Chrome DevTools → **Application** → **Local Storage** → `https://project.citytech.ec`.
3. Find key `oidc.user:https://identity.citytech.ec:vue.client` (JSON).
4. Copy `access_token` → `ARPSIS_ACCESS_TOKEN` in your local `.env`.
5. If the JSON includes `refresh_token`, copy it to `ARPSIS_REFRESH_TOKEN` instead.

**No `refresh_token` in storage?** The SPA may not request the `offline_access` scope on login. Ensure `ARPSIS_SCOPE` includes `offline_access`, log out/in, and check storage again. Until then, use `ARPSIS_ACCESS_TOKEN` and renew manually.

### Cursor MCP config

```json
{
  "mcpServers": {
    "arpsis": {
      "command": "bun",
      "args": ["--cwd", "C:/path/to/arpsis-mcp", "run", "src/index.ts"],
      "env": {
        "ARPSIS_AUTHORITY": "https://identity.citytech.ec",
        "ARPSIS_API_BASE": "https://project.citytech.ec/api/v1"
      }
    }
  }
}
```

Put secrets (`ARPSIS_REFRESH_TOKEN`, `ARPSIS_ACCESS_TOKEN`, `ARPSIS_CLIENT_ID`) in `.env` or Windows user environment variables — **not** in committed `mcp.json`.

## Uso multi-usuario / compartir el MCP

This repo is safe to share (no secrets). Each developer runs their **own** MCP subprocess with **their own** credentials — same model as GitLab MCP with a personal access token.

| Do | Don't |
|----|-------|
| Clone the repo; each person copies `.env.example` → `.env` | Commit `.env` or paste tokens in the repo |
| Put tokens in local `.env` or OS env vars / `mcp.json` `env` on your machine | Share one team token in git or Slack |
| Use `ARPSIS_REFRESH_TOKEN` or your own `ARPSIS_ACCESS_TOKEN` | Run one shared MCP server with everyone's data |

### Per-developer setup (stdio)

1. Clone `arpsis-mcp` to a local path (any path works).
2. `bun install`
3. Create `.env` with **your** OIDC tokens (see above).
4. Add to **your** `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "arpsis": {
      "command": "C:/Users/you/.bun/bin/bun.exe",
      "args": ["--cwd", "C:/Users/you/arpsis-mcp", "run", "src/index.ts"]
    }
  }
}
```

Cursor starts one isolated process per user. No port, no Docker, no central server — identical to [MCP stdio servers](https://modelcontextprotocol.io/docs/develop/build-server).

### Server mode (HTTP / SSE)

Since v2 there is also an HTTP transport for centrally-hosted deployments. Each request must carry the user's own ARPSIS bearer in the `Authorization` header — the server never persists tokens.

```bash
bun run start-http   # listens on 127.0.0.1:8787 by default
```

`ARPSIS_HTTP_PORT` / `ARPSIS_HTTP_HOST` in `.env` override the defaults. Only `ARPSIS_AUTHORITY` and `ARPSIS_API_BASE` are read from `.env` in HTTP mode — the auth tokens (`ARPSIS_REFRESH_TOKEN`, `ARPSIS_ACCESS_TOKEN`, `ARPSIS_CLIENT_SECRET`) are ignored server-side because the token comes per-request from the client.

Endpoints:
- `POST /mcp` — MCP JSON-RPC over Streamable HTTP (stateless).
- `GET /health` — liveness probe.

TLS is out of scope for the process itself. Front it with Caddy / nginx / Cloudflare Tunnel and terminate TLS there.

Cursor config for the HTTP server:

```json
{
  "mcpServers": {
    "arpsis-remote": {
      "url": "https://arpsis-mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_ARPSIS_ACCESS_TOKEN>"
      }
    }
  }
}
```

Since there's no refresh in HTTP mode, when the ARPSIS token expires you paste a fresh one into `mcp.json` (or your secret manager) — Cursor will send the new value on the next request.

#### Rate limiting & logging

- **Rate limit**: token-bucket per bearer (sha-256 hashed for logging), configurable via `ARPSIS_HTTP_RPM` (requests/min per user, default 120, `0` disables). Exceeding the limit returns `429` with a `Retry-After` header.
- **Logs**: JSON lines to stderr. Level controlled by `ARPSIS_LOG_LEVEL` (`debug` / `info` / `warn` / `error`, default `info`). Bearer tokens and JWTs are redacted automatically; only the short hash appears in logs.

### Docker

```bash
docker build -t arpsis-mcp .
docker run --rm -p 8787:8787 \
  -e ARPSIS_AUTHORITY=https://identity.citytech.ec \
  -e ARPSIS_API_BASE=https://project.citytech.ec/api/v1 \
  arpsis-mcp
```

The image runs as non-root (`bun` user), sets `ARPSIS_HTTP_HOST=0.0.0.0` for container networking, and includes a `HEALTHCHECK` against `/health`. Front it with a TLS-terminating reverse proxy in production.

### Token reload without restart

When you update `ARPSIS_ACCESS_TOKEN` in `.env`, the next MCP tool call reloads the file automatically. Restart MCP only if you change `mcp.json` or the server crashes.

## Scripts

- `bun run start` — start MCP server (stdio; waits silently — normal)
- `bun run smoke-test` — auth + API smoke checks
- `bun run parse-har` — merge HAR fixtures → `docs/api-map.md`
- `bun run typecheck` — TypeScript check

## Tools (v1)

Read: project, functionals, sprints, schedule, my assignments, notifications, desk, users.

Write: create activity, follow-up comment with @mention, update activity status, mark notifications read.
