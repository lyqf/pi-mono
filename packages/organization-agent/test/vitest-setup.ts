import { AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL } from "../src/memory-from-env.js";
import { AGENT_COMPANY_SPECIALIST_LIMIT_ENV } from "../src/organization-session.js";

delete process.env[AGENT_COMPANY_NOCTURNE_HTTP_BASE_URL];
delete process.env[AGENT_COMPANY_SPECIALIST_LIMIT_ENV];
delete process.env.AGENT_COMPANY_SHOW_TELEMETRY_HINT;
