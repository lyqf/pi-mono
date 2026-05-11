import { createEventStore, type EventStore } from "./event-store.js";
import type { OrganizationEvent } from "./events.js";
import { createInMemoryMemoryClient, type MemoryClient, type NewMemoryRecord } from "./memory-client.js";
import { createMessageBus, type MessageBus } from "./message-bus.js";
import { createSkillRegistry, type NewSkillCandidate, type SkillRegistry } from "./skill-registry.js";
import { createTaskGraph, type TaskGraph } from "./task-graph.js";
import type { AgentNode, AgentRole } from "./types.js";

interface InitialAgentDefinition {
	readonly id: string;
	readonly role: AgentRole;
	readonly displayName: string;
	readonly parentAgentId?: string;
	readonly spawnedBy?: string;
}

/** Set to a non-negative integer (e.g. `0`, `4`). Default when unset: `2`. */
export const AGENT_COMPANY_SPECIALIST_LIMIT_ENV = "AGENT_COMPANY_SPECIALIST_LIMIT";

const DEFAULT_SPECIALIST_LIMIT = 2;

const INITIAL_AGENTS: readonly InitialAgentDefinition[] = [
	{ id: "boss", role: "boss", displayName: "Boss Agent" },
	{ id: "planner", role: "planner", displayName: "Planner Agent" },
	{ id: "worker-a", role: "worker", displayName: "Worker Agent A" },
	{ id: "worker-b", role: "worker", displayName: "Worker Agent B" },
	{ id: "reviewer", role: "reviewer", displayName: "Reviewer Agent" },
	{ id: "memory", role: "memory", displayName: "Memory Agent" },
];

export interface OrganizationSessionOptions {
	readonly now?: () => string;
	readonly memoryClient?: MemoryClient;
	/** Overrides {@link AGENT_COMPANY_SPECIALIST_LIMIT_ENV} when both are applicable. */
	readonly specialistLimit?: number;
}

export interface SpawnRequest {
	readonly byAgentId: string;
	readonly role: AgentRole;
	readonly reason: string;
}

export type SpawnDecision =
	| { readonly accepted: true; readonly agent: AgentNode }
	| { readonly accepted: false; readonly reason: string };

export interface OrganizationSession {
	start(input: string): void;
	requestSpawn(request: SpawnRequest): SpawnDecision;
	terminateAgent(agentId: string, reason: string): void;
	mergeAgents(sourceAgentId: string, targetAgentId: string, reason: string): void;
	writeMemory(record: NewMemoryRecord): Promise<void>;
	attachMemorySearchContext(agentId: string, taskId: string, query: string): Promise<void>;
	createSkillCandidate(candidate: NewSkillCandidate): void;
	getAgents(): readonly AgentNode[];
	getTaskGraph(): TaskGraph;
	getMessageBus(): MessageBus;
	getEvents(): readonly OrganizationEvent[];
	getEventStore(): EventStore;
	setAgentState(agentId: string, state: AgentNode["state"], currentTaskId?: string): void;
}

export function createOrganizationSession(options: OrganizationSessionOptions = {}): OrganizationSession {
	return new DefaultOrganizationSession(
		options.now ?? (() => new Date().toISOString()),
		options.memoryClient,
		resolveSpecialistLimit(options),
	);
}

function resolveSpecialistLimit(options: OrganizationSessionOptions): number {
	if (options.specialistLimit !== undefined) return options.specialistLimit;
	const raw = process.env[AGENT_COMPANY_SPECIALIST_LIMIT_ENV]?.trim();
	if (!raw) return DEFAULT_SPECIALIST_LIMIT;
	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed < 0)
		throw new Error(`${AGENT_COMPANY_SPECIALIST_LIMIT_ENV} must be a non-negative integer`);
	return parsed;
}

class DefaultOrganizationSession implements OrganizationSession {
	private readonly eventStore: EventStore;
	private readonly messageBus: MessageBus;
	private readonly taskGraph: TaskGraph;
	private readonly memoryClient: MemoryClient;
	private readonly skillRegistry: SkillRegistry;
	private readonly agents = new Map<string, AgentNode>();

	constructor(
		private readonly now: () => string,
		memoryClient: MemoryClient | undefined,
		private readonly specialistLimit: number,
	) {
		this.eventStore = createEventStore();
		this.messageBus = createMessageBus({ eventStore: this.eventStore });
		this.taskGraph = createTaskGraph({ now });
		this.memoryClient = memoryClient ?? createInMemoryMemoryClient({ eventStore: this.eventStore, now });
		this.skillRegistry = createSkillRegistry({ eventStore: this.eventStore, now });
		this.createInitialAgents();
	}

	start(input: string): void {
		const task = this.taskGraph.createTask({
			id: "root-goal",
			title: input,
			description: input,
			kind: "root",
			acceptanceCriteria: ["Boss Agent has acknowledged and planned the user goal"],
		});
		this.eventStore.append({ type: "task.created", task });
		const assignedTask = this.taskGraph.assignTask("root-goal", "boss");
		this.eventStore.append({ type: "task.assigned", taskId: assignedTask.id, agentId: "boss" });
		this.updateAgent("boss", { state: "assigned", currentTaskId: "root-goal" });
	}

