import type { Model } from "@earendil-works/pi-ai";
import { describe, expect, it } from "vitest";
import { createDefaultPiAgentRuntimeAdapter, type DefaultPiAgentOptions } from "../src/default-pi-agent-adapter.js";
import type { PiAgentLike } from "../src/pi-agent-runtime-adapter.js";

const model: Model<"anthropic-messages"> = {
	id: "claude-opus-4-7",
	name: "Claude Opus 4.7 (1M)",
	api: "anthropic-messages",
	provider: "cpa-claude",
	baseUrl: "http://127.0.0.1:8317",
	reasoning: true,
	input: ["text", "image"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 1_000_000,
	maxTokens: 128_000,
};

class FakePiAgent implements PiAgentLike {
	readonly state = {
		messages: [
			{
				role: "assistant" as const,
				content: [{ type: "text" as const, text: "Factory summary\nFactory message" }],
			},
		],
	};

	constructor(readonly options: DefaultPiAgentOptions) {}

	async prompt(): Promise<void> {}
}

describe("createDefaultPiAgentRuntimeAdapter", () => {
	it("creates a pi Agent with role prompt as system prompt", async () => {
		const created: FakePiAgent[] = [];
		const adapter = createDefaultPiAgentRuntimeAdapter({
			createAgent: (options) => {
				const agent = new FakePiAgent(options);
				created.push(agent);
				return agent;
			},
		});

		const output = await adapter.run({ agentId: "planner", role: "planner", taskId: "root-goal", input: "Plan" });

		expect(created).toHaveLength(1);
		expect(created[0]?.options.initialState?.systemPrompt).toContain("Role: planner");
		expect(output).toEqual({ summary: "Factory summary", messages: ["Factory message"] });
	});

	it("passes caller Agent options while injecting the role system prompt", async () => {
		const created: FakePiAgent[] = [];
		const adapter = createDefaultPiAgentRuntimeAdapter({
			agentOptions: { initialState: { model, thinkingLevel: "off" }, sessionId: "session-1" },
			createAgent: (options) => {
				const agent = new FakePiAgent(options);
				created.push(agent);
				return agent;
			},
		});

		await adapter.run({ agentId: "worker-a", role: "worker", taskId: "task-1", input: "Implement" });

		expect(created[0]?.options.initialState?.model).toBe(model);
		expect(created[0]?.options.initialState?.thinkingLevel).toBe("off");
		expect(created[0]?.options.initialState?.systemPrompt).toContain("Role: worker");
		expect(created[0]?.options.sessionId).toBe("session-1");
	});

	it("appends skillsPromptAddon to the role system prompt", async () => {
		const created: FakePiAgent[] = [];
		const adapter = createDefaultPiAgentRuntimeAdapter({
			skillsPromptAddon: "SKILL_ADDON_LINE",
			createAgent: (options) => {
				created.push(new FakePiAgent(options));
				return created[created.length - 1]!;
			},
		});
		await adapter.run({ agentId: "memory", role: "memory", taskId: "t1", input: "x" });
		expect(created[0]?.options.initialState?.systemPrompt).toContain("Role: memory");
		expect(created[0]?.options.initialState?.systemPrompt).toContain("SKILL_ADDON_LINE");
	});
});
