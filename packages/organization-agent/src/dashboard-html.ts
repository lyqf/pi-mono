export function createDashboardHtml(): string {
	return [
		...createDocumentStart(),
		...createDashboardStylesBase(),
		...createDashboardStylesGodLayout(),
		...createDashboardStylesMotion(),
		...createDashboardBody(),
		...createDashboardScript(),
		...createDocumentEnd(),
	].join("\n");
}

function createDocumentStart(): readonly string[] {
	return [
		"<!doctype html>",
		'<html lang="en">',
		"<head>",
		'\t<meta charset="utf-8" />',
		'\t<meta name="viewport" content="width=device-width, initial-scale=1" />',
		"\t<title>Agent Company Dashboard</title>",
		"\t<style>",
	];
}

function createDocumentEnd(): readonly string[] {
	return ["</body>", "</html>"];
}

function createDashboardStylesBase(): readonly string[] {
	return [
		"\t\t:root { color-scheme: dark; --bg: #08111f; --panel: #101a2b; --panel-2: #0d1524; --line: #223047; --text: #e8eef7; --muted: #9aa9bd; --accent: #60a5fa; --green: #34d399; --yellow: #fbbf24; --red: #fb7185; }",
		'\t\t* { box-sizing: border-box; } body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at top left, #17345f 0, var(--bg) 38%); color: var(--text); }',
		"\t\theader.hero { padding: 20px 24px; border-bottom: 1px solid var(--line); background: rgba(8, 17, 31, 0.86); } h1, h2, h3, p { margin-top: 0; } h1 { margin-bottom: 6px; font-size: 28px; } h2 { margin-bottom: 10px; font-size: 15px; letter-spacing: .02em; }",
		"\t\t.badge { display: inline-flex; margin: 0 6px 6px 0; padding: 3px 8px; border-radius: 999px; background: #1d2a3f; color: #bfdbfe; font-size: 11px; font-weight: 700; }",
		"\t\t.badge.hot { color: #fecdd3; background: #4c1d2a; } .badge.cluster-core { background: #172554; color: #bfdbfe; } .badge.cluster-spec { background: #422006; color: #fcd34d; }",
		"\t\t.meta, .muted { color: var(--muted); font-size: 12px; } ul { margin: 8px 0 0 18px; padding: 0; } code { color: #d8b4fe; }",
		"\t\t@media (max-width: 720px) { header.hero { padding: 14px; } }",
		"\t</style>",
		"</head>",
	];
}

function createDashboardStylesGodLayout(): readonly string[] {
	return [
		"\t<style>",
		"\t\t.god-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; padding: 12px; align-items: start; }",
		"\t\t.god-primary { display: flex; flex-direction: column; gap: 12px; min-width: 0; }",
		"\t\t.god-aside { border: 1px solid var(--line); border-radius: 16px; padding: 12px; background: rgba(16, 26, 43, .92); position: sticky; top: 8px; }",
		"\t\tsection.panel { border: 1px solid var(--line); border-radius: 16px; padding: 12px; background: rgba(16, 26, 43, .92); }",
		"\t\t.status-strip { display: grid; grid-template-columns: repeat(4, minmax(100px, 1fr)); gap: 8px; }",
		"\t\t.metric-card { padding: 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel-2); }",
		"\t\t.metric-value { display: block; font-size: 22px; font-weight: 800; color: var(--accent); }",
		"\t\t.focus-row { display: grid; grid-template-columns: 1.3fr .9fr; gap: 12px; }",
		"\t\t.focus-card { border: 1px solid var(--line); border-radius: 14px; padding: 14px; background: rgba(13, 21, 36, .95); }",
		"\t\t.focus-title { margin-bottom: 6px; font-size: 17px; font-weight: 800; }",
		"\t\t.progress-track { overflow: hidden; height: 8px; border-radius: 999px; background: #1e293b; }",
		"\t\t.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--green)); }",
		"\t\t.swarm-panel { border: 1px solid var(--line); border-radius: 16px; padding: 8px; background: var(--panel-2); min-height: 220px; }",
		"\t\t.swarm-panel svg { width: 100%; height: 220px; display: block; }",
		"\t\t.swarm-edge-flash { stroke: var(--yellow); stroke-width: 2px; opacity: 0.95; }",
		"\t\t.task-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }",
		"\t\t.agent-roster, .timeline, .memory-skill-grid, .event-list { display: grid; gap: 8px; }",
		"\t\t.agent-card, .task-card, .message-item, .memory-item, .skill-item, .event-item, .task-lane { border: 1px solid var(--line); border-radius: 12px; padding: 10px; background: var(--panel-2); }",
		"\t\t.task-lane { min-height: 100px; } .lane-title, .card-title { font-weight: 800; margin-bottom: 6px; font-size: 13px; }",
		"\t\t.timeline-item { border-left: 3px solid var(--accent); }",
		"\t\tdetails.diagnostics { border: 1px solid var(--line); border-radius: 14px; padding: 10px 14px; background: rgba(12, 20, 34, .88); grid-column: 1 / -1; }",
		"\t\tdetails.diagnostics summary { cursor: pointer; font-weight: 700; color: var(--muted); }",
		"\t\t.diagnostics-inner { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }",
		"\t\t@media (max-width: 1100px) { .god-layout { grid-template-columns: 1fr; } .god-aside { position: static; } .focus-row, .task-board, .diagnostics-inner { grid-template-columns: 1fr; } .status-strip { grid-template-columns: 1fr 1fr; } }",
		"\t</style>",
	];
}

