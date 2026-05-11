import { describe, expect, it } from "vitest";
import { createTaskGraph } from "../src/task-graph.js";

function createTask() {
	return {
		id: "task-a",
		title: "Task A",
		description: "Original description",
		kind: "task" as const,
		acceptanceCriteria: ["Original done"],
	};
}

describe("TaskGraph update", () => {
	it("updates task fields immutably", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		const original = graph.createTask(createTask());

		const updated = graph.updateTask("task-a", {
			description: "Updated description",
			acceptanceCriteria: ["Updated done"],
			outputs: [{ id: "out-1", title: "Result", value: "Done" }],
			blockers: ["Needs review"],
		});

		expect(original).toMatchObject({ description: "Original description", outputs: [], blockers: [] });
		expect(updated).toMatchObject({
			description: "Updated description",
			acceptanceCriteria: ["Updated done"],
			outputs: [{ id: "out-1", title: "Result", value: "Done" }],
			blockers: ["Needs review"],
		});
	});
});
