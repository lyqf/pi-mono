import type { OrganizationEvent, SkillCandidate } from "./events.js";

export interface TrellisSkillManifestV1 {
	readonly version: 1;
	readonly generatedAt: string;
	readonly skills: readonly TrellisSkillEntryV1[];
}

export interface TrellisSkillEntryV1 {
	readonly id: string;
	readonly name: string;
	readonly trigger: string;
	readonly steps: readonly string[];
	readonly sourceTaskId: string;
	readonly sourceAgentIds: readonly string[];
}

export function collectSkillsFromEvents(events: readonly OrganizationEvent[]): SkillCandidate[] {
	return events
		.filter((event): event is Extract<OrganizationEvent, { type: "skill.created" }> => event.type === "skill.created")
		.map((event) => event.skill);
}

export function buildTrellisSkillManifest(candidates: readonly SkillCandidate[]): TrellisSkillManifestV1 {
	return {
		version: 1,
		generatedAt: new Date().toISOString(),
		skills: candidates.map((skill) => ({
			id: skill.id,
			name: skill.name,
			trigger: skill.trigger,
			steps: [...skill.steps],
			sourceTaskId: skill.sourceTaskId,
			sourceAgentIds: [...skill.sourceAgentIds],
		})),
	};
}

export function formatSkillsForRolePrompt(manifest: TrellisSkillManifestV1): string {
	if (manifest.skills.length === 0) return "";
	const lines = manifest.skills.map(
		(skill) => `- ${skill.name} (trigger: ${skill.trigger}) steps: ${skill.steps.join(" → ")} [id=${skill.id}]`,
	);
	return ["Loaded organization skills (apply when trigger matches):", ...lines].join("\n");
}
