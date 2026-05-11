import { describe, expect, it } from "vitest";
import { createTaskGraph } from "../src/task-graph.js";
import { applyTaskGraphCommand } from "../src/task-graph-commands.js";

describe("TaskGraphCommand", () => {
	it("applies create link assign and review commands", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });

		applyTaskGraphCommand(graph, {
			type: "create_task",
			task: {
				id: "root",
				title: "Root",
				description: "Root task",
				kind: "root",
				acceptanceCriteria: ["Root done"],
			},
		});
		applyTaskGraphCommand(graph, {
			type: "create_task",
			task: {
				id: "worker",
				title: "Worker",
				description: "Worker task",
				kind: "task",
				acceptanceCriteria: ["Worker done"],
			},
		});
		applyTaskGraphCommand(graph, { type: "link_dependency", beforeTaskId: "root", afterTaskId: "worker" });
		graph.changeTaskState("root", "completed");
		applyTaskGraphCommand(graph, { type: "assign_task", taskId: "worker", agentId: "worker-a" });
		graph.changeTaskState("worker", "completed");
		applyTaskGraphCommand(graph, { type: "create_review_task", targetTaskId: "worker", reviewerAgentId: "reviewer" });

		expect(graph.getTask("worker")).toMatchObject({ state: "completed", assigneeAgentId: "worker-a" });
		expect(graph.getTask("review-worker")).toMatchObject({ kind: "review", assigneeAgentId: "reviewer" });
	});
});
