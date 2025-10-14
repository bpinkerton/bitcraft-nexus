/**
 * Discord Bot Database Integration
 *
 * This module provides database access for the Discord bot using
 * the centralized database package to ensure consistency with the web app.
 */

import { db, schema } from "@bitcraft/database";
import { eq, and } from "drizzle-orm";
import type {
    User,
    NewUser,
    DiscordUser,
    NewDiscordUser,
} from "@bitcraft/database";

// User Management
export async function createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
}

export async function getUserById(id: string): Promise<User | null> {
    const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
    return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));
    return user || null;
}

export async function updateUser(
    id: string,
    userData: Partial<NewUser>
): Promise<User | null> {
    const [user] = await db
        .update(schema.users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
    return user || null;
}

// Discord User Management
export async function createDiscordUser(
    discordUserData: NewDiscordUser
): Promise<DiscordUser> {
    const [discordUser] = await db
        .insert(schema.discordUsers)
        .values(discordUserData)
        .returning();
    return discordUser;
}

export async function getDiscordUserByDiscordId(
    discordId: string
): Promise<DiscordUser | null> {
    const [discordUser] = await db
        .select()
        .from(schema.discordUsers)
        .where(eq(schema.discordUsers.discordId, discordId));
    return discordUser || null;
}

export async function getDiscordUserByUserId(
    userId: string
): Promise<DiscordUser | null> {
    const [discordUser] = await db
        .select()
        .from(schema.discordUsers)
        .where(eq(schema.discordUsers.userId, userId));
    return discordUser || null;
}

export async function updateDiscordUser(
    discordId: string,
    discordUserData: Partial<NewDiscordUser>
): Promise<DiscordUser | null> {
    const [discordUser] = await db
        .update(schema.discordUsers)
        .set({ ...discordUserData, updatedAt: new Date() })
        .where(eq(schema.discordUsers.discordId, discordId))
        .returning();
    return discordUser || null;
}

// Workspace Configuration Management
export async function getWorkspaceConfig(
    workspaceName: string,
    configType: string
) {
    const [config] = await db
        .select()
        .from(schema.workspaceConfigs)
        .where(
            and(
                eq(schema.workspaceConfigs.workspaceName, workspaceName),
                eq(schema.workspaceConfigs.configType, configType),
                eq(schema.workspaceConfigs.isActive, true)
            )
        );
    return config || null;
}

export async function setWorkspaceConfig(
    workspaceName: string,
    configType: string,
    configData: string
) {
    const [config] = await db
        .insert(schema.workspaceConfigs)
        .values({
            workspaceName,
            configType,
            configData,
            isActive: true,
        })
        .returning();
    return config;
}

// Export database instance for direct access if needed
export { db, schema };
