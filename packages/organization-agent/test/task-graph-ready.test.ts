import { describe, expect, it } from "vitest";
import { createTaskGraph } from "../src/task-graph.js";

function task(id: string, parentTaskId?: string) {
	return {
		id,
		title: id,
		description: `${id} description`,
		kind: "task" as const,
		parentTaskId,
		acceptanceCriteria: [`${id} done`],
	};
}

describe("TaskGraph ready task selection", () => {
	it("returns planned tasks with completed dependencies and no blockers", () => {
		const graph = createTaskGraph({ now: () => "2026-05-11T00:00:00.000Z" });
		graph.createTask(task("research"));
		graph.createTask(task("implement"));
		graph.createTask(task("blocked"));
		graph.createTask(task("assigned"));
		graph.linkDependency("research", "implement");
		graph.changeTaskState("research", "completed");
		graph.changeTaskState("implement", "planned");
		graph.changeTaskState("blocked", "blocked", { blockers: ["missing input"] });
		graph.changeTaskState("assigned", "assigned");

		expect(graph.getReadyTasks().map((readyTask) => readyTask.id)).toEqual(["implement"]);
	});
});
