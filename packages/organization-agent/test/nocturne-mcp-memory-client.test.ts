import { describe, expect, it } from "vitest";
import { createNocturneMcpMemoryClient, type JsonRpcTransport } from "../src/nocturne-mcp-memory-client.js";

class RecordingTransport implements JsonRpcTransport {
	readonly calls: Array<{ readonly method: string; readonly params: unknown }> = [];

	async call(method: string, params: unknown): Promise<unknown> {
		this.calls.push({ method, params });
		if (method === "read_memory") return "Memory content";
		if (method === "search_memory") return "Found 1 matches for 'GraphService':\n\n- core://note\n  snippet";
		if (method === "create_memory") return "Success: Memory created at 'core://task_note'";
		throw new Error(`Unexpected method: ${method}`);
	}
}

describe("NocturneMcpMemoryClient", () => {
	it("maps memory operations to Nocturne MCP tools", async () => {
		const transport = new RecordingTransport();
		const client = createNocturneMcpMemoryClient({ transport });

		expect(await client.read("core://note")).toMatchObject({ uri: "core://note", content: "Memory content" });
		expect(await client.search("GraphService")).toEqual([
			expect.objectContaining({ uri: "core://note", content: expect.stringContaining("core://note") }),
		]);
		expect(await client.write({ uri: "core://task_note", content: "Task memory" })).toMatchObject({
			uri: "core://task_note",
			content: "Task memory",
		});
		expect(transport.calls).toEqual([
			{ method: "read_memory", params: { uri: "core://note" } },
			{ method: "search_memory", params: { query: "GraphService" } },
			{
				method: "create_memory",
				params: {
					parent_uri: "core://",
					content: "Task memory",
					priority: 2,
					disclosure: "When reviewing Agent Company task memory",
					title: "task_note",
				},
			},
		]);
	});

	it("throws explicit errors for MCP tool error strings", async () => {
		const client = createNocturneMcpMemoryClient({
			transport: { call: async () => "Error: missing memory" },
		});

		await expect(client.read("core://missing")).rejects.toThrow("Nocturne MCP read_memory failed: missing memory");
	});
});
