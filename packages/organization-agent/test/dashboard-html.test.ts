import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDashboardHtml } from "../src/dashboard-html.js";

const MAX_FUNCTION_LINES = 50;

describe("Dashboard HTML", () => {
	it("renders the god-view layout and diagnostics region", () => {
		const html = createDashboardHtml();

		expect(html).toContain("Agent Company Dashboard");
		expect(html).toContain("god-layout");
		expect(html).toContain("god-primary");
		expect(html).toContain("agent-swarm");
		expect(html).toContain("diagnostics");
		expect(html).toContain("task-board");
		expect(html).toContain("agent-roster");
	});

	it("uses a readable mission-control layout", () => {
		const html = createDashboardHtml();

		expect(html).toContain("Mission Control");
		expect(html).toContain("Current focus");
		expect(html).toContain("Root subtree progress");
		expect(html).toContain("Agent roster");
		expect(html).toContain("Task board");
		expect(html).toContain("Conversation timeline");
		expect(html).toContain("Memory & skills");
	});

	it("includes visual hierarchy classes and readable render helpers", () => {
		const html = createDashboardHtml();

		expect(html).toContain('class="hero"');
		expect(html).toContain("status-strip");
		expect(html).toContain("focus-card");
		expect(html).toContain("timeline-item");
		expect(html).toContain("task-lane");
		expect(html).toContain("renderCurrentFocus");
		expect(html).toContain("renderProgress");
		expect(html).toContain("renderTimeline");
		expect(html).toContain("renderSwarm");
		expect(html).toContain("renderBlocked");
		expect(html).toContain("describeLatestEvent");
		expect(html).toContain("groupTasksByState");
		expect(html).toContain("requestAnimationFrame");
	});

	it("loads snapshot and subscribes to SSE events", () => {
		const html = createDashboardHtml();

		expect(html).toContain('fetch("/api/snapshot")');
		expect(html).toContain('new EventSource("/api/events")');
		expect(html).toContain("applyEvent");
	});

	it("handles agent lifecycle events", () => {
		const html = createDashboardHtml();

		expect(html).toContain('event.type === "agent.terminated"');
		expect(html).toContain('event.type === "agent.merged"');
	});

	it("maps Pi telemetry activity to swarm piPulse when agentHint matches an agent", () => {
		const html = createDashboardHtml();

		expect(html).toContain("integration.pi_activity");
		expect(html).toContain("piPulse");
		expect(html).toContain("agent-node-pi-telemetry");
		expect(html).toContain("resolveAgentIdFromPiHint");
		expect(html).toContain("roleMatches");
	});

	it("renders dashboard data as visual sections instead of primary JSON dumps", () => {
		const html = createDashboardHtml();

		expect(html).toContain("renderAgents");
		expect(html).toContain("agent-card");
		expect(html).toContain("task-card");
		expect(html).toContain("message-item");
		expect(html).toContain("memory-item");
		expect(html).toContain("skill-item");
		expect(html).not.toContain('document.getElementById("agents").textContent = JSON.stringify');
		expect(html).not.toContain('document.getElementById("tasks").textContent = JSON.stringify');
		expect(html).not.toContain("JSON.stringify(event)");
	});

	it("keeps dashboard HTML functions below the size limit", () => {
		const source = readFileSync(new URL("../src/dashboard-html.ts", import.meta.url), "utf8");
		const functionBodies = source.matchAll(/function \w+\([^)]*\): [^{]+ \{\n([\s\S]*?)\n\}/g);

		for (const match of functionBodies) {
			const lines = match[1].split("\n").filter((line) => line.trim().length > 0);
			expect(lines.length).toBeLessThanOrEqual(MAX_FUNCTION_LINES);
		}
	});
});
