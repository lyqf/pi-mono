import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { JsonRpcTransport } from "./nocturne-mcp-memory-client.js";

export interface NocturneStreamableMcpToolTransportOptions {
	readonly mcpUrl: string | URL;
	readonly bearerToken?: string;
}

/**
 * Bridges {@link JsonRpcTransport} to Nocturne (or any MCP server) over Streamable HTTP,
 * mapping `call(method, params)` to MCP `tools/call` and returning concatenated text blocks.
 */
export function createNocturneStreamableMcpToolTransport(
	options: NocturneStreamableMcpToolTransportOptions,
): JsonRpcTransport {
	return new NocturneStreamableMcpToolTransport(options);
}

class NocturneStreamableMcpToolTransport implements JsonRpcTransport {
	private client: Client | undefined;
	private readonly connectOnce: Promise<void>;

	constructor(private readonly options: NocturneStreamableMcpToolTransportOptions) {
		this.connectOnce = this.connect();
	}

	async call(method: string, params: unknown): Promise<unknown> {
		await this.connectOnce;
		const client = this.client;
		if (!client) throw new Error("MCP client failed to initialize");

		const result = await client.callTool({
			name: method,
			arguments: params as Record<string, unknown>,
		});

		if ("isError" in result && result.isError === true) {
			throw new Error(`Nocturne MCP ${method} failed: ${extractContentText(result.content)}`);
		}
		if ("content" in result && result.content !== undefined) {
			return extractContentText(result.content);
		}
		throw new Error(`Nocturne MCP ${method}: unexpected tool result`);
	}

	private async connect(): Promise<void> {
		const url = typeof this.options.mcpUrl === "string" ? new URL(this.options.mcpUrl) : this.options.mcpUrl;
		const token = this.options.bearerToken?.trim();
		const transport = token
			? new StreamableHTTPClientTransport(url, {
					requestInit: {
						headers: new Headers({ Authorization: `Bearer ${token}` }),
					},
				})
			: new StreamableHTTPClientTransport(url);
		const client = new Client({ name: "agent-company-nocturne", version: "0.1.0" });
		await client.connect(transport);
		this.client = client;
	}
}

function extractContentText(content: unknown): string {
	if (!Array.isArray(content)) return String(content ?? "");
	return content
		.map((block) => {
			if (
				block &&
				typeof block === "object" &&
				"type" in block &&
				(block as { type: string }).type === "text" &&
				"text" in block
			) {
				return String((block as { text: string }).text);
			}
			return "";
		})
		.filter(Boolean)
		.join("\n");
}