	requestSpawn(request: SpawnRequest): SpawnDecision {
		this.eventStore.append({
			type: "agent.spawn_requested",
			byAgentId: request.byAgentId,
			role: request.role,
			reason: request.reason,
		});
		if (!request.reason.trim()) return { accepted: false, reason: "Spawn reason is required" };
		if (request.role !== "specialist") return { accepted: false, reason: "Only specialist spawn is supported" };
		if (!this.canRequestSpecialist(request.byAgentId))
			return { accepted: false, reason: "Only boss or planner can request specialist spawn" };
		if (this.countSpecialists() >= this.specialistLimit)
			return { accepted: false, reason: "Specialist limit reached" };
		return {
			accepted: true,
			agent: this.createAgent({
				id: `specialist-${this.countSpecialists() + 1}`,
				role: "specialist",
				displayName: `Specialist Agent ${this.countSpecialists() + 1}`,
				parentAgentId: request.byAgentId,
				spawnedBy: request.byAgentId,
			}),
		};
	}

	terminateAgent(agentId: string, reason: string): void {
		if (!reason.trim()) throw new Error("Termination reason is required");
		const agent = this.requireAgent(agentId);
		this.agents.set(agentId, { ...agent, state: "terminated", terminatedAt: this.now() });
		this.eventStore.append({ type: "agent.terminated", agentId, reason });
	}

	mergeAgents(sourceAgentId: string, targetAgentId: string, reason: string): void {
		if (!reason.trim()) throw new Error("Merge reason is required");
		if (sourceAgentId === targetAgentId) throw new Error("Cannot merge an agent into itself");
		const source = this.requireAgent(sourceAgentId);
		this.requireAgent(targetAgentId);
		this.agents.set(sourceAgentId, { ...source, state: "merged" });
		this.eventStore.append({ type: "agent.merged", sourceAgentId, targetAgentId, reason });
	}

	async writeMemory(record: NewMemoryRecord): Promise<void> {
		const memory = await this.memoryClient.write(record);
		if (!this.hasMemoryEvent(memory.id)) this.eventStore.append({ type: "memory.written", memory });
	}

	async attachMemorySearchContext(agentId: string, taskId: string, query: string): Promise<void> {
		const trimmed = query.trim();
		if (!trimmed) return;
		const bounded = trimmed.slice(0, 240);
		const hits = await this.memoryClient.search(bounded);
		this.eventStore.append({
			type: "memory.search_used",
			agentId,
			taskId,
			query: bounded,
			hitCount: hits.length,
		});
	}

	createSkillCandidate(candidate: NewSkillCandidate): void {
		this.skillRegistry.createCandidate(candidate);
	}

	getAgents(): readonly AgentNode[] {
		return Array.from(this.agents.values(), cloneAgent);
	}

	getTaskGraph(): TaskGraph {
		return this.taskGraph;
	}

	getMessageBus(): MessageBus {
		return this.messageBus;
	}

	getEvents(): readonly OrganizationEvent[] {
		return this.eventStore.snapshot();
	}

	getEventStore(): EventStore {
		return this.eventStore;
	}

	setAgentState(agentId: string, state: AgentNode["state"], currentTaskId?: string): void {
		this.updateAgent(agentId, { state, currentTaskId });
	}

	private hasMemoryEvent(memoryId: string): boolean {
		return this.eventStore
			.snapshot()
			.some((event) => event.type === "memory.written" && event.memory.id === memoryId);
	}

	private createInitialAgents(): void {
		for (const definition of INITIAL_AGENTS) this.createAgent(definition);
	}

	private createAgent(definition: InitialAgentDefinition): AgentNode {
		const agent: AgentNode = {
			id: definition.id,
			role: definition.role,
			displayName: definition.displayName,
			state: "created",
			parentAgentId: definition.parentAgentId,
			spawnedBy: definition.spawnedBy,
			createdAt: this.now(),
		};
		this.agents.set(agent.id, agent);
		this.eventStore.append({ type: "agent.created", agent });
		return cloneAgent(agent);
	}

	private canRequestSpecialist(agentId: string): boolean {
		const agent = this.requireAgent(agentId);
		return agent.role === "boss" || agent.role === "planner";
	}

	private countSpecialists(): number {
		return Array.from(this.agents.values()).filter((agent) => agent.role === "specialist").length;
	}

	private updateAgent(agentId: string, patch: Partial<AgentNode>): void {
		const agent = this.requireAgent(agentId);
		const next = { ...agent, ...patch };
		this.agents.set(agentId, next);
		this.eventStore.append({ type: "agent.status_changed", agentId, state: next.state });
	}

	private requireAgent(agentId: string): AgentNode {
		const agent = this.agents.get(agentId);
		if (!agent) throw new Error(`Unknown agent: ${agentId}`);
		return agent;
	}
}

function cloneAgent(agent: AgentNode): AgentNode {
	return { ...agent };
}
