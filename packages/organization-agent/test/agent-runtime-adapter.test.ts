import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";

describe("AgentRuntimeAdapter", () => {
	it("returns scripted role output", async () => {
		const adapter = createScriptedAgentRuntimeAdapter({
			boss: { summary: "Goal accepted", messages: ["Plan the work"] },
		});

		await expect(
			adapter.run({ agentId: "boss", role: "boss", taskId: "root-goal", input: "Build" }),
		).resolves.toEqual({
			summary: "Goal accepted",
			messages: ["Plan the work"],
		});
	});

	it("fails explicitly when role script is missing", async () => {
		const adapter = createScriptedAgentRuntimeAdapter({});

		await expect(
			adapter.run({ agentId: "worker-a", role: "worker", taskId: "task-1", input: "Build" }),
		).rejects.toThrow("No scripted output");
	});
});
