import type { OrganizationEvent } from "./events.js";
import type { OrganizationMessage } from "./message-bus.js";
import type { AgentNode, TaskNode, TaskProgressSummary } from "./types.js";

const PERCENT_SCALE = 100;

export interface AgentWorkload {
	readonly agentId: string;
	readonly assignedTaskCount: number;
}

export interface OrganizationMetrics {
	readonly rootProgress?: TaskProgressSummary;
	readonly blockedTasks: readonly TaskNode[];
	readonly agentWorkload: readonly AgentWorkload[];
}

export interface OrganizationProjection {
	readonly agents: Readonly<Record<string, AgentNode>>;
	readonly tasks: Readonly<Record<string, TaskNode>>;
	readonly messages: readonly OrganizationMessage[];
	readonly events: readonly OrganizationEvent[];
	readonly metrics: OrganizationMetrics;
}

export interface OrganizationProjector {
	apply(event: OrganizationEvent): void;
	snapshot(): OrganizationProjection;
}

export function createOrganizationProjector(events: readonly OrganizationEvent[] = []): OrganizationProjector {
	const projector = new DefaultOrganizationProjector();
	for (const event of events) projector.apply(event);
	return projector;
}

class DefaultOrganizationProjector implements OrganizationProjector {
	private readonly agents: Record<string, AgentNode> = {};
	private readonly tasks: Record<string, TaskNode> = {};
	private readonly messages: OrganizationMessage[] = [];
	private readonly events: OrganizationEvent[] = [];

	apply(event: OrganizationEvent): void {
		this.events.push(event);
		switch (event.type) {
			case "agent.created":
				this.agents[event.agent.id] = { ...event.agent };
				return;
			case "agent.status_changed":
				this.updateAgentState(event);
				return;
			case "agent.terminated":
				this.updateAgentLifecycle(event.agentId, "terminated");
				return;
			case "agent.merged":
				this.updateAgentLifecycle(event.sourceAgentId, "merged");
				return;
			case "task.created":
				this.tasks[event.task.id] = cloneTask(event.task);
				return;
			case "task.updated":
				this.tasks[event.task.id] = cloneTask(event.task);
				return;
			case "task.assigned":
				this.updateTaskAssignment(event.taskId, event.agentId);
				return;
			case "task.status_changed":
				this.updateTaskState(event.taskId, event.state);
				return;
			case "task.dependency_linked":
				this.updateTaskDependency(event.beforeTaskId, event.afterTaskId);
				return;
			case "message.sent":
				this.messages.push(event.message);
				return;
			default:
				return;
		}
	}

	snapshot(): OrganizationProjection {
		return {
			agents: cloneRecord(this.agents, cloneAgent),
			tasks: cloneRecord(this.tasks, cloneTask),
			messages: this.messages.map((message) => ({ ...message })),
			events: [...this.events],
			metrics: createMetrics(this.tasks),
		};
	}

	private updateAgentState(event: Extract<OrganizationEvent, { type: "agent.status_changed" }>): void {
		const agent = this.agents[event.agentId];
		if (!agent) return;
		this.agents[event.agentId] = { ...agent, state: event.state };
	}

	private updateAgentLifecycle(agentId: string, state: AgentNode["state"]): void {
		const agent = this.agents[agentId];
		if (!agent) return;
		this.agents[agentId] = { ...agent, state };
	}

	private updateTaskAssignment(taskId: string, agentId: string): void {
		const task = this.tasks[taskId];
		if (!task) return;
		this.tasks[taskId] = { ...task, assigneeAgentId: agentId, state: "assigned" };
	}

	private updateTaskState(taskId: string, state: TaskNode["state"]): void {
		const task = this.tasks[taskId];
		if (!task) return;
		this.tasks[taskId] = { ...task, state };
	}

	private updateTaskDependency(beforeTaskId: string, afterTaskId: string): void {
		const task = this.tasks[afterTaskId];
		if (!task || task.dependencies.includes(beforeTaskId)) return;
		this.tasks[afterTaskId] = { ...task, dependencies: [...task.dependencies, beforeTaskId] };
	}
}

function createMetrics(tasks: Readonly<Record<string, TaskNode>>): OrganizationMetrics {
	const taskList = Object.values(tasks);
	const root = taskList.find((task) => task.kind === "root");
	return {
		rootProgress: root ? createProgress(root.id, taskList) : undefined,
		blockedTasks: taskList.filter((task) => task.state === "blocked").map(cloneTask),
		agentWorkload: createAgentWorkload(taskList),
	};
}

function createProgress(taskId: string, tasks: readonly TaskNode[]): TaskProgressSummary {
	const descendants = getDescendants(taskId, tasks);
	const completed = descendants.filter((task) => task.state === "completed").length;
	const blocked = descendants.filter((task) => task.state === "blocked").length;
	const reviewing = descendants.filter((task) => task.state === "reviewing").length;
	return {
		taskId,
		totalDescendants: descendants.length,
		completedDescendants: completed,
		blockedDescendants: blocked,
		reviewingDescendants: reviewing,
		percentComplete: calculatePercent(completed, descendants.length),
	};
}

function createAgentWorkload(tasks: readonly TaskNode[]): readonly AgentWorkload[] {
	const counts = new Map<string, number>();
	for (const task of tasks) {
		if (!task.assigneeAgentId || !isActiveTask(task)) continue;
		counts.set(task.assigneeAgentId, (counts.get(task.assigneeAgentId) ?? 0) + 1);
	}
	return Array.from(counts.entries()).map(([agentId, assignedTaskCount]) => ({ agentId, assignedTaskCount }));
}

function getDescendants(taskId: string, tasks: readonly TaskNode[]): readonly TaskNode[] {
	const directChildren = tasks.filter((task) => task.parentTaskId === taskId);
	return directChildren.flatMap((task) => [task, ...getDescendants(task.id, tasks)]);
}

function isActiveTask(task: TaskNode): boolean {
	return task.state !== "completed" && task.state !== "failed" && task.state !== "cancelled";
}

function calculatePercent(completed: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((completed / total) * PERCENT_SCALE);
}

function cloneRecord<T>(record: Readonly<Record<string, T>>, clone: (value: T) => T): Record<string, T> {
	return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, clone(value)]));
}

function cloneAgent(agent: AgentNode): AgentNode {
	return { ...agent };
}

function cloneTask(task: TaskNode): TaskNode {
	return {
		...task,
		acceptanceCriteria: [...task.acceptanceCriteria],
		dependencies: [...task.dependencies],
		outputs: [...task.outputs],
		blockers: [...task.blockers],
	};
}
