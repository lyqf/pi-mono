import { describe, expect, it } from "vitest";
import { tryParseExternalAppendEvent } from "../src/external-append-event.js";

describe("tryParseExternalAppendEvent", () => {
	it("accepts integration.pi_activity", () => {
		expect(
			tryParseExternalAppendEvent({
				type: "integration.pi_activity",
				phase: "tool_use",
				detail: "read_file",
				agentHint: "worker-a",
			}),
		).toEqual({
			type: "integration.pi_activity",
			phase: "tool_use",
			detail: "read_file",
			agentHint: "worker-a",
		});
	});

	it("accepts minimal pi_activity", () => {
		expect(tryParseExternalAppendEvent({ type: "integration.pi_activity", phase: "idle" })).toEqual({
			type: "integration.pi_activity",
			phase: "idle",
		});
	});

	it("accepts integration.external_note", () => {
		expect(tryParseExternalAppendEvent({ type: "integration.external_note", message: "hello" })).toEqual({
			type: "integration.external_note",
			message: "hello",
		});
	});

	it("rejects forged task events", () => {
		expect(
			tryParseExternalAppendEvent({
				type: "task.created",
				task: { id: "x", title: "hack", kind: "root", state: "planned" },
			}),
		).toBeUndefined();
	});

	it("rejects invalid payloads", () => {
		expect(tryParseExternalAppendEvent(null)).toBeUndefined();
		expect(tryParseExternalAppendEvent({ type: "integration.pi_activity" })).toBeUndefined();
		expect(tryParseExternalAppendEvent({ type: "integration.external_note" })).toBeUndefined();
	});
});
