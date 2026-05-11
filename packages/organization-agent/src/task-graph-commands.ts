import type { TaskGraph } from "./task-graph.js";
import type { NewTaskNode, TaskPatch } from "./types.js";

export type TaskGraphCommand =
	| { readonly type: "create_task"; readonly task: NewTaskNode }
	| { readonly type: "update_task"; readonly taskId: string; readonly patch: TaskPatch }
	| { readonly type: "link_dependency"; readonly beforeTaskId: string; readonly afterTaskId: string }
	| { readonly type: "assign_task"; readonly taskId: string; readonly agentId: string }
	| { readonly type: "create_review_task"; readonly targetTaskId: string; readonly reviewerAgentId: string };

export function applyTaskGraphCommand(graph: TaskGraph, command: TaskGraphCommand): void {
	switch (command.type) {
		case "create_task":
			graph.createTask(command.task);
			return;
		case "update_task":
			graph.updateTask(command.taskId, command.patch);
			return;
		case "link_dependency":
			graph.linkDependency(command.beforeTaskId, command.afterTaskId);
			return;
		case "assign_task":
			graph.assignTask(command.taskId, command.agentId);
			return;
		case "create_review_task":
			createReviewTask(graph, command.targetTaskId, command.reviewerAgentId);
			return;
	}
}

function createReviewTask(graph: TaskGraph, targetTaskId: string, reviewerAgentId: string): void {
	const target = graph.getTask(targetTaskId);
	if (!target) throw new Error(`Unknown task: ${targetTaskId}`);
	const reviewTaskId = `review-${targetTaskId}`;
	graph.createTask({
		id: reviewTaskId,
		title: `Review ${target.title}`,
		description: `Review output for ${target.title}`,
		kind: "review",
		parentTaskId: target.parentTaskId,
		acceptanceCriteria: [`Reviewer accepts ${target.title}`],
	});
	graph.linkDependency(targetTaskId, reviewTaskId);
	if (target.state === "completed") graph.assignTask(reviewTaskId, reviewerAgentId);
}
