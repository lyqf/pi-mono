import { spawn } from "node:child_process";

export interface PiInteractiveLauncherInput {
	readonly task?: string;
	readonly provider?: string;
	readonly model?: string;
}

export interface PiInteractiveLauncherResult {
	readonly exitCode: number;
}

export type PiCommandRunner = (command: string, args: readonly string[]) => Promise<PiInteractiveLauncherResult>;

export interface PiInteractiveLauncherOptions {
	readonly command?: string;
	readonly runner?: PiCommandRunner;
}

export interface PiInteractiveLauncher {
	start(input: PiInteractiveLauncherInput): Promise<PiInteractiveLauncherResult>;
}

export function createPiInteractiveLauncher(options: PiInteractiveLauncherOptions = {}): PiInteractiveLauncher {
	return new DefaultPiInteractiveLauncher(options.command ?? "pi", options.runner ?? runPiCommand);
}

export function buildPiArgs(input: PiInteractiveLauncherInput): readonly string[] {
	const args: string[] = [];
	if (input.provider) args.push("--provider", input.provider);
	if (input.model) args.push("--model", input.model);
	if (input.task) args.push("--append-system-prompt", buildTaskContextPrompt(input.task));
	return args;
}

function buildTaskContextPrompt(task: string): string {
	return [
		`Agent Company task context: ${task}`,
		"Use this as task context only. Do not start executing it until the user sends an instruction inside pi.",
	].join("\n");
}

class DefaultPiInteractiveLauncher implements PiInteractiveLauncher {
	constructor(
		private readonly command: string,
		private readonly runner: PiCommandRunner,
	) {}

	async start(input: PiInteractiveLauncherInput): Promise<PiInteractiveLauncherResult> {
		return this.runner(this.command, buildPiArgs(input));
	}
}

const runPiCommand: PiCommandRunner = (command, args) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, [...args], { stdio: "inherit" });
		child.once("error", reject);
		child.once("exit", (code) => resolve({ exitCode: code ?? 1 }));
	});
