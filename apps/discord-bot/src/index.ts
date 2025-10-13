/**
 * Discord Bot Entry Point
 *
 * This is the main entry point for the Discord integration bot.
 * It connects to Discord and handles various bot interactions.
 */

import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "./config/client";
import { logger } from "@bitcraft/shared";
import { handleCommand } from "./commands";

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Bot ready event
client.once(Events.ClientReady, readyClient => {
    logger.info(`Discord bot is ready! Logged in as ${readyClient.user.tag}`);
});

// Command interaction event
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, client);
    }
});

// Error handling
client.on("error", error => {
    logger.error("Discord client error:", error);
});

process.on("unhandledRejection", error => {
    logger.error("Unhandled promise rejection:", error);
});

// Login to Discord
async function startBot() {
    try {
        await client.login(config.token);
    } catch (error) {
        logger.error("Failed to start Discord bot:", error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on("SIGINT", () => {
    logger.info("Shutting down Discord bot...");
    client.destroy();
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info("Shutting down Discord bot...");
    client.destroy();
    process.exit(0);
});

// Start the bot
if (require.main === module) {
    startBot();
}

export { client };
export default client;
