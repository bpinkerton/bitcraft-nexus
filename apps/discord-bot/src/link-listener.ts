import { applySubscription, spacetime } from "@/lib/spacetime";
import { db, schema } from "@bitcraft/database";
import { logger } from "@bitcraft/shared";
import { eq } from "drizzle-orm";
import { DiscordBot } from "@/lib/discord";

export function startLinkListener() {
    const codeRegex = /^BN(\d{6})$/;

    const st = spacetime();

    const subscription = applySubscription(
        "SELECT * FROM chat_message_state",
        () => {
            const startTime = Date.now() / 1000;
            st.db.chatMessageState.onInsert(async (ctx, chatMessage) => {
                if (
                    chatMessage.channelId !== 2 ||
                    chatMessage.timestamp < startTime
                )
                    return;

                const codeMatch = chatMessage.text.match(codeRegex);
                if (codeMatch) {
                    const code = codeMatch[1];
                    logger.info(`Auth Code Submitted: ${code}`);

                    const linkCodeResult = await db
                        .select()
                        .from(schema.linkCodes)
                        .where(eq(schema.linkCodes.code, code));
                    const linkCode = linkCodeResult?.[0];
                    if (linkCode) {
                        const subscription = applySubscription(
                            `SELECT * FROM player_username_state WHERE username = '${chatMessage.username}'`,
                            async () => {
                                const userNameState =
                                    st.db.playerUsernameState.username.find(
                                        chatMessage.username
                                    );
                                subscription.unsubscribe();
                                if (!userNameState) {
                                    logger.warn(
                                        `Player Username State Not Found: ${chatMessage.username}`
                                    );
                                    return;
                                }

                                await db
                                    .delete(schema.linkCodes)
                                    .where(eq(schema.linkCodes.code, code));
                                await db.insert(schema.linkedUsers).values({
                                    userId: userNameState.entityId,
                                    discordId: linkCode.discordId,
                                    linkedAt: new Date(),
                                });

                                DiscordBot.users
                                    .fetch(linkCode.discordId)
                                    .then(user => {
                                        if (user) {
                                            user.send(
                                                `You have been linked to your BitCraft account. Your username is ${chatMessage.username}`
                                            );
                                        } else {
                                            logger.warn(
                                                `User Not Found: ${linkCode.discordId}`
                                            );
                                        }
                                    });
                            }
                        );
                    }
                }
            });
        }
    );

    return subscription;
}
