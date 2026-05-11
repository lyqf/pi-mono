import { describe, expect, it } from "vitest";
import { buildRolePrompt } from "../src/role-prompts.js";
import type { AgentRole } from "../src/types.js";

const roles: AgentRole[] = ["boss", "planner", "worker", "reviewer", "memory", "specialist"];

describe("role prompts", () => {
	it("builds explicit prompts for every role", () => {
		for (const role of roles) {
			const prompt = buildRolePrompt(role);

			expect(prompt).toContain(role);
			expect(prompt).toContain("OrganizationEvent");
			expect(prompt).toContain("MessageBus");
		}
	});

	it("marks runtime as the only authority for state mutation", () => {
		expect(buildRolePrompt("planner")).toContain("Runtime is the only authority");
	});

	it("documents structured organization request contract", () => {
		const prompt = buildRolePrompt("planner");

		expect(prompt).toContain("organizationRequests");
		expect(prompt).toContain("spawn");
		expect(prompt).toContain("terminate");
		expect(prompt).toContain("merge");
	});

	it("requires structured JSON when proposing state mutations", () => {
		const prompt = buildRolePrompt("worker");

		expect(prompt).toContain("Return JSON");
		expect(prompt).toContain("taskGraphCommands");
		expect(prompt).toContain("summary");
		expect(prompt).toContain("messages");
	});
});