function createDashboardStylesMotion(): readonly string[] {
	return [
		"\t<style>",
		"\t\t@keyframes pulse-ring { 0% { r: 14; opacity: 0.55; } 100% { r: 22; opacity: 0; } }",
		"\t\t.agent-node-working .pulse { animation: pulse-ring 1.1s ease-out infinite; }",
		"\t\t.agent-node-pi-telemetry .pulse-pi { animation: pulse-ring 1s ease-out infinite; }",
		"\t\t@media (prefers-reduced-motion: reduce) { .agent-node-working .pulse { animation: none !important; } }",
		"\t\t@media (prefers-reduced-motion: reduce) { .agent-node-pi-telemetry .pulse-pi { animation: none !important; } }",
		"\t</style>",
	];
}

function createDashboardBody(): readonly string[] {
	return [
		"<body>",
		'\t<header class="hero"><p class="muted">Agent Company</p><h1>Mission Control</h1><p>Organization overview first — diagnostics stay tucked below.</p>',
		'\t<div id="summary" class="status-strip" style="margin-top:14px;">Connecting...</div>',
		'\t<div class="focus-row" style="margin-top:12px;"><div id="current-focus" class="focus-card"></div><div id="blocked-strip" class="focus-card"></div></div>',
		"\t</header>",
		'\t<main class="god-layout">',
		'\t\t<div class="god-primary">',
		'\t\t\t<section class="panel"><h2>Live situation</h2><div id="progress" class="focus-card" style="border:none;background:transparent;padding:0;"></div>',
		'\t\t\t<div id="swarm-wrap" class="swarm-panel"><svg id="agent-swarm" viewBox="0 0 640 220" aria-label="Agent swarm"></svg></div></section>',
		'\t\t\t<section class="panel"><h2>Task board</h2><div id="tasks" class="task-board"></div></section>',
		'\t\t\t<section class="panel"><h2>Agent roster</h2><div id="agents" class="agent-roster"></div></section>',
		"\t\t</div>",
		'\t\t<aside class="god-aside"><h2>Memory & skills</h2><div id="memory-skills" class="memory-skill-grid"></div></aside>',
		'\t\t<details class="diagnostics"><summary>Diagnostics — timeline & raw events</summary><div class="diagnostics-inner">',
		'\t\t\t<section><h3>Conversation timeline</h3><div id="messages" class="timeline"></div></section>',
		'\t\t\t<section><h3>Event stream</h3><div id="events" class="event-list"></div></section>',
		"\t\t</div></details>",
		"\t</main>",
	];
}

function createDashboardScript(): readonly string[] {
	return [
		"\t<script>",
		...dashScriptConstants(),
		...dashScriptState(),
		...dashScriptBatching(),
		...dashScriptGodHelpers(),
		...dashScriptResolvePiHint(),
		...dashScriptApply(),
		...dashScriptRenderMain(),
		...dashScriptSwarm(),
		...dashScriptItems(),
		...dashScriptDescribe(),
		...dashScriptDom(),
		...dashScriptFetch(),
		"\t</script>",
	];
}

function dashScriptConstants(): readonly string[] {
	return [
		"\t\tconst RECENT_EVENT_LIMIT = 14;",
		"\t\tconst LANE_ORDER = ['in_progress', 'assigned', 'reviewing', 'blocked', 'planned', 'completed'];",
	];
}

