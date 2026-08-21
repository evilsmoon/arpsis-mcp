// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/** Load .env from project root (Cursor MCP cwd may differ from repo). */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface LoadProjectEnvOptions {
  /** When true, values from .env overwrite existing process.env (used on token reload). */
  overwrite?: boolean;
}

export function loadProjectEnv(options?: LoadProjectEnvOptions): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const overwrite = options?.overwrite === true;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (overwrite || process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

// Side-effect: load .env as soon as this module is imported (before other local imports).
loadProjectEnv();
