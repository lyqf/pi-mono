import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createEventStreamServer } from "../src/event-stream-server.js";

const scriptPath = path.join(fileURLToPath(new URL(".", import.meta.url)), "..", "scripts", "send-pi-telemetry.mjs");

describe("send-pi-telemetry.mjs", () => {
	it("ships a CLI helper whose payloads match POST /api/append-event (integration.pi_activity + external_note)", async () => {
		const src = readFileSync(scriptPath, "utf8");
		expect(src).toContain("AGENT_COMPANY_DASHBOARD_URL");
		expect(src).toContain("--phase");
		expect(src).toContain("--note");
		expect(src).toContain("integration.pi_activity");
		expect(src).toContain("integration.external_note");

		const server = createEventStreamServer({ eventStore: createEventStore() });
		await server.start({ port: 0 });
		try {
			const post = async (body: Record<string, unknown>) =>
				fetch(`${server.url}/api/append-event`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body),
				});

			expect((await post({ type: "integration.pi_activity", phase: "tool_use", detail: "bash" })).ok).toBe(true);
			expect((await post({ type: "integration.external_note", message: "wrapper ping" })).ok).toBe(true);

			const snapshot = (await fetch(`${server.url}/api/snapshot`).then((response) => response.json())) as {
				events: ReadonlyArray<{ type: string; phase?: string; message?: string }>;
			};

			expect(
				snapshot.events.some((event) => event.type === "integration.pi_activity" && event.phase === "tool_use"),
			).toBe(true);
			expect(
				snapshot.events.some(
					(event) => event.type === "integration.external_note" && event.message === "wrapper ping",
				),
			).toBe(true);
		} finally {
			await server.stop();
		}
	});
});
