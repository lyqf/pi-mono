import { describe, expect, it } from "vitest";
import { createOrganizationProjector } from "../src/organization-projector.js";
import type { TaskNode } from "../src/types.js";

const task: TaskNode = {
	id: "task-a",
	title: "Task A",
	description: "Original",
	kind: "task",
	state: "created",
	acceptanceCriteria: ["Original done"],
	dependencies: [],
	outputs: [],
	blockers: [],
	createdAt: "2026-05-11T00:00:00.000Z",
	updatedAt: "2026-05-11T00:00:00.000Z",
};

describe("OrganizationProjector task updates", () => {
	it("applies task.updated snapshots", () => {
		const projector = createOrganizationProjector([{ type: "task.created", task }]);

		projector.apply({
			type: "task.updated",
			task: { ...task, description: "Updated", blockers: ["Needs input"] },
		});

		expect(projector.snapshot().tasks["task-a"]).toMatchObject({
			description: "Updated",
			blockers: ["Needs input"],
		});
	});
});
