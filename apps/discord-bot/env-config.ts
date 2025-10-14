/**
 * Environment Configuration Templates
 *
 * These templates show the required environment variables for each deployment environment.
 */

export const discordBotEnvConfig = {
    development: {
        NODE_ENV: "development",
        DISCORD_BOT_TOKEN: "your_discord_bot_token_here",
        DISCORD_CLIENT_ID: "your_discord_client_id_here",
        DISCORD_CLIENT_SECRET: "your_discord_client_secret_here",
        DISCORD_WEBHOOK_SECRET: "your_webhook_secret_here",
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        LOG_LEVEL: "debug",
    },
    staging: {
        NODE_ENV: "staging",
        DISCORD_BOT_TOKEN: "${STAGING_DISCORD_BOT_TOKEN}",
        DISCORD_CLIENT_ID: "${STAGING_DISCORD_CLIENT_ID}",
        DISCORD_CLIENT_SECRET: "${STAGING_DISCORD_CLIENT_SECRET}",
        DISCORD_WEBHOOK_SECRET: "${STAGING_DISCORD_WEBHOOK_SECRET}",
        DATABASE_URL: "${STAGING_DATABASE_URL}",
        LOG_LEVEL: "info",
    },
    production: {
        NODE_ENV: "production",
        DISCORD_BOT_TOKEN: "${DISCORD_BOT_TOKEN}",
        DISCORD_CLIENT_ID: "${DISCORD_CLIENT_ID}",
        DISCORD_CLIENT_SECRET: "${DISCORD_CLIENT_SECRET}",
        DISCORD_WEBHOOK_SECRET: "${DISCORD_WEBHOOK_SECRET}",
        DATABASE_URL: "${DATABASE_URL}",
        LOG_LEVEL: "warn",
        ENABLE_METRICS: "true",
        ENABLE_HEALTH_CHECKS: "true",
    },
};

export default discordBotEnvConfig;
