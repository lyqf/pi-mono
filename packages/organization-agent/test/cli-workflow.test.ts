import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";
import { type RealAdapterFactoryInput, runCliSession } from "../src/cli.js";

const scriptedAdapter = createScriptedAgentRuntimeAdapter({
	boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
	planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
	worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
	reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
	memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
});

describe("CLI workflow", () => {
	it("runs scripted workflow and exposes dashboard URL without cmux", async () => {
		const result = await runCliSession({
			command: "start",
			task: "Build Agent Company",
			port: 0,
			openCmux: false,
			runWorkflow: true,
			adapter: scriptedAdapter,
		});

		try {
			expect(result.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
			expect(result.events.map((event) => event.type)).toContain("skill.created");
			expect(result.events.map((event) => event.type)).toContain("memory.written");
		} finally {
			await result.stop();
		}
	});

	it("uses the real adapter factory when provider and model are explicit", async () => {
		const calls: RealAdapterFactoryInput[] = [];
		const result = await runCliSession({
			command: "start",
			task: "Build Agent Company",
			port: 0,
			openCmux: false,
			runWorkflow: true,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			createRealAdapter: (input) => {
				calls.push(input);
				return scriptedAdapter;
			},
		});

		try {
			expect(calls).toHaveLength(1);
			expect(calls[0]).toMatchObject({ provider: "cpa-claude", modelId: "claude-opus-4-7" });
			expect(result.events.map((event) => event.type)).toContain("skill.created");
		} finally {
			await result.stop();
		}
	});
});
