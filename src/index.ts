#!/usr/bin/env bun
// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import "./load-env.js";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ArpsisAuth } from "./auth.js";
import { ArpsisClient } from "./client.js";
import { registerArpsisTools } from "./tools/index.js";

async function main() {
  const config = loadConfig();
  const auth = new ArpsisAuth(config);
  const client = new ArpsisClient(config, auth);

  const server = new McpServer({
    name: "arpsis-mcp",
    version: "1.0.0",
  });

  registerArpsisTools(server, client, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("arpsis-mcp fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
