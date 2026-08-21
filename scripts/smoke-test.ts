#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import "../src/load-env.js";
import { loadConfig } from "../src/config.js";
import { ArpsisAuth } from "../src/auth.js";
import { ArpsisClient } from "../src/client.js";

interface SmokeResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function runSmokeTest(): Promise<number> {
  const config = loadConfig();
  const results: SmokeResult[] = [];

  if (!config.accessToken && !config.refreshToken && !config.clientSecret) {
    console.error(
      "Missing auth: add ARPSIS_ACCESS_TOKEN (or ARPSIS_REFRESH_TOKEN) to .env",
    );
    return 1;
  }

  if (!config.defaultProjectId) {
    console.error("Missing ARPSIS_DEFAULT_PROJECT_ID in .env");
    return 1;
  }

  const auth = new ArpsisAuth(config);
  const client = new ArpsisClient(config, auth);

  async function check(name: string, fn: () => Promise<string>): Promise<void> {
    try {
      const detail = await fn();
      results.push({ name, ok: true, detail });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, ok: false, detail: redactSecrets(message) });
    }
  }

  await check("GET connect/userinfo", async () => {
    const info = await client.getUserInfo();
    const sub = typeof info.sub === "string" ? info.sub : "(unknown)";
    return `sub=${sub.slice(0, 8)}…`;
  });

  await check(`GET /Projects/${config.defaultProjectId}`, async () => {
    const project = await client.get<Record<string, unknown>>(
      `/Projects/${config.defaultProjectId}`,
    );
    const name = typeof project.name === "string" ? project.name : "(no name)";
    return `name=${truncate(name, 40)}`;
  });

  await check("GET /Activities/User", async () => {
    const items = await client.get<unknown[]>("/Activities/User");
    const count = Array.isArray(items) ? items.length : 0;
    return `assignments=${count}`;
  });

  await check("GET /ProjectTraces/Notifications/UnreadCount", async () => {
    const payload = await client.get<unknown>("/ProjectTraces/Notifications/UnreadCount");
    if (typeof payload === "number") return `unread=${payload}`;
    if (typeof payload === "object" && payload !== null && "count" in payload) {
      return `unread=${String((payload as { count: unknown }).count)}`;
    }
    return `unread=${JSON.stringify(payload)}`;
  });

  await check("GET /activityStatuss/list", async () => {
    const items = await client.get<unknown[]>("/activityStatuss/list");
    const count = Array.isArray(items) ? items.length : 0;
    return `activityStatuses=${count}`;
  });

  await check("GET /Requirements", async () => {
    const items = await client.get<unknown>("/Requirements", {
      projectId: config.defaultProjectId,
      page: 1,
      pageSize: 5,
    });
    const count = countItems(items);
    return `requirements=${count}`;
  });

  await check("GET /Dailies", async () => {
    const items = await client.get<unknown>("/Dailies");
    return `dailies=${countItems(items)}`;
  });

  await check("GET /StickyNotes", async () => {
    const items = await client.get<unknown>("/StickyNotes");
    return `stickyNotes=${countItems(items)}`;
  });

  await check("GET /systems/all", async () => {
    const items = await client.get<unknown[]>("/systems/all");
    return `systems=${Array.isArray(items) ? items.length : 0}`;
  });

  await check("GET /SprintImpediments", async () => {
    const items = await client.get<unknown>("/SprintImpediments");
    return `impediments=${countItems(items)}`;
  });

  await check("GET /ActivitiesElapsed/SummaryParameters", async () => {
    const payload = await client.get<unknown>("/ActivitiesElapsed/SummaryParameters");
    return payload && typeof payload === "object" ? "ok" : "empty";
  });

  await check("GET /TestRuns/TestCases/Owner (auto ownerId)", async () => {
    const info = await client.getUserInfo();
    const sub = typeof info.sub === "string" ? info.sub : "";
    if (!sub) return "skipped (no sub in userinfo)";
    const qs = `?query=&projectId=&ownerId=${sub}&page=1&pageSize=10&issueStatuss=4`;
    const items = await client.get<unknown>(`/TestRuns/TestCases/Owner${qs}`);
    return `ownedTestCases=${countItems(items)}`;
  });

  await check("GET /Calendars/months (current month)", async () => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-28`;
    const payload = await client.get<unknown>(`/Calendars/months/${from}/${to}`);
    return payload ? "ok" : "empty";
  });

  console.log("\nARPSIS MCP smoke test\n");
  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.name} — ${r.detail}`);
    if (!r.ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed\n`);

  return failed > 0 ? 1 : 0;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function countItems(payload: unknown): number | string {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data.length;
    if (Array.isArray(rec.items)) return rec.items.length;
    if (typeof rec.total === "number") return rec.total;
  }
  return "?";
}

function redactSecrets(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, "Bearer [REDACTED]")
    .replace(/eyJ[A-Za-z0-9\-._~+/]*/g, "[JWT_REDACTED]")
    .slice(0, 300);
}

const code = await runSmokeTest();
process.exit(code);
