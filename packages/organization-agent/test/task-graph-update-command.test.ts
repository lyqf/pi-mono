import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { applyTaskGraphCommandWithEvents } from "../src/evented-task-graph-commands.js";
import { createTaskGraph } from "../src/task-graph.js";
import { applyTaskGraphCommand } from "../src/task-graph-commands.js";

describe("update_task command", () => {
	it("updates task fields", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask({
			id: "task-a",
			title: "Task A",
			description: "Original",
			kind: "task",
			acceptanceCriteria: ["Original done"],
		});

		applyTaskGraphCommand(graph, {
			type: "update_task",
			taskId: "task-a",
			patch: { description: "Updated", acceptanceCriteria: ["Updated done"] },
		});

		expect(graph.getTask("task-a")).toMatchObject({
			description: "Updated",
			acceptanceCriteria: ["Updated done"],
		});
	});

	it("emits task updated event", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		const eventStore = createEventStore();
		graph.createTask({
			id: "task-a",
			title: "Task A",
			description: "Original",
			kind: "task",
			acceptanceCriteria: ["Original done"],
		});

		applyTaskGraphCommandWithEvents(graph, eventStore, {
			type: "update_task",
			taskId: "task-a",
			patch: { blockers: ["Needs input"] },
		});

		expect(eventStore.snapshot()).toEqual([{ type: "task.updated", task: graph.getTask("task-a") }]);
	});
});
