# pi-organization-agent

Organization runtime primitives for Agent Company: a Trellis-like task graph, organization events, agent lifecycle controls, memory, skill extraction, and a dashboard server.

## CLI

Start the dashboard from the package binary:

```sh
agent-company start "Build Agent Company" --workflow
```

Environment (optional):

- `AGENT_COMPANY_SPECIALIST_LIMIT`: non-negative integer cap on concurrent **specialist** agents (default `2`).
- `AGENT_COMPANY_SHOW_TELEMETRY_HINT=1`: after the dashboard URL, print the **`POST …/api/append-event`** line plus a copy-paste **`agent-company-pi-telemetry`** example (see Dashboard HTTP API below).
- `AGENT_COMPANY_DASHBOARD_URL`: base URL for the standalone **`agent-company-pi-telemetry`** helper (`npm run send-pi-telemetry`); not read by `agent-company start`.

Package gate: **`npm run verify`** runs `build` then full **`vitest --run`**.

Useful flags:

- `--workflow`: run the deterministic initial Boss -> Planner -> Worker -> Reviewer -> Memory workflow before opening the dashboard.
- `--no-cmux`: print the dashboard URL without asking cmux to open its built-in browser.
- `--port <number>`: bind the dashboard server to a specific port; `0` uses an available local port.

Local test-style startup:

```sh
agent-company start "Build Agent Company" --workflow --no-cmux --port 0
```

## Persistent memory (optional)

By default, memories stay in-process for that run. To point Agent Company at a **Nocturne-compatible HTTP memory service** (POST `/read`, `/search`, `/write` with JSON bodies matching `createNocturneHttpMemoryClient`), either:

### A. HTTP service you already run

Set the base URL (no trailing path segments required beyond what your server expects):

```sh
export AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL="http://127.0.0.1:8788"
agent-company start "My task" --workflow --no-cmux --port 0
```

### B. Built-in bridge (Nocturne Streamable MCP → HTTP)

1. Start **Nocturne Memory** so MCP is available (default assumed below).
2. In another terminal, from this package after `npm run build`:

```sh
# Optional: NOCTURNE_MCP_URL, NOCTURNE_MCP_BEARER_TOKEN, AGENT_COMPANY_MEMORY_BRIDGE_PORT (default 8788)
agent-company-memory-bridge
```

The bridge prints `Set AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL=...`. Export that URL, then run `agent-company start ...`.

MCP-native wiring remains available via `createNocturneMcpMemoryClient` for programmatic use (the bridge uses the same client stack).

### Verify persistence (CI / local)

The package includes an integration test that writes through `OrganizationSession` over HTTP and reads back with a **fresh** `createNocturneHttpMemoryClient` (simulating process restart while the HTTP memory tier stays up):

```sh
cd packages/organization-agent && npx vitest --run test/http-memory-persistence.integration.test.ts
```

With **real Nocturne**, keep the bridge running, restart only `agent-company`, and confirm `read`/`search` for the same URI still succeed.

## Programmatic API

```ts
import {
	createOrganizationSession,
	createScriptedAgentRuntimeAdapter,
	runInitialOrganizationWorkflow,
} from "@earendil-works/pi-organization-agent";

const session = createOrganizationSession();
const adapter = createScriptedAgentRuntimeAdapter({
	boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
	planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
	worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
	reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
	memory: { summary: "Memory extracted", messages: ["Trace persisted"] },
});

await runInitialOrganizationWorkflow({ session, adapter, task: "Build Agent Company" });
```

## Core pieces

- `TaskGraph`: DAG task model with dependencies, acceptance criteria, ready task selection, progress aggregation, and update commands.
- `OrganizationSession`: fixed initial six-agent organization plus bounded specialist spawn, terminate, merge, memory, and skill APIs.
- `EventStore`: append-only event source for dashboard state.
- `OrganizationProjector`: event-to-dashboard projection with progress, blocked tasks, and workload metrics.
- `EventStreamServer`: local HTML dashboard, `/api/snapshot`, and `/api/events` SSE stream.
- `createNocturneMcpMemoryClient`: JSON-RPC seam for Nocturne MCP memory tools.

