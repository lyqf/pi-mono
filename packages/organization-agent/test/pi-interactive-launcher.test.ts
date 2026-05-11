import { describe, expect, it } from "vitest";
import { buildPiArgs, createPiInteractiveLauncher } from "../src/pi-interactive-launcher.js";

describe("Pi interactive launcher", () => {
	it("builds args for normal pi interactive mode without auto-running the task", () => {
		expect(buildPiArgs({ task: "Build", provider: "cpa-claude", model: "claude-opus-4-7" })).toEqual([
			"--provider",
			"cpa-claude",
			"--model",
			"claude-opus-4-7",
			"--append-system-prompt",
			"Agent Company task context: Build\nUse this as task context only. Do not start executing it until the user sends an instruction inside pi.",
		]);
	});

	it("omits task context when no startup prompt is supplied", () => {
		expect(buildPiArgs({ provider: "cpa-claude", model: "claude-opus-4-7" })).toEqual([
			"--provider",
			"cpa-claude",
			"--model",
			"claude-opus-4-7",
		]);
	});

	it("runs the pi command through an injectable runner", async () => {
		const calls: Array<{ command: string; args: readonly string[] }> = [];
		const launcher = createPiInteractiveLauncher({
			runner: async (command, args) => {
				calls.push({ command, args });
				return { exitCode: 0 };
			},
		});

		const result = await launcher.start({ task: "Build", provider: "cpa-claude", model: "claude-opus-4-7" });

		expect(result.exitCode).toBe(0);
		expect(calls).toEqual([
			{
				command: "pi",
				args: [
					"--provider",
					"cpa-claude",
					"--model",
					"claude-opus-4-7",
					"--append-system-prompt",
					"Agent Company task context: Build\nUse this as task context only. Do not start executing it until the user sends an instruction inside pi.",
				],
			},
		]);
	});
});
