import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@earendil-works/pi-agent-core": fileURLToPath(new URL("../agent/src/index.ts", import.meta.url)),
			"@earendil-works/pi-ai": fileURLToPath(new URL("../ai/src/index.ts", import.meta.url)),
		},
	},
	test: {
		globals: true,
		environment: "node",
		testTimeout: 30000,
		setupFiles: [fileURLToPath(new URL("./test/vitest-setup.ts", import.meta.url))],
	},
});
