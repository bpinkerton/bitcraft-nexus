import { logger } from "@bitcraft/shared";
import {Client as DiscordClient, Events, GatewayIntentBits} from "discord.js";
import { handleCommand } from "@/lib/command";

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

DiscordBot.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()) return;
    await handleCommand(interaction);
});

DiscordBot.on(Events.Error, (error) => {
    logger.error("Discord bot error:", error);
});

