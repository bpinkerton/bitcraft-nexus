/**
 * Discord Bot Client Configuration
 *
 * Configuration for the Discord.js client and bot settings.
 */

import { getEnvVar } from "@bitcraft/shared";

export const config = {
    // Discord Bot Configuration
    token: getEnvVar("DISCORD_BOT_TOKEN"),
    clientId: getEnvVar("DISCORD_CLIENT_ID"),
    clientSecret: getEnvVar("DISCORD_CLIENT_SECRET"),

    // Bot Settings
    prefix: process.env.DISCORD_PREFIX || "!",
    ownerIds: process.env.DISCORD_OWNER_IDS?.split(",") || [],

    // Webhook Configuration
    webhookSecret: getEnvVar("DISCORD_WEBHOOK_SECRET", ""),

    // Database Configuration
    databaseUrl: getEnvVar("DATABASE_URL"),

    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || "info",

    // Development Settings
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
} as const;

// Validate required configuration
export function validateConfig() {
    const required = ["token", "clientId", "databaseUrl"];
    const missing = required.filter(key => !config[key as keyof typeof config]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required configuration: ${missing.join(", ")}`
        );
    }
}
