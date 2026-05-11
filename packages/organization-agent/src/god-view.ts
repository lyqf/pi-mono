import type { OrganizationEvent } from "./events.js";
import { createOrganizationProjector } from "./organization-projector.js";
import type { AgentNode, TaskNode } from "./types.js";

export interface AgentClusterView {
	readonly id: string;
	readonly label: string;
	readonly kind: "core" | "specialists";
	readonly agentIds: readonly string[];
}

export interface GodViewEdge {
	readonly fromId: string;
	readonly toId: string;
	readonly kind: "parent_child" | "task_assignment";
}

export interface DashboardGodView {
	readonly activeAgents: number;
	readonly openTasks: number;
	readonly blockedTaskTitles: readonly string[];
	readonly rootPercentComplete: number;
	readonly clusters: readonly AgentClusterView[];
	readonly edges: readonly GodViewEdge[];
}

export function buildDashboardGodView(events: readonly OrganizationEvent[]): DashboardGodView {
	const projector = createOrganizationProjector(events);
	const projection = projector.snapshot();
	const agents = Object.values(projection.agents);
	const tasks = Object.values(projection.tasks);
	return {
		activeAgents: countActiveAgents(agents),
		openTasks: countOpenTasks(tasks),
		blockedTaskTitles: tasks.filter((task) => task.state === "blocked").map((task) => task.title),
		rootPercentComplete: projection.metrics.rootProgress?.percentComplete ?? 0,
		clusters: buildClusters(agents),
		edges: buildEdges(agents, tasks),
	};
}

function countActiveAgents(agents: readonly AgentNode[]): number {
	return agents.filter((agent) => !["done", "terminated", "merged"].includes(agent.state)).length;
}

function countOpenTasks(tasks: readonly TaskNode[]): number {
	return tasks.filter((task) => !["completed", "failed", "cancelled"].includes(task.state)).length;
}

function buildClusters(agents: readonly AgentNode[]): readonly AgentClusterView[] {
	const coreIds = agents.filter((agent) => agent.role !== "specialist").map((agent) => agent.id);
	const specialistIds = agents.filter((agent) => agent.role === "specialist").map((agent) => agent.id);
	const clusters: AgentClusterView[] = [];
	if (coreIds.length > 0) clusters.push({ id: "core", label: "Core organization", kind: "core", agentIds: coreIds });
	if (specialistIds.length > 0)
		clusters.push({
			id: "specialists",
			label: "Specialists",
			kind: "specialists",
			agentIds: specialistIds,
		});
	return clusters;
}

function buildEdges(agents: readonly AgentNode[], tasks: readonly TaskNode[]): readonly GodViewEdge[] {
	const edges: GodViewEdge[] = [];
	for (const agent of agents) {
		if (agent.parentAgentId) edges.push({ fromId: agent.parentAgentId, toId: agent.id, kind: "parent_child" });
	}
	for (const task of tasks) {
		if (task.assigneeAgentId) edges.push({ fromId: task.assigneeAgentId, toId: task.id, kind: "task_assignment" });
	}
	return edges;
}
