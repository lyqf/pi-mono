import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Api, Model } from "@earendil-works/pi-ai";

const DEFAULT_CONTEXT_WINDOW = 128000;
const DEFAULT_MAX_TOKENS = 16384;
const CONFIG_DIR_NAME = ".agent-company";
const DEFAULT_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } as const;
const PWD_PLACEHOLDER = "$" + "{PWD}";

export interface CliModelConfigOptions {
	readonly provider: string;
	readonly model: string;
	readonly agentDir?: string;
}

export interface CliModelConfig {
	readonly model: Model<Api>;
	getApiKey(provider: string): Promise<string | undefined>;
}

interface ModelsFile {
	readonly providers?: Readonly<Record<string, ProviderConfig>>;
}

interface ProviderConfig {
	readonly baseUrl?: string;
	readonly api?: string;
	readonly apiKey?: string;
	readonly headers?: Readonly<Record<string, string>>;
	readonly models?: readonly ModelConfig[];
}

interface ModelConfig {
	readonly id?: string;
	readonly name?: string;
	readonly api?: string;
	readonly baseUrl?: string;
	readonly reasoning?: boolean;
	readonly input?: readonly string[];
	readonly contextWindow?: number;
	readonly maxTokens?: number;
	readonly headers?: Readonly<Record<string, string>>;
}

export function getDefaultAgentCompanyConfigDir(): string {
	return join(homedir(), CONFIG_DIR_NAME, "agent");
}

export async function loadCliModelConfig(options: CliModelConfigOptions): Promise<CliModelConfig> {
	const agentDir = options.agentDir ?? getDefaultAgentCompanyConfigDir();
	const file = readModelsFile(join(agentDir, "models.json"));
	const provider = file.providers?.[options.provider];
	if (!provider) throw new Error(`Unknown provider: ${options.provider}`);
	const modelConfig = provider.models?.find((model) => model.id === options.model);
	if (!modelConfig) throw new Error(`Unknown model: ${options.provider}/${options.model}`);
	return {
		model: createModel(options.provider, provider, modelConfig),
		getApiKey: async (providerId) => (providerId === options.provider ? resolveValue(provider.apiKey) : undefined),
	};
}

function readModelsFile(path: string): ModelsFile {
	if (!existsSync(path)) throw new Error(`models.json not found: ${path}`);
	const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
	if (!isObject(parsed)) throw new Error(`models.json root must be an object: ${path}`);
	return parsed as ModelsFile;
}

function createModel(providerId: string, provider: ProviderConfig, model: ModelConfig): Model<Api> {
	const api = model.api ?? provider.api;
	if (!api) throw new Error(`Provider ${providerId}, model ${model.id}: api is required`);
	const baseUrl = model.baseUrl ?? provider.baseUrl;
	if (!baseUrl) throw new Error(`Provider ${providerId}, model ${model.id}: baseUrl is required`);
	return {
		id: requireText(model.id, "model id"),
		name: model.name ?? requireText(model.id, "model id"),
		api: api as Api,
		provider: providerId,
		baseUrl,
		reasoning: model.reasoning ?? false,
		input: readModelInput(model.input),
		cost: DEFAULT_COST,
		contextWindow: model.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
		maxTokens: model.maxTokens ?? DEFAULT_MAX_TOKENS,
		headers: resolveHeaders({ ...provider.headers, ...model.headers }),
	};
}

function readModelInput(input: readonly string[] | undefined): ("text" | "image")[] {
	return (input ?? ["text"]).filter((value): value is "text" | "image" => value === "text" || value === "image");
}

function resolveHeaders(headers: Readonly<Record<string, string>>): Record<string, string> | undefined {
	const resolved = Object.fromEntries(
		Object.entries(headers).flatMap(([key, value]) => {
			const resolvedValue = resolveValue(value);
			return resolvedValue === undefined ? [] : [[key, resolvedValue]];
		}),
	);
	return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function resolveValue(value: string | undefined): string | undefined {
	if (!value) return undefined;
	return process.env[value] ?? value.replaceAll(PWD_PLACEHOLDER, process.cwd());
}

function requireText(value: string | undefined, label: string): string {
	if (!value?.trim()) throw new Error(`${label} is required`);
	return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
