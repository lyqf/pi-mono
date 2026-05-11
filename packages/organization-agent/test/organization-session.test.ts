import { describe, expect, it } from "vitest";
import { createOrganizationSession } from "../src/organization-session.js";

describe("OrganizationSession", () => {
	it("creates the fixed initial six-agent organization", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		expect(session.getAgents().map((agent) => agent.role)).toEqual([
			"boss",
			"planner",
			"worker",
			"worker",
			"reviewer",
			"memory",
		]);
		expect(session.getAgents().map((agent) => agent.id)).toEqual([
			"boss",
			"planner",
			"worker-a",
			"worker-b",
			"reviewer",
			"memory",
		]);
	});

	it("start seeds a root task and assigns it to the boss", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		session.start("Build Agent Company");

		expect(session.getTaskGraph().getTask("root-goal")).toMatchObject({
			title: "Build Agent Company",
			kind: "root",
			state: "assigned",
			assigneeAgentId: "boss",
			acceptanceCriteria: ["Boss Agent has acknowledged and planned the user goal"],
		});
		expect(session.getAgents().find((agent) => agent.id === "boss")).toMatchObject({
			state: "assigned",
			currentTaskId: "root-goal",
		});
	});

	it("emits creation and task events", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		session.start("Build Agent Company");

		expect(session.getEvents().map((event) => event.type)).toEqual([
			"agent.created",
			"agent.created",
			"agent.created",
			"agent.created",
			"agent.created",
			"agent.created",
			"task.created",
			"task.assigned",
			"agent.status_changed",
		]);
	});
});
