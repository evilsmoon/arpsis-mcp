#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/** Merge HAR fixtures → docs/api-map.md + src/generated/endpoints.json */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "fixtures");
const OUT_MD = join(ROOT, "docs", "api-map.md");
const OUT_JSON = join(ROOT, "src", "generated", "endpoints.json");

interface HarEntry {
  request: {
    method: string;
    url: string;
    postData?: { text?: string };
  };
  response?: { status: number };
}

interface HarFile {
  log: { entries: HarEntry[] };
}

interface EndpointRecord {
  method: string;
  url: string;
  path: string;
  host: string;
  sampleBody?: string;
  status?: number;
  sources: string[];
}

const API_HOSTS = new Set(["project.citytech.ec", "identity.citytech.ec"]);
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g;

function redact(text: string): string {
  return text
    .replace(BEARER_RE, "Bearer [REDACTED]")
    .replace(EMAIL_RE, "[EMAIL_MOCK]")
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/g, '"refresh_token":"[REDACTED]"');
}

function endpointKey(method: string, url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "{id}",
    );
    return `${method} ${u.host}${path}`;
  } catch {
    return `${method} ${url}`;
  }
}

async function parseHarFile(filePath: string, source: string, map: Map<string, EndpointRecord>) {
  const raw = await readFile(filePath, "utf-8");
  const har = JSON.parse(raw) as HarFile;

  for (const entry of har.log.entries ?? []) {
    const { method, url } = entry.request;
    if (!url) continue;
    let host: string;
    try {
      host = new URL(url).host;
    } catch {
      continue;
    }
    if (!API_HOSTS.has(host)) continue;
    if (url.includes("/js/") || url.includes(".css") || url.includes(".png")) continue;

    const key = endpointKey(method, url);
    const u = new URL(url);
    const existing = map.get(key);
    const body = entry.request.postData?.text
      ? redact(entry.request.postData.text).slice(0, 2000)
      : undefined;

    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (body && !existing.sampleBody) existing.sampleBody = body;
    } else {
      map.set(key, {
        method,
        url: `${u.origin}${u.pathname}`,
        path: u.pathname,
        host,
        sampleBody: body,
        status: entry.response?.status,
        sources: [source],
      });
    }
  }
}

async function main() {
  const files = (await readdir(FIXTURES)).filter((f) => f.endsWith(".har"));
  if (!files.length) {
    console.warn("No HAR files in fixtures/ — add project.citytech.ec*.har");
    process.exit(0);
  }

  const map = new Map<string, EndpointRecord>();
  for (const f of files) {
    await parseHarFile(join(FIXTURES, f), f, map);
  }

  const endpoints = [...map.values()].sort((a, b) =>
    `${a.host}${a.path}`.localeCompare(`${b.host}${b.path}`),
  );

  await mkdir(dirname(OUT_JSON), { recursive: true });
  await mkdir(dirname(OUT_MD), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(endpoints, null, 2));

  const lines = [
    "# ARPSIS API Map (generated from HAR fixtures)",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Total unique endpoints: ${endpoints.length}`,
    "",
    "| Method | Host | Path | Sources |",
    "|--------|------|------|---------|",
  ];

  for (const e of endpoints) {
    lines.push(`| ${e.method} | ${e.host} | \`${e.path}\` | ${e.sources.join(", ")} |`);
  }

  lines.push("", "## Sample bodies (redacted)", "");
  for (const e of endpoints.filter((x) => x.sampleBody)) {
    lines.push(`### ${e.method} ${e.path}`, "", "```json", e.sampleBody!, "```", "");
  }

  await writeFile(OUT_MD, lines.join("\n"));
  console.log(`Wrote ${endpoints.length} endpoints → ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
