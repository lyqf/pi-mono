import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../src/cli.js";

describe("CLI", () => {
	it("parses start command task and port", () => {
		expect(parseCliArgs(["start", "Build Agent Company", "--port", "4321", "--no-cmux"])).toEqual({
			command: "start",
			task: "Build Agent Company",
			port: 4321,
			openCmux: false,
			runWorkflow: false,
			provider: undefined,
			model: undefined,
			agentDir: undefined,
		});
	});

	it("parses workflow mode", () => {
		expect(parseCliArgs(["start", "Build Agent Company", "--workflow", "--no-cmux"])).toMatchObject({
			runWorkflow: true,
			openCmux: false,
		});
	});

	it("parses provider model options", () => {
		expect(
			parseCliArgs([
				"start",
				"Build Agent Company",
				"--workflow",
				"--provider",
				"cpa-claude",
				"--model",
				"claude-opus-4-7",
				"--agent-dir",
				"/tmp/agent-company",
			]),
		).toMatchObject({
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			agentDir: "/tmp/agent-company",
		});
	});

	it("allows interactive start without a task prompt", () => {
		expect(parseCliArgs(["start", "--provider", "cpa-claude", "--model", "claude-opus-4-7"])).toMatchObject({
			command: "start",
			task: undefined,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
		});
	});

	it("rejects workflow without a task", () => {
		expect(() => parseCliArgs(["start", "--workflow"])).toThrow("--workflow requires a task");
	});
});
