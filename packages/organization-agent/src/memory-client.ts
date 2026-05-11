import type { EventStore } from "./event-store.js";
import type { MemoryRecord } from "./events.js";

export interface NewMemoryRecord {
	readonly uri: string;
	readonly content: string;
}

export interface MemoryClient {
	read(uri: string): Promise<MemoryRecord>;
	search(query: string): Promise<readonly MemoryRecord[]>;
	write(record: NewMemoryRecord): Promise<MemoryRecord>;
}

export interface InMemoryMemoryClientOptions {
	readonly eventStore?: EventStore;
	readonly now?: () => string;
}

export function createInMemoryMemoryClient(options: InMemoryMemoryClientOptions = {}): MemoryClient {
	return new InMemoryMemoryClient(options.eventStore, options.now ?? (() => new Date().toISOString()));
}

class InMemoryMemoryClient implements MemoryClient {
	private readonly records = new Map<string, MemoryRecord>();

	constructor(
		private readonly eventStore: EventStore | undefined,
		private readonly now: () => string,
	) {}

	async read(uri: string): Promise<MemoryRecord> {
		const record = this.records.get(uri);
		if (!record) throw new Error(`Unknown memory: ${uri}`);
		return { ...record };
	}

	async search(query: string): Promise<readonly MemoryRecord[]> {
		const normalized = query.toLowerCase();
		return Array.from(this.records.values())
			.filter(
				(record) =>
					record.uri.toLowerCase().includes(normalized) || record.content.toLowerCase().includes(normalized),
			)
			.map((record) => ({ ...record }));
	}

	async write(record: NewMemoryRecord): Promise<MemoryRecord> {
		if (!record.uri.trim()) throw new Error("Memory uri is required");
		if (!record.content.trim()) throw new Error("Memory content is required");
		const saved: MemoryRecord = {
			id: record.uri,
			uri: record.uri,
			content: record.content,
			createdAt: this.now(),
		};
		this.records.set(saved.uri, saved);
		this.eventStore?.append({ type: "memory.written", memory: saved });
		return { ...saved };
	}
}
