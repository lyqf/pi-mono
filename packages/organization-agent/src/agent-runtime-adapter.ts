import type { TaskGraphCommand } from "./task-graph-commands.js";
import type { AgentRole } from "./types.js";

export interface AgentRunInput {
	readonly agentId: string;
	readonly role: AgentRole;
	readonly taskId: string;
	readonly input: string;
}

export type OrganizationRequest =
	| { readonly type: "spawn"; readonly role: AgentRole; readonly reason: string }
	| { readonly type: "terminate"; readonly agentId: string; readonly reason: string }
	| {
			readonly type: "merge";
			readonly sourceAgentId: string;
			readonly targetAgentId: string;
			readonly reason: string;
	  };

export interface AgentRunOutput {
	readonly summary: string;
	readonly messages: readonly string[];
	readonly taskGraphCommands?: readonly TaskGraphCommand[];
	readonly organizationRequests?: readonly OrganizationRequest[];
}

export interface AgentRuntimeAdapter {
	run(input: AgentRunInput): Promise<AgentRunOutput>;
}

export type ScriptedRoleOutputs = Partial<Record<AgentRole, AgentRunOutput>>;

export function createScriptedAgentRuntimeAdapter(outputs: ScriptedRoleOutputs): AgentRuntimeAdapter {
	return new ScriptedAgentRuntimeAdapter(outputs);
}

class ScriptedAgentRuntimeAdapter implements AgentRuntimeAdapter {
	constructor(private readonly outputs: ScriptedRoleOutputs) {}

	async run(input: AgentRunInput): Promise<AgentRunOutput> {
		const output = this.outputs[input.role];
		if (!output) throw new Error(`No scripted output for role: ${input.role}`);
		return {
			summary: output.summary,
			messages: [...output.messages],
			taskGraphCommands: output.taskGraphCommands ? [...output.taskGraphCommands] : undefined,
			organizationRequests: output.organizationRequests ? [...output.organizationRequests] : undefined,
		};
	}
}
