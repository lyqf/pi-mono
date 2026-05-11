import type { AgentRunOutput, AgentRuntimeAdapter, OrganizationRequest } from "./agent-runtime-adapter.js";
import { applyTaskGraphCommandWithEvents } from "./evented-task-graph-commands.js";
import type { OrganizationSession } from "./organization-session.js";
import { extractSkillCandidateFromTrace, type SkillExtractionTrace } from "./skill-extractor.js";
import type { NewSkillCandidate } from "./skill-registry.js";

export interface InitialWorkflowOptions {
	readonly session: OrganizationSession;
	readonly adapter: AgentRuntimeAdapter;
	readonly task: string;
	readonly extractSkillCandidate?: (trace: SkillExtractionTrace) => NewSkillCandidate;
}

export async function runInitialOrganizationWorkflow(options: InitialWorkflowOptions): Promise<void> {
	const { session, task } = options;
	session.start(task);
	const boss = await runRole(options, "boss", "boss", "root-goal", task);
	sendBossMessage(session, boss);

	const planner = await runRole(options, "planner", "planner", "root-goal", boss.summary);
	applyPlannerCommands(options, planner);
	createInitialWorkerTask(session, planner.summary);

	const worker = await runRole(options, "worker-a", "worker", "initial-worker-task", planner.summary);
	sendWorkerReviewMessage(session, worker);

	const reviewer = await runRole(options, "reviewer", "reviewer", "initial-worker-task", worker.summary);
	session.getTaskGraph().changeTaskState("initial-worker-task", "completed");
	session.getEventStore().append({ type: "task.status_changed", taskId: "initial-worker-task", state: "completed" });

	const memory = await runRole(options, "memory", "memory", "initial-worker-task", reviewer.summary);
	await session.writeMemory({ uri: "core://task/initial-worker-task", content: memory.summary });
	createWorkflowSkill(options, { boss, planner, worker, reviewer, memory });
}

function sendBossMessage(session: OrganizationSession, boss: AgentRunOutput): void {
	session.getMessageBus().send({
		id: "message-boss-planner",
		fromAgentId: "boss",
		toAgentId: "planner",
		taskId: "root-goal",
		type: "instruction",
		content: boss.messages.join("\n"),
		createdAt: new Date().toISOString(),
	});
}

function applyPlannerCommands(options: InitialWorkflowOptions, planner: AgentRunOutput): void {
	for (const command of planner.taskGraphCommands ?? [])
		applyTaskGraphCommandWithEvents(options.session.getTaskGraph(), options.session.getEventStore(), command);
}

function createInitialWorkerTask(session: OrganizationSession, description: string): void {
	const workerTask = session.getTaskGraph().createTask({
		id: "initial-worker-task",
		title: "Initial worker task",
		description,
		kind: "task",
		parentTaskId: "root-goal",
		acceptanceCriteria: ["Worker produced an output for reviewer"],
	});
	session.getEventStore().append({ type: "task.created", task: workerTask });
	session.getTaskGraph().assignTask("initial-worker-task", "worker-a");
	session.getEventStore().append({ type: "task.assigned", taskId: "initial-worker-task", agentId: "worker-a" });
}

function sendWorkerReviewMessage(session: OrganizationSession, worker: AgentRunOutput): void {
	session.getMessageBus().send({
		id: "message-worker-reviewer",
		fromAgentId: "worker-a",
		toAgentId: "reviewer",
		taskId: "initial-worker-task",
		type: "review",
		content: worker.summary,
		createdAt: new Date().toISOString(),
	});
}

function createWorkflowSkill(
	options: InitialWorkflowOptions,
	outputs: Record<"boss" | "planner" | "worker" | "reviewer" | "memory", AgentRunOutput>,
): void {
	const extractor = options.extractSkillCandidate ?? extractSkillCandidateFromTrace;
	options.session.createSkillCandidate(extractor(createSkillTrace(options.task, outputs)));
}

function createSkillTrace(
	taskTitle: string,
	outputs: Record<"boss" | "planner" | "worker" | "reviewer" | "memory", AgentRunOutput>,
): SkillExtractionTrace {
	return {
		taskId: "initial-worker-task",
		taskTitle,
		agentSummaries: [
			{ agentId: "boss", summary: outputs.boss.summary },
			{ agentId: "planner", summary: outputs.planner.summary },
			{ agentId: "worker-a", summary: outputs.worker.summary },
			{ agentId: "reviewer", summary: outputs.reviewer.summary },
			{ agentId: "memory", summary: outputs.memory.summary },
		],
		successEvidence: ["Initial workflow completed"],
	};
}

async function runRole(
	options: InitialWorkflowOptions,
	agentId: "boss" | "planner" | "worker-a" | "reviewer" | "memory",
	role: "boss" | "planner" | "worker" | "reviewer" | "memory",
	taskId: string,
	input: string,
) {
	options.session.setAgentState(agentId, "working", taskId);
	await options.session.attachMemorySearchContext(agentId, taskId, input);
	const output = await options.adapter.run({ agentId, role, taskId, input });
	applyOrganizationRequests(options.session, agentId, output.organizationRequests);
	options.session.setAgentState(agentId, "done", taskId);
	return output;
}

function applyOrganizationRequests(
	session: OrganizationSession,
	agentId: string,
	requests: readonly OrganizationRequest[] | undefined,
): void {
	for (const request of requests ?? []) applyOrganizationRequest(session, agentId, request);
}

function applyOrganizationRequest(session: OrganizationSession, agentId: string, request: OrganizationRequest): void {
	if (request.type === "spawn") {
		session.requestSpawn({ byAgentId: agentId, role: request.role, reason: request.reason });
		return;
	}
	if (request.type === "terminate") {
		session.terminateAgent(request.agentId, request.reason);
		return;
	}
	session.mergeAgents(request.sourceAgentId, request.targetAgentId, request.reason);
}
