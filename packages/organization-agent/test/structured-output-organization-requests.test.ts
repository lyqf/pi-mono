import { describe, expect, it } from "vitest";
import { parseAgentRunOutput } from "../src/structured-output.js";

describe("structured organization requests", () => {
	it("parses spawn terminate and merge requests", () => {
		const output = parseAgentRunOutput(
			JSON.stringify({
				summary: "Need specialist",
				messages: [],
				organizationRequests: [
					{ type: "spawn", role: "specialist", reason: "Need database expertise" },
					{ type: "terminate", agentId: "specialist-1", reason: "Done" },
					{ type: "merge", sourceAgentId: "specialist-2", targetAgentId: "worker-a", reason: "Hand off" },
				],
			}),
		);

		expect(output.organizationRequests).toEqual([
			{ type: "spawn", role: "specialist", reason: "Need database expertise" },
			{ type: "terminate", agentId: "specialist-1", reason: "Done" },
			{ type: "merge", sourceAgentId: "specialist-2", targetAgentId: "worker-a", reason: "Hand off" },
		]);
	});
});
