import type { MemoryRecord } from "./events.js";
import type { MemoryClient, NewMemoryRecord } from "./memory-client.js";

export type FetchFn = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface NocturneHttpMemoryClientOptions {
	readonly baseUrl: string;
	readonly fetchFn?: FetchFn;
}

export function createNocturneHttpMemoryClient(options: NocturneHttpMemoryClientOptions): MemoryClient {
	return new NocturneHttpMemoryClient(options.baseUrl, options.fetchFn ?? fetch);
}

class NocturneHttpMemoryClient implements MemoryClient {
	private readonly baseUrl: string;

	constructor(
		baseUrl: string,
		private readonly fetchFn: FetchFn,
	) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	async read(uri: string): Promise<MemoryRecord> {
		return this.post<MemoryRecord>("/read", { uri });
	}

	async search(query: string): Promise<readonly MemoryRecord[]> {
		const response = await this.post<{ readonly results: readonly MemoryRecord[] }>("/search", { query });
		return response.results;
	}

	async write(record: NewMemoryRecord): Promise<MemoryRecord> {
		return this.post<MemoryRecord>("/write", record);
	}

	private async post<T>(path: string, body: unknown): Promise<T> {
		const response = await this.fetchFn(`${this.baseUrl}${path}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!response.ok) throw new Error(`Nocturne Memory HTTP ${response.status}: ${await response.text()}`);
		return (await response.json()) as T;
	}
}
