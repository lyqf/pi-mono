import type { EventStore } from "./event-store.js";
import type { SkillCandidate } from "./events.js";

export interface NewSkillCandidate {
	readonly name: string;
	readonly trigger: string;
	readonly steps: readonly string[];
	readonly sourceTaskId: string;
	readonly sourceAgentIds: readonly string[];
	readonly successEvidence: readonly string[];
	readonly failureCases: readonly string[];
}

export interface SkillRegistryOptions {
	readonly eventStore?: EventStore;
	readonly now?: () => string;
}

export interface SkillRegistry {
	createCandidate(candidate: NewSkillCandidate): SkillCandidate;
	snapshot(): readonly SkillCandidate[];
}

export function createSkillRegistry(options: SkillRegistryOptions = {}): SkillRegistry {
	return new InMemorySkillRegistry(options.eventStore, options.now ?? (() => new Date().toISOString()));
}

class InMemorySkillRegistry implements SkillRegistry {
	private readonly skills: SkillCandidate[] = [];

	constructor(
		private readonly eventStore: EventStore | undefined,
		private readonly now: () => string,
	) {}

	createCandidate(candidate: NewSkillCandidate): SkillCandidate {
		validateCandidate(candidate);
		const skill: SkillCandidate = {
			...candidate,
			id: `skill-${this.skills.length + 1}`,
			usageCount: 0,
			createdAt: this.now(),
		};
		this.skills.push(skill);
		this.eventStore?.append({ type: "skill.created", skill });
		return cloneSkill(skill);
	}

	snapshot(): readonly SkillCandidate[] {
		return this.skills.map(cloneSkill);
	}
}

function validateCandidate(candidate: NewSkillCandidate): void {
	if (!candidate.sourceTaskId.trim()) throw new Error("Skill sourceTaskId is required");
	if (!candidate.name.trim()) throw new Error("Skill name is required");
	if (!candidate.trigger.trim()) throw new Error("Skill trigger is required");
	if (candidate.steps.length === 0) throw new Error("Skill steps are required");
	if (candidate.sourceAgentIds.length === 0) throw new Error("Skill sourceAgentIds are required");
	if (candidate.successEvidence.length === 0) throw new Error("Skill successEvidence is required");
}

function cloneSkill(skill: SkillCandidate): SkillCandidate {
	return {
		...skill,
		steps: [...skill.steps],
		sourceAgentIds: [...skill.sourceAgentIds],
		successEvidence: [...skill.successEvidence],
		failureCases: [...skill.failureCases],
	};
}
