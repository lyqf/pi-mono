import { describe, expect, it } from "vitest";
import { parseCliArgs, renderCliHelp } from "../src/cli.js";

describe("CLI help", () => {
	it("parses help without requiring a task", () => {
		expect(parseCliArgs(["--help"])).toEqual({ command: "help" });
		expect(parseCliArgs(["start", "--help"])).toEqual({ command: "help" });
	});

	it("renders usage", () => {
		const help = renderCliHelp();

		expect(help).toContain("agent-company start");
		expect(help).toContain("--workflow");
		expect(help).toContain("--no-cmux");
		expect(help).toContain(".agent-company/agent/models.json");
		expect(help).toContain("AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL");
		expect(help).toContain("AGENT_COMPANY_SPECIALIST_LIMIT");
		expect(help).toContain("AGENT_COMPANY_SHOW_TELEMETRY_HINT");
		expect(help).toContain("AGENT_COMPANY_DASHBOARD_URL");
		expect(help).toContain("agent-company-pi-telemetry");
		expect(help).toContain("agent-company-memory-bridge");
	});
});
