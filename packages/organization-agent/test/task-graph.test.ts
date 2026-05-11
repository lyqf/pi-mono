import { describe, expect, it } from "vitest";
import { createTaskGraph } from "../src/task-graph.js";

function createRootTask() {
	return {
		id: "root",
		title: "Ship Agent Company",
		description: "Deliver the first organization runtime slice",
		kind: "root" as const,
		acceptanceCriteria: ["All milestone tests pass"],
	};
}

describe("TaskGraph", () => {
	it("creates tasks and exposes an immutable snapshot", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });

		graph.createTask(createRootTask());

		expect(graph.getTask("root")).toMatchObject({
			id: "root",
			state: "created",
			dependencies: [],
			acceptanceCriteria: ["All milestone tests pass"],
		});
		expect(graph.snapshot()).toHaveLength(1);
	});

	it("links dependencies as a DAG and rejects cycles", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask(createRootTask());
		graph.createTask({
			id: "review",
			title: "Review runtime",
			description: "Review implementation",
			kind: "review",
			acceptanceCriteria: ["Reviewer accepts output"],
		});

		graph.linkDependency("root", "review");

		expect(graph.getTask("review")?.dependencies).toEqual(["root"]);
		expect(() => graph.linkDependency("review", "root")).toThrow("cycle");
	});

	it("requires acceptance criteria before assignment", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask({
			id: "loose-task",
			title: "Loose task",
			description: "No acceptance criteria yet",
			kind: "task",
			acceptanceCriteria: [],
		});

		expect(() => graph.assignTask("loose-task", "worker-a")).toThrow("acceptanceCriteria");
	});

	it("assigns ready tasks only after dependencies complete", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask(createRootTask());
		graph.createTask({
			id: "worker-task",
			title: "Implement runtime",
			description: "Implement the runtime skeleton",
			kind: "task",
			acceptanceCriteria: ["Runtime test passes"],
		});
		graph.linkDependency("root", "worker-task");

		expect(() => graph.assignTask("worker-task", "worker-a")).toThrow("dependencies");

		graph.changeTaskState("root", "completed");
		graph.assignTask("worker-task", "worker-a");

		expect(graph.getTask("worker-task")).toMatchObject({
			assigneeAgentId: "worker-a",
			state: "assigned",
		});
	});

	it("aggregates descendant progress", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask(createRootTask());
		graph.createTask({
			id: "milestone",
			title: "Runtime milestone",
			description: "Build runtime primitives",
			kind: "milestone",
			parentTaskId: "root",
			acceptanceCriteria: ["Runtime primitives exist"],
		});
		graph.createTask({
			id: "task-a",
			title: "Task A",
			description: "First task",
			kind: "task",
			parentTaskId: "milestone",
			acceptanceCriteria: ["A passes"],
		});
		graph.createTask({
			id: "task-b",
			title: "Task B",
			description: "Second task",
			kind: "task",
			parentTaskId: "milestone",
			acceptanceCriteria: ["B passes"],
		});
		graph.changeTaskState("task-a", "completed");
		graph.changeTaskState("task-b", "blocked", { blockers: ["waiting for review"] });

		expect(graph.getProgress("root")).toEqual({
			taskId: "root",
			totalDescendants: 3,
			completedDescendants: 1,
			blockedDescendants: 1,
			reviewingDescendants: 0,
			percentComplete: 33,
		});
	});
});
