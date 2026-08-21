#!/usr/bin/env bun
/**
 * One-shot helper: writes .env from OIDC JSON in parent chat transcript.
 * Does not print tokens.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const transcriptPath =
  process.argv[2] ??
  "C:\\Users\\Administrator\\.cursor\\projects\\c-Users-Administrator-Documents-CITYTECH-workspace\\agent-transcripts\\bd0c1cc6-dc54-46af-bf60-868aaa5da1bc\\bd0c1cc6-dc54-46af-bf60-868aaa5da1bc.jsonl";

const outPath = join(import.meta.dir, "..", ".env");

const raw = readFileSync(transcriptPath, "utf8");
const lines = raw.split("\n").filter(Boolean);

let oidc: {
  access_token?: string;
  expires_at?: number;
} | null = null;

for (const line of lines) {
  try {
    const row = JSON.parse(line) as {
      role?: string;
      message?: { content?: Array<{ type?: string; text?: string }> };
    };
    if (row.role !== "user") continue;

    const text =
      row.message?.content?.find((c) => c.type === "text" || c.text)?.text ?? "";
    if (!text.includes("access_token")) continue;

    const match = text.match(/"access_token":"(eyJ[^"]+)"/);
    const expiresMatch = text.match(/"expires_at":(\d+)/);
    if (match?.[1]) {
      oidc = {
        access_token: match[1],
        expires_at: expiresMatch ? Number(expiresMatch[1]) : undefined,
      };
    }
  } catch {
    // skip malformed lines
  }
}

if (!oidc?.access_token) {
  console.error("Could not extract access_token from transcript");
  process.exit(1);
}

const env = `# ARPSIS MCP — local only (gitignored)
ARPSIS_AUTHORITY=https://identity.citytech.ec
ARPSIS_API_BASE=https://project.citytech.ec/api/v1
ARPSIS_CLIENT_ID=vue.client
ARPSIS_SCOPE=openid profile services offline_access roles

ARPSIS_DEFAULT_PROJECT_ID=0e166a8e-5a79-4f2d-a69c-2fcbf894bf34
ARPSIS_DEFAULT_DEPARTMENT_ID=b99808e4-87d7-46f5-a09c-99926ecc3681

# Static bearer fallback (no refresh_token in OIDC session)
# Expiry is read from JWT exp — ARPSIS_ACCESS_TOKEN_EXPIRES_AT not required
ARPSIS_ACCESS_TOKEN=${oidc.access_token}
`;

writeFileSync(outPath, env, "utf8");
console.log(`.env written at ${outPath} (token redacted in output)`);
