import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDefaultAgentCompanyConfigDir, loadCliModelConfig } from "../src/model-config.js";

const PWD_PLACEHOLDER = "$" + "{PWD}";

function writeModelsJson(agentDir: string): void {
	writeFileSync(
		join(agentDir, "models.json"),
		JSON.stringify({
			providers: {
				"cpa-claude": {
					baseUrl: "http://127.0.0.1:8317",
					api: "anthropic-messages",
					apiKey: "CPA_TEST_KEY",
					headers: { "X-Working-Dir": PWD_PLACEHOLDER },
					models: [
						{
							id: "claude-opus-4-7",
							name: "Claude Opus 4.7 (1M)",
							reasoning: true,
							input: ["text", "image"],
							contextWindow: 1000000,
							maxTokens: 128000,
						},
					],
				},
			},
		}),
	);
}

describe("CLI model config", () => {
	it("uses an Agent Company specific default config directory", () => {
		expect(getDefaultAgentCompanyConfigDir()).toContain(".agent-company");
		expect(getDefaultAgentCompanyConfigDir()).not.toContain(".pi/agent");
	});

	it("loads provider model metadata and resolves request auth", async () => {
		const agentDir = mkdtempSync(join(tmpdir(), "agent-company-models-"));
		writeModelsJson(agentDir);
		process.env.CPA_TEST_KEY = "resolved-key";

		const config = await loadCliModelConfig({ provider: "cpa-claude", model: "claude-opus-4-7", agentDir });

		expect(config.model).toMatchObject({
			id: "claude-opus-4-7",
			api: "anthropic-messages",
			provider: "cpa-claude",
			baseUrl: "http://127.0.0.1:8317",
		});
		expect(await config.getApiKey("cpa-claude")).toBe("resolved-key");
		expect(config.model.headers?.["X-Working-Dir"]).toBe(process.cwd());
	});

	it("throws when provider model is missing", async () => {
		const agentDir = mkdtempSync(join(tmpdir(), "agent-company-models-"));
		writeModelsJson(agentDir);

		await expect(loadCliModelConfig({ provider: "cpa-claude", model: "missing", agentDir })).rejects.toThrow(
			"Unknown model",
		);
	});
});
