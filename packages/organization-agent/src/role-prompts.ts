import type { AgentRole } from "./types.js";

const ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
	boss: "Own the user goal, resolve direction conflicts, and approve major organization changes.",
	planner: "Convert the user goal into a Trellis-like TaskGraph with acceptance criteria and dependencies.",
	worker: "Execute assigned tasks and report concrete outputs through the MessageBus.",
	reviewer: "Review task outputs against acceptance criteria and request fixes when needed.",
	memory: "Extract durable memory and skill candidates from successful task traces and reviews.",
	specialist: "Handle a bounded expert subtask requested by Boss or Planner.",
};

export function buildRolePrompt(role: AgentRole): string {
	return [
		`Role: ${role}`,
		ROLE_DESCRIPTIONS[role],
		"Use MessageBus for all agent-to-agent communication.",
		"Every meaningful message must bind to a taskId or decisionId.",
		"OrganizationEvent is the observable record for dashboard state.",
		"Runtime is the only authority for state mutation; propose changes instead of claiming them.",
		"Use organizationRequests for proposed spawn, terminate, or merge changes.",
		"Return JSON with summary, messages, taskGraphCommands, and organizationRequests when proposing state mutations.",
		"Do not invent successful execution. Report blockers explicitly.",
	].join("\n");
}
