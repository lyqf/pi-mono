import type { NewSkillCandidate } from "./skill-registry.js";

export interface SkillTraceAgentSummary {
	readonly agentId: string;
	readonly summary: string;
}

export interface SkillExtractionTrace {
	readonly taskId: string;
	readonly taskTitle: string;
	readonly agentSummaries: readonly SkillTraceAgentSummary[];
	readonly successEvidence: readonly string[];
	readonly failureCases?: readonly string[];
}

export function extractSkillCandidateFromTrace(trace: SkillExtractionTrace): NewSkillCandidate {
	validateTrace(trace);
	return {
		name: trace.taskTitle,
		trigger: "When a similar task needs company-style agent coordination",
		steps: trace.agentSummaries.map((item) => item.summary),
		sourceTaskId: trace.taskId,
		sourceAgentIds: trace.agentSummaries.map((item) => item.agentId),
		successEvidence: [...trace.successEvidence],
		failureCases: [...(trace.failureCases ?? [])],
	};
}

function validateTrace(trace: SkillExtractionTrace): void {
	if (!trace.taskId.trim()) throw new Error("Skill trace taskId is required");
	if (!trace.taskTitle.trim()) throw new Error("Skill trace taskTitle is required");
	if (trace.agentSummaries.length === 0) throw new Error("Skill trace agentSummaries are required");
	if (trace.successEvidence.length === 0) throw new Error("Skill trace successEvidence is required");
	for (const item of trace.agentSummaries) validateAgentSummary(item);
}

function validateAgentSummary(item: SkillTraceAgentSummary): void {
	if (!item.agentId.trim()) throw new Error("Skill trace agentId is required");
	if (!item.summary.trim()) throw new Error("Skill trace summary is required");
}