function dashScriptState(): readonly string[] {
	return [
		"\t\tconst state = { agents: {}, tasks: {}, messages: [], memories: [], skills: [], events: [], flash: null, piPulse: null };",
	];
}

function dashScriptBatching(): readonly string[] {
	return [
		"\t\tconst pendingEvents = [];",
		"\t\tlet flushScheduled = false;",
		"\t\tfunction flushPending() {",
		"\t\t\tflushScheduled = false;",
		"\t\t\tconst batch = pendingEvents.splice(0, pendingEvents.length);",
		"\t\t\tfor (const event of batch) applyEventCore(event);",
		"\t\t\trender();",
		"\t\t}",
		"\t\tfunction scheduleFlush() {",
		"\t\t\tif (flushScheduled) return;",
		"\t\t\tflushScheduled = true;",
		"\t\t\trequestAnimationFrame(flushPending);",
		"\t\t}",
		"\t\tfunction applyEvent(event) { pendingEvents.push(event); scheduleFlush(); }",
	];
}

function dashScriptGodHelpers(): readonly string[] {
	return [
		"\t\tfunction taskDescendants(rootId) {",
		"\t\t\tconst tasks = Object.values(state.tasks);",
		"\t\t\tfunction walk(pid) {",
		"\t\t\t\tconst kids = tasks.filter((task) => task.parentTaskId === pid);",
		"\t\t\t\treturn kids.flatMap((kid) => [kid, ...walk(kid.id)]);",
		"\t\t\t}",
		"\t\t\treturn walk(rootId);",
		"\t\t}",
		"\t\tfunction rootProgressPercent() {",
		"\t\t\tconst root = Object.values(state.tasks).find((task) => task.kind === 'root');",
		"\t\t\tif (!root) return 0;",
		"\t\t\tconst desc = taskDescendants(root.id);",
		"\t\t\tif (desc.length === 0) return 0;",
		"\t\t\tconst done = desc.filter((task) => task.state === 'completed').length;",
		"\t\t\treturn Math.round((done / desc.length) * 100);",
		"\t\t}",
		"\t\tfunction buildClusters() {",
		"\t\t\tconst agents = Object.values(state.agents);",
		"\t\t\tconst core = agents.filter((agent) => agent.role !== 'specialist').map((agent) => agent.id);",
		"\t\t\tconst specialists = agents.filter((agent) => agent.role === 'specialist').map((agent) => agent.id);",
		"\t\t\tconst clusters = [];",
		"\t\t\tif (core.length) clusters.push({ id: 'core', label: 'Core organization', kind: 'core', agentIds: core });",
		"\t\t\tif (specialists.length) clusters.push({ id: 'specialists', label: 'Specialists', kind: 'specialists', agentIds: specialists });",
		"\t\t\treturn clusters;",
		"\t\t}",
	];
}

function dashScriptResolvePiHint(): readonly string[] {
	return [
		"\t\tfunction resolveAgentIdFromPiHint(hint) {",
		"\t\t\tif (!hint || typeof hint !== 'string') return null;",
		"\t\t\tconst trimmed = hint.trim();",
		"\t\t\tif (!trimmed) return null;",
		"\t\t\tif (state.agents[trimmed]) return trimmed;",
		"\t\t\tconst agents = Object.values(state.agents);",
		"\t\t\tconst roleMatches = agents.filter((agent) => agent.role === trimmed);",
		"\t\t\tif (roleMatches.length === 1) return roleMatches[0].id;",
		"\t\t\tconst lower = trimmed.toLowerCase();",
		"\t\t\tconst nameMatches = agents.filter((agent) => agent.displayName.toLowerCase() === lower);",
		"\t\t\tif (nameMatches.length === 1) return nameMatches[0].id;",
		"\t\t\treturn null;",
		"\t\t}",
	];
}

