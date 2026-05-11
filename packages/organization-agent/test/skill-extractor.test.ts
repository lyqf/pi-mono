import { describe, expect, it } from "vitest";
import { extractSkillCandidateFromTrace } from "../src/skill-extractor.js";

describe("SkillExtractor", () => {
	it("converts successful workflow traces into skill candidates", () => {
		const candidate = extractSkillCandidateFromTrace({
			taskId: "initial-worker-task",
			taskTitle: "Build Agent Company",
			agentSummaries: [
				{ agentId: "boss", summary: "Goal accepted" },
				{ agentId: "planner", summary: "Plan created" },
				{ agentId: "worker-a", summary: "Worker output ready" },
				{ agentId: "reviewer", summary: "Review passed" },
				{ agentId: "memory", summary: "Memory extracted" },
			],
			successEvidence: ["Initial workflow completed"],
		});

		expect(candidate).toEqual({
			name: "Build Agent Company",
			trigger: "When a similar task needs company-style agent coordination",
			steps: ["Goal accepted", "Plan created", "Worker output ready", "Review passed", "Memory extracted"],
			sourceTaskId: "initial-worker-task",
			sourceAgentIds: ["boss", "planner", "worker-a", "reviewer", "memory"],
			successEvidence: ["Initial workflow completed"],
			failureCases: [],
		});
	});

	it("rejects traces without evidence", () => {
		expect(() =>
			extractSkillCandidateFromTrace({
				taskId: "task-a",
				taskTitle: "Task A",
				agentSummaries: [{ agentId: "worker-a", summary: "Done" }],
				successEvidence: [],
			}),
		).toThrow("successEvidence");
	});
});
