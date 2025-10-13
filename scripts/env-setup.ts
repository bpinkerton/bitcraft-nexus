#!/usr/bin/env tsx
/**
 * Environment setup orchestrator
 * Runs interactive setup modules for BitCraft Nexus development environment
 */

import * as clack from "@clack/prompts";
import { GitHooksModule } from "./modules/git-hooks";
import { SupabaseModule } from "./modules/supabase";
import { SpacetimeBindingsModule } from "./modules/spacetime-bindings";
import { SpacetimeAuthModule } from "./modules/spacetime-auth";
import type { Module } from "./modules/base";

async function main() {
    // Skip in CI environments
    if (process.env.CI === "true") {
        return;
    }

    console.clear();
    clack.intro("🚀 BitCraft Nexus Setup");

    // Initialize modules in dependency order
    const modules: Module[] = [
        new GitHooksModule(),
        new SupabaseModule(),
        new SpacetimeBindingsModule(),
        new SpacetimeAuthModule(),
    ];

    try {
        // Check status of all modules with real-time feedback
        const statuses = [];

        for (const module of modules) {
            try {
                // Add 10 second timeout per module check
                const timeoutPromise = new Promise<boolean>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 10000)
                );

                const checkPromise = module.isComplete();
                const complete = (await Promise.race([
                    checkPromise,
                    timeoutPromise,
                ])) as boolean;

                // Show status immediately
                if (complete) {
                    clack.log.success(`${module.name}`);
                } else {
                    clack.log.info(`${module.name} - needs setup`);
                }

                statuses.push({ module, complete });
            } catch (error) {
                // If check times out or fails, assume incomplete
                clack.log.warn(`${module.name} - check failed, will setup`);
                statuses.push({ module, complete: false });
            }
        }

        console.log(""); // Add spacing after status checks

        // Check if we need to run any modules
        const incomplete = statuses.filter(s => !s.complete);

        if (incomplete.length === 0) {
            clack.outro("✨ All modules configured!");
            process.exit(0);
        }

        // Run all incomplete modules sequentially
        for (const { module } of incomplete) {
            try {
                console.log(""); // Add spacing
                clack.log.step(`Setting up ${module.name}...`);

                const result = await module.run();

                if (result.status === "complete") {
                    clack.log.success(result.message);
                } else if (result.status === "skipped") {
                    clack.log.warn(result.message);
                } else {
                    clack.log.error(result.message);
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                clack.log.error(`${module.name} failed: ${errorMessage}`);

                const shouldContinue = await clack.confirm({
                    message: "Continue with remaining modules?",
                    initialValue: true,
                });

                if (clack.isCancel(shouldContinue) || !shouldContinue) {
                    clack.cancel("Setup cancelled");
                    process.exit(1);
                }
            }
        }

        // Final summary
        console.log(""); // Add spacing
        clack.outro("✨ Setup complete! Run `pnpm dev` to start developing.");
        process.exit(0);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        clack.log.error(`Setup failed: ${errorMessage}`);
        clack.outro("Setup failed");
        process.exit(1);
    }
}

// Export for programmatic use
export default main;

// Run main function if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error("Unexpected error:", error);
        process.exit(1);
    });
}
