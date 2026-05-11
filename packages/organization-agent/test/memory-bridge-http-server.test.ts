import { describe, expect, it } from "vitest";
import { startAgentCompanyMemoryBridge } from "../src/memory-bridge-http-server.js";
import { createInMemoryMemoryClient } from "../src/memory-client.js";

describe("Agent Company memory bridge HTTP server", () => {
	it("serves read search write and health", async () => {
		const memory = createInMemoryMemoryClient();
		const handle = await startAgentCompanyMemoryBridge({ memory, port: 0 });
		const base = handle.url;

		try {
			const health = await fetch(`${base}/health`);
			expect(health.ok).toBe(true);
			expect(await health.json()).toEqual({ ok: true });

			const w = await fetch(`${base}/write`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ uri: "core://bridge-test", content: "persist-me" }),
			});
			expect(w.ok).toBe(true);
			const written = (await w.json()) as { uri: string; content: string };
			expect(written.uri).toBe("core://bridge-test");
			expect(written.content).toBe("persist-me");

			const r = await fetch(`${base}/read`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ uri: "core://bridge-test" }),
			});
			expect(r.ok).toBe(true);
			expect(await r.json()).toMatchObject({ uri: "core://bridge-test", content: "persist-me" });

			const s = await fetch(`${base}/search`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ query: "persist" }),
			});
			expect(s.ok).toBe(true);
			const searchBody = (await s.json()) as { results: { uri: string }[] };
			expect(searchBody.results.some((row) => row.uri === "core://bridge-test")).toBe(true);
		} finally {
			await handle.stop();
		}
	});
});
