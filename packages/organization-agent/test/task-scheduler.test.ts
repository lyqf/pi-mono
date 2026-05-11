import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createTaskGraph } from "../src/task-graph.js";
import { scheduleReadyTasks } from "../src/task-scheduler.js";
import type { AgentNode } from "../src/types.js";

const now = "2026-05-11T00:00:00.000Z";

function createAgent(id: string, state: AgentNode["state"] = "idle"): AgentNode {
	return { id, role: "worker", displayName: id, state, createdAt: now };
}

describe("TaskScheduler", () => {
	it("assigns ready tasks to idle role-compatible agents and emits events", () => {
		const graph = createTaskGraph({ now: () => now });
		const eventStore = createEventStore();
		graph.createTask({
			id: "worker-task",
			title: "Worker task",
			description: "Ready worker task",
			kind: "task",
			acceptanceCriteria: ["Done"],
		});
		graph.changeTaskState("worker-task", "planned");

		const result = scheduleReadyTasks({
			graph,
			eventStore,
			agents: [createAgent("worker-a"), createAgent("reviewer", "idle")],
		});

		expect(result.assignments).toEqual([{ taskId: "worker-task", agentId: "worker-a" }]);
		expect(graph.getTask("worker-task")).toMatchObject({ assigneeAgentId: "worker-a", state: "assigned" });
		expect(eventStore.snapshot()).toEqual([
			{ type: "task.assigned", taskId: "worker-task", agentId: "worker-a" },
			{ type: "agent.status_changed", agentId: "worker-a", state: "assigned" },
		]);
	});
});
