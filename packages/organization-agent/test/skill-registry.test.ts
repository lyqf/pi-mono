import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createSkillRegistry } from "../src/skill-registry.js";

describe("SkillRegistry", () => {
	it("requires source task trigger steps and evidence", () => {
		const registry = createSkillRegistry({ eventStore: createEventStore(), now: () => "2026-05-11T00:00:00.000Z" });

		expect(() =>
			registry.createCandidate({
				name: "",
				trigger: "",
				steps: [],
				sourceTaskId: "",
				sourceAgentIds: [],
				successEvidence: [],
				failureCases: [],
			}),
		).toThrow("sourceTaskId");
	});

	it("stores skill candidates and emits skill.created", () => {
		const eventStore = createEventStore();
		const registry = createSkillRegistry({ eventStore, now: () => "2026-05-11T00:00:00.000Z" });

		const skill = registry.createCandidate({
			name: "Implement TaskGraph",
			trigger: "When a task needs DAG planning",
			steps: ["Create tasks", "Link dependencies", "Validate progress"],
			sourceTaskId: "task-graph",
			sourceAgentIds: ["worker-a"],
			successEvidence: ["TaskGraph tests passed"],
			failureCases: [],
		});

		expect(registry.snapshot()).toEqual([skill]);
		expect(eventStore.snapshot()).toEqual([{ type: "skill.created", skill }]);
	});
});
