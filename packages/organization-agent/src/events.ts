import type { OrganizationMessage } from "./message-bus.js";
import type { AgentLifecycleState, AgentNode, AgentRole, TaskNode, TaskState } from "./types.js";

export interface MemoryRecord {
	readonly id: string;
	readonly uri: string;
	readonly content: string;
	readonly createdAt: string;
}

export interface SkillCandidate {
	readonly id: string;
	readonly name: string;
	readonly trigger: string;
	readonly steps: readonly string[];
	readonly sourceTaskId: string;
	readonly sourceAgentIds: readonly string[];
	readonly successEvidence: readonly string[];
	readonly failureCases: readonly string[];
	readonly usageCount: number;
	readonly createdAt: string;
}

export type OrganizationEvent =
	| { readonly type: "agent.created"; readonly agent: AgentNode }
	| { readonly type: "agent.status_changed"; readonly agentId: string; readonly state: AgentLifecycleState }
	| {
			readonly type: "agent.spawn_requested";
			readonly byAgentId: string;
			readonly role: AgentRole;
			readonly reason: string;
	  }
	| { readonly type: "agent.terminated"; readonly agentId: string; readonly reason: string }
	| {
			readonly type: "agent.merged";
			readonly sourceAgentId: string;
			readonly targetAgentId: string;
			readonly reason: string;
	  }
	| { readonly type: "task.created"; readonly task: TaskNode }
	| { readonly type: "task.updated"; readonly task: TaskNode }
	| { readonly type: "task.assigned"; readonly taskId: string; readonly agentId: string }
	| { readonly type: "task.status_changed"; readonly taskId: string; readonly state: TaskState }
	| { readonly type: "task.dependency_linked"; readonly beforeTaskId: string; readonly afterTaskId: string }
	| { readonly type: "message.sent"; readonly message: OrganizationMessage }
	| { readonly type: "memory.written"; readonly memory: MemoryRecord }
	| {
			readonly type: "memory.search_used";
			readonly agentId: string;
			readonly taskId: string;
			readonly query: string;
			readonly hitCount: number;
	  }
	| { readonly type: "skill.created"; readonly skill: SkillCandidate }
	| { readonly type: "integration.pi_session_started"; readonly taskContext?: string }
	| { readonly type: "integration.pi_session_finished"; readonly exitCode: number }
	| {
			readonly type: "integration.pi_activity";
			readonly phase: string;
			readonly detail?: string;
			readonly agentHint?: string;
	  }
	| { readonly type: "integration.external_note"; readonly message: string }
	| { readonly type: "runtime.error"; readonly message: string; readonly details?: unknown };
