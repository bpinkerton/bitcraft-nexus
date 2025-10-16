import { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";

export function DisplayMessage(content: string, color: number = 0x0099ff) {
    const container = new ContainerBuilder()
        .setAccentColor(color);
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(content)
    )

        
    return container;
}

export function DisplayMessageWithTitle(title: string, content: string, color: number = 0x0099ff) {
    const displayMessage = DisplayMessage(title, color);
    displayMessage.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );
    displayMessage.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(content)
    )
    return displayMessage;
}