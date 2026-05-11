import type { NewTaskNode, TaskNode, TaskPatch, TaskProgressSummary, TaskState } from "./types.js";

const PERCENT_SCALE = 100;

export interface TaskGraphOptions {
	readonly now?: () => string;
}

export interface ChangeTaskStateOptions {
	readonly blockers?: readonly string[];
}

export interface TaskGraph {
	createTask(task: NewTaskNode): TaskNode;
	linkDependency(beforeTaskId: string, afterTaskId: string): void;
	assignTask(taskId: string, agentId: string): TaskNode;
	updateTask(taskId: string, patch: TaskPatch): TaskNode;
	changeTaskState(taskId: string, state: TaskState, options?: ChangeTaskStateOptions): TaskNode;
	getTask(taskId: string): TaskNode | undefined;
	getProgress(taskId: string): TaskProgressSummary;
	getReadyTasks(): readonly TaskNode[];
	snapshot(): readonly TaskNode[];
}

export function createTaskGraph(options: TaskGraphOptions = {}): TaskGraph {
	return new InMemoryTaskGraph(options.now ?? (() => new Date().toISOString()));
}

class InMemoryTaskGraph implements TaskGraph {
	private readonly tasks = new Map<string, TaskNode>();

	constructor(private readonly now: () => string) {}

	createTask(task: NewTaskNode): TaskNode {
		this.ensureNewTaskValid(task);
		const timestamp = this.now();
		const node: TaskNode = {
			...task,
			state: "created",
			dependencies: [],
			outputs: [],
			blockers: [],
			createdAt: timestamp,
			updatedAt: timestamp,
		};
		this.tasks.set(task.id, node);
		return node;
	}

	linkDependency(beforeTaskId: string, afterTaskId: string): void {
		this.requireTask(beforeTaskId);
		const afterTask = this.requireTask(afterTaskId);
		if (beforeTaskId === afterTaskId) throw new Error("Task dependency would create a cycle");
		if (this.dependsOn(beforeTaskId, afterTaskId)) throw new Error("Task dependency would create a cycle");
		if (afterTask.dependencies.includes(beforeTaskId)) return;
		this.replaceTask(afterTaskId, { dependencies: [...afterTask.dependencies, beforeTaskId] });
	}

	assignTask(taskId: string, agentId: string): TaskNode {
		const task = this.requireTask(taskId);
		if (task.acceptanceCriteria.length === 0)
			throw new Error("Task acceptanceCriteria are required before assignment");
		if (this.hasIncompleteDependencies(task))
			throw new Error("Task dependencies must be completed before assignment");
		return this.replaceTask(taskId, { assigneeAgentId: agentId, state: "assigned" });
	}

	updateTask(taskId: string, patch: TaskPatch): TaskNode {
		this.ensurePatchValid(patch);
		return this.replaceTask(taskId, clonePatch(patch));
	}

	changeTaskState(taskId: string, state: TaskState, options: ChangeTaskStateOptions = {}): TaskNode {
		return this.replaceTask(taskId, {
			state,
			blockers: options.blockers ? [...options.blockers] : this.requireTask(taskId).blockers,
		});
	}

	getTask(taskId: string): TaskNode | undefined {
		const task = this.tasks.get(taskId);
		return task ? cloneTask(task) : undefined;
	}

	getProgress(taskId: string): TaskProgressSummary {
		this.requireTask(taskId);
		const descendants = this.getDescendants(taskId);
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

	getReadyTasks(): readonly TaskNode[] {
		return Array.from(this.tasks.values())
			.filter((task) => this.isReadyTask(task))
			.map(cloneTask);
	}

	snapshot(): readonly TaskNode[] {
		return Array.from(this.tasks.values(), cloneTask);
	}

	private ensureNewTaskValid(task: NewTaskNode): void {
		if (this.tasks.has(task.id)) throw new Error(`Task already exists: ${task.id}`);
		if (!task.title.trim()) throw new Error("Task title is required");
		if (!task.description.trim()) throw new Error("Task description is required");
		if (task.parentTaskId) this.requireTask(task.parentTaskId);
	}

	private ensurePatchValid(patch: TaskPatch): void {
		if (patch.title !== undefined && !patch.title.trim()) throw new Error("Task title is required");
		if (patch.description !== undefined && !patch.description.trim()) throw new Error("Task description is required");
	}

	private requireTask(taskId: string): TaskNode {
		const task = this.tasks.get(taskId);
		if (!task) throw new Error(`Unknown task: ${taskId}`);
		return task;
	}

	private replaceTask(taskId: string, patch: Partial<TaskNode>): TaskNode {
		const current = this.requireTask(taskId);
		const next: TaskNode = { ...current, ...patch, updatedAt: this.now() };
		this.tasks.set(taskId, next);
		return cloneTask(next);
	}

	private hasIncompleteDependencies(task: TaskNode): boolean {
		return task.dependencies.some((dependencyId) => this.requireTask(dependencyId).state !== "completed");
	}

	private isReadyTask(task: TaskNode): boolean {
		return task.state === "planned" && task.blockers.length === 0 && !this.hasIncompleteDependencies(task);
	}

	private dependsOn(taskId: string, dependencyId: string): boolean {
		const task = this.requireTask(taskId);
		if (task.dependencies.includes(dependencyId)) return true;
		return task.dependencies.some((nextDependencyId) => this.dependsOn(nextDependencyId, dependencyId));
	}

	private getDescendants(taskId: string): readonly TaskNode[] {
		const directChildren = Array.from(this.tasks.values()).filter((task) => task.parentTaskId === taskId);
		return directChildren.flatMap((task) => [task, ...this.getDescendants(task.id)]);
	}
}

function calculatePercent(completed: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((completed / total) * PERCENT_SCALE);
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

function clonePatch(patch: TaskPatch): Partial<TaskNode> {
	return {
		...patch,
		...clonePatchArrays(patch),
	};
}

function clonePatchArrays(patch: TaskPatch): Partial<TaskNode> {
	return {
		...(patch.acceptanceCriteria ? { acceptanceCriteria: [...patch.acceptanceCriteria] } : {}),
		...(patch.outputs ? { outputs: patch.outputs.map((output) => ({ ...output })) } : {}),
		...(patch.blockers ? { blockers: [...patch.blockers] } : {}),
	};
}
