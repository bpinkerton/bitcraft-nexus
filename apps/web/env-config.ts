/**
 * Environment Configuration Templates
 *
 * These templates show the required environment variables for each deployment environment.
 */

export const webAppEnvConfig = {
    development: {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        SUPABASE_URL: "your_supabase_url_here",
        SUPABASE_ANON_KEY: "your_supabase_anon_key_here",
        SUPABASE_SERVICE_ROLE_KEY: "your_supabase_service_role_key_here",
        NEXT_PUBLIC_SUPABASE_URL: "your_supabase_url_here",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "your_supabase_anon_key_here",
        PORT: 3000,
        LOG_LEVEL: "debug",
    },
    staging: {
        NODE_ENV: "staging",
        DATABASE_URL: "${STAGING_DATABASE_URL}",
        SUPABASE_URL: "${STAGING_SUPABASE_URL}",
        SUPABASE_ANON_KEY: "${STAGING_SUPABASE_ANON_KEY}",
        SUPABASE_SERVICE_ROLE_KEY: "${STAGING_SUPABASE_SERVICE_ROLE_KEY}",
        NEXT_PUBLIC_SUPABASE_URL: "${STAGING_SUPABASE_URL}",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "${STAGING_SUPABASE_ANON_KEY}",
        PORT: "${PORT:-3000}",
        LOG_LEVEL: "info",
    },
    production: {
        NODE_ENV: "production",
        DATABASE_URL: "${DATABASE_URL}",
        SUPABASE_URL: "${SUPABASE_URL}",
        SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
        SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}",
        NEXT_PUBLIC_SUPABASE_URL: "${SUPABASE_URL}",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
        PORT: "${PORT:-3000}",
        HOSTNAME: "${HOSTNAME:-0.0.0.0}",
        NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}",
        NEXTAUTH_URL: "${NEXTAUTH_URL}",
        LOG_LEVEL: "info",
        ENABLE_METRICS: "true",
    },
};

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

export default { webAppEnvConfig, discordBotEnvConfig };
