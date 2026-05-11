import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

const CMUX_COMMAND = "cmux";
const CMUX_APP_CLI = "/Applications/cmux.app/Contents/Resources/bin/cmux";
const CMUX_APP_EXECUTABLE = "/Applications/cmux.app/Contents/MacOS/cmux";
const CMUX_CANDIDATES = [CMUX_APP_CLI, CMUX_APP_EXECUTABLE] as const;

export interface CommandResult {
	readonly exitCode: number;
	readonly stdout: string;
	readonly stderr: string;
}

export type CommandRunner = (command: string, args: readonly string[]) => Promise<CommandResult>;

export interface CmuxClientOptions {
	readonly runner?: CommandRunner;
	readonly command?: string;
}

export interface CmuxClient {
	openDashboard(url: string): Promise<void>;
}

export interface CmuxCommandResolutionOptions {
	readonly exists?: (path: string) => boolean;
	readonly pathValue?: string;
}

export function createCmuxClient(options: CmuxClientOptions = {}): CmuxClient {
	return new DefaultCmuxClient(options.runner ?? execFileRunner, options.command ?? resolveCmuxCommand());
}

export function resolveCmuxCommand(options: CmuxCommandResolutionOptions = {}): string {
	const exists = options.exists ?? existsSync;
	const pathCommand = findPathCommand(options.pathValue ?? process.env.PATH ?? "", exists);
	if (pathCommand) return pathCommand;
	return CMUX_CANDIDATES.find(exists) ?? CMUX_COMMAND;
}

class DefaultCmuxClient implements CmuxClient {
	constructor(
		private readonly runner: CommandRunner,
		private readonly command: string,
	) {}

	async openDashboard(url: string): Promise<void> {
		const result = await this.runner(this.command, ["browser", "open", url]);
		if (result.exitCode !== 0)
			throw new Error(result.stderr || result.stdout || `cmux exited with ${result.exitCode}`);
	}
}

function findPathCommand(pathValue: string, exists: (path: string) => boolean): string | undefined {
	const paths = pathValue.split(delimiter).filter((path) => path.length > 0);
	return paths.map((path) => join(path, CMUX_COMMAND)).find(exists);
}

const execFileRunner: CommandRunner = (command, args) =>
	new Promise((resolve) => {
		execFile(command, [...args], (error, stdout, stderr) => {
			resolve({
				exitCode: typeof error?.code === "number" ? error.code : error ? 1 : 0,
				stdout,
				stderr,
			});
		});
	});
