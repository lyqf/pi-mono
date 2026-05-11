#!/usr/bin/env node
import type { AgentRuntimeAdapter } from "./agent-runtime-adapter.js";
import { createScriptedAgentRuntimeAdapter } from "./agent-runtime-adapter.js";
import type { CmuxClient } from "./cmux-client.js";
import { createCmuxClient } from "./cmux-client.js";
import { createDefaultPiAgentRuntimeAdapter } from "./default-pi-agent-adapter.js";
import type { EventStreamServer } from "./event-stream-server.js";
import { createEventStreamServer } from "./event-stream-server.js";
import type { OrganizationEvent } from "./events.js";
import { AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL, createMemoryClientFromEnv } from "./memory-from-env.js";
import { getDefaultAgentCompanyConfigDir, loadCliModelConfig } from "./model-config.js";
import { AGENT_COMPANY_SPECIALIST_LIMIT_ENV, createOrganizationSession } from "./organization-session.js";
import { createPiInteractiveLauncher, type PiInteractiveLauncher } from "./pi-interactive-launcher.js";
import { runInitialOrganizationWorkflow } from "./workflow-coordinator.js";

const DEFAULT_PORT = 0;

/** Set to `1` to log `POST …/api/append-event` right after the dashboard URL (for Pi wrappers / scripts). */
export const AGENT_COMPANY_SHOW_TELEMETRY_HINT_ENV = "AGENT_COMPANY_SHOW_TELEMETRY_HINT";

/** Same name as `scripts/send-pi-telemetry.mjs` (Pi wrapper / `agent-company-pi-telemetry` CLI). */
export const AGENT_COMPANY_DASHBOARD_URL_ENV = "AGENT_COMPANY_DASHBOARD_URL";

export interface RealAdapterFactoryInput {
	readonly provider: string;
	readonly modelId: string;
	readonly agentDir?: string;
}

export interface StartCliOptions {
	readonly command: "start";
	readonly task?: string;
	readonly port: number;
	readonly openCmux: boolean;
	readonly runWorkflow: boolean;
	readonly provider?: string;
	readonly model?: string;
	readonly agentDir?: string;
	readonly adapter?: AgentRuntimeAdapter;
	readonly createRealAdapter?: (input: RealAdapterFactoryInput) => AgentRuntimeAdapter | Promise<AgentRuntimeAdapter>;
	readonly onStatus?: (message: string) => void;
	readonly piLauncher?: PiInteractiveLauncher;
	readonly cmuxClient?: CmuxClient;
	/** For tests; defaults to `process.env`. */
	readonly processEnv?: NodeJS.ProcessEnv;
}

export interface HelpCliOptions {
	readonly command: "help";
}

export interface CliSessionResult {
	readonly url: string;
	readonly events: readonly OrganizationEvent[];
	stop(): Promise<void>;
}

export type CliOptions = StartCliOptions | HelpCliOptions;

export function parseCliArgs(args: readonly string[]): CliOptions {
	if (args.includes("--help") || args.includes("-h")) return { command: "help" };
	const [command, ...startArgs] = args;
	if (command !== "start") throw new Error("Only start command is supported");
	const { task, rest } = splitOptionalTask(startArgs);
	const runWorkflow = rest.includes("--workflow");
	if (runWorkflow && !task) throw new Error("--workflow requires a task");
	return {
		command,
		task,
		port: readNumberOption(rest, "--port", DEFAULT_PORT),
		openCmux: !rest.includes("--no-cmux"),
		runWorkflow,
		provider: readTextOption(rest, "--provider"),
		model: readTextOption(rest, "--model"),
		agentDir: readTextOption(rest, "--agent-dir"),
	};
}

export async function runCliSession(options: StartCliOptions): Promise<CliSessionResult> {
	const memoryClient = createMemoryClientFromEnv();
	const session = createOrganizationSession(memoryClient ? { memoryClient } : {});
	if (memoryClient)
		reportStatus(options, "Using Nocturne-compatible HTTP memory (AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL).");
	const server = createEventStreamServer({ eventStore: session.getEventStore() });
	await server.start({ port: options.port });
	reportStatus(options, `Agent Company dashboard: ${server.url}`);
	maybeReportTelemetryHint(options, server.url);
	if (options.openCmux) await openDashboardWithStatus(options, server.url);
	if (options.runWorkflow) await runWorkflowWithStatus(options, session);
	else await launchPiInteractive(options, session);
	return createCliSessionResult(server, session.getEvents());
}

export async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
	const options = parseCliArgs(args);
	if (options.command === "help") {
		console.log(renderCliHelp());
		return;
	}
	await runCliSession({ ...options, onStatus: (message) => console.log(message) });
}

