import { describe, expect, it } from "vitest";
import { AGENT_COMPANY_DASHBOARD_URL_ENV, AGENT_COMPANY_SHOW_TELEMETRY_HINT_ENV, runCliSession } from "../src/cli.js";
import type { PiInteractiveLauncherInput } from "../src/pi-interactive-launcher.js";

describe("CLI pi interactive mode", () => {
	it("prints telemetry endpoint when AGENT_COMPANY_SHOW_TELEMETRY_HINT=1", async () => {
		const statuses: string[] = [];
		const result = await runCliSession({
			command: "start",
			port: 0,
			openCmux: false,
			runWorkflow: false,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			processEnv: { [AGENT_COMPANY_SHOW_TELEMETRY_HINT_ENV]: "1" },
			onStatus: (message) => statuses.push(message),
			piLauncher: {
				start: async () => ({ exitCode: 0 }),
			},
		});
		try {
			expect(statuses.some((line) => line.includes("/api/append-event"))).toBe(true);
			expect(statuses.some((line) => line.includes("agent-company-pi-telemetry"))).toBe(true);
			expect(statuses.some((line) => line.includes(`${AGENT_COMPANY_DASHBOARD_URL_ENV}=`))).toBe(true);
		} finally {
			await result.stop();
		}
	});

	it("starts dashboard then launches normal pi interactive session", async () => {
		const statuses: string[] = [];
		const launches: PiInteractiveLauncherInput[] = [];
		const result = await runCliSession({
			command: "start",
			task: "Interactive test",
			port: 0,
			openCmux: false,
			runWorkflow: false,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			onStatus: (message) => statuses.push(message),
			piLauncher: {
				start: async (input) => {
					launches.push(input);
					return { exitCode: 0 };
				},
			},
		});

		try {
			expect(statuses[0]).toMatch(/^Agent Company dashboard: http:\/\/127\.0\.0\.1:\d+$/);
			expect(statuses).toContain("Starting pi interactive session...");
			expect(launches).toEqual([{ task: "Interactive test", provider: "cpa-claude", model: "claude-opus-4-7" }]);
			const types = result.events.map((event) => event.type);
			expect(types.filter((type) => type.startsWith("integration."))).toEqual([
				"integration.pi_session_started",
				"integration.pi_session_finished",
			]);
			expect(types).toContain("task.created");
			expect(result.events.filter((event) => event.type === "integration.pi_session_finished")).toEqual([
				{ type: "integration.pi_session_finished", exitCode: 0 },
			]);
		} finally {
			await result.stop();
		}
	});
	it("starts pi interactive mode without a startup prompt", async () => {
		const launches: PiInteractiveLauncherInput[] = [];
		const result = await runCliSession({
			command: "start",
			port: 0,
			openCmux: false,
			runWorkflow: false,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			piLauncher: {
				start: async (input) => {
					launches.push(input);
					return { exitCode: 0 };
				},
			},
		});

		try {
			expect(launches).toEqual([{ provider: "cpa-claude", model: "claude-opus-4-7" }]);
			const types = result.events.map((event) => event.type);
			expect(types).not.toContain("task.created");
			expect(types.filter((type) => type.startsWith("integration."))).toEqual([
				"integration.pi_session_started",
				"integration.pi_session_finished",
			]);
			expect(result.events.filter((event) => event.type === "integration.pi_session_finished")).toEqual([
				{ type: "integration.pi_session_finished", exitCode: 0 },
			]);
		} finally {
			await result.stop();
		}
	});

	it("keeps pi interactive mode running when cmux cannot open the dashboard", async () => {
		const statuses: string[] = [];
		const launches: PiInteractiveLauncherInput[] = [];
		const result = await runCliSession({
			command: "start",
			task: "Interactive test",
			port: 0,
			openCmux: true,
			runWorkflow: false,
			provider: "cpa-claude",
			model: "claude-opus-4-7",
			onStatus: (message) => statuses.push(message),
			cmuxClient: {
				openDashboard: async () => {
					throw new Error("cmux exited with 1");
				},
			},
			piLauncher: {
				start: async (input) => {
					launches.push(input);
					return { exitCode: 0 };
				},
			},
		});

		try {
			expect(statuses).toContain("cmux dashboard open failed: cmux exited with 1");
			expect(statuses).toContain("Continuing with terminal pi interactive session.");
			expect(launches).toHaveLength(1);
			const types = result.events.map((event) => event.type);
			expect(types.filter((type) => type.startsWith("integration."))).toEqual([
				"integration.pi_session_started",
				"integration.pi_session_finished",
			]);
			expect(result.events.filter((event) => event.type === "integration.pi_session_finished")).toEqual([
				{ type: "integration.pi_session_finished", exitCode: 0 },
			]);
		} finally {
			await result.stop();
		}
	});
});
