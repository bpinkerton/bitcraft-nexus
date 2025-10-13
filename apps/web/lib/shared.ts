/**
 * Web App Shared Package Integration
 *
 * This module provides integration with shared packages for the web application.
 */

import {
    cn,
    logger,
    createSuccessResponse,
    createErrorResponse,
} from "@bitcraft/shared";
import { db, schema } from "@bitcraft/database";
import type { User } from "@bitcraft/database";

// Re-export commonly used utilities for convenience
export { cn, logger, createSuccessResponse, createErrorResponse };

// Database utilities specific to web app
export async function getUserProfile(userId: string): Promise<User | null> {
    try {
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, userId));
        return user || null;
    } catch (error) {
        logger.error("Failed to get user profile:", error);
        return null;
    }
}

export async function linkDiscordAccount(
    userId: string,
    discordId: string,
    username: string
) {
    try {
        const discordUser = await db
            .insert(schema.discordUsers)
            .values({
                discordId,
                userId,
                username,
            })
            .returning();

        logger.info(`Linked Discord account ${discordId} to user ${userId}`);
        return createSuccessResponse(discordUser[0]);
    } catch (error) {
        logger.error("Failed to link Discord account:", error);
        return createErrorResponse(
            "DISCORD_LINK_FAILED",
            "Failed to link Discord account"
        );
    }
}

// Import eq from drizzle-orm
import { eq } from "drizzle-orm";
