import { describe, expect, it } from "vitest";
import type { MemoryRecord } from "../src/events.js";
import type { MemoryClient, NewMemoryRecord } from "../src/memory-client.js";
import { createOrganizationSession } from "../src/organization-session.js";

class RecordingMemoryClient implements MemoryClient {
	readonly writes: NewMemoryRecord[] = [];

	async read(): Promise<MemoryRecord> {
		throw new Error("not used");
	}

	async search() {
		return [];
	}

	async write(record: NewMemoryRecord) {
		this.writes.push(record);
		return { id: record.uri, uri: record.uri, content: record.content, createdAt: "memory-now" };
	}
}

describe("OrganizationSession memory injection", () => {
	it("writes memory through injected memory client and emits memory event", async () => {
		const memoryClient = new RecordingMemoryClient();
		const session = createOrganizationSession({
			now: () => "2026-05-11T00:00:00.000Z",
			memoryClient,
		});

		await session.writeMemory({ uri: "core://task/a", content: "Task memory" });

		expect(memoryClient.writes).toEqual([{ uri: "core://task/a", content: "Task memory" }]);
		expect(session.getEvents()).toContainEqual({
			type: "memory.written",
			memory: { id: "core://task/a", uri: "core://task/a", content: "Task memory", createdAt: "memory-now" },
		});
	});
});
