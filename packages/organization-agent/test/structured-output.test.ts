import { describe, expect, it } from "vitest";
import { parseAgentRunOutput } from "../src/structured-output.js";

describe("structured agent output", () => {
	it("parses JSON output with messages and task graph commands", () => {
		const output = parseAgentRunOutput(
			JSON.stringify({
				summary: "Plan created",
				messages: ["Worker should start"],
				taskGraphCommands: [
					{
						type: "create_task",
						task: {
							id: "task-1",
							title: "Task 1",
							description: "Do task 1",
							kind: "task",
							acceptanceCriteria: ["Done"],
						},
					},
				],
			}),
		);

		expect(output.summary).toBe("Plan created");
		expect(output.messages).toEqual(["Worker should start"]);
		expect(output.taskGraphCommands).toHaveLength(1);
	});

	it("falls back to line based output", () => {
		expect(parseAgentRunOutput("Summary\nMessage one")).toEqual({ summary: "Summary", messages: ["Message one"] });
	});
});
