import { describe, expect, it } from "vitest";
import { createPiAgentRuntimeAdapter, type PiAgentLike } from "../src/pi-agent-runtime-adapter.js";

class FakePiAgent implements PiAgentLike {
	readonly prompts: string[] = [];
	readonly state = {
		messages: [
			{
				role: "assistant" as const,
				content: [{ type: "text" as const, text: "Summary\nMessage one\nMessage two" }],
			},
		],
	};

	async prompt(input: string): Promise<void> {
		this.prompts.push(input);
	}
}

describe("PiAgentRuntimeAdapter", () => {
	it("sends role prompt to pi Agent and extracts assistant text", async () => {
		const agent = new FakePiAgent();
		const adapter = createPiAgentRuntimeAdapter({ createAgent: () => agent });

		const output = await adapter.run({ agentId: "boss", role: "boss", taskId: "root-goal", input: "Build" });

		expect(agent.prompts[0]).toContain("Role: boss");
		expect(agent.prompts[0]).toContain("Build");
		expect(output).toEqual({ summary: "Summary", messages: ["Message one", "Message two"] });
	});
});
