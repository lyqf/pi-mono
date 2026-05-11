#!/usr/bin/env node
/**
 * POST whitelisted integration events to a running Agent Company dashboard.
 * Base URL: AGENT_COMPANY_DASHBOARD_URL or first positional argument (e.g. http://127.0.0.1:9876).
 *
 * Examples:
 *   AGENT_COMPANY_DASHBOARD_URL=http://127.0.0.1:9876 node scripts/send-pi-telemetry.mjs --phase tool_use --detail bash --agent-hint worker-a
 *   node scripts/send-pi-telemetry.mjs http://127.0.0.1:9876 --note "checkpoint saved"
 */

function usage() {
	process.stderr.write(`Usage:
  AGENT_COMPANY_DASHBOARD_URL=<url> node scripts/send-pi-telemetry.mjs [baseUrl] --phase <phase> [--detail <s>] [--agent-hint <s>]
  AGENT_COMPANY_DASHBOARD_URL=<url> node scripts/send-pi-telemetry.mjs [baseUrl] --note <message>

Environment:
  AGENT_COMPANY_DASHBOARD_URL   Dashboard origin (no trailing slash required)
`);
}

function stripTrailingSlash(url) {
	const trimmed = url.trim();
	return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function takeValue(argv, index, flag) {
	const next = argv[index + 1];
	if (!next || next.startsWith("--")) {
		throw new Error(`Missing value after ${flag}`);
	}
	return { value: next, nextIndex: index + 2 };
}

function parseArgs(argv) {
	let baseUrl = process.env.AGENT_COMPANY_DASHBOARD_URL?.trim() ?? "";
	let phase;
	let detail;
	let agentHint;
	let note;
	let i = 0;

	if (argv[0] && !argv[0].startsWith("--")) {
		baseUrl = argv[0];
		i = 1;
	}

	while (i < argv.length) {
		const arg = argv[i];
		if (arg === "--phase") {
			const t = takeValue(argv, i, "--phase");
			phase = t.value;
			i = t.nextIndex;
		} else if (arg === "--detail") {
			const t = takeValue(argv, i, "--detail");
			detail = t.value;
			i = t.nextIndex;
		} else if (arg === "--agent-hint") {
			const t = takeValue(argv, i, "--agent-hint");
			agentHint = t.value;
			i = t.nextIndex;
		} else if (arg === "--note") {
			const t = takeValue(argv, i, "--note");
			note = t.value;
			i = t.nextIndex;
		} else if (arg === "--help" || arg === "-h") {
			usage();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	if (!stripTrailingSlash(baseUrl || "")) {
		throw new Error("Set AGENT_COMPANY_DASHBOARD_URL or pass baseUrl as first argument.");
	}

	baseUrl = stripTrailingSlash(baseUrl);

	if (note !== undefined) {
		return { baseUrl, body: { type: "integration.external_note", message: note } };
	}

	if (!phase) {
		throw new Error("Either --phase <phase> (pi_activity) or --note <message> (external_note) is required.");
	}

	const body = { type: "integration.pi_activity", phase };
	if (detail !== undefined) body.detail = detail;
	if (agentHint !== undefined) body.agentHint = agentHint;
	return { baseUrl, body };
}

async function main() {
	let parsed;
	try {
		parsed = parseArgs(process.argv.slice(2));
	} catch (err) {
		usage();
		process.stderr.write(`\n${/** @type {Error} */ (err).message}\n`);
		process.exit(1);
		return;
	}

	const url = `${parsed.baseUrl}/api/append-event`;
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(parsed.body),
	});

	const text = await response.text();
	let json;
	try {
		json = JSON.parse(text);
	} catch {
		json = null;
	}

	if (!response.ok || !json?.ok) {
		process.stderr.write(
			`send-pi-telemetry: POST failed ${response.status} ${text.slice(0, 500)}\n`,
		);
		process.exit(1);
		return;
	}

	process.stdout.write(`ok: ${parsed.body.type}\n`);
}

main().catch((err) => {
	process.stderr.write(`${/** @type {Error} */ (err).stack ?? err}\n`);
	process.exit(1);
});
