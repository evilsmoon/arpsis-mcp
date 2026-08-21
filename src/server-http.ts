#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import "./load-env.js";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { StaticBearerProvider } from "./auth.js";
import { ArpsisClient } from "./client.js";
import { registerArpsisTools } from "./tools/index.js";
import { log } from "./log.js";
import { RateLimiter, hashKey } from "./rate-limit.js";

const PORT = Number(process.env.ARPSIS_HTTP_PORT ?? 8787);
const HOST = process.env.ARPSIS_HTTP_HOST ?? "127.0.0.1";
const RPM = Number(process.env.ARPSIS_HTTP_RPM ?? 120);

const baseConfig = loadConfig();
const limiter = new RateLimiter(RPM);

// Evict idle buckets every 5 min so long-running processes don't leak memory
// for bearers that never come back.
const sweepTimer = setInterval(() => {
  const evicted = limiter.sweep(5 * 60_000);
  if (evicted > 0) log.debug("ratelimit.sweep", { evicted });
}, 5 * 60_000);
sweepTimer.unref();

function extractBearer(header: string | string[] | undefined): string | null {
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function jsonError(res: ServerResponse, status: number, message: string, extraHeaders?: Record<string, string>): void {
  if (res.headersSent) return;
  res.writeHead(status, { "content-type": "application/json", ...(extraHeaders ?? {}) });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: status === 401 ? -32001 : -32000, message },
      id: null,
    }),
  );
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startedAt = Date.now();
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    log.warn("http.mcp.unauthorized", { remoteAddr: req.socket.remoteAddress });
    jsonError(res, 401, "missing bearer token in Authorization header");
    return;
  }

  const key = hashKey(token);
  const allowed = limiter.tryTake(key);
  if (!allowed.ok) {
    log.warn("http.mcp.ratelimited", { key, retryAfterSec: allowed.retryAfterSec, rpm: RPM });
    jsonError(res, 429, `rate limit exceeded — retry in ${allowed.retryAfterSec}s`, {
      "retry-after": String(allowed.retryAfterSec),
    });
    return;
  }

  const provider = new StaticBearerProvider(token);
  const client = new ArpsisClient(baseConfig, provider);
  const server = new McpServer({ name: "arpsis-mcp", version: "1.0.0" });
  registerArpsisTools(server, client, baseConfig);

  // Stateless mode: no session id, every request is independent — required for
  // per-user bearer isolation (a session id would let two callers share state).
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close().catch(() => {});
    void server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    const body = await readBody(req);
    await transport.handleRequest(req, res, body);
    log.info("http.mcp.ok", { key, ms: Date.now() - startedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("http.mcp.error", { key, ms: Date.now() - startedAt, message });
    jsonError(res, 500, message);
  }
}

const httpServer = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (url.pathname !== "/mcp") {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }

  handleMcp(req, res).catch((err) => {
    log.error("http.unhandled", { message: err instanceof Error ? err.message : String(err) });
    jsonError(res, 500, "internal error");
  });
});

httpServer.listen(PORT, HOST, () => {
  log.info("http.listen", { host: HOST, port: PORT, rpm: RPM, url: `http://${HOST}:${PORT}/mcp` });
});

function shutdown(signal: string): void {
  log.info("http.shutdown", { signal });
  httpServer.close(() => process.exit(0));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
