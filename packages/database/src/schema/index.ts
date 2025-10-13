/**
 * Centralized Database Schema Package
 *
 * This package contains all database schema definitions using Drizzle ORM.
 * Both the web application and Discord bot will import from this package
 * to ensure schema consistency across all workspaces.
 */

import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
} from "drizzle-orm/pg-core";

// Example tables - replace with your actual schema
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discordUsers = pgTable("discord_users", {
    id: uuid("id").primaryKey().defaultRandom(),
    discordId: text("discord_id").notNull().unique(),
    userId: uuid("user_id").references(() => users.id),
    username: text("username").notNull(),
    discriminator: text("discriminator"),
    avatar: text("avatar"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceConfigs = pgTable("workspace_configs", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceName: text("workspace_name").notNull().unique(),
    configType: text("config_type").notNull(),
    configData: text("config_data").notNull(), // JSON string
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export all tables for easy importing
export const schema = {
    users,
    discordUsers,
    workspaceConfigs,
};

// Export types for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DiscordUser = typeof discordUsers.$inferSelect;
export type NewDiscordUser = typeof discordUsers.$inferInsert;
export type WorkspaceConfig = typeof workspaceConfigs.$inferSelect;
export type NewWorkspaceConfig = typeof workspaceConfigs.$inferInsert;
