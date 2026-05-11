import { describe, expect, it } from "vitest";
import { isCliEntrypoint } from "../src/cli.js";

describe("CLI entrypoint", () => {
	it("runs when invoked through the installed agent-company symlink", () => {
		expect(isCliEntrypoint("/repo/packages/organization-agent/dist/cli.js", "/opt/homebrew/bin/agent-company")).toBe(
			true,
		);
	});

	it("does not run when imported by a test runner", () => {
		expect(
			isCliEntrypoint("/repo/packages/organization-agent/src/cli.ts", "/repo/node_modules/vitest/vitest.mjs"),
		).toBe(false);
	});
});
