import type { AgentOptions, Agent as PiAgentCoreAgent } from "@earendil-works/pi-agent-core";
import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentRuntimeAdapter } from "./agent-runtime-adapter.js";
import { createPiAgentRuntimeAdapter, type PiAgentLike } from "./pi-agent-runtime-adapter.js";
import { buildRolePrompt } from "./role-prompts.js";

export type DefaultPiAgentOptions = AgentOptions;

export interface DefaultPiAgentRuntimeAdapterOptions {
	readonly agentOptions?: DefaultPiAgentOptions;
	readonly createAgent?: (options: DefaultPiAgentOptions) => PiAgentLike;
	/** Appended to each role system prompt (e.g. exported skill manifest text). */
	readonly skillsPromptAddon?: string;
}

export function createDefaultPiAgentRuntimeAdapter(
	options: DefaultPiAgentRuntimeAdapterOptions = {},
): AgentRuntimeAdapter {
	const createAgent = options.createAgent ?? createCoreAgent;
	return createPiAgentRuntimeAdapter({
		createAgent: (input) =>
			createAgent(
				createRoleAgentOptions(
					options.agentOptions,
					appendSkillsAddon(buildRolePrompt(input.role), options.skillsPromptAddon),
				),
			),
		includeRolePromptInUserInput: false,
	});
}

function appendSkillsAddon(rolePrompt: string, addon: string | undefined): string {
	const extra = addon?.trim();
	return extra ? `${rolePrompt}\n\n${extra}` : rolePrompt;
}

function createRoleAgentOptions(options: DefaultPiAgentOptions | undefined, rolePrompt: string): DefaultPiAgentOptions {
	const initialState = options?.initialState ?? {};
	return {
		...options,
		initialState: {
			...initialState,
			systemPrompt: joinSystemPrompts(rolePrompt, initialState.systemPrompt),
		},
	};
}

function joinSystemPrompts(rolePrompt: string, callerPrompt: string | undefined): string {
	if (!callerPrompt?.trim()) return rolePrompt;
	return `${rolePrompt}\n\n${callerPrompt}`;
}

function createCoreAgent(options: DefaultPiAgentOptions): PiAgentLike {
	return new Agent(options) as PiAgentCoreAgent as PiAgentLike;
}