## Dashboard HTTP API

Served by `createEventStreamServer` (same host/port as the HTML UI):

| Path | Purpose |
|------|---------|
| `/` | God-view dashboard (SVG swarm, task board, roster; timeline/events under **Diagnostics**). |
| `GET /api` | Small JSON index of HTTP endpoints (`snapshot`, `eventsSse`, `appendEvent`, …). |
| `GET /api/snapshot` | JSON: `events` (full history), **`godView`** (clusters, edges, blocked titles, root progress), **`skillManifest`** (Trellis-oriented export). |
| `GET /api/skills-manifest` | Same `skillManifest` shape only (`buildTrellisSkillManifest`). |
| `POST /api/append-event` | Append **whitelist-only** integration telemetry (`integration.pi_activity`, `integration.external_note`). Local dev hook for Pi wrappers / scripts (cannot forge tasks or agents). If `pi_activity` includes **`agentHint`**, the swarm resolves it in order: exact **agent id**, else **unique role** string (e.g. `memory`), else **unique displayName** (case-insensitive). Then that node gets a brief amber pulse. |
| `GET /api/events` | SSE stream of `OrganizationEvent` (unchanged contract). |

SSE updates are **batched per animation frame** in the dashboard script to avoid excessive repaints.

### Pi wrapper helper (HTTP telemetry)

Without hand-writing `curl`, you can send the same whitelisted payloads using the published script (also exposed as **`agent-company-pi-telemetry`** when the package is installed globally or via `npx`):

```sh
export AGENT_COMPANY_DASHBOARD_URL="http://127.0.0.1:<port>"
npm run send-pi-telemetry -- --phase tool_use --detail bash --agent-hint worker-a
npm run send-pi-telemetry -- --note "checkpoint saved"
```

Source: [`scripts/send-pi-telemetry.mjs`](./scripts/send-pi-telemetry.mjs). The base URL may be passed as the first argument instead of `AGENT_COMPANY_DASHBOARD_URL`.

Integration notes for Pi + skills: see [docs/PI_SINGLE_ENTRY.md](./docs/PI_SINGLE_ENTRY.md).

Product overview and usage (Chinese): [docs/PRODUCT_INTRODUCTION.md](./docs/PRODUCT_INTRODUCTION.md), [docs/PRODUCT_USER_GUIDE.md](./docs/PRODUCT_USER_GUIDE.md).

## Workspace status (pi-develop)

Agent Company 的 **宪法、路线图、当前进展与下一步** 写在 monorepo 之上的工作区根目录，便于跨仓库恢复上下文：

> **路径前提**：下列 `../../../…` 以及 **`pi-develop` 根目录下的 `./scripts/agent-company-acceptance.sh`**，假定磁盘布局为 **`pi-develop/pi-mono/packages/organization-agent`**（`pi-mono` 作为 `pi-develop` 的子目录）。若你 **只克隆了 `pi-mono`**，通常 **没有** 这些上层文档与脚本；请以你团队提供的宪法/进度副本为准，并优先使用本包 **`npm run verify`**、**`docs/PI_SINGLE_ENTRY.md`**。

- `../../../README.md`（`pi-develop` 工作区导航）
- `../../../PROGRESS.md`（相对本 README：即 `pi-develop/PROGRESS.md`）
- `../../../CONSTITUTION.md`、`../../../CONSTITUTION-ROADMAP.md`

在 **`pi-mono` 仓库根目录**（由本目录向上两级 **`../..`**）：专项验收 **`npm run test:organization-agent`**；完整门禁见根目录 **`README.md`**（`npm run build`、`npm run check`、`npm test` / `./test.sh`）。

若你在 **`pi-develop` 工作区根**（含 `pi-mono` 子目录）：可对 Agent Company 里程碑做一次 **`./scripts/agent-company-acceptance.sh`**（**`--help`** 查看步骤；顺序执行 [`PROGRESS.md`](../../../PROGRESS.md) §1c 中的自动化项）。
