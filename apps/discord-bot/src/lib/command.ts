import { DisplayMessage } from "@/util/embed-utils";
import { getEnvVar, logger } from "@bitcraft/shared";
import { ChatInputCommandInteraction, MessageFlags, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export type CommandBuilder = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type DiscordCommand = {
    data: CommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

let commands: DiscordCommand[] = []

export async function loadCommands() {
    const cmds = await import("@/commands");
    commands = Object.values(cmds) as DiscordCommand[];
    return commands;
}

export async function handleCommand(interaction: ChatInputCommandInteraction) {
	const command = commands.find(
		(c) => c.data.name === interaction.commandName
	);
	if (!command) {
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error("Failed to execute command:\n", error);
        const errorMessage = DisplayMessage("There was an error while executing this command!", 0xff0000);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				components: [errorMessage],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
			});
		} else {
			await interaction.reply({
				components: [errorMessage],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
			});
		}
	}
}

export async function pushCommandsToDiscord() {
	try {
        await loadCommands();
        logger.info(`Loaded ${commands.length} commands`);
		const rest = new REST().setToken(getEnvVar("DISCORD_BOT_TOKEN"));
		const commandJson = commands.map((command) => {
            logger.info(`Registering command: ${command.data.name}`);
            return command.data.toJSON()
        });

		await rest.put(
			Routes.applicationCommands(getEnvVar("DISCORD_CLIENT_ID")),
			{ body: commandJson }
		);
		logger.info("Successfully registered commands");
	} catch (error) {
		logger.error("Failed to register commands:\n", error);
        process.exit(1);
	}
}
