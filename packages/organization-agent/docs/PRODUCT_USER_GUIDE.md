# Agent Company 产品使用文档

与 [PRODUCT_INTRODUCTION.md](./PRODUCT_INTRODUCTION.md)、[../README.md](../README.md)、[PI_SINGLE_ENTRY.md](./PI_SINGLE_ENTRY.md) 配套。

## 1. 环境前提

- **Node** ≥ 20。
- 在 **`pi-mono`** 中已安装依赖；本包可 **`npm run build`**。
- **可选**：Nocturne MCP + **`agent-company-memory-bridge`**。
- **完整签收脚本**：若存在 **`pi-develop`** 父目录且含 **`scripts/agent-company-acceptance.sh`**，可在该根目录运行（见下文 §6）。

## 2. 安装与验证（本包）

```bash
cd packages/organization-agent   # 相对于 pi-mono 根
npm install
npm run verify                     # build + vitest --run
npm run test:integration-memory    # 可选：HTTP 记忆持久化集成测试
```

在 **`pi-mono` 根目录**：

```bash
npm run test:organization-agent
```

## 3. CLI

```bash
agent-company start "任务描述" --workflow    # 演示工作流 + Dashboard
agent-company start "任务" --no-cmux --port 0   # Pi 路径示例
agent-company --help
```

常用环境变量见 **`README.md`**（**`AGENT_COMPANY_*`**）。持久记忆与 bridge 步骤见 **`README.md`**「Persistent memory」。

## 4. Dashboard HTTP API（同源）

| 路径 | 说明 |
|------|------|
| **`/`** | Dashboard HTML |
| **`GET /api`** | 端点索引 |
| **`GET /api/snapshot`** | 事件 + `godView` + `skillManifest` |
| **`GET /api/skills-manifest`** | 技能清单 JSON |
| **`POST /api/append-event`** | 仅 `integration.pi_activity` / `integration.external_note` |
| **`GET /api/events`** | SSE |

Pi 遥测 helper：**`npm run send-pi-telemetry`** 或 **`agent-company-pi-telemetry`**（需 **`AGENT_COMPANY_DASHBOARD_URL`**）。详见 **`README.md`**。

## 5. 程序化接入

见 **`README.md`**「Programmatic API」与 `@earendil-works/pi-organization-agent` 导出。

## 6. 维护者与 pi-develop 签收

若本地存在 **`pi-develop/pi-mono`** 布局：

- **路线图**：**`pi-develop/CONSTITUTION-ROADMAP.md`**
- **§1c 清单**：**`pi-develop/PROGRESS.md`**
- **一键**：

```bash
cd /path/to/pi-develop
./scripts/agent-company-acceptance.sh --help
./scripts/agent-company-acceptance.sh
```

仅克隆 **`pi-mono`** 时可能没有上述文件；以 **`npm run verify`** 与本包文档为准。

## 7. 常见问题

**`agentHint` 无脉冲**：需唯一解析到某一 agent（id > 唯一 role > 唯一 displayName）。多人同 role 时请传 **agent id**。

**Dashboard 与 Java `static/react-app`**：Agent Company 的 UI 由本包的 **`dashboard-html.ts`** 等生成，不要与其它工程的嵌入式前端构建流程混用。

---

*以 **`README.md`** 最新内容为准。*
