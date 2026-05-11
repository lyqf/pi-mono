import { describe, expect, it } from "vitest";
import { createTerminalPool } from "../src/terminal-pool.js";

describe("TerminalPool", () => {
	it("binds agents to known slots", () => {
		const pool = createTerminalPool(["boss", "active-worker"]);

		pool.bind("boss", "boss-agent", "pane:1");

		expect(pool.snapshot()).toEqual([
			{ id: "boss", boundAgentId: "boss-agent", cmuxPaneRef: "pane:1" },
			{ id: "active-worker" },
		]);
	});

	it("rejects unknown slots", () => {
		const pool = createTerminalPool(["boss"]);

		expect(() => pool.bind("reviewer", "reviewer", "pane:2")).toThrow("Unknown terminal slot");
	});
});
