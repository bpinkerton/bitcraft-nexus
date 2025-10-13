/**
 * Discord Bot Command Management System
 *
 * Manages Discord slash commands and their handlers.
 */

import { SlashCommandBuilder, Client, ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from "discord.js";
import { logger } from "@bitcraft/shared";

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}

// Ping Command
export const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    async execute(interaction: ChatInputCommandInteraction) {
        const sent = await interaction.reply({
            content: "Pinging...",
            fetchReply: true,
        });

        const roundtripLatency =
            sent.createdTimestamp - interaction.createdTimestamp;
        const websocketHeartbeat = interaction.client.ws.ping;

        await interaction.editReply(
            `🏓 Pong! Roundtrip latency: ${roundtripLatency}ms | WebSocket heartbeat: ${websocketHeartbeat}ms`
        );

        logger.info(`Ping command executed by ${interaction.user.tag}`);
    },
};

// User Info Command
export const userInfoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Get information about a user")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to get information about")
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = interaction.guild?.members.cache.get(user.id);

        const embed = {
            color: 0x0099ff,
            title: `User Information: ${user.username}`,
            thumbnail: { url: user.displayAvatarURL() },
            fields: [
                { name: "Username", value: user.username, inline: true },
                {
                    name: "Discriminator",
                    value: user.discriminator,
                    inline: true,
                },
                { name: "ID", value: user.id, inline: true },
                {
                    name: "Created",
                    value: user.createdAt.toDateString(),
                    inline: true,
                },
                { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
            ],
            timestamp: new Date().toISOString(),
        };

        if (member) {
            embed.fields.push(
                {
                    name: "Joined Server",
                    value: member.joinedAt?.toDateString() || "Unknown",
                    inline: true,
                },
                {
                    name: "Roles",
                    value: member.roles.cache.size.toString(),
                    inline: true,
                }
            );
        }

        await interaction.reply({ embeds: [embed] });
        logger.info(
            `User info command executed by ${interaction.user.tag} for user ${user.username}`
        );
    },
};

// Workspace Status Command
export const workspaceStatusCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("workspace-status")
        .setDescription("Get status of all workspaces in the monorepo"),

    async execute(interaction: ChatInputCommandInteraction) {
        const workspaces = [
            {
                name: "Web App",
                status: "🟢 Active",
                lastDeployed: "2 hours ago",
            },
            {
                name: "Discord Bot",
                status: "🟢 Active",
                lastDeployed: "1 hour ago",
            },
            {
                name: "Shared Package",
                status: "🟢 Active",
                lastDeployed: "3 hours ago",
            },
            {
                name: "Database Package",
                status: "🟢 Active",
                lastDeployed: "3 hours ago",
            },
        ];

        const embed = {
            color: 0x00ff00,
            title: "🏗️ Workspace Status",
            description: "Current status of all monorepo workspaces",
            fields: workspaces.map(ws => ({
                name: ws.name,
                value: `${ws.status}\nLast deployed: ${ws.lastDeployed}`,
                inline: true,
            })),
            timestamp: new Date().toISOString(),
        };

        await interaction.reply({ embeds: [embed] });
        logger.info(
            `Workspace status command executed by ${interaction.user.tag}`
        );
    },
};

// Command Registry
export const commands: Command[] = [
    pingCommand,
    userInfoCommand,
    workspaceStatusCommand,
];

// Command Handler
export async function handleCommand(
    interaction: ChatInputCommandInteraction,
    client: Client
) {
    const command = commands.find(
        cmd => cmd.data.name === interaction.commandName
    );

    if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        await interaction.reply({
            content: "❌ Unknown command!",
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        logger.error(
            `Error executing command ${interaction.commandName}:`,
            error
        );

        const errorMessage = {
            content: "❌ There was an error while executing this command!",
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
}

const commandsModule = { commands, handleCommand };

export default commandsModule;
