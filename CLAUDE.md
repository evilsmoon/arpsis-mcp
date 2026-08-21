# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Runtime is **Bun** (not Node), so scripts execute TypeScript directly with no build step.

- `bun install` — install dependencies (uses `bun.lock`, not `package-lock.json`)
- `bun run start` — start the MCP server over **stdio** (Cursor spawns as subprocess). Waits silently for JSON-RPC on stdin.
- `bun run start-http` — start the MCP server over **HTTP+SSE** (`StreamableHTTPServerTransport`) on `ARPSIS_HTTP_HOST:ARPSIS_HTTP_PORT` (default `127.0.0.1:8787`). Multi-tenant: each request carries its own `Authorization: Bearer <arpsis-token>`.
- `bun run smoke-test` — end-to-end auth + API checks against real ARPSIS. Requires `ARPSIS_DEFAULT_PROJECT_ID` and one of `ARPSIS_ACCESS_TOKEN` / `ARPSIS_REFRESH_TOKEN` / `ARPSIS_CLIENT_SECRET` in `.env`. Only exercises stdio-mode auth; HTTP mode has no smoke test yet.
- `bun run parse-har` — regenerate `docs/api-map.md` + `src/generated/endpoints.json` from every `fixtures/*.har`. Run this after dropping a new HAR capture.
- `bun run typecheck` — `tsc --noEmit`. The only static gate (no linter, no unit tests).
- `scripts/start-mcp.ps1` — Windows launcher used by `mcp.json`. The `Set-Location` step exists because Bun 1.3.x's `--cwd PATH` form (space-separated) is broken; only `--cwd=PATH` works.

There is no test framework. `bun run smoke-test` is the closest thing — it exercises real endpoints against `ARPSIS_API_BASE` with the developer's own token.

## Architecture

The MCP server is a thin translator from MCP tool calls to ARPSIS REST calls. It supports **two transports** that share the same tool implementations:

```
stdio:  Cursor → stdio JSON-RPC → McpServer → tool handler → ArpsisClient → ArpsisAuth (refresh/cache)
HTTP:   Cursor → POST /mcp (Bearer) → per-request McpServer → tool handler → ArpsisClient → StaticBearerProvider
```

Both flow through the same `ArpsisClient` and tool handlers — only the `TokenProvider` differs.

### Files under `src/`

- **`load-env.ts`** — hand-rolled `.env` parser. Runs as a side effect on import (before other local imports resolve), and again with `overwrite: true` inside `ArpsisAuth.reloadEnvAndConfig` so stdio users can paste a new `ARPSIS_ACCESS_TOKEN` into `.env` without restarting the subprocess. HTTP mode does **not** rely on this — its bearer comes per-request from the header.
- **`config.ts`** — pure env→`ArpsisConfig` mapping with URL trailing-slash normalization. No I/O. The `if (!clientId && ...)` warning goes to `console.error` (stderr is fine over stdio; stdout is reserved for JSON-RPC).
- **`auth.ts`** — exports the `TokenProvider` interface (`getAccessToken()` + `supportsRefresh` + optional `invalidate` / `refresh`) and two implementations:
  1. `ArpsisAuth` (`supportsRefresh = true`) — used by stdio. Cached in-process, three code paths:
     - Static `ARPSIS_ACCESS_TOKEN` — expiry from JWT `exp` claim (`decodeJwtExpSec`), fallback `ARPSIS_ACCESS_TOKEN_EXPIRES_AT` (deprecated), else 1 h TTL. When expired, `staticTokenExpiredError` reports the ISO timestamp.
     - `ARPSIS_REFRESH_TOKEN` — `grant_type=refresh_token`. A rotated `refresh_token` from the response replaces `this.refreshToken` in memory only (never written back to `.env`).
     - `ARPSIS_CLIENT_SECRET` alone — `grant_type=client_credentials`. Confidential clients only.
     `EXPIRY_SKEW_MS = 30_000` refreshes 30 s early. `sanitizeError` redacts tokens from any 4xx/5xx body before logs.
  2. `StaticBearerProvider` (`supportsRefresh = false`) — used by HTTP. Wraps the bearer from the request header and returns it unchanged. No cache, no refresh: if the token expires the caller must send a new one.
