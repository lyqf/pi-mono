import { describe, expect, it } from "vitest";
import type { OrganizationEvent } from "../src/events.js";
import { buildDashboardGodView } from "../src/god-view.js";

const bossCreated: OrganizationEvent = {
	type: "agent.created",
	agent: {
		id: "boss",
		role: "boss",
		displayName: "Boss",
		state: "working",
		createdAt: "2026-05-11T00:00:00.000Z",
		currentTaskId: "t1",
	},
};

const specialistCreated: OrganizationEvent = {
	type: "agent.created",
	agent: {
		id: "sp1",
		role: "specialist",
		displayName: "S1",
		state: "idle",
		parentAgentId: "boss",
		createdAt: "2026-05-11T00:00:00.000Z",
	},
};

const taskRoot: OrganizationEvent = {
	type: "task.created",
	task: {
		id: "root-1",
		title: "Goal",
		description: "",
		kind: "root",
		state: "planned",
		assigneeAgentId: undefined,
		dependencies: [],
		acceptanceCriteria: [],
		outputs: [],
		blockers: [],
		createdAt: "2026-05-11T00:00:00.000Z",
		updatedAt: "2026-05-11T00:00:00.000Z",
	},
};

describe("buildDashboardGodView", () => {
	it("clusters core vs specialists and counts active agents", () => {
		const view = buildDashboardGodView([bossCreated, specialistCreated, taskRoot]);
		expect(view.activeAgents).toBe(2);
		expect(view.clusters.some((c) => c.kind === "core" && c.agentIds.includes("boss"))).toBe(true);
		expect(view.clusters.some((c) => c.kind === "specialists" && c.agentIds.includes("sp1"))).toBe(true);
		expect(view.edges.some((e) => e.kind === "parent_child" && e.fromId === "boss" && e.toId === "sp1")).toBe(true);
	});
});
