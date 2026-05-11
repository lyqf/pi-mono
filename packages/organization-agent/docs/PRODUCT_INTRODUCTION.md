# Agent Company 产品介绍

本文档与本包 **`README.md`** 配套：概述 **Agent Company**（`@earendil-works/pi-organization-agent`）的产品能力与边界。

若你的磁盘布局为 **`pi-develop/pi-mono/packages/organization-agent`**，仓库根目录可能另有 **`pi-develop/docs/PRODUCT_INTRODUCTION.md`** 副本；以 **包内文档 + 包 README** 为 API 与 CLI 的权威说明。

## 产品定位

**Agent Company** 提供「多 Agent 组织运行时」：**任务图（DAG）**、固定角色组织 + 可封顶的 **Specialist**、统一 **OrganizationEvent** 流与 **本地 Dashboard**，可选 **Nocturne 兼容 HTTP 持久记忆**，并与 **Pi 启动路径**、**技能清单回流** 打通。

高层需求与里程碑见 **pi-develop 工作区**（若存在）中的 **`CONSTITUTION.md`** / **`CONSTITUTION-ROADMAP.md`**；路径见下文「相关文档」。

## 架构一览

| 层级 | 说明 |
|------|------|
| **CLI** | `agent-company`、`agent-company-memory-bridge`、`agent-company-pi-telemetry` |
| **运行时** | `OrganizationSession`、`TaskGraph`、`OrganizationProjector`、`EventStore` |
| **可视化** | `EventStreamServer`：上帝视角 Dashboard、SSE、`/api/snapshot`（`godView`、`skillManifest`） |
| **记忆** | 进程内默认；可选 **`AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL`** + **`agent-company-memory-bridge`** |
| **Pi** | `agent-company start` 绑定 Pi；白名单 **`POST /api/append-event`** 供 wrapper 遥测 |

## 能力清单（摘要）

- **组织与任务**：TaskGraph、OrganizationSession（含 specialist 上限 **`AGENT_COMPANY_SPECIALIST_LIMIT`**）、可选脚本工作流与非脚本 **`organizationRequests`** 路径、事件投影。
- **Dashboard**：上帝视角首屏、诊断区折叠、`GET /api/snapshot`、`integration.pi_activity` + **`agentHint`** 脉冲（解析规则见 **`README`**）。
- **记忆**：HTTP client + bridge；集成测试 **`http-memory-persistence.integration.test.ts`**。
- **技能与 Pi**：**`/api/skills-manifest`**、`skillsPromptAddon`、`attachMemorySearchContext`、`PI_SINGLE_ENTRY.md`、遥测 CLI **`send-pi-telemetry`**。
- **门禁**：**`npm run verify`**；monorepo 根 **`npm run test:organization-agent`**；pi-develop 根 **`./scripts/agent-company-acceptance.sh`**（若布局存在）。

## 可选后续（非路线图必选）

真实 Nocturne 冒烟、Pi 内核自动打点、Dashboard 产品 UX 深扫等 —见 **`PROGRESS.md` §3**（若可得）。

## 相关文档

| 文档 | 说明 |
|------|------|
| [PRODUCT_USER_GUIDE.md](./PRODUCT_USER_GUIDE.md) | 安装、CLI、HTTP API、签收 |
| [PI_SINGLE_ENTRY.md](./PI_SINGLE_ENTRY.md) | Pi 单入口与遥测 |
| [../README.md](../README.md) | CLI、环境变量、Dashboard API、程序化 API |
| [../../../../CONSTITUTION.md](../../../../CONSTITUTION.md) | 宪法（**仅当** `pi-mono` 位于 `pi-develop/pi-mono` 时有效） |
| [../../../../CONSTITUTION-ROADMAP.md](../../../../CONSTITUTION-ROADMAP.md) | 路线图 M0–M5 |
| [../../../../PROGRESS.md](../../../../PROGRESS.md) | 进展与 §1c 签收 |

---

*实现细节以本包源码与 `README.md` 为准。*
