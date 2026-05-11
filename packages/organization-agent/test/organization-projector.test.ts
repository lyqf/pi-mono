import { describe, expect, it } from "vitest";
import type { OrganizationEvent } from "../src/events.js";
import { createOrganizationProjector } from "../src/organization-projector.js";

const createdAt = "2026-05-11T00:00:00.000Z";

function agentCreated(id: string): OrganizationEvent {
	return {
		type: "agent.created",
		agent: {
			id,
			role: id === "boss" ? "boss" : "worker",
			displayName: id,
			state: "created",
			createdAt,
		},
	};
}

describe("OrganizationProjector", () => {
	it("projects agent creation and status changes", () => {
		const projector = createOrganizationProjector();

		projector.apply(agentCreated("boss"));
		projector.apply({ type: "agent.status_changed", agentId: "boss", state: "assigned" });

		expect(projector.snapshot().agents.boss).toMatchObject({
			id: "boss",
			state: "assigned",
		});
	});

	it("projects task creation and assignment", () => {
		const projector = createOrganizationProjector();
		projector.apply({
			type: "task.created",
			task: {
				id: "root-goal",
				title: "Build Agent Company",
				description: "Build Agent Company",
				kind: "root",
				state: "created",
				dependencies: [],
				acceptanceCriteria: ["Boss planned the goal"],
				outputs: [],
				blockers: [],
				createdAt,
				updatedAt: createdAt,
			},
		});
		projector.apply({ type: "task.assigned", taskId: "root-goal", agentId: "boss" });

		expect(projector.snapshot().tasks["root-goal"]).toMatchObject({
			state: "assigned",
			assigneeAgentId: "boss",
		});
	});

	it("projects messages and keeps raw events", () => {
		const projector = createOrganizationProjector();
		const event: OrganizationEvent = {
			type: "message.sent",
			message: {
				id: "message-1",
				fromAgentId: "planner",
				toAgentId: "worker-a",
				taskId: "task-1",
				type: "instruction",
				content: "Implement TaskGraph",
				createdAt,
			},
		};

		projector.apply(event);

		expect(projector.snapshot().messages).toEqual([event.message]);
		expect(projector.snapshot().events).toEqual([event]);
	});
});
