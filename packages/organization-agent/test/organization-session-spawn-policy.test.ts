import { describe, expect, it } from "vitest";
import { createOrganizationSession } from "../src/organization-session.js";

describe("OrganizationSession spawn policy", () => {
	it("rejects specialist spawn requests from unsupported requester roles", () => {
		const session = createOrganizationSession({ now: () => "2026-05-11T00:00:00.000Z" });

		expect(
			session.requestSpawn({ byAgentId: "worker-a", role: "specialist", reason: "Need database expertise" }),
		).toEqual({ accepted: false, reason: "Only boss or planner can request specialist spawn" });
	});

	it("honors specialistLimit option at zero", () => {
		const session = createOrganizationSession({
			now: () => "2026-05-11T00:00:00.000Z",
			specialistLimit: 0,
		});

		expect(session.requestSpawn({ byAgentId: "boss", role: "specialist", reason: "Need help" })).toEqual({
			accepted: false,
			reason: "Specialist limit reached",
		});
	});
});