function dashScriptApply(): readonly string[] {
	return [
		"\t\tfunction applyEventCore(event) {",
		"\t\t\tstate.events.push(event);",
		'\t\t\tif (event.type === "agent.created") state.agents[event.agent.id] = event.agent;',
		'\t\t\tif (event.type === "agent.status_changed" && state.agents[event.agentId]) state.agents[event.agentId] = { ...state.agents[event.agentId], state: event.state };',
		'\t\t\tif (event.type === "agent.terminated" && state.agents[event.agentId]) state.agents[event.agentId] = { ...state.agents[event.agentId], state: "terminated" };',
		'\t\t\tif (event.type === "agent.merged" && state.agents[event.sourceAgentId]) state.agents[event.sourceAgentId] = { ...state.agents[event.sourceAgentId], state: "merged" };',
		'\t\t\tif (event.type === "task.created") state.tasks[event.task.id] = event.task;',
		'\t\t\tif (event.type === "task.updated") state.tasks[event.task.id] = event.task;',
		'\t\t\tif (event.type === "task.assigned" && state.tasks[event.taskId]) state.tasks[event.taskId] = { ...state.tasks[event.taskId], state: "assigned", assigneeAgentId: event.agentId };',
		'\t\t\tif (event.type === "task.status_changed" && state.tasks[event.taskId]) state.tasks[event.taskId] = { ...state.tasks[event.taskId], state: event.state };',
		'\t\t\tif (event.type === "task.dependency_linked" && state.tasks[event.afterTaskId]) state.tasks[event.afterTaskId] = linkDependency(event);',
		'\t\t\tif (event.type === "message.sent") { state.messages.push(event.message); state.flash = { from: event.message.fromAgentId, to: event.message.toAgentId, until: Date.now() + 950 }; }',
		'\t\t\tif (event.type === "memory.written") state.memories.push(event.memory);',
		'\t\t\tif (event.type === "skill.created") state.skills.push(event.skill);',
		'\t\t\tif (event.type === "integration.pi_activity") {',
		"\t\t\t\tconst resolved = resolveAgentIdFromPiHint(event.agentHint);",
		"\t\t\t\tif (resolved) state.piPulse = { agentId: resolved, until: Date.now() + 1600 };",
		"\t\t\t}",
		"\t\t}",
	];
}

function dashScriptRenderMain(): readonly string[] {
	return [
		"\t\tfunction render() {",
		"\t\t\trenderSummary();",
		"\t\t\trenderCurrentFocus();",
		"\t\t\trenderBlocked();",
		"\t\t\trenderProgress();",
		"\t\t\trenderAgents();",
		"\t\t\trenderTasks();",
		"\t\t\trenderTimeline();",
		"\t\t\trenderMemorySkills();",
		"\t\t\trenderEvents();",
		"\t\t\trenderSwarm();",
		"\t\t}",
		"\t\tfunction renderSummary() {",
		'\t\t\tconst activeAgents = Object.values(state.agents).filter((agent) => !["done", "terminated", "merged"].includes(agent.state)).length;',
		'\t\t\tconst openTasks = Object.values(state.tasks).filter((task) => !["completed", "failed", "cancelled"].includes(task.state)).length;',
		'\t\t\tsetHtml("summary", [metric("Active agents", activeAgents), metric("Open tasks", openTasks), metric("Messages", state.messages.length), metric("Clusters", buildClusters().length)].join(""));',
		"\t\t}",
		"\t\tfunction renderCurrentFocus() {",
		"\t\t\tconst activeTask = firstTask(['in_progress', 'assigned', 'reviewing', 'blocked']);",
		'\t\t\tconst title = activeTask ? activeTask.title : "Waiting for the first task";',
		'\t\t\tconst owner = activeTask ? agentName(activeTask.assigneeAgentId) : "No owner yet";',
		"\t\t\tsetHtml(\"current-focus\", '<h2>Current focus</h2><div class=\"focus-title\">' + escapeHtml(title) + '</div><p class=\"meta\">Owner: ' + escapeHtml(owner) + ' · Latest: ' + escapeHtml(describeLatestEvent()) + '</p>');",
		"\t\t}",
		"\t\tfunction renderBlocked() {",
		"\t\t\tconst blocked = Object.values(state.tasks).filter((task) => task.state === 'blocked');",
		"\t\t\tconst lines = blocked.map((task) => '<li>' + escapeHtml(task.title) + '</li>').join('');",
		"\t\t\tconst body = blocked.length ? '<ul>' + lines + '</ul>' : '<p class=\"meta\">No blocked tasks</p>';",
		"\t\t\tsetHtml(\"blocked-strip\", '<h2>Blocked</h2>' + body);",
		"\t\t}",
		"\t\tfunction renderProgress() {",
		"\t\t\tconst percent = rootProgressPercent();",
		"\t\t\tconst tasks = Object.values(state.tasks);",
		'\t\t\tconst done = tasks.filter((task) => task.state === "completed").length;',
		'\t\t\tsetHtml("progress", \'<h2>Root subtree progress</h2><div class="focus-title">\' + percent + \'% descendants done</div><div class="progress-track"><div class="progress-fill" style="width:\' + percent + \'%"></div></div><p class="meta">\' + done + \'/\' + tasks.length + \' tasks total</p>\');',
		"\t\t}",
	];
}

