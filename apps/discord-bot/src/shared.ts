/**
 * Discord Bot Shared Package Integration
 *
 * This module provides integration with shared packages for the Discord bot.
 */

import {
    logger,
    createSuccessResponse,
    createErrorResponse,
} from "@bitcraft/shared";
import { db, schema } from "@bitcraft/database";
import type { User } from "@bitcraft/database";
import { eq } from "drizzle-orm";

// Re-export commonly used utilities for convenience
export { logger, createSuccessResponse, createErrorResponse };

// Discord-specific utilities
export async function syncDiscordUser(
    discordId: string,
    username: string,
    discriminator?: string
) {
    try {
        // Check if Discord user already exists
        const existingDiscordUser = await db
            .select()
            .from(schema.discordUsers)
            .where(eq(schema.discordUsers.discordId, discordId));

        if (existingDiscordUser.length > 0) {
            // Update existing user
            const [updatedUser] = await db
                .update(schema.discordUsers)
                .set({ username, discriminator, updatedAt: new Date() })
                .where(eq(schema.discordUsers.discordId, discordId))
                .returning();

            logger.info(`Updated Discord user ${discordId}`);
            return createSuccessResponse(updatedUser);
        } else {
            // Create new Discord user
            const [newUser] = await db
                .insert(schema.discordUsers)
                .values({ discordId, username, discriminator })
                .returning();

            logger.info(`Created new Discord user ${discordId}`);
            return createSuccessResponse(newUser);
        }
    } catch (error) {
        logger.error("Failed to sync Discord user:", error);
        return createErrorResponse(
            "DISCORD_SYNC_FAILED",
            "Failed to sync Discord user"
        );
    }
}

export async function getUserByDiscordId(
    discordId: string
): Promise<User | null> {
    try {
        const discordUser = await db
            .select()
            .from(schema.discordUsers)
            .where(eq(schema.discordUsers.discordId, discordId));

        if (discordUser.length === 0) {
            return null;
        }

        const user = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, discordUser[0].userId!));

        return user[0] || null;
    } catch (error) {
        logger.error("Failed to get user by Discord ID:", error);
        return null;
    }
}

export async function createWebAppUser(
    email: string,
    name?: string
): Promise<User | null> {
    try {
        const [user] = await db
            .insert(schema.users)
            .values({ email, name })
            .returning();

        logger.info(`Created web app user ${user.id}`);
        return user;
    } catch (error) {
        logger.error("Failed to create web app user:", error);
        return null;
    }
}
