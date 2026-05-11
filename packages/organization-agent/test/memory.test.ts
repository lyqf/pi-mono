import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createInMemoryMemoryClient } from "../src/memory-client.js";

describe("MemoryClient", () => {
	it("writes memory records and emits memory.written", async () => {
		const eventStore = createEventStore();
		const memory = createInMemoryMemoryClient({ eventStore, now: () => "2026-05-11T00:00:00.000Z" });

		const record = await memory.write({ uri: "core://task/root", content: "Root task summary" });

		expect(record).toMatchObject({ uri: "core://task/root", content: "Root task summary" });
		expect(eventStore.snapshot()).toEqual([{ type: "memory.written", memory: record }]);
	});

	it("searches memory by URI and content", async () => {
		const memory = createInMemoryMemoryClient({ now: () => "2026-05-11T00:00:00.000Z" });
		await memory.write({ uri: "core://task/root", content: "Root task summary" });

		expect(await memory.search("root")).toHaveLength(1);
		expect(await memory.read("core://task/root")).toMatchObject({ content: "Root task summary" });
	});
});
