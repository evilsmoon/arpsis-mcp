// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import type { ArpsisConfig } from "./config.js";
import type { TokenProvider } from "./auth.js";

export interface ApiEnvelope<T = unknown> {
  code: number;
  data: T;
  message: string | null;
}

export class ArpsisClient {
  constructor(
    private readonly config: ArpsisConfig,
    private readonly auth: TokenProvider,
  ) {}

  async get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async getUserInfo(): Promise<Record<string, unknown>> {
    const token = await this.auth.getAccessToken();
    const res = await fetch(`${this.config.authority}/connect/userinfo`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Userinfo failed (${res.status})`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let url: URL;
    if (path.startsWith("http")) {
      url = new URL(path);
    } else if (path.includes("?")) {
      url = new URL(`${this.config.apiBase}${path.startsWith("/") ? path : `/${path}`}`);
    } else {
      url = new URL(
        `${this.config.apiBase}${path.startsWith("/") ? path : `/${path}`}`,
      );
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined && v !== "") {
            url.searchParams.append(k, String(v));
          }
        }
      }
    }

    const doFetch = async (token: string) =>
      fetch(url.toString(), {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

    let token = await this.auth.getAccessToken();
    let res = await doFetch(token);

    if (res.status === 401 && this.auth.supportsRefresh && this.auth.refresh) {
      this.auth.invalidate?.();
      token = await this.auth.refresh();
      res = await doFetch(token);
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`API ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
    }

    if (!text) return {} as T;
    const parsed = JSON.parse(text) as ApiEnvelope<T> | T;
    if (typeof parsed === "object" && parsed !== null && "code" in parsed && "data" in parsed) {
      const envelope = parsed as ApiEnvelope<T>;
      if (envelope.code !== 0 && envelope.code !== 200) {
        throw new Error(envelope.message ?? `API error code ${envelope.code}`);
      }
      return envelope.data;
    }
    return parsed as T;
  }
}

export function buildMentionHtml(userId: string, email: string, label: string): string {
  const safeLabel = label.startsWith("@") ? label : `@${label}`;
  return `<p><span data-type="mention" class="mention" data-id="${userId}|${email}" data-label="${safeLabel}">${safeLabel}</span> </p>`;
}

export function wrapCommentHtml(text: string, mentions?: Array<{ userId: string; email: string; label: string }>): string {
  if (!mentions?.length) {
    return `<p>${escapeHtml(text)}</p>`;
  }
  const parts = mentions.map((m) =>
    `<span data-type="mention" class="mention" data-id="${m.userId}|${m.email}" data-label="${m.label.startsWith("@") ? m.label : `@${m.label}`}">${m.label.startsWith("@") ? m.label : `@${m.label}`}</span>`,
  );
  return `<p>${escapeHtml(text)} ${parts.join(" ")} </p>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
