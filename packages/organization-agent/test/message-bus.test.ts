import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createMessageBus } from "../src/message-bus.js";

describe("MessageBus", () => {
	it("requires taskId or decisionId for main timeline messages", () => {
		const bus = createMessageBus({ eventStore: createEventStore() });

		expect(() =>
			bus.send({
				id: "message-1",
				fromAgentId: "planner",
				toAgentId: "worker-a",
				type: "instruction",
				content: "Please implement the runtime",
				createdAt: "2026-05-11T00:00:00.000Z",
			}),
		).toThrow("taskId or decisionId");
	});

	it("stores messages and emits message.sent events", () => {
		const eventStore = createEventStore();
		const bus = createMessageBus({ eventStore });

		bus.send({
			id: "message-1",
			fromAgentId: "planner",
			toAgentId: "worker-a",
			taskId: "task-1",
			type: "instruction",
			content: "Please implement the runtime",
			createdAt: "2026-05-11T00:00:00.000Z",
		});

		expect(bus.snapshot()).toHaveLength(1);
		expect(eventStore.snapshot()).toEqual([
			{
				type: "message.sent",
				message: {
					id: "message-1",
					fromAgentId: "planner",
					toAgentId: "worker-a",
					taskId: "task-1",
					type: "instruction",
					content: "Please implement the runtime",
					createdAt: "2026-05-11T00:00:00.000Z",
				},
			},
		]);
	});
});
