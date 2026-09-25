// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/**
 * Single-key .env writer shared by the token scripts and ArpsisAuth's silent
 * renew. Rewrites only the first `KEY=` line (or appends one) and leaves every
 * other line — comments, ordering, line endings — untouched.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Same location load-env.ts reads from: the project root, not the process cwd. */
export const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");

export interface UpsertResult {
  /** true when an existing line was rewritten, false when a new line was appended */
  replaced: boolean;
  /** how many `KEY=` lines existed before the write (load-env only honours the first) */
  duplicates: number;
}

export function upsertEnvKey(key: string, value: string, envPath: string = ENV_PATH): UpsertResult {
  const original = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  const keyLine = new RegExp(`^\\s*${key}\\s*=`);

  const duplicates = lines.filter((l) => keyLine.test(l)).length;
  const index = lines.findIndex((l) => keyLine.test(l));

  if (index !== -1) {
    lines[index] = `${key}=${value}`;
  } else {
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`${key}=${value}`, "");
  }

  writeFileSync(envPath, lines.join(eol), "utf8");
  return { replaced: index !== -1, duplicates };
}
