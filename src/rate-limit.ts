// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]
/**
 * In-memory token-bucket rate limiter, keyed by an opaque identifier (typically
 * a hash of the client's bearer token). Independent per-key, so a noisy caller
 * cannot starve others.
 */

import { createHash } from "node:crypto";

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly refillPerMs: number;

  constructor(
    /** Max requests per minute per key. 0 disables the limiter entirely. */
    private readonly rpm: number,
    /** Burst capacity (defaults to rpm). */
    private readonly burst: number = rpm,
  ) {
    this.refillPerMs = rpm / 60_000;
  }

  /**
   * Try to consume one token. Returns { ok: true } on success, or
   * { ok: false, retryAfterSec } when the bucket is empty.
   */
  tryTake(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
    if (this.rpm <= 0) return { ok: true };
    const now = Date.now();
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.burst, lastRefillMs: now };
      this.buckets.set(key, b);
    } else {
      const elapsed = now - b.lastRefillMs;
      if (elapsed > 0) {
        b.tokens = Math.min(this.burst, b.tokens + elapsed * this.refillPerMs);
        b.lastRefillMs = now;
      }
    }

    if (b.tokens >= 1) {
      b.tokens -= 1;
      return { ok: true };
    }

    const missing = 1 - b.tokens;
    const retryAfterSec = Math.max(1, Math.ceil(missing / this.refillPerMs / 1000));
    return { ok: false, retryAfterSec };
  }

  /** Evict entries idle for more than maxIdleMs. Call periodically. */
  sweep(maxIdleMs: number): number {
    const now = Date.now();
    let evicted = 0;
    for (const [key, b] of this.buckets) {
      if (now - b.lastRefillMs > maxIdleMs) {
        this.buckets.delete(key);
        evicted++;
      }
    }
    return evicted;
  }
}

/** Hash a bearer token to a short opaque key safe to log. */
export function hashKey(bearer: string): string {
  return createHash("sha256").update(bearer).digest("hex").slice(0, 16);
}