function dashScriptSwarm(): readonly string[] {
	return [
		"\t\tfunction renderSwarm() {",
		"\t\t\tconst svg = document.getElementById('agent-swarm');",
		"\t\t\tif (!svg) return;",
		"\t\t\tconst clusters = buildClusters();",
		"\t\t\tconst reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
		"\t\t\tconst positions = {};",
		"\t\t\tlet col = 0;",
		"\t\t\tfor (const cluster of clusters) {",
		"\t\t\t\tcluster.agentIds.forEach((id, index) => {",
		"\t\t\t\t\tconst x = 120 + col * 200 + (index % 3) * 52;",
		"\t\t\t\t\tconst y = 48 + Math.floor(index / 3) * 56 + (cluster.kind === 'specialists' ? 28 : 0);",
		"\t\t\t\t\tpositions[id] = { x, y };",
		"\t\t\t\t});",
		"\t\t\t\tcol += 1;",
		"\t\t\t}",
		"\t\t\tlet html = '<defs></defs>';",
		"\t\t\tconst now = Date.now();",
		"\t\t\tif (state.piPulse && now >= state.piPulse.until) state.piPulse = null;",
		"\t\t\tif (state.flash && now < state.flash.until) {",
		"\t\t\t\tconst a = positions[state.flash.from];",
		"\t\t\t\tconst b = positions[state.flash.to];",
		"\t\t\t\tif (a && b) html += '<line class=\"swarm-edge-flash\" x1=\"' + a.x + '\" y1=\"' + a.y + '\" x2=\"' + b.x + '\" y2=\"' + b.y + '\" />';",
		"\t\t\t} else state.flash = null;",
		"\t\t\tfor (const agent of Object.values(state.agents)) {",
		"\t\t\t\tconst pos = positions[agent.id] || { x: 40, y: 40 };",
		"\t\t\t\tconst working = agent.state === 'working';",
		"\t\t\t\tconst piHot = state.piPulse && state.piPulse.agentId === agent.id && now < state.piPulse.until;",
		"\t\t\t\tconst fill = working ? '#60a5fa' : piHot ? '#d97706' : agent.state === 'done' ? '#34d399' : '#475569';",
		"\t\t\t\tconst cls = working && !reduced ? 'agent-node-working' : piHot && !reduced ? 'agent-node-pi-telemetry' : '';",
		"\t\t\t\thtml += '<g class=\"' + cls + '\" transform=\"translate(' + pos.x + ',' + pos.y + ')\">';",
		'\t\t\t\tif (working && !reduced) html += \'<circle class="pulse" cx="0" cy="0" fill="none" stroke="#60a5fa" stroke-width="2" />\';',
		'\t\t\t\telse if (piHot && !reduced) html += \'<circle class="pulse-pi" cx="0" cy="0" fill="none" stroke="#fbbf24" stroke-width="2" />\';',
		'\t\t\t\thtml += \'<circle r="14" fill="\' + fill + \'" stroke="#0f172a" stroke-width="2" /><text x="0" y="5" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">\' + escapeHtml(agent.role[0].toUpperCase()) + \'</text></g>\';',
		"\t\t\t}",
		"\t\t\tsvg.innerHTML = html;",
		"\t\t}",
	];
}

