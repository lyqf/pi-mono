import { describe, expect, it } from "vitest";
import { type CommandRunner, createCmuxClient, resolveCmuxCommand } from "../src/cmux-client.js";

describe("CmuxClient", () => {
	it("opens dashboard URL through the configured command runner", async () => {
		const calls: string[][] = [];
		const runner: CommandRunner = async (command, args) => {
			calls.push([command, ...args]);
			return { exitCode: 0, stdout: "ok", stderr: "" };
		};
		const client = createCmuxClient({ runner, command: "cmux" });

		await client.openDashboard("http://127.0.0.1:3000");

		expect(calls).toEqual([["cmux", "browser", "open", "http://127.0.0.1:3000"]]);
	});

	it("prefers the installed app bundled cmux CLI when PATH does not expose cmux", () => {
		const command = resolveCmuxCommand({
			exists: (path) => path === "/Applications/cmux.app/Contents/Resources/bin/cmux",
			pathValue: "/usr/bin:/bin",
		});

		expect(command).toBe("/Applications/cmux.app/Contents/Resources/bin/cmux");
	});

	it("uses PATH cmux before app bundle candidates", () => {
		const command = resolveCmuxCommand({
			exists: (path) => path === "/opt/homebrew/bin/cmux",
			pathValue: "/opt/homebrew/bin:/usr/bin",
		});

		expect(command).toBe("/opt/homebrew/bin/cmux");
	});

	it("surfaces cmux command failures", async () => {
		const runner: CommandRunner = async () => ({ exitCode: 1, stdout: "", stderr: "socket unavailable" });
		const client = createCmuxClient({ runner });

		await expect(client.openDashboard("http://127.0.0.1:3000")).rejects.toThrow("socket unavailable");
	});
});
