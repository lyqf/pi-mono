#!/usr/bin/env node
import { startAgentCompanyMemoryBridge } from "./memory-bridge-http-server.js";
import { createNocturneMcpMemoryClient } from "./nocturne-mcp-memory-client.js";
import { createNocturneStreamableMcpToolTransport } from "./nocturne-streamable-mcp-tool-transport.js";

/** Streamable MCP endpoint (Nocturne default: http://127.0.0.1:8233/mcp). */
export const NOCTURNE_MCP_URL = "NOCTURNE_MCP_URL";
/** Optional Bearer token when Nocturne auth is enabled. */
export const NOCTURNE_MCP_BEARER_TOKEN = "NOCTURNE_MCP_BEARER_TOKEN";
/** Local HTTP port for POST /read /search /write (default 8788). */
export const AGENT_COMPANY_MEMORY_BRIDGE_PORT = "AGENT_COMPANY_MEMORY_BRIDGE_PORT";

export async function runMemoryBridgeCli(env: NodeJS.ProcessEnv = process.env): Promise<void> {
	const mcpUrl = env[NOCTURNE_MCP_URL]?.trim() ?? "http://127.0.0.1:8233/mcp";
	const bearerToken = env[NOCTURNE_MCP_BEARER_TOKEN]?.trim();
	const portRaw = env[AGENT_COMPANY_MEMORY_BRIDGE_PORT]?.trim() ?? "8788";
	const port = Number(portRaw);
	if (!Number.isInteger(port) || port < 0)
		throw new Error(`${AGENT_COMPANY_MEMORY_BRIDGE_PORT} must be a non-negative integer`);

	const transport = createNocturneStreamableMcpToolTransport({ mcpUrl, bearerToken });
	const memory = createNocturneMcpMemoryClient({ transport });

	const handle = await startAgentCompanyMemoryBridge({ memory, port });
	console.log(`Agent Company memory bridge listening at ${handle.url}`);
	console.log(`Set AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL=${handle.url}`);

	const shutdown = async () => {
		await handle.stop();
		process.exit(0);
	};
	process.once("SIGINT", () => void shutdown());
	process.once("SIGTERM", () => void shutdown());
}

function isBridgeEntrypoint(modulePath: string, argvPath: string | undefined): boolean {
	return modulePath.endsWith("memory-bridge-cli.js") || argvPath?.includes("agent-company-memory-bridge") === true;
}

if (isBridgeEntrypoint(import.meta.url, process.argv[1])) {
	runMemoryBridgeCli().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
