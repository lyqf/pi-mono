import { describe, expect, it } from "vitest";
import { createNocturneHttpMemoryClient, type FetchFn } from "../src/nocturne-memory-client.js";

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("NocturneHttpMemoryClient", () => {
	it("reads searches and writes via HTTP", async () => {
		const calls: string[] = [];
		const fetchFn: FetchFn = async (url, init) => {
			calls.push(`${init?.method ?? "GET"} ${url}`);
			if (String(url).includes("/read"))
				return jsonResponse({ id: "m1", uri: "core://x", content: "hello", createdAt: "now" });
			if (String(url).includes("/search"))
				return jsonResponse({ results: [{ id: "m1", uri: "core://x", content: "hello", createdAt: "now" }] });
			return jsonResponse({ id: "m2", uri: "core://y", content: "world", createdAt: "now" });
		};
		const client = createNocturneHttpMemoryClient({ baseUrl: "http://memory.local", fetchFn });

		expect(await client.read("core://x")).toMatchObject({ content: "hello" });
		expect(await client.search("hello")).toHaveLength(1);
		expect(await client.write({ uri: "core://y", content: "world" })).toMatchObject({ uri: "core://y" });
		expect(calls).toEqual([
			"POST http://memory.local/read",
			"POST http://memory.local/search",
			"POST http://memory.local/write",
		]);
	});

	it("throws explicit HTTP errors", async () => {
		const client = createNocturneHttpMemoryClient({
			baseUrl: "http://memory.local",
			fetchFn: async () => new Response("bad", { status: 500 }),
		});

		await expect(client.read("core://x")).rejects.toThrow("Nocturne Memory HTTP 500");
	});
});
