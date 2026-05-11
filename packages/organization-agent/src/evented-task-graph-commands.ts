import type { EventStore } from "./event-store.js";
import type { TaskGraph } from "./task-graph.js";
import { applyTaskGraphCommand, type TaskGraphCommand } from "./task-graph-commands.js";

export function applyTaskGraphCommandWithEvents(
	graph: TaskGraph,
	eventStore: EventStore,
	command: TaskGraphCommand,
): void {
	applyTaskGraphCommand(graph, command);
	emitCommandEvent(graph, eventStore, command);
}

function emitCommandEvent(graph: TaskGraph, eventStore: EventStore, command: TaskGraphCommand): void {
	switch (command.type) {
		case "create_task": {
			const task = graph.getTask(command.task.id);
			if (!task) throw new Error(`Task was not created: ${command.task.id}`);
			eventStore.append({ type: "task.created", task });
			return;
		}
		case "update_task": {
			const task = graph.getTask(command.taskId);
			if (!task) throw new Error(`Task was not updated: ${command.taskId}`);
			eventStore.append({ type: "task.updated", task });
			return;
		}
		case "link_dependency":
			eventStore.append({
				type: "task.dependency_linked",
				beforeTaskId: command.beforeTaskId,
				afterTaskId: command.afterTaskId,
			});
			return;
		case "assign_task":
			eventStore.append({ type: "task.assigned", taskId: command.taskId, agentId: command.agentId });
			return;
		case "create_review_task": {
			const taskId = `review-${command.targetTaskId}`;
			const task = graph.getTask(taskId);
			if (!task) throw new Error(`Review task was not created: ${taskId}`);
			eventStore.append({ type: "task.created", task });
			eventStore.append({
				type: "task.dependency_linked",
				beforeTaskId: command.targetTaskId,
				afterTaskId: taskId,
			});
			if (task.assigneeAgentId) eventStore.append({ type: "task.assigned", taskId, agentId: task.assigneeAgentId });
			return;
		}
	}
}
