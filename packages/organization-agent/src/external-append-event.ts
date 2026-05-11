import type { OrganizationEvent } from "./events.js";

/** Parses JSON bodies for `POST /api/append-event` (whitelist integration-only shapes). */
export function tryParseExternalAppendEvent(body: unknown): OrganizationEvent | undefined {
	if (!body || typeof body !== "object") return undefined;
	const record = body as Record<string, unknown>;
	const type = record.type;
	if (type === "integration.pi_activity") return parsePiActivity(record);
	if (type === "integration.external_note") return parseExternalNote(record);
	return undefined;
}

function parsePiActivity(record: Record<string, unknown>): OrganizationEvent | undefined {
	const phase = record.phase;
	if (typeof phase !== "string" || !phase.trim()) return undefined;
	const detail = typeof record.detail === "string" && record.detail.trim() ? record.detail.trim() : undefined;
	const agentHint =
		typeof record.agentHint === "string" && record.agentHint.trim() ? record.agentHint.trim() : undefined;
	return {
		type: "integration.pi_activity",
		phase: phase.trim(),
		...(detail !== undefined ? { detail } : {}),
		...(agentHint !== undefined ? { agentHint } : {}),
	};
}

function parseExternalNote(record: Record<string, unknown>): OrganizationEvent | undefined {
	const message = record.message;
	if (typeof message !== "string" || !message.trim()) return undefined;
	return { type: "integration.external_note", message: message.trim() };
}
