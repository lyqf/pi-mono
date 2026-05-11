import { describe, expect, it } from "vitest";
import { createEventStore } from "../src/event-store.js";
import { createEventStreamServer } from "../src/event-stream-server.js";
import type { OrganizationEvent } from "../src/events.js";
import { buildDashboardGodView } from "../src/god-view.js";
import type { TrellisSkillManifestV1 } from "../src/skill-manifest.js";

interface SnapshotPayload {
	readonly events: readonly OrganizationEvent[];
	readonly godView: ReturnType<typeof buildDashboardGodView>;
	readonly skillManifest: TrellisSkillManifestV1;
}

const agentCreatedEvent: OrganizationEvent = {
	type: "agent.created",
	agent: {
		id: "boss",
		role: "boss",
		displayName: "Boss Agent",
		state: "created",
		createdAt: "2026-05-11T00:00:00.000Z",
	},
};

describe("EventStreamServer", () => {
	it("serves trellis skill manifest JSON", async () => {
		const eventStore = createEventStore();
		const server = createEventStreamServer({ eventStore });
		await server.start({ port: 0 });
		try {
			const response = await fetch(`${server.url}/api/skills-manifest`);
			const manifest = (await response.json()) as TrellisSkillManifestV1;
			expect(manifest.version).toBe(1);
			expect(manifest.skills).toEqual([]);
		} finally {
			await server.stop();
		}
	});

	it("serves GET /api discovery JSON", async () => {
		const server = createEventStreamServer({ eventStore: createEventStore() });
		await server.start({ port: 0 });
		try {
			const response = await fetch(`${server.url}/api`);
			const body = (await response.json()) as {
				endpoints: { appendEvent: string; snapshot: string };
			};
			expect(response.status).toBe(200);
			expect(body.endpoints.appendEvent).toBe("/api/append-event");
			expect(body.endpoints.snapshot).toBe("/api/snapshot");
		} finally {
			await server.stop();
		}
	});

	it("serves dashboard HTML", async () => {
		const server = createEventStreamServer({ eventStore: createEventStore() });
		await server.start({ port: 0 });
		try {
			const response = await fetch(`${server.url}/`);
			const body = await response.text();

			expect(response.headers.get("content-type")).toContain("text/html");
			expect(body).toContain("Agent Company Dashboard");
		} finally {
			await server.stop();
		}
	});

	it("serves snapshot JSON", async () => {
		const eventStore = createEventStore();
		eventStore.append(agentCreatedEvent);
		const server = createEventStreamServer({ eventStore });
		await server.start({ port: 0 });
		try {
			const response = await fetch(`${server.url}/api/snapshot`);
			const snapshot = (await response.json()) as SnapshotPayload;

			expect(response.headers.get("content-type")).toContain("application/json");
			expect(snapshot.events).toEqual([agentCreatedEvent]);
			expect(snapshot.godView).toEqual(buildDashboardGodView([agentCreatedEvent]));
			expect(snapshot.skillManifest).toMatchObject({ version: 1, skills: [] });
			expect(snapshot.skillManifest.generatedAt.length).toBeGreaterThan(10);
		} finally {
			await server.stop();
		}
	});

	it("accepts POST /api/append-event for whitelisted integration payloads", async () => {
		const eventStore = createEventStore();
		const server = createEventStreamServer({ eventStore });
		await server.start({ port: 0 });
		try {
			const posted = await fetch(`${server.url}/api/append-event`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ type: "integration.external_note", message: "pi wrapper ping" }),
			});
			expect(posted.status).toBe(200);
			expect(await posted.json()).toEqual({ ok: true });

			const snapshot = (await fetch(`${server.url}/api/snapshot`).then((response) =>
				response.json(),
			)) as SnapshotPayload;
			expect(snapshot.events).toContainEqual({
				type: "integration.external_note",
				message: "pi wrapper ping",
			});
		} finally {
			await server.stop();
		}
	});

	it("rejects POST /api/append-event for non-whitelisted types", async () => {
		const server = createEventStreamServer({ eventStore: createEventStore() });
		await server.start({ port: 0 });
		try {
			const posted = await fetch(`${server.url}/api/append-event`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ type: "task.created", task: { bogus: true } }),
			});
			expect(posted.status).toBe(400);
			expect(await posted.json()).toMatchObject({ ok: false, error: "invalid_external_event" });
		} finally {
			await server.stop();
		}
	});

	it("streams appended events as server-sent events", async () => {
		const eventStore = createEventStore();
		const server = createEventStreamServer({ eventStore });
		await server.start({ port: 0 });
		try {
			const response = await fetch(`${server.url}/api/events`);
			const eventText = response.body
				?.getReader()
				.read()
				.then((result) => new TextDecoder().decode(result.value));
			eventStore.append(agentCreatedEvent);

			expect(await eventText).toContain(`data: ${JSON.stringify(agentCreatedEvent)}`);
		} finally {
			await server.stop();
		}
	});
});
