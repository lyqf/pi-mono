import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";
import { createOrganizationSession } from "../src/organization-session.js";
import { runInitialOrganizationWorkflow } from "../src/workflow-coordinator.js";

describe("Workflow organization requests", () => {
	it("applies spawn requests through organization session", async () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });
		const adapter = createScriptedAgentRuntimeAdapter({
			boss: {
				summary: "Goal accepted",
				messages: ["Planner should break down work"],
				organizationRequests: [{ type: "spawn", role: "specialist", reason: "Need database expertise" }],
			},
			planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
			worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
			reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
			memory: { summary: "Memory extracted", messages: ["Trace persisted"] },
		});

		await runInitialOrganizationWorkflow({ session, adapter, task: "Build Agent Company" });

		expect(session.getAgents().find((agent) => agent.id === "specialist-1")).toMatchObject({
			role: "specialist",
			spawnedBy: "boss",
		});
		expect(session.getEvents()).toContainEqual({
			type: "agent.spawn_requested",
			byAgentId: "boss",
			role: "specialist",
			reason: "Need database expertise",
		});
	});
});
