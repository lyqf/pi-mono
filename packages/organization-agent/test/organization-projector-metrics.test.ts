import { describe, expect, it } from "vitest";
import type { OrganizationEvent } from "../src/events.js";
import { createOrganizationProjector } from "../src/organization-projector.js";
import type { TaskNode } from "../src/types.js";

const baseTask: Omit<TaskNode, "id" | "title" | "kind" | "parentTaskId" | "state" | "assigneeAgentId"> = {
	description: "Task description",
	acceptanceCriteria: ["Done"],
	dependencies: [],
	outputs: [],
	blockers: [],
	createdAt: "2026-05-11T00:00:00.000Z",
	updatedAt: "2026-05-11T00:00:00.000Z",
};

function task(options: Pick<TaskNode, "id" | "title" | "kind" | "state"> & Partial<TaskNode>): TaskNode {
	return { ...baseTask, ...options };
}

describe("OrganizationProjector metrics", () => {
	it("projects root progress blocked tasks and agent workload", () => {
		const events: OrganizationEvent[] = [
			{ type: "task.created", task: task({ id: "root", title: "Root", kind: "root", state: "created" }) },
			{
				type: "task.created",
				task: task({ id: "done", title: "Done", kind: "task", parentTaskId: "root", state: "completed" }),
			},
			{
				type: "task.created",
				task: task({
					id: "blocked",
					title: "Blocked",
					kind: "task",
					parentTaskId: "root",
					state: "blocked",
					assigneeAgentId: "worker-a",
					blockers: ["waiting input"],
				}),
			},
			{
				type: "task.created",
				task: task({ id: "review", title: "Review", kind: "review", parentTaskId: "root", state: "reviewing" }),
			},
		];

		const snapshot = createOrganizationProjector(events).snapshot();

		expect(snapshot.metrics.rootProgress).toEqual({
			taskId: "root",
			totalDescendants: 3,
			completedDescendants: 1,
			blockedDescendants: 1,
			reviewingDescendants: 1,
			percentComplete: 33,
		});
		expect(snapshot.metrics.blockedTasks.map((blockedTask) => blockedTask.id)).toEqual(["blocked"]);
		expect(snapshot.metrics.agentWorkload).toEqual([{ agentId: "worker-a", assignedTaskCount: 1 }]);
	});
});
