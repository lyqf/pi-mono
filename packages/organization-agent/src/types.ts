export type AgentRole = "boss" | "planner" | "worker" | "reviewer" | "memory" | "specialist";

export type AgentLifecycleState =
	| "created"
	| "idle"
	| "assigned"
	| "thinking"
	| "working"
	| "waiting_review"
	| "blocked"
	| "done"
	| "terminated"
	| "merged";

export interface AgentNode {
	readonly id: string;
	readonly role: AgentRole;
	readonly displayName: string;
	readonly state: AgentLifecycleState;
	readonly currentTaskId?: string;
	readonly parentAgentId?: string;
	readonly spawnedBy?: string;
	readonly createdAt: string;
	readonly terminatedAt?: string;
}

export type TaskKind = "root" | "milestone" | "task" | "subtask" | "review";

export type TaskState =
	| "created"
	| "planned"
	| "assigned"
	| "in_progress"
	| "blocked"
	| "reviewing"
	| "completed"
	| "failed"
	| "cancelled";

export interface TaskOutput {
	readonly id: string;
	readonly title: string;
	readonly value: string;
}

export interface NewTaskNode {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly kind: TaskKind;
	readonly parentTaskId?: string;
	readonly acceptanceCriteria: readonly string[];
}

export interface TaskPatch {
	readonly title?: string;
	readonly description?: string;
	readonly acceptanceCriteria?: readonly string[];
	readonly outputs?: readonly TaskOutput[];
	readonly blockers?: readonly string[];
}

export interface TaskNode extends NewTaskNode {
	readonly state: TaskState;
	readonly assigneeAgentId?: string;
	readonly dependencies: readonly string[];
	readonly outputs: readonly TaskOutput[];
	readonly blockers: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface TaskProgressSummary {
	readonly taskId: string;
	readonly totalDescendants: number;
	readonly completedDescendants: number;
	readonly blockedDescendants: number;
	readonly reviewingDescendants: number;
	readonly percentComplete: number;
}
