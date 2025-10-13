import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@bitcraft/database";

/**
 * Database connection for Drizzle ORM
 *
 * Uses the centralized database schema from @bitcraft/database package
 * to ensure consistency across web app and Discord bot.
 *
 * For local development: postgresql://postgres:postgres@127.0.0.1:54322/postgres
 * For production: Set DATABASE_URL in your deployment environment
 */

const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Create postgres client
const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

// Create drizzle instance with centralized schema
export const db = drizzle(client, { schema });

// Export types
export type Db = typeof db;

// Re-export schema types for convenience
export type {
    User,
    NewUser,
    DiscordUser,
    NewDiscordUser,
    WorkspaceConfig,
    NewWorkspaceConfig,
} from "@bitcraft/database";
