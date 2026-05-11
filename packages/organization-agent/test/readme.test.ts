import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("README", () => {
	it("documents CLI dashboard workflow and programmatic API", () => {
		const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

		expect(readme).toContain("agent-company start");
		expect(readme).toContain("--workflow");
		expect(readme).toContain("--no-cmux");
		expect(readme).toContain("runInitialOrganizationWorkflow");
		expect(readme).toContain("createOrganizationSession");
		expect(readme).toContain("AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL");
		expect(readme).toContain("AGENT_COMPANY_DASHBOARD_URL");
		expect(readme).toContain("send-pi-telemetry");
		expect(readme).toContain("agent-company-pi-telemetry");
		expect(readme).toContain("npm run verify");
		expect(readme).toContain("test:organization-agent");
		expect(readme).toContain("agent-company-acceptance.sh");
		expect(readme).toContain("./scripts/agent-company-acceptance.sh`**（**`--help`**");
		expect(readme).toContain("../../../README.md");
		expect(readme).toContain("pi-develop/pi-mono/packages/organization-agent");
		expect(readme).toContain("docs/PRODUCT_INTRODUCTION.md");
		expect(readme).toContain("docs/PRODUCT_USER_GUIDE.md");
	});
});
