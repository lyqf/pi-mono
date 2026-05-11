import { describe, expect, it } from "vitest";
import { createScriptedAgentRuntimeAdapter } from "../src/agent-runtime-adapter.js";
import { createOrganizationSession } from "../src/organization-session.js";
import type { SkillExtractionTrace } from "../src/skill-extractor.js";
import { runInitialOrganizationWorkflow } from "../src/workflow-coordinator.js";

const adapter = createScriptedAgentRuntimeAdapter({
	boss: { summary: "Goal accepted", messages: ["Planner should break down work"] },
	planner: { summary: "Plan created", messages: ["Worker A should implement first task"] },
	worker: { summary: "Worker output ready", messages: ["Reviewer should inspect output"] },
	reviewer: { summary: "Review passed", messages: ["Memory should summarize trace"] },
	memory: { summary: "Memory extracted", messages: ["Trace persisted"] },
});

describe("Workflow skill extraction", () => {
	it("uses injected skill extractor trace to create the workflow skill", async () => {
		const traces: SkillExtractionTrace[] = [];
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		await runInitialOrganizationWorkflow({
			session,
			adapter,
			task: "Build Agent Company",
			extractSkillCandidate: (trace) => {
				traces.push(trace);
				return {
					name: trace.taskTitle,
					trigger: "When test trace extraction runs",
					steps: trace.agentSummaries.map((item) => item.summary),
					sourceTaskId: trace.taskId,
					sourceAgentIds: trace.agentSummaries.map((item) => item.agentId),
					successEvidence: trace.successEvidence,
					failureCases: [],
				};
			},
		});

		expect(traces).toEqual([
			expect.objectContaining({
				taskId: "initial-worker-task",
				taskTitle: "Build Agent Company",
				successEvidence: ["Initial workflow completed"],
			}),
		]);
		expect(session.getEvents()).toContainEqual(
			expect.objectContaining({
				type: "skill.created",
				skill: expect.objectContaining({ trigger: "When test trace extraction runs" }),
			}),
		);
	});
});
