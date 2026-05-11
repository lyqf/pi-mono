import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { applyTaskGraphCommandWithEvents } from "../src/evented-task-graph-commands.js";
import { createTaskGraph } from "../src/task-graph.js";

describe("evented task graph commands", () => {
	it("emits task events for applied commands", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		const eventStore = createEventStore();

		applyTaskGraphCommandWithEvents(graph, eventStore, {
			type: "create_task",
			task: { id: "root", title: "Root", description: "Root", kind: "root", acceptanceCriteria: ["Done"] },
		});

		expect(eventStore.snapshot()).toEqual([{ type: "task.created", task: graph.getTask("root") }]);
	});
});
