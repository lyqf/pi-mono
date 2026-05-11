import type { AgentRunOutput, OrganizationRequest } from "./agent-runtime-adapter.js";
import type { TaskGraphCommand } from "./task-graph-commands.js";

interface StructuredAgentRunOutput {
	readonly summary?: unknown;
	readonly messages?: unknown;
	readonly taskGraphCommands?: unknown;
	readonly organizationRequests?: unknown;
}

export function parseAgentRunOutput(text: string): AgentRunOutput {
	const parsed = parseJson(text);
	if (parsed) return parseStructured(parsed);
	return parseLineBased(text);
}

function parseJson(text: string): StructuredAgentRunOutput | undefined {
	try {
		const value: unknown = JSON.parse(text);
		return isObject(value) ? value : undefined;
	} catch {
		return undefined;
	}
}

function parseStructured(value: StructuredAgentRunOutput): AgentRunOutput {
	if (typeof value.summary !== "string" || !value.summary.trim())
		throw new Error("Structured output summary is required");
	return {
		summary: value.summary,
		messages: stringArray(value.messages),
		taskGraphCommands: taskGraphCommandArray(value.taskGraphCommands),
		organizationRequests: organizationRequestArray(value.organizationRequests),
	};
}

function parseLineBased(text: string): AgentRunOutput {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
	const [summary, ...messages] = lines;
	if (!summary) throw new Error("Agent produced empty output");
	return { summary, messages };
}

function stringArray(value: unknown): readonly string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

function taskGraphCommandArray(value: unknown): readonly TaskGraphCommand[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter(isTaskGraphCommand);
}

function isTaskGraphCommand(value: unknown): value is TaskGraphCommand {
	return isObject(value) && typeof value.type === "string";
}

function organizationRequestArray(value: unknown): readonly OrganizationRequest[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter(isOrganizationRequest);
}

function isOrganizationRequest(value: unknown): value is OrganizationRequest {
	if (!isObject(value) || typeof value.type !== "string") return false;
	if (value.type === "spawn") return typeof value.role === "string" && typeof value.reason === "string";
	if (value.type === "terminate") return typeof value.agentId === "string" && typeof value.reason === "string";
	if (value.type === "merge") return isMergeRequest(value);
	return false;
}

function isMergeRequest(value: Record<string, unknown>): value is OrganizationRequest {
	return (
		typeof value.sourceAgentId === "string" &&
		typeof value.targetAgentId === "string" &&
		typeof value.reason === "string"
	);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
