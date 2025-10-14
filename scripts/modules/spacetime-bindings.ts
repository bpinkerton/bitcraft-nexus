/**
 * SpacetimeDB Bindings Module
 * Syncs TypeScript bindings from GitHub and keeps them up-to-date
 */

import * as fs from "fs";
import * as path from "path";
import * as clack from "@clack/prompts";
import { Module, ModuleResult } from "./base";
import { fetchLatestCommitSHA, downloadGitHubFolder } from "../utils/github";
import type { BindingsMetadata } from "../types";

const GITHUB_REPO = "BitCraftToolBox/BitCraft_Bindings";
const BRANCH_MAP = {
    global: "ts-global",
    regional: "ts-region",
} as const;
const SRC_PATH = "src";
const LOCAL_PATH = "./spacetime_bindings";
const METADATA_FILE = "./.bindings-meta.json";

type BindingType = keyof typeof BRANCH_MAP;

export class SpacetimeBindingsModule extends Module {
    readonly name = "SpacetimeDB Bindings";
    readonly description = "TypeScript bindings for SpacetimeDB";

    async isComplete(): Promise<boolean> {
        // Check if bindings exist
        if (!fs.existsSync(LOCAL_PATH)) {
            return false;
        }

        // Check if metadata exists
        if (!fs.existsSync(METADATA_FILE)) {
            return false;
        }

        try {
            const metadata = this.readMetadata();
            if (!metadata) {
                return false;
            }

            const branch = BRANCH_MAP[metadata.bindingType];

            // Check if local bindings are up-to-date with timeout
            const timeoutPromise = new Promise<string>((_, reject) =>
                setTimeout(
                    () => reject(new Error("GitHub check timeout")),
                    5000
                )
            );

            const shaPromise = fetchLatestCommitSHA(
                GITHUB_REPO,
                branch,
                SRC_PATH
            );

            const latestSHA = (await Promise.race([
                shaPromise,
                timeoutPromise,
            ])) as string;

            return metadata.sha === latestSHA;
        } catch {
            // If we can't check GitHub (network issue, timeout, etc.),
            // assume complete if bindings exist (don't force update on every run)
            return true;
        }
    }

    async run(): Promise<ModuleResult> {
        const spinner = clack.spinner();

        try {
            // Step 1: Determine binding type preference
            let bindingType = this.getConfiguredBindingType();

            if (!bindingType) {
                const selected = await clack.select({
                    message: "Which SpacetimeDB bindings do you need?",
                    options: [
                        {
                            value: "global" as const,
                            label: "Global bindings (recommended)",
                            hint: "For global game data",
                        },
                        {
                            value: "regional" as const,
                            label: "Regional bindings",
                            hint: "For region-specific data",
                        },
                    ],
                    initialValue: "global" as const,
                });

                if (clack.isCancel(selected)) {
                    return {
                        status: "skipped",
                        message: "User cancelled bindings selection",
                    };
                }

                bindingType = selected;
            }

            const branch = BRANCH_MAP[bindingType];

            // Step 2: Get latest commit SHA from GitHub
            spinner.start("Checking for latest bindings...");
            const latestSHA = await fetchLatestCommitSHA(
                GITHUB_REPO,
                branch,
                SRC_PATH
            );

            // Step 3: Check if bindings exist locally
            const bindingsExist = fs.existsSync(LOCAL_PATH);

            if (bindingsExist) {
                const metadata = this.readMetadata();

                if (metadata && metadata.sha === latestSHA) {
                    spinner.stop("SpacetimeDB bindings are up-to-date");
                    return {
                        status: "complete",
                        message: `SpacetimeDB bindings (${bindingType}) are up-to-date`,
                    };
                }

                spinner.stop();
                const shouldUpdate = await clack.confirm({
                    message: "New SpacetimeDB bindings available. Update now?",
                    initialValue: true,
                });

                if (clack.isCancel(shouldUpdate) || !shouldUpdate) {
                    return {
                        status: "skipped",
                        message: "Skipped bindings update",
                    };
                }
            } else {
                // Bindings don't exist, stop spinner before downloading
                spinner.stop();
            }

            // Step 4: Download bindings from GitHub with progress tracking
            clack.log.info(
                `Downloading ${bindingType} SpacetimeDB bindings...`
            );
            let lastProgress = "";

            try {
                await downloadGitHubFolder(
                    GITHUB_REPO,
                    branch,
                    SRC_PATH,
                    LOCAL_PATH,
                    (downloaded, total, file) => {
                        const percentage = Math.round(
                            (downloaded / total) * 100
                        );
                        const barLength = 30;
                        const filled = Math.round(
                            (downloaded / total) * barLength
                        );
                        const bar =
                            "█".repeat(filled) + "░".repeat(barLength - filled);

                        const progress = `\r${bar} ${percentage}% (${downloaded}/${total}) ${file}`;

                        // Only update if progress changed
                        if (progress !== lastProgress) {
                            process.stdout.write("\x1b[K" + progress); // Clear line and write
                            lastProgress = progress;
                        }
                    }
                );

                // Clear the progress line
                process.stdout.write("\r\x1b[K");

                // Step 5: Store metadata for future comparison
                this.writeMetadata({
                    sha: latestSHA,
                    bindingType,
                    lastUpdated: new Date().toISOString(),
                    source: `${GITHUB_REPO}:${branch}/${SRC_PATH}`,
                });

                clack.log.success(
                    `Installed ${bindingType} SpacetimeDB bindings`
                );

                return {
                    status: "complete",
                    message: `Installed ${bindingType} SpacetimeDB bindings (${latestSHA.slice(0, 7)})`,
                };
            } catch (downloadError) {
                process.stdout.write("\r\x1b[K"); // Clear progress line
                throw downloadError;
            }
        } catch (error) {
            spinner.stop();
            throw error;
        }
    }

    /**
     * Get configured binding type from metadata
     */
    private getConfiguredBindingType(): BindingType | null {
        if (!fs.existsSync(METADATA_FILE)) {
            return null;
        }

        try {
            const metadata = this.readMetadata();
            return metadata?.bindingType || null;
        } catch {
            return null;
        }
    }

    /**
     * Read bindings metadata from file
     */
    private readMetadata(): BindingsMetadata | null {
        if (!fs.existsSync(METADATA_FILE)) {
            return null;
        }

        try {
            const content = fs.readFileSync(METADATA_FILE, "utf-8");
            return JSON.parse(content) as BindingsMetadata;
        } catch {
            return null;
        }
    }

    /**
     * Write bindings metadata to file
     */
    private writeMetadata(metadata: BindingsMetadata): void {
        fs.writeFileSync(
            METADATA_FILE,
            JSON.stringify(metadata, null, 2),
            "utf-8"
        );
    }
}

// Allow running this module directly
if (require.main === module) {
    (async () => {
        try {
            const module = new SpacetimeBindingsModule();

            // Force flush any pending operations before exit
            const result = await module.run();
            console.log(result.message);

            // Give a moment for any async cleanup
            await new Promise(resolve => setTimeout(resolve, 100));

            process.exit(result.status === "complete" ? 0 : 1);
        } catch (error) {
            console.error(
                "Error:",
                error instanceof Error ? error.message : String(error)
            );
            process.exit(1);
        }
    })();
}
