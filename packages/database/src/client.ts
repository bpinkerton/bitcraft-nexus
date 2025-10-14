/**
 * Centralized Database Client Configuration
 *
 * This package provides a shared database client that both the web application
 * and Discord bot can use to ensure consistent database access.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection for Drizzle ORM
 *
 * Uses the same DATABASE_URL that Supabase provides, ensuring both
 * Supabase client and Drizzle connect to the exact same database.
 *
 * For local development: postgresql://postgres:postgres@127.0.0.1:54322/postgres
 * For production: Set DATABASE_URL in your deployment environment
 */

const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Create postgres client with optimized settings
const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

// Create drizzle instance with centralized schema
export const db = drizzle(client, { schema });

// Export types for TypeScript inference
export type Db = typeof db;

// Export schema for external use
export { schema };

// Export individual table types
export type {
    User,
    NewUser,
    DiscordUser,
    NewDiscordUser,
    WorkspaceConfig,
    NewWorkspaceConfig,
} from "./schema";
