import { describe, expect, it } from "vitest";
import type { OrganizationEvent, SkillCandidate } from "../src/events.js";
import {
	buildTrellisSkillManifest,
	collectSkillsFromEvents,
	formatSkillsForRolePrompt,
} from "../src/skill-manifest.js";

const skill: SkillCandidate = {
	id: "skill-1",
	name: "Checklist",
	trigger: "before review",
	steps: ["a", "b"],
	sourceTaskId: "t-1",
	sourceAgentIds: ["memory"],
	successEvidence: ["ok"],
	failureCases: [],
	usageCount: 0,
	createdAt: "2026-05-11T00:00:00.000Z",
};

const skillEvent: OrganizationEvent = { type: "skill.created", skill };

describe("skill manifest", () => {
	it("collects skills from events and formats prompt addon", () => {
		const manifest = buildTrellisSkillManifest(collectSkillsFromEvents([skillEvent]));
		expect(manifest.version).toBe(1);
		expect(manifest.skills).toHaveLength(1);
		expect(manifest.skills[0].name).toBe("Checklist");
		const prompt = formatSkillsForRolePrompt(manifest);
		expect(prompt).toContain("Checklist");
		expect(prompt).toContain("before review");
	});
});
