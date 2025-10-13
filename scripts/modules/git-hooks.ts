/**
 * Git Hooks Module
 * Installs Husky git hooks for commit linting and pre-commit checks
 */

import * as fs from "fs";
import * as path from "path";
import * as clack from "@clack/prompts";
import { Module, ModuleResult } from "./base";
import { exec } from "../utils/exec";

export class GitHooksModule extends Module {
    readonly name = "Git Hooks";
    readonly description = "Husky git hooks for commit linting";

    async isComplete(): Promise<boolean> {
        // Check if .husky directory exists with hooks
        const huskyDir = path.join(process.cwd(), ".husky");

        if (!fs.existsSync(huskyDir)) {
            return false;
        }

        // Check for common hooks
        const commitMsgHook = path.join(huskyDir, "commit-msg");
        const preCommitHook = path.join(huskyDir, "pre-commit");

        // At minimum, commit-msg should exist for conventional commits
        return fs.existsSync(commitMsgHook);
    }

    async run(): Promise<ModuleResult> {
        const spinner = clack.spinner();

        try {
            spinner.start("Installing git hooks...");

            // Run husky prepare script
            const result = await exec("pnpm", ["prepare"]);

            if (result.exitCode !== 0) {
                throw new Error(`Failed to install git hooks: ${result.error}`);
            }

            spinner.stop("Git hooks installed");

            return {
                status: "complete",
                message: "Git hooks installed successfully",
            };
        } catch (error) {
            spinner.stop("Failed to install git hooks");
            throw error;
        }
    }
}

// Allow running this module directly
if (require.main === module) {
    (async () => {
        const module = new GitHooksModule();
        const result = await module.run();
        console.log(result.message);
        process.exit(result.status === "complete" ? 0 : 1);
    })();
}
