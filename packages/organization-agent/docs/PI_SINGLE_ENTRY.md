# Pi 单入口与 Agent Company Dashboard（M4 集成说明）

## 目标

用户从 **Pi 交互**（`pi` CLI）为主路径启动时，组织层事件仍进入 **同一 `EventStore`**，Dashboard 通过既有 `/api/snapshot` 与 `/api/events` 实时展示，避免「两条平行宇宙」。

## 当前 MVP 行为

1. **`agent-company start [task]`**（无 `--workflow`）  
   - 若提供 `task`：调用 `OrganizationSession.start(task)`，产生根任务与 boss 分配等事件。  
   - 向事件流追加 **`integration.pi_session_started`**（含可选 `taskContext`），用于 Dashboard 显示「Pi 已与组织上下文绑定」。  
   - 随后 `createPiInteractiveLauncher()` 启动 `pi`，任务上下文通过 `buildPiArgs` 的 `--append-system-prompt` 注入（见 `pi-interactive-launcher.ts`）。

2. **Dashboard**  
   - 不依赖 Pi 内部实现；只消费 `OrganizationEvent`。  
   - 粗粒度「当前阶段」可由 `agent.status_changed`、`task.*`、`message.sent` 等事件推断。

3. **Pi 会话生命周期（可观测）**  
   - `integration.pi_session_started`：即将启动 `pi`。  
   - `integration.pi_session_finished`：`pi` 子进程结束（含 `exitCode`）；非零退出码仍会追加该事件，随后 CLI 抛错退出。

## Pi / 包装器 → Dashboard 遥测（本地 HTTP）

在 **`agent-company` 已打印的 Dashboard URL** 上（与 HTML 同源），可向 **`POST /api/append-event`** 发送 JSON，事件类型 **仅限**：

- `integration.pi_activity`：`phase`（必填），可选 `detail`、`agentHint`。**`agentHint` 解析顺序**：① 与某个 agent **`id` 完全一致**；② 否则若全场 **仅有一个** agent 的 **`role`** 与该字符串一致（如 `planner`、`worker`——若有两名 `worker` 则无法解析）；③ 否则 **仅有一个** agent 的 **`displayName`** 与该字符串一致（忽略大小写）。匹配成功后群体视图对该圆点做一次短时 **琥珀色脉冲**。  
- `integration.external_note`：`message`（必填）。

示例：

```sh
curl -sS -X POST "$DASHBOARD_URL/api/append-event" \
  -H 'content-type: application/json' \
  -d '{"type":"integration.pi_activity","phase":"tool_use","detail":"bash","agentHint":"worker-a"}'
```

包内提供 **`scripts/send-pi-telemetry.mjs`**（`npm run send-pi-telemetry`，安装后 CLI 名为 **`agent-company-pi-telemetry`**）：设置 **`AGENT_COMPANY_DASHBOARD_URL`**（或将 Dashboard 根 URL 作为第一个参数），例如：

```sh
export AGENT_COMPANY_DASHBOARD_URL="$DASHBOARD_URL"
npm run send-pi-telemetry -- --phase tool_use --detail bash --agent-hint worker-a
```

解析与校验见 `external-append-event.ts`。**不接受** `task.*` / `agent.*` 等伪造组织状态的事件类型。

启动 `agent-company` 时可设置 **`AGENT_COMPANY_SHOW_TELEMETRY_HINT=1`**，在控制台额外打印该 POST URL，以及一行可复制的 **`export AGENT_COMPANY_DASHBOARD_URL='…' && agent-company-pi-telemetry --phase idle`**（亦见 **`agent-company --help`**）；或用 **`GET /api`** 查询同源 JSON 端点索引。

## 后续可增强项（未在本包内硬编码）

- 在 Pi 进程内自动调用上述 HTTP（需 Pi 插件或 wrapper）；wrapper 侧已可选用 **`agent-company-pi-telemetry`** / `npm run send-pi-telemetry`，无需手写 `curl`。  
- 将 `GET /api/skills-manifest` 的 JSON 在第二次会话注入 `createDefaultPiAgentRuntimeAdapter({ skillsPromptAddon })`（见 `skill-manifest.ts` / `default-pi-agent-adapter.ts`）。

## 相关文件

- `src/cli.ts` — `launchPiInteractive` 与 `integration.pi_session_started`  
- `src/pi-interactive-launcher.ts` — `pi` 参数与 task 提示  
- `src/event-stream-server.ts` — 快照中的 `godView` / `skillManifest`  
- `src/skill-manifest.ts` — Trellis 友好技能清单与 prompt 片段  
