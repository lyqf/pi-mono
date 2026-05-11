import type { AgentRunInput, AgentRunOutput, AgentRuntimeAdapter } from "./agent-runtime-adapter.js";
import { buildRolePrompt } from "./role-prompts.js";
import { parseAgentRunOutput } from "./structured-output.js";

export interface PiAgentMessageContentPart {
	readonly type: string;
	readonly text?: string;
}

export interface PiAgentMessage {
	readonly role: string;
	readonly content: readonly PiAgentMessageContentPart[];
}

export interface PiAgentLike {
	readonly state: { readonly messages: readonly PiAgentMessage[] };
	prompt(input: string): Promise<void>;
}

export interface PiAgentFactoryInput {
	readonly role: AgentRunInput["role"];
}

export interface PiAgentRuntimeAdapterOptions {
	readonly createAgent: (input: PiAgentFactoryInput) => PiAgentLike;
	readonly includeRolePromptInUserInput?: boolean;
}

export function createPiAgentRuntimeAdapter(options: PiAgentRuntimeAdapterOptions): AgentRuntimeAdapter {
	return new PiAgentRuntimeAdapter(options);
}

class PiAgentRuntimeAdapter implements AgentRuntimeAdapter {
	constructor(private readonly options: PiAgentRuntimeAdapterOptions) {}

	async run(input: AgentRunInput): Promise<AgentRunOutput> {
		const agent = this.options.createAgent({ role: input.role });
		await agent.prompt(formatPrompt(input, this.options.includeRolePromptInUserInput !== false));
		return parseAgentRunOutput(extractLastAssistantText(agent));
	}
}

function formatPrompt(input: AgentRunInput, includeRolePrompt: boolean): string {
	const body = `Task ID: ${input.taskId}\nAgent ID: ${input.agentId}\nInput:\n${input.input}`;
	if (!includeRolePrompt) return body;
	return `${buildRolePrompt(input.role)}\n\n${body}`;
}

function extractLastAssistantText(agent: PiAgentLike): string {
	const assistantMessages = agent.state.messages.filter((message) => message.role === "assistant");
	const last = assistantMessages[assistantMessages.length - 1];
	if (!last) throw new Error("Pi agent produced no assistant message");
	return last.content
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text)
		.join("\n")
		.trim();
}
