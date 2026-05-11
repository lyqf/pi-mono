import { describe, expect, it } from "vitest";
import { createOrganizationSession } from "../src/organization-session.js";

describe("OrganizationSession lifecycle", () => {
	it("records spawn metadata for specialist agents", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		const decision = session.requestSpawn({
			byAgentId: "planner",
			role: "specialist",
			reason: "Need database expertise",
		});

		expect(decision).toMatchObject({
			accepted: true,
			agent: { id: "specialist-1", parentAgentId: "planner", spawnedBy: "planner" },
		});
	});

	it("terminates and merges agents with explicit reasons", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });
		session.requestSpawn({ byAgentId: "planner", role: "specialist", reason: "Need database expertise" });
		session.requestSpawn({ byAgentId: "boss", role: "specialist", reason: "Need UI expertise" });

		session.terminateAgent("specialist-1", "Database task complete");
		session.mergeAgents("specialist-2", "worker-a", "UI findings handed off");

		expect(session.getAgents().find((agent) => agent.id === "specialist-1")).toMatchObject({
			state: "terminated",
			terminatedAt: "2026-05-11T00:00:00.000Z",
		});
		expect(session.getAgents().find((agent) => agent.id === "specialist-2")).toMatchObject({ state: "merged" });
		expect(session.getEvents().slice(-2)).toEqual([
			{ type: "agent.terminated", agentId: "specialist-1", reason: "Database task complete" },
			{
				type: "agent.merged",
				sourceAgentId: "specialist-2",
				targetAgentId: "worker-a",
				reason: "UI findings handed off",
			},
		]);
	});

	it("rejects lifecycle changes without explicit reasons", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		expect(() => session.terminateAgent("worker-b", "")).toThrow("Termination reason is required");
		expect(() => session.mergeAgents("worker-b", "worker-a", "")).toThrow("Merge reason is required");
	});
});