- **`client.ts`** — `ArpsisClient` takes a `TokenProvider` (not `ArpsisAuth` directly) so both transports share it. Two things every caller must know:
  1. The API wraps responses in `{code, data, message}` (`ApiEnvelope<T>`). The client unwraps and returns `data`; `code !== 0 && code !== 200` throws `envelope.message`. Some endpoints skip the envelope — the client detects that and returns the raw JSON. Tool handlers never see the envelope shape.
  2. On `401`, if `provider.supportsRefresh && provider.refresh`, `invalidate()` clears the cache, `refresh()` runs, and the request retries **exactly once**. HTTP mode has `supportsRefresh: false`, so the 401 propagates to the caller — no futile server-side retry.
  `buildMentionHtml` / `wrapCommentHtml` produce the exact HTML shape ARPSIS's rich-text editor emits (`<span data-type="mention" ...>`). Comments posted without this markup will not render as mentions — do not reformat.
- **`tools/index.ts`** — one long registration file (~1100 lines, ~48 tools). Every handler follows the same shape: Zod schema → `client.get/post/put(...)` → `jsonResult(data)` or `errorResult(err.message)`. `defaultProjectId` / `defaultDepartmentId` from config are used as fallbacks when the tool caller omits them. When adding a tool, match `arpsis_<verb>_<noun>`. The single lookup tool `arpsis_get_lookups({ catalog: enum(...) })` covers all 6 status/catalog endpoints in one registration — mirror this pattern when adding more trivial catalogs instead of one tool per endpoint. `resolveCurrentUserId(client)` at the bottom of the file resolves the caller's `sub` from `/connect/userinfo` — use it whenever a tool needs to default a `developerId`/`ownerId` to "the current user".
- **`index.ts`** — stdio entry point. Constructs `ArpsisAuth`, wires `ArpsisClient`, calls `registerArpsisTools`, connects to `StdioServerTransport`.
- **`server-http.ts`** — HTTP entry point. Reads bearer from `Authorization`, hashes it via `hashKey`, checks the rate limiter, constructs a **per-request** `McpServer` + `ArpsisClient` + `StaticBearerProvider`, and drives `StreamableHTTPServerTransport` in stateless mode (`sessionIdGenerator: undefined`). Stateless is required so two callers cannot share session state. Binds `127.0.0.1` by default; TLS is expected to terminate at an upstream reverse proxy.
- **`log.ts`** — structured JSON-lines logger to stderr. `ARPSIS_LOG_LEVEL` (`debug|info|warn|error`, default `info`). Automatically redacts `Bearer …`, JWTs, and any field whose name matches `/token|secret|authorization/i`. Bearer tokens must never reach logs — use `hashKey(bearer)` (short sha-256 slice) as the identifier instead.
- **`rate-limit.ts`** — in-memory token-bucket keyed by an opaque string (typically `hashKey(bearer)`). `ARPSIS_HTTP_RPM` (default 120, `0` disables). `sweep(maxIdleMs)` evicts idle buckets — `server-http.ts` runs it every 5 min so long-running processes don't leak memory for one-shot callers.

`src/generated/endpoints.json` and `docs/api-map.md` are **generated** by `scripts/parse-har.ts` from HAR captures in `fixtures/` — never edit them by hand. HAR fixtures are gitignored; only the redacted derived artifacts ship. `parse-har.ts` redacts `Bearer …` tokens, emails, and `access_token`/`refresh_token` fields before writing.

`Dockerfile` (+ `.dockerignore`) packages the HTTP mode: multi-stage `oven/bun:1-slim`, non-root `bun` user, `ARPSIS_HTTP_HOST=0.0.0.0` for container networking, `HEALTHCHECK` against `/health`. TLS terminates upstream.

## Conventions

- ESM only (`"type": "module"` in `package.json`), Node16 module resolution, so all local imports use `.js` extensions even though the source is `.ts` (see the imports in `src/index.ts`).
- All source files start with `// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]` — preserve this header on new files.
- Never write to `stdout` from server code. That channel is JSON-RPC in stdio mode. Diagnostics go to `stderr` via `log.*` (JSON lines) or `console.error` (legacy — prefer `log`).
- Never commit `.env` or `fixtures/*.har`. `.gitignore` covers both.
- When adding a new write tool, check whether the HAR sample body has a nested payload (e.g. `PUT /Sprints/:id` sends the whole sprint including groups + requirements). Prefer a small quirurgical tool over a full-replace `PUT` where possible; when a full-replace is unavoidable, warn in the tool `description` that the caller must fetch → mutate → send (see `arpsis_update_sprint`).
