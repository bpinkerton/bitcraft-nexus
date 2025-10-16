import { DiscordCommand } from "@/lib/command";
import { DisplayMessageWithTitle } from "@/util/embed-utils";
import { db, LinkCode, schema } from "@bitcraft/database";
import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

const activeLinkCodes = new Map<string, LinkCode>();

//Generate a random 6 digit code
function generateLinkCode(){
    //generate each digit as a random number between 0 and 9
    const code = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
    return code.join("");
}

async function LinkAccount(interaction: ChatInputCommandInteraction){
    const userId = interaction.user.id;

    if(activeLinkCodes.has(userId)) {
        const linkCode = activeLinkCodes.get(userId);
        if(linkCode) {
            await interaction.reply({
                components: [DisplayMessageWithTitle("You already have a link code active", `Your link code is ${linkCode.code} and expires at ${new Date(linkCode.expiresAt).toLocaleString()}`, 0xffff00)],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
            return;
        }
    }

    const linkCode = await db.insert(schema.linkCodes).values({
        code: generateLinkCode(),
        discordId: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
    }).returning();

    if(!linkCode) {
        await interaction.reply({
            components: [DisplayMessageWithTitle("Failed to generate link code", "Please try again later", 0xffff00)],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        return;
    }

    activeLinkCodes.set(userId, linkCode[0]);

    await interaction.reply({
        components: [DisplayMessageWithTitle("Link code generated", `Your link code is ${linkCode[0].code} and expires at ${new Date(linkCode[0].expiresAt).toLocaleString()}`, 0xffff00)],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Discord account to your BitCraft account"),
    execute: LinkAccount
} satisfies DiscordCommand;