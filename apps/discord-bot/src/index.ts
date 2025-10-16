/**
 * Discord Bot Entry Point
 *
 * This is the main entry point for the Discord integration bot.
 * It connects to Discord and handles various bot interactions.
 */

import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config({
    path: "./.env.local"
});

import { DiscordBot } from "@/lib/discord";
import { getEnvVar, logger } from "@bitcraft/shared";
import { initializeSpacetime } from "@/lib/spacetime";
import { startLinkListener } from "./link-listener";
import { loadCommands, pushCommandsToDiscord } from "./lib/command";

// Suppress SpacetimeDB deserialize error messages
const originalDebug = console.debug;
console.debug = (...args: unknown[]) => {
    // Filter out the specific SpacetimeDB deserialize error message
    if (args[0] === "Failed to deserialize reducer arguments") {
        return;
    }
    originalDebug.apply(console, args);
};


process.on("unhandledRejection", error => {
    logger.error("Unhandled promise rejection:", error);
});

process.on("SIGINT", () => {
    logger.info("Shutting down Discord bot...");
    DiscordBot.destroy();
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info("Shutting down Discord bot...");
    DiscordBot.destroy();
    process.exit(0);
});

// Login to Discord
async function startBot() {
    try {
        await loadCommands();
        await DiscordBot.login(getEnvVar("DISCORD_BOT_TOKEN"));

        await initializeSpacetime();
        startLinkListener();
    } catch (error) {
        logger.error("Failed to start Discord bot:", error);
        process.exit(1);
    }
}

// Start the bot
if (require.main === module) {
    // If the --push flag is present, push the known commands to the Discord bot
    if(process.argv.includes("--push")) {
        pushCommandsToDiscord();
    }else{
        startBot();
    }
}

