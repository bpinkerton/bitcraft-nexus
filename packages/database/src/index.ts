/**
 * Database Package Main Export
 *
 * This is the main entry point for the @bitcraft/database package.
 * It exports the database client, schema, and types.
 */

// Export database client
export { db, type Db } from "./client";

// Export schema and types
export { schema } from "./client";
export * from "./schema";
