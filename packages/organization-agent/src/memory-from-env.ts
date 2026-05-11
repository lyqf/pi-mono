import type { MemoryClient } from "./memory-client.js";
import { createNocturneHttpMemoryClient } from "./nocturne-memory-client.js";

/** Base URL for a service implementing POST /read, /search, /write (JSON bodies per MemoryClient). */
export const AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL = "AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL";

/**
 * When {@link AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL} is set to a non-empty string,
 * returns a {@link MemoryClient} that persists via that HTTP API.
 * Otherwise returns `undefined` and callers should use the default in-process memory.
 */
export function createMemoryClientFromEnv(env: NodeJS.ProcessEnv = process.env): MemoryClient | undefined {
	const baseUrl = env[AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL]?.trim();
	if (!baseUrl) return undefined;
	return createNocturneHttpMemoryClient({ baseUrl });
}
