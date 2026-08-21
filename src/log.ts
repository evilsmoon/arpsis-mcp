// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

const envLevel = (process.env.ARPSIS_LOG_LEVEL ?? "info").toLowerCase() as Level;
const threshold = LEVELS.indexOf(envLevel) === -1 ? LEVELS.indexOf("info") : LEVELS.indexOf(envLevel);

const BEARER_RE = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g;
const JWT_RE = /eyJ[A-Za-z0-9\-._~+/=]{20,}/g;

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(BEARER_RE, "Bearer [REDACTED]").replace(JWT_RE, "[JWT_REDACTED]");
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value)) return value.map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = /token|secret|authorization/i.test(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  return value;
}

function emit(level: Level, event: string, fields?: Record<string, unknown>): void {
  if (LEVELS.indexOf(level) < threshold) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  };
  process.stderr.write(JSON.stringify(line) + "\n");
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
