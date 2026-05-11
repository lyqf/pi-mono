import { describe, expect, it } from "vitest";
import { createOrganizationProjector } from "../src/organization-projector.js";
import type { AgentNode } from "../src/types.js";

const agent: AgentNode = {
	id: "specialist-1",
	role: "specialist",
	displayName: "Specialist Agent 1",
	state: "created",
	createdAt: "2026-05-11T00:00:00.000Z",
};

describe("OrganizationProjector lifecycle events", () => {
	it("projects terminated and merged agent states", () => {
		const projector = createOrganizationProjector([{ type: "agent.created", agent }]);

		projector.apply({ type: "agent.terminated", agentId: "specialist-1", reason: "Complete" });

		expect(projector.snapshot().agents["specialist-1"]).toMatchObject({ state: "terminated" });

		projector.apply({
			type: "agent.created",
			agent: { ...agent, id: "specialist-2", displayName: "Specialist Agent 2" },
		});
		projector.apply({
			type: "agent.merged",
			sourceAgentId: "specialist-2",
			targetAgentId: "worker-a",
			reason: "Handed off",
		});

		expect(projector.snapshot().agents["specialist-2"]).toMatchObject({ state: "merged" });
	});
});
