import type { EventStore } from "./event-store.js";
import type { TaskGraph } from "./task-graph.js";
import type { AgentNode, AgentRole, TaskKind } from "./types.js";

const TASK_ROLE_BY_KIND: Readonly<Record<TaskKind, AgentRole>> = {
	root: "boss",
	milestone: "planner",
	task: "worker",
	subtask: "worker",
	review: "reviewer",
};

export interface TaskSchedulerOptions {
	readonly graph: TaskGraph;
	readonly eventStore: EventStore;
	readonly agents: readonly AgentNode[];
}

export interface TaskAssignmentDecision {
	readonly taskId: string;
	readonly agentId: string;
}

export interface TaskSchedulerResult {
	readonly assignments: readonly TaskAssignmentDecision[];
}

export function scheduleReadyTasks(options: TaskSchedulerOptions): TaskSchedulerResult {
	const assignments: TaskAssignmentDecision[] = [];
	const busyAgentIds = new Set<string>();
	for (const task of options.graph.getReadyTasks()) {
		const agent = findAvailableAgent(options.agents, TASK_ROLE_BY_KIND[task.kind], busyAgentIds);
		if (!agent) continue;
		options.graph.assignTask(task.id, agent.id);
		options.eventStore.append({ type: "task.assigned", taskId: task.id, agentId: agent.id });
		options.eventStore.append({ type: "agent.status_changed", agentId: agent.id, state: "assigned" });
		busyAgentIds.add(agent.id);
		assignments.push({ taskId: task.id, agentId: agent.id });
	}
	return { assignments };
}

function findAvailableAgent(
	agents: readonly AgentNode[],
	role: AgentRole,
	busyAgentIds: ReadonlySet<string>,
): AgentNode | undefined {
	return agents.find((agent) => agent.role === role && agent.state === "idle" && !busyAgentIds.has(agent.id));
}
