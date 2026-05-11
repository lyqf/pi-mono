import type { MemoryRecord } from "./events.js";
import type { MemoryClient, NewMemoryRecord } from "./memory-client.js";

const DEFAULT_PRIORITY = 2;
const DEFAULT_DISCLOSURE = "When reviewing Agent Company task memory";

export interface JsonRpcTransport {
	call(method: string, params: unknown): Promise<unknown>;
}

export interface NocturneMcpMemoryClientOptions {
	readonly transport: JsonRpcTransport;
	readonly now?: () => string;
}

export function createNocturneMcpMemoryClient(options: NocturneMcpMemoryClientOptions): MemoryClient {
	return new NocturneMcpMemoryClient(options.transport, options.now ?? (() => new Date().toISOString()));
}

class NocturneMcpMemoryClient implements MemoryClient {
	constructor(
		private readonly transport: JsonRpcTransport,
		private readonly now: () => string,
	) {}

	async read(uri: string): Promise<MemoryRecord> {
		const content = await this.callText("read_memory", { uri });
		return createMemoryRecord(uri, content, this.now());
	}

	async search(query: string): Promise<readonly MemoryRecord[]> {
		const content = await this.callText("search_memory", { query });
		return extractUris(content).map((uri) => createMemoryRecord(uri, content, this.now()));
	}

	async write(record: NewMemoryRecord): Promise<MemoryRecord> {
		const parts = parseWritableUri(record.uri);
		await this.callText("create_memory", {
			parent_uri: parts.parentUri,
			content: record.content,
			priority: DEFAULT_PRIORITY,
			disclosure: DEFAULT_DISCLOSURE,
			title: parts.title,
		});
		return createMemoryRecord(record.uri, record.content, this.now());
	}

	private async callText(method: string, params: unknown): Promise<string> {
		const response = await this.transport.call(method, params);
		if (typeof response !== "string") throw new Error(`Nocturne MCP ${method} returned non-string response`);
		if (response.startsWith("Error: ")) throw new Error(`Nocturne MCP ${method} failed: ${response.slice(7)}`);
		return response;
	}
}

function createMemoryRecord(uri: string, content: string, createdAt: string): MemoryRecord {
	return { id: uri, uri, content, createdAt };
}

function extractUris(content: string): readonly string[] {
	return Array.from(new Set(content.match(/[a-z]+:\/\/[a-zA-Z0-9_/-]+/g) ?? []));
}

function parseWritableUri(uri: string): { readonly parentUri: string; readonly title: string } {
	const match = uri.match(/^([a-z]+:\/\/)(.*)$/);
	if (!match) throw new Error(`Invalid Nocturne memory URI: ${uri}`);
	const path = match[2] ?? "";
	const segments = path.split("/").filter(Boolean);
	const title = segments[segments.length - 1];
	if (!title) throw new Error(`Nocturne memory URI requires a title: ${uri}`);
	const parentPath = segments.slice(0, -1).join("/");
	return { parentUri: `${match[1]}${parentPath ? `${parentPath}/` : ""}`, title };
}