function dashScriptItems(): readonly string[] {
	return [
		"\t\tfunction renderAgents() {",
		'\t\t\tconst agents = Object.values(state.agents).map(renderAgent).join("");',
		'\t\t\tsetHtml("agents", agents || empty("No agents yet"));',
		"\t\t}",
		"\t\tfunction renderTasks() {",
		'\t\t\tconst lanes = groupTasksByState().map(renderTaskLane).join("");',
		'\t\t\tsetHtml("tasks", lanes || empty("No tasks yet"));',
		"\t\t}",
		"\t\tfunction renderTimeline() {",
		'\t\t\tconst rows = state.messages.slice(-RECENT_EVENT_LIMIT).reverse().map(renderMessage).join("");',
		'\t\t\tsetHtml("messages", rows || empty("No messages yet"));',
		"\t\t}",
		"\t\tfunction renderMemorySkills() {",
		'\t\t\tconst memories = state.memories.slice(-6).map(renderMemory).join("");',
		'\t\t\tconst skills = state.skills.slice(-6).map(renderSkill).join("");',
		'\t\t\tsetHtml("memory-skills", memories + skills || empty("No memory or skills yet"));',
		"\t\t}",
		"\t\tfunction renderEvents() {",
		'\t\t\tconst recent = state.events.slice(-RECENT_EVENT_LIMIT).reverse().map(renderEvent).join("");',
		'\t\t\tsetHtml("events", recent || empty("No events yet"));',
		"\t\t}",
		"\t\tfunction renderAgent(agent) {",
		'\t\t\tconst badge = agent.role === "specialist" ? \'<span class="badge cluster-spec">Specialist</span>\' : \'<span class="badge cluster-core">Core</span>\';',
		"\t\t\treturn '<article class=\"agent-card\"><div class=\"card-title\">' + escapeHtml(agent.displayName) + '</div>' + badge + '<span class=\"badge\">' + escapeHtml(agent.role) + '</span><span class=\"badge\">' + escapeHtml(agent.state) + '</span><p class=\"meta\">Task: ' + escapeHtml(taskTitle(agent.currentTaskId) || \"unassigned\") + '</p></article>';",
		"\t\t}",
		"\t\tfunction renderTaskLane(lane) {",
		'\t\t\treturn \'<div class="task-lane"><div class="lane-title">\' + escapeHtml(label(lane.state)) + \' <span class="muted">\' + lane.tasks.length + \'</span></div>\' + (lane.tasks.map(renderTask).join("") || empty("No tasks")) + \'</div>\';',
		"\t\t}",
		"\t\tfunction renderTask(task) {",
		'\t\t\tconst owner = agentName(task.assigneeAgentId) || "unassigned";',
		'\t\t\tconst badgeClass = task.state === "blocked" ? "badge hot" : "badge";',
		"\t\t\treturn '<article class=\"task-card\"><div class=\"card-title\">' + escapeHtml(task.title) + '</div><span class=\"badge\">' + escapeHtml(task.kind) + '</span><span class=\"' + badgeClass + '\">' + escapeHtml(label(task.state)) + '</span><p class=\"meta\">Owner: ' + escapeHtml(owner) + '</p>' + renderCriteria(task.acceptanceCriteria || []) + '</article>';",
		"\t\t}",
		"\t\tfunction renderMessage(message) {",
		"\t\t\treturn '<article class=\"message-item timeline-item\"><span class=\"badge\">' + escapeHtml(message.type) + '</span><strong>' + escapeHtml(agentName(message.fromAgentId) || message.fromAgentId) + '</strong><span class=\"muted\"> → ' + escapeHtml(agentName(message.toAgentId) || message.channel || \"broadcast\") + '</span><p>' + escapeHtml(message.content) + '</p></article>';",
		"\t\t}",
		"\t\tfunction renderMemory(memory) {",
		"\t\t\treturn '<article class=\"memory-item\"><div class=\"card-title\">Memory</div><p><code>' + escapeHtml(memory.uri) + '</code></p><p>' + escapeHtml(memory.content) + '</p></article>';",
		"\t\t}",
		"\t\tfunction renderSkill(skill) {",
		"\t\t\treturn '<article class=\"skill-item\"><div class=\"card-title\">' + escapeHtml(skill.name) + '</div><p class=\"meta\">Trigger: ' + escapeHtml(skill.trigger) + '</p>' + renderCriteria(skill.steps || []) + '</article>';",
		"\t\t}",
	];
}