export function renderCliHelp(): string {
	return [
		"Usage: agent-company start [task] [options]",
		"",
		"Environment:",
		`  ${AGENT_COMPANY_SPECIALIST_LIMIT_ENV}=<n>`,
		"                       Optional. Max specialist agents that may exist at once (default 2).",
		`  ${AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL}=<url>`,
		"                       Optional. Use persistent memory via HTTP POST /read, /search, /write",
		"                       (JSON API as used by createNocturneHttpMemoryClient).",
		"                       Tip: run `agent-company-memory-bridge` against a live Nocturne MCP",
		"                       endpoint, then point this variable at the bridge URL (see package README).",
		`  ${AGENT_COMPANY_SHOW_TELEMETRY_HINT_ENV}=1`,
		"                       Optional. After the dashboard URL, print POST …/api/append-event for Pi telemetry",
		"                       plus a one-line `agent-company-pi-telemetry` example (see package README).",
		`  ${AGENT_COMPANY_DASHBOARD_URL_ENV}=<url>`,
		"                       Read by the standalone `agent-company-pi-telemetry` helper (not by `agent-company start`).",
		"",
		"Related commands:",
		"  agent-company-pi-telemetry   POST whitelisted integration.* events (npm bin from this package).",
		"  agent-company-memory-bridge   Streamable MCP → HTTP memory tier for AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL.",
		"",
		"Options:",
		"  --workflow           Run the initial organization workflow before serving dashboard.",
		"  --provider <id>      Use a real provider from models.json for workflow agents.",
		"  --model <id>         Use a real model from the selected provider.",
		"  --agent-dir <path>   Read models.json from this agent config directory.",
		`                       Default: ${getDefaultAgentCompanyConfigDir()}/models.json`,
		"  --no-cmux            Do not open cmux built-in browser; print the dashboard URL only.",
		"  --port <number>      Bind dashboard server to a port; 0 selects an available local port.",
		"  --help, -h           Show this help.",
	].join("\n");
}

function createCliSessionResult(server: EventStreamServer, events: readonly OrganizationEvent[]): CliSessionResult {
	return { url: server.url, events, stop: () => server.stop() };
}

async function runWorkflowWithStatus(
	options: StartCliOptions,
	session: ReturnType<typeof createOrganizationSession>,
): Promise<void> {
	if (!options.task) throw new Error("--workflow requires a task");
	reportStatus(options, "Running workflow...");
	await runInitialOrganizationWorkflow({
		session,
		adapter: await resolveWorkflowAdapter(options),
		task: options.task,
	});
	reportStatus(options, "Workflow completed.");
}

function reportStatus(options: StartCliOptions, message: string): void {
	options.onStatus?.(message);
}

function maybeReportTelemetryHint(options: StartCliOptions, dashboardBaseUrl: string): void {
	const env = options.processEnv ?? process.env;
	if (env[AGENT_COMPANY_SHOW_TELEMETRY_HINT_ENV]?.trim() !== "1") return;
	reportStatus(options, `Pi telemetry (POST integration events): ${dashboardBaseUrl}/api/append-event`);
	reportStatus(
		options,
		`Pi telemetry helper: export ${AGENT_COMPANY_DASHBOARD_URL_ENV}='${dashboardBaseUrl}' && agent-company-pi-telemetry --phase idle`,
	);
}

async function openDashboardWithStatus(options: StartCliOptions, url: string): Promise<void> {
	try {
		await (options.cmuxClient ?? createCmuxClient()).openDashboard(url);
	} catch (error) {
		reportStatus(options, `cmux dashboard open failed: ${formatError(error)}`);
		reportStatus(options, "Continuing with terminal pi interactive session.");
	}
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

async function launchPiInteractive(
	options: StartCliOptions,
	session: ReturnType<typeof createOrganizationSession>,
): Promise<void> {
	if (options.task) session.start(options.task);
	session.getEventStore().append({
		type: "integration.pi_session_started",
		taskContext: options.task,
	});
	reportStatus(options, "Starting pi interactive session...");
	const launcher = options.piLauncher ?? createPiInteractiveLauncher();
	const result = await launcher.start({ task: options.task, provider: options.provider, model: options.model });
	session.getEventStore().append({ type: "integration.pi_session_finished", exitCode: result.exitCode });
	if (result.exitCode !== 0) throw new Error(`pi exited with ${result.exitCode}`);
}

async function resolveWorkflowAdapter(options: StartCliOptions): Promise<AgentRuntimeAdapter> {
	if (options.adapter) return options.adapter;
	if (!options.provider && !options.model) return createDefaultScriptedAdapter();
	if (!options.provider || !options.model) throw new Error("--provider and --model must be supplied together");
	if (options.createRealAdapter)
		return options.createRealAdapter({
			provider: options.provider,
			modelId: options.model,
			agentDir: options.agentDir,
		});
	const config = await loadCliModelConfig({
		provider: options.provider,
		model: options.model,
		agentDir: options.agentDir,
	});
	return createDefaultPiAgentRuntimeAdapter({
		agentOptions: { initialState: { model: config.model, thinkingLevel: "off" }, getApiKey: config.getApiKey },
	});
}

function createDefaultScriptedAdapter(): AgentRuntimeAdapter {
	return createScriptedAgentRuntimeAdapter({
		boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
		planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
		worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
		reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
		memory: { summary: "Memory and skill extracted", messages: ["Trace persisted"] },
	});
}

function splitOptionalTask(args: readonly string[]): { readonly task?: string; readonly rest: readonly string[] } {
	const first = args[0];
	if (!first || first.startsWith("-")) return { rest: args };
	return { task: first, rest: args.slice(1) };
}

function readNumberOption(args: readonly string[], name: string, defaultValue: number): number {
	const value = readTextOption(args, name);
	if (value === undefined) return defaultValue;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 0) throw new Error(`${name} must be a non-negative integer`);
	return number;
}

function readTextOption(args: readonly string[], name: string): string | undefined {
	const index = args.indexOf(name);
	if (index < 0) return undefined;
	const value = args[index + 1];
	if (!value?.trim()) throw new Error(`${name} requires a value`);
	return value;
}

export function isCliEntrypoint(modulePath: string, argvPath: string | undefined): boolean {
	return modulePath.endsWith("cli.js") || argvPath?.endsWith("agent-company") === true;
}

if (isCliEntrypoint(import.meta.url, process.argv[1])) {
	runCli().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
