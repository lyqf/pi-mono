import { describe, expect, it } from "vitest";
import { startAgentCompanyMemoryBridge } from "../src/memory-bridge-http-server.js";
import { createInMemoryMemoryClient } from "../src/memory-client.js";
import { createNocturneHttpMemoryClient } from "../src/nocturne-memory-client.js";
import { createOrganizationSession } from "../src/organization-session.js";

/**
 * Exercises the same HTTP contract used with Nocturne (`createNocturneHttpMemoryClient`).
 * A fresh client instance after `OrganizationSession.writeMemory` models **process restart**
 * against a durable HTTP memory tier (here: bridge → in-memory backing shared across requests).
 */
describe("HTTP memory persistence (integration)", () => {
	it("read and search survive new HTTP client instances after session write", async () => {
		const backing = createInMemoryMemoryClient({});
		const bridge = await startAgentCompanyMemoryBridge({ memory: backing, port: 0 });
		try {
			const baseUrl = bridge.url;
			const clientRun1 = createNocturneHttpMemoryClient({ baseUrl });
			const session1 = createOrganizationSession({ memoryClient: clientRun1 });
			await session1.writeMemory({
				uri: "core://restart-proof",
				content: "stored across simulated restart",
			});

			const clientRun2 = createNocturneHttpMemoryClient({ baseUrl });
			const roundTrip = await clientRun2.read("core://restart-proof");
			expect(roundTrip.content).toBe("stored across simulated restart");

			const hits = await clientRun2.search("restart-proof");
			expect(hits.some((record) => record.uri === "core://restart-proof")).toBe(true);
		} finally {
			await bridge.stop();
		}
	});
});