function dashScriptDescribe(): readonly string[] {
	return [
		"\t\tfunction renderEvent(event) {",
		"\t\t\treturn '<article class=\"event-item timeline-item\"><span class=\"badge\">' + escapeHtml(event.type) + '</span><span>' + escapeHtml(describeEvent(event)) + '</span></article>';",
		"\t\t}",
		"\t\tfunction describeLatestEvent() {",
		"\t\t\tconst latest = state.events[state.events.length - 1];",
		'\t\t\treturn latest ? describeEvent(latest) : "No activity yet";',
		"\t\t}",
		"\t\tfunction describeEvent(event) {",
		'\t\t\tif (event.type === "agent.created") return event.agent.displayName + " joined as " + event.agent.role;',
		'\t\t\tif (event.type === "agent.status_changed") return agentName(event.agentId) + " → " + label(event.state);',
		'\t\t\tif (event.type === "task.created") return "Task created: " + event.task.title;',
		'\t\t\tif (event.type === "task.assigned") return agentName(event.agentId) + " took " + taskTitle(event.taskId);',
		'\t\t\tif (event.type === "task.status_changed") return taskTitle(event.taskId) + " → " + label(event.state);',
		'\t\t\tif (event.type === "message.sent") return agentName(event.message.fromAgentId) + " messaged";',
		'\t\t\tif (event.type === "memory.written") return "Memory saved: " + event.memory.uri;',
		'\t\t\tif (event.type === "memory.search_used") return "Memory search (" + event.hitCount + " hits): " + event.query.slice(0, 48);',
		'\t\t\tif (event.type === "skill.created") return "Skill learned: " + event.skill.name;',
		'\t\t\tif (event.type === "integration.pi_session_started") return "Pi session bound" + (event.taskContext ? ": " + event.taskContext : "");',
		'\t\t\tif (event.type === "integration.pi_session_finished") return "Pi session ended (exit " + event.exitCode + ")";',
		'\t\t\tif (event.type === "integration.pi_activity") return "Pi activity: " + event.phase + (event.detail ? " — " + event.detail : "") + (event.agentHint ? " [" + event.agentHint + "]" : "");',
		'\t\t\tif (event.type === "integration.external_note") return "Note: " + event.message;',
		'\t\t\tif (event.type === "runtime.error") return "Runtime error: " + event.message;',
		"\t\t\treturn label(event.type);",
		"\t\t}",
		"\t\tfunction groupTasksByState() {",
		"\t\t\tconst tasks = Object.values(state.tasks);",
		"\t\t\treturn LANE_ORDER.map((taskState) => ({ state: taskState, tasks: tasks.filter((task) => task.state === taskState) })).filter((lane) => lane.tasks.length > 0);",
		"\t\t}",
	];
}

function dashScriptDom(): readonly string[] {
	return [
		"\t\tfunction linkDependency(event) {",
		"\t\t\tconst task = state.tasks[event.afterTaskId];",
		"\t\t\tconst dependencies = task.dependencies || [];",
		"\t\t\tif (dependencies.includes(event.beforeTaskId)) return task;",
		"\t\t\treturn { ...task, dependencies: [...dependencies, event.beforeTaskId] };",
		"\t\t}",
		"\t\tfunction firstTask(states) { return Object.values(state.tasks).find((task) => states.includes(task.state)); }",
		"\t\tfunction taskTitle(taskId) { return taskId && state.tasks[taskId] ? state.tasks[taskId].title : taskId; }",
		"\t\tfunction agentName(agentId) { return agentId && state.agents[agentId] ? state.agents[agentId].displayName : agentId; }",
		'\t\tfunction label(value) { return String(value || "").replaceAll("_", " "); }',
		"\t\tfunction renderCriteria(items) {",
		'\t\t\tif (items.length === 0) return "";',
		'\t\t\treturn "<ul>" + items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";',
		"\t\t}",
		"\t\tfunction metric(labelText, value) { return '<div class=\"metric-card\"><span class=\"muted\">' + escapeHtml(labelText) + '</span><span class=\"metric-value\">' + escapeHtml(value) + '</span></div>'; }",
		"\t\tfunction empty(text) { return '<p class=\"muted\">' + escapeHtml(text) + '</p>'; }",
		"\t\tfunction setHtml(id, html) { document.getElementById(id).innerHTML = html; }",
		"\t\tfunction escapeHtml(value) {",
		'\t\t\treturn String(value ?? "").replace(/[&<>"\']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;", "\'": "&#39;" })[char]);',
		"\t\t}",
	];
}

function dashScriptFetch(): readonly string[] {
	return [
		'\t\tfetch("/api/snapshot").then((response) => response.json()).then((snapshot) => {',
		"\t\t\tfor (const event of snapshot.events) applyEventCore(event);",
		"\t\t\trender();",
		"\t\t});",
		'\t\tconst source = new EventSource("/api/events");',
		"\t\tsource.onmessage = (message) => applyEvent(JSON.parse(message.data));",
		'\t\tsource.onerror = () => { document.getElementById("summary").textContent = "Event stream disconnected"; };',
	];
}
