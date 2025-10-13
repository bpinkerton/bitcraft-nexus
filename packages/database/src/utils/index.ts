/**
 * Shared Database Utilities
 *
 * Common database utility functions used across both web application and Discord bot.
 */

import { db, schema } from "../client";
import { eq, and, desc } from "drizzle-orm";
import type {
    User,
    NewUser,
    DiscordUser,
    NewDiscordUser,
    WorkspaceConfig,
} from "../schema";

// User Management Utilities
export async function findUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));
    return user || null;
}

export async function findUserById(id: string): Promise<User | null> {
    const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
    return user || null;
}

export async function createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
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

// Discord User Management Utilities
export async function findDiscordUserByDiscordId(
    discordId: string
): Promise<DiscordUser | null> {
    const [discordUser] = await db
        .select()
        .from(schema.discordUsers)
        .where(eq(schema.discordUsers.discordId, discordId));
    return discordUser || null;
}

export async function findDiscordUserByUserId(
    userId: string
): Promise<DiscordUser | null> {
    const [discordUser] = await db
        .select()
        .from(schema.discordUsers)
        .where(eq(schema.discordUsers.userId, userId));
    return discordUser || null;
}

export async function createDiscordUser(
    discordUserData: NewDiscordUser
): Promise<DiscordUser> {
    const [discordUser] = await db
        .insert(schema.discordUsers)
        .values(discordUserData)
        .returning();
    return discordUser;
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

// Workspace Configuration Utilities
export async function getWorkspaceConfig(
    workspaceName: string,
    configType: string
): Promise<WorkspaceConfig | null> {
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
): Promise<WorkspaceConfig> {
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

export async function getAllWorkspaceConfigs(
    workspaceName: string
): Promise<WorkspaceConfig[]> {
    return await db
        .select()
        .from(schema.workspaceConfigs)
        .where(
            and(
                eq(schema.workspaceConfigs.workspaceName, workspaceName),
                eq(schema.workspaceConfigs.isActive, true)
            )
        )
        .orderBy(desc(schema.workspaceConfigs.createdAt));
}

// Database Health Check
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await db.select().from(schema.users).limit(1);
        return true;
    } catch {
        return false;
    }
}

// Transaction Utilities
export async function withTransaction<T>(
    callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
    return await db.transaction(callback);
}
