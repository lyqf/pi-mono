import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import type { OrganizationEvent } from "../src/events.js";

function createAgentCreatedEvent(id: string): OrganizationEvent {
	return {
		type: "agent.created",
		agent: {
			id,
			role: "worker",
			displayName: `Worker ${id}`,
			state: "created",
			createdAt: "2026-05-11T00:00:00.000Z",
		},
	};
}

describe("EventStore", () => {
	it("appends events and returns them in insertion order", () => {
		const store = createEventStore();

		store.append(createAgentCreatedEvent("a"));
		store.append(createAgentCreatedEvent("b"));

		expect(store.snapshot().map((event) => event.type)).toEqual(["agent.created", "agent.created"]);
		expect(store.snapshot()[1]).toMatchObject({ agent: { id: "b" } });
	});

	it("notifies subscribers for appended events", () => {
		const store = createEventStore();
		const received: OrganizationEvent[] = [];

		const unsubscribe = store.subscribe((event) => received.push(event));
		store.append(createAgentCreatedEvent("a"));
		unsubscribe();
		store.append(createAgentCreatedEvent("b"));

		expect(received).toHaveLength(1);
		expect(received[0]).toMatchObject({ agent: { id: "a" } });
	});
});
