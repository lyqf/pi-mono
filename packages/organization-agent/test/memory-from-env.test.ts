import { describe, expect, it } from "vitest";
import { AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL, createMemoryClientFromEnv } from "../src/memory-from-env.js";

describe("createMemoryClientFromEnv", () => {
	it("returns undefined when unset", () => {
		expect(createMemoryClientFromEnv({})).toBeUndefined();
	});

	it("returns undefined when whitespace only", () => {
		expect(createMemoryClientFromEnv({ [AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL]: "  " })).toBeUndefined();
	});

	it("returns an HTTP memory client when base URL is set", () => {
		const client = createMemoryClientFromEnv({
			[AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL]: "http://127.0.0.1:9999",
		});
		expect(client).toBeDefined();
		expect(typeof client?.write).toBe("function");
		expect(typeof client?.read).toBe("function");
		expect(typeof client?.search).toBe("function");
	});
});
