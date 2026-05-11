import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { createDashboardHtml } from "./dashboard-html.js";
import type { EventStore } from "./event-store.js";
import type { OrganizationEvent } from "./events.js";
import { tryParseExternalAppendEvent } from "./external-append-event.js";
import { buildDashboardGodView } from "./god-view.js";
import { buildTrellisSkillManifest, collectSkillsFromEvents } from "./skill-manifest.js";

const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const EVENT_STREAM_CONTENT_TYPE = "text/event-stream; charset=utf-8";

export interface EventStreamServerOptions {
	readonly eventStore: EventStore;
	readonly dashboardHtml?: string;
}

export interface EventStreamServerStartOptions {
	readonly port: number;
	readonly host?: string;
}

export interface EventStreamServer {
	readonly url: string;
	start(options: EventStreamServerStartOptions): Promise<void>;
	stop(): Promise<void>;
}

export function createEventStreamServer(options: EventStreamServerOptions): EventStreamServer {
	return new NodeEventStreamServer(options.eventStore, options.dashboardHtml ?? createDashboardHtml());
}

class NodeEventStreamServer implements EventStreamServer {
	private server?: Server;
	private currentUrl?: string;
	private readonly eventResponses = new Set<ServerResponse>();

	constructor(
		private readonly eventStore: EventStore,
		private readonly dashboardHtml: string,
	) {}

	get url(): string {
		if (!this.currentUrl) throw new Error("Event stream server has not been started");
		return this.currentUrl;
	}

	async start(options: EventStreamServerStartOptions): Promise<void> {
		if (this.server) throw new Error("Event stream server is already started");
		this.server = createServer((request, response) => {
			const path = request.url?.split("?", 1)[0] ?? "/";
			if (path === "/") return this.writeHtml(response);
			if (path === "/api" || path === "/api/") return this.writeApiDiscovery(response);
			if (path === "/api/snapshot") return this.writeSnapshot(response);
			if (path === "/api/skills-manifest") return this.writeSkillsManifest(response);
			if (path === "/api/append-event" && request.method === "POST") {
				void this.handleAppendEvent(request, response);
				return;
			}
			if (path === "/api/events") return this.writeEvents(response);
			return this.writeNotFound(response);
		});
		await listen(this.server, options.port, options.host);
		const address = this.server.address();
		if (!isAddressInfo(address)) throw new Error("Event stream server did not expose a TCP address");
		this.currentUrl = `http://${options.host ?? "127.0.0.1"}:${address.port}`;
	}

	async stop(): Promise<void> {
		if (!this.server) return;
		const runningServer = this.server;
		this.server = undefined;
		this.currentUrl = undefined;
		for (const response of this.eventResponses) response.end();
		this.eventResponses.clear();
		await close(runningServer);
	}

	private writeHtml(response: ServerResponse): void {
		response.writeHead(200, { "content-type": HTML_CONTENT_TYPE });
		response.end(this.dashboardHtml);
	}

	private writeApiDiscovery(response: ServerResponse): void {
		writeJson(response, 200, {
			service: "agent-company-dashboard",
			endpoints: {
				html: "/",
				snapshot: "/api/snapshot",
				eventsSse: "/api/events",
				skillsManifest: "/api/skills-manifest",
				appendEvent: "/api/append-event",
			},
		});
	}

	private writeSnapshot(response: ServerResponse): void {
		response.writeHead(200, { "content-type": JSON_CONTENT_TYPE });
		const events = this.eventStore.snapshot();
		const godView = buildDashboardGodView(events);
		const skillManifest = buildTrellisSkillManifest(collectSkillsFromEvents(events));
		response.end(JSON.stringify({ events, godView, skillManifest }));
	}

	private writeSkillsManifest(response: ServerResponse): void {
		response.writeHead(200, { "content-type": JSON_CONTENT_TYPE });
		const events = this.eventStore.snapshot();
		response.end(JSON.stringify(buildTrellisSkillManifest(collectSkillsFromEvents(events))));
	}

	private writeEvents(response: ServerResponse): void {
		response.writeHead(200, {
			"cache-control": "no-cache",
			connection: "keep-alive",
			"content-type": EVENT_STREAM_CONTENT_TYPE,
		});
		response.flushHeaders();
		this.eventResponses.add(response);
		const unsubscribe = this.eventStore.subscribe((event) => response.write(formatServerSentEvent(event)));
		response.on("close", () => {
			unsubscribe();
			this.eventResponses.delete(response);
		});
	}

	private writeNotFound(response: ServerResponse): void {
		response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
		response.end("Not found");
	}

	private async handleAppendEvent(request: IncomingMessage, response: ServerResponse): Promise<void> {
		try {
			const body = await readJsonBody(request);
			const event = tryParseExternalAppendEvent(body);
			if (!event) {
				writeJson(response, 400, { ok: false as const, error: "invalid_external_event" });
				return;
			}
			this.eventStore.append(event);
			writeJson(response, 200, { ok: true as const });
		} catch {
			writeJson(response, 400, { ok: false as const, error: "bad_json" });
		}
	}
}

function writeJson(response: ServerResponse, status: number, payload: unknown): void {
	response.writeHead(status, { "content-type": JSON_CONTENT_TYPE });
	response.end(JSON.stringify(payload));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of request) chunks.push(chunk as Buffer);
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw.trim()) return {};
	return JSON.parse(raw) as unknown;
}

function formatServerSentEvent(event: OrganizationEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

function isAddressInfo(address: AddressInfo | string | null): address is AddressInfo {
	return typeof address === "object" && address !== null && typeof address.port === "number";
}

function listen(server: Server, port: number, host?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host ?? "127.0.0.1", () => {
			server.off("error", reject);
			resolve();
		});
	});
}

function close(server: Server): Promise<void> {
	return new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) reject(error);
			else resolve();
		});
	});
}
