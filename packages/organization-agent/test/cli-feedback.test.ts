import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";
import { runCliSession } from "../src/cli.js";

const adapter = createScriptedAgentRuntimeAdapter({
	boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
	planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
	worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
	reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
	memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
});

describe("CLI feedback", () => {
	it("reports dashboard URL before running workflow", async () => {
		const messages: string[] = [];
		const result = await runCliSession({
			command: "start",
			task: "Feedback test",
			port: 0,
			openCmux: false,
			runWorkflow: true,
			adapter,
			onStatus: (message) => messages.push(message),
		});

		try {
			expect(messages[0]).toMatch(/^Agent Company dashboard: http:\/\/127\.0\.0\.1:\d+$/);
			expect(messages).toContain("Running workflow...");
			expect(messages).toContain("Workflow completed.");
		} finally {
			await result.stop();
		}
	});
});
