import { logger } from "@bitcraft/shared";
import {Client as DiscordClient, Events, GatewayIntentBits} from "discord.js";

export const DiscordBot = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

DiscordBot.once(Events.ClientReady, (client) => {
    logger.info(`Discord bot is ready! Logged in as ${client.user.tag}`);
});

DiscordBot.on(Events.Error, (error) => {
    logger.error("Discord bot error:", error);
});

