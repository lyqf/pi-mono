import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";
import { createOrganizationProjector } from "../src/organization-projector.js";
import { createOrganizationSession } from "../src/organization-session.js";
import { runInitialOrganizationWorkflow } from "../src/workflow-coordinator.js";

describe("WorkflowCoordinator", () => {
	it("runs Boss Planner Worker Reviewer Memory sequence", async () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });
		const adapter = createScriptedAgentRuntimeAdapter({
			boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
			planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
			worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
			reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
			memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
		});

		await runInitialOrganizationWorkflow({ session, adapter, task: "Build Agent Company" });

		const eventTypes = session.getEvents().map((event) => event.type);
		expect(eventTypes).toContain("message.sent");
		expect(eventTypes).toContain("memory.written");
		expect(eventTypes).toContain("skill.created");
		expect(
			session
				.getTaskGraph()
				.snapshot()
				.map((task) => task.id),
		).toContain("initial-worker-task");
	});
	it("projects workflow events into dashboard state", async () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });
		const adapter = createScriptedAgentRuntimeAdapter({
			boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
			planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
			worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
			reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
			memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
		});

		await runInitialOrganizationWorkflow({ session, adapter, task: "Build Agent Company" });
		const projection = createOrganizationProjector(session.getEvents()).snapshot();

		expect(projection.tasks["initial-worker-task"].state).toBe("completed");
		expect(projection.messages.length).toBeGreaterThanOrEqual(2);
		expect(projection.events.some((event) => event.type === "memory.written")).toBe(true);
		expect(projection.events.some((event) => event.type === "skill.created")).toBe(true);
	});
	it("applies planner task graph commands", async () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });
		const adapter = createScriptedAgentRuntimeAdapter({
			boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
			planner: {
				summary: "Plan created",
				messages: ["Worker A should implement first task"],
				taskGraphCommands: [
					{
						type: "create_task",
						task: {
							id: "planner-worker-task",
							title: "Planner worker task",
							description: "Created by planner",
							kind: "task",
							parentTaskId: "root-goal",
							acceptanceCriteria: ["Planner task done"],
						},
					},
				],
			},
			worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
			reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
			memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
		});

		await runInitialOrganizationWorkflow({ session, adapter, task: "Build Agent Company" });

		expect(session.getTaskGraph().getTask("planner-worker-task")).toMatchObject({ title: "Planner worker task" });
	});
});
