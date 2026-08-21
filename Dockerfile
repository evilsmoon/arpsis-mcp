# syntax=docker/dockerfile:1.7
FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src

# Listen on all interfaces inside the container; expose a single port. TLS
# terminates upstream (reverse proxy / ingress).
ENV ARPSIS_HTTP_HOST=0.0.0.0
ENV ARPSIS_HTTP_PORT=8787
ENV ARPSIS_LOG_LEVEL=info
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1

USER bun
CMD ["bun", "run", "src/server-http.ts"]
