import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { MemoryClient } from "./memory-client.js";

const JSON_CT = "application/json; charset=utf-8";

export interface MemoryBridgeHttpServerOptions {
	readonly memory: MemoryClient;
	readonly port: number;
	readonly host?: string;
}

export interface MemoryBridgeHttpServerHandle {
	readonly url: string;
	readonly server: Server;
	stop(): Promise<void>;
}

/**
 * Minimal HTTP surface expected by {@link createNocturneHttpMemoryClient}:
 * POST `/read`, `/search`, `/write` with JSON bodies.
 */
export async function startAgentCompanyMemoryBridge(
	options: MemoryBridgeHttpServerOptions,
): Promise<MemoryBridgeHttpServerHandle> {
	const host = options.host ?? "127.0.0.1";
	const server = createServer((req, res) => {
		void handleBridgeRequest(req, res, options.memory);
	});

	await listen(server, options.port, host);
	const address = server.address();
	if (!isAddressInfo(address)) throw new Error("Memory bridge server did not expose a TCP address");
	const url = `http://${host === "::" ? "[::]" : host}:${address.port}`;

	return {
		url,
		server,
		stop: () =>
			new Promise((resolve, reject) => {
				server.close((err) => (err ? reject(err) : resolve()));
			}),
	};
}

async function handleBridgeRequest(req: IncomingMessage, res: ServerResponse, memory: MemoryClient): Promise<void> {
	const path = req.url?.split("?", 1)[0] ?? "/";

	if (req.method === "GET" && path === "/health") {
		res.writeHead(200, { "content-type": JSON_CT });
		res.end(JSON.stringify({ ok: true }));
		return;
	}

	if (req.method !== "POST" || !["/read", "/search", "/write"].includes(path)) {
		res.writeHead(404, { "content-type": JSON_CT });
		res.end(JSON.stringify({ error: "not_found" }));
		return;
	}

	try {
		const body = await readJsonBody(req);
		if (path === "/read") {
			const uri = expectStringField(body, "uri");
			const record = await memory.read(uri);
			writeJson(res, 200, record);
			return;
		}
		if (path === "/search") {
			const query = expectStringField(body, "query");
			const results = await memory.search(query);
			writeJson(res, 200, { results });
			return;
		}
		const uri = expectStringField(body, "uri");
		const content = expectStringField(body, "content");
		const record = await memory.write({ uri, content });
		writeJson(res, 200, record);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		writeJson(res, 400, { error: message });
	}
}

function writeJson(res: ServerResponse, status: number, payload: unknown): void {
	res.writeHead(status, { "content-type": JSON_CT });
	res.end(JSON.stringify(payload));
}

function expectStringField(body: unknown, key: string): string {
	if (!body || typeof body !== "object") throw new Error(`JSON body must be an object`);
	const value = (body as Record<string, unknown>)[key];
	if (typeof value !== "string" || !value.trim()) throw new Error(`Missing string field: ${key}`);
	return value;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw.trim()) return {};
	return JSON.parse(raw) as unknown;
}

function listen(server: Server, port: number, host: string): Promise<void> {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host, () => resolve());
	});
}

function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
	return Boolean(address && typeof address === "object" && "port" in address);
}
