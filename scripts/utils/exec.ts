/**
 * Utilities for executing shell commands
 */

import { spawn } from "child_process";
import type { ExecResult } from "../types";

/**
 * Execute a shell command and return the result
 * @param command The command to execute
 * @param args Command arguments
 * @param options Execution options
 */
export function exec(
    command: string,
    args: string[] = [],
    options: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        timeout?: number;
        streamOutput?: boolean; // Stream output to console in real-time
        silent?: boolean; // Completely suppress output (ignore stdio)
    } = {}
): Promise<ExecResult> {
    return new Promise(resolve => {
        let stdout = "";
        let stderr = "";

        // Determine stdio mode
        let stdio: any;
        if (options.silent) {
            stdio = "ignore"; // Completely ignore all stdio
        } else if (options.streamOutput) {
            stdio = ["inherit", "pipe", "pipe"];
        } else {
            stdio = ["pipe", "pipe", "pipe"];
        }

        // On Windows, use shell for command resolution, but pass full command string
        const isWindows = process.platform === "win32";
        const proc = isWindows
            ? spawn(command + " " + args.join(" "), [], {
                  cwd: options.cwd || process.cwd(),
                  env: { ...process.env, ...options.env },
                  shell: true,
                  stdio,
              })
            : spawn(command, args, {
                  cwd: options.cwd || process.cwd(),
                  env: { ...process.env, ...options.env },
                  stdio,
              });

        proc.stdout?.on("data", data => {
            const output = data.toString();
            stdout += output;
            if (options.streamOutput) {
                process.stdout.write(output);
            }
        });

        proc.stderr?.on("data", data => {
            const error = data.toString();
            stderr += error;
            if (options.streamOutput) {
                process.stderr.write(error);
            }
        });

        proc.on("close", code => {
            resolve({
                exitCode: code ?? 1,
                output: stdout,
                error: stderr,
            });
        });

        proc.on("error", err => {
            resolve({
                exitCode: 1,
                output: stdout,
                error: stderr + "\n" + err.message,
            });
        });

        // Handle timeout
        if (options.timeout) {
            setTimeout(() => {
                proc.kill();
                resolve({
                    exitCode: 1,
                    output: stdout,
                    error: stderr + "\nCommand timed out",
                });
            }, options.timeout);
        }
    });
}

/**
 * Execute a command using pnpx
 */
export function pnpx(
    command: string,
    args: string[] = [],
    options?: { timeout?: number; streamOutput?: boolean; silent?: boolean }
): Promise<ExecResult> {
    return exec("pnpx", [command, ...args], {
        timeout: options?.timeout || 30000, // Default 30 second timeout
        streamOutput: options?.streamOutput,
        silent: options?.silent,
    });
}

/**
 * Check if a command is available in PATH
 */
export async function commandExists(command: string): Promise<boolean> {
    const isWindows = process.platform === "win32";
    const checkCmd = isWindows ? "where" : "which";
    const result = await exec(checkCmd, [command]);
    return result.exitCode === 0;
}
