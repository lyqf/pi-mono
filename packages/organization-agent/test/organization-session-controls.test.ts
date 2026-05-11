import { describe, expect, it } from "vitest";
import { createOrganizationSession } from "../src/organization-session.js";

describe("OrganizationSession controls", () => {
	it("accepts bounded specialist spawn requests", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		const first = session.requestSpawn({
			byAgentId: "planner",
			role: "specialist",
			reason: "Need database expertise",
		});
		const second = session.requestSpawn({ byAgentId: "boss", role: "specialist", reason: "Need UI expertise" });
		const third = session.requestSpawn({ byAgentId: "planner", role: "specialist", reason: "Need another expert" });

		expect(first.accepted).toBe(true);
		expect(second.accepted).toBe(true);
		expect(third).toEqual({ accepted: false, reason: "Specialist limit reached" });
		expect(session.getAgents().filter((agent) => agent.role === "specialist")).toHaveLength(2);
	});

	it("rejects spawn requests without a reason", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		expect(session.requestSpawn({ byAgentId: "planner", role: "specialist", reason: "" })).toEqual({
			accepted: false,
			reason: "Spawn reason is required",
		});
	});

	it("writes memory and skill through session services", async () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		await session.writeMemory({ uri: "core://task/root", content: "Root summary" });
		session.createSkillCandidate({
			name: "Plan DAG tasks",
			trigger: "When task planning needs dependencies",
			steps: ["Create tasks", "Link dependencies"],
			sourceTaskId: "root-goal",
			sourceAgentIds: ["planner"],
			successEvidence: ["Planner created task graph"],
			failureCases: [],
		});

		expect(session.getEvents().map((event) => event.type)).toContain("memory.written");
		expect(session.getEvents().map((event) => event.type)).toContain("skill.created");
	});
});
