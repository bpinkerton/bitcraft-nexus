/**
 * Discord Bot Deployment Configuration
 *
 * Configuration for deploying the Discord bot independently.
 */

export const discordBotConfig = {
    // Build Configuration
    build: {
        command: "pnpm --filter discord-bot build",
        outputDir: "apps/discord-bot/dist",
        entryPoint: "apps/discord-bot/dist/index.js",
    },

    // Environment Configuration
    environments: {
        development: {
            NODE_ENV: "development",
            DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
            DATABASE_URL:
                "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
            LOG_LEVEL: "debug",
        },
        staging: {
            NODE_ENV: "staging",
            DISCORD_BOT_TOKEN: process.env.STAGING_DISCORD_BOT_TOKEN,
            DATABASE_URL: process.env.STAGING_DATABASE_URL,
            LOG_LEVEL: "info",
        },
        production: {
            NODE_ENV: "production",
            DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
            DATABASE_URL: process.env.DATABASE_URL,
            LOG_LEVEL: "warn",
        },
    },

    // Health Check Configuration
    healthCheck: {
        enabled: true,
        interval: 60000, // Check every minute
        timeout: 10000,
        retries: 3,
    },

    // Monitoring Configuration
    monitoring: {
        enabled: true,
        metrics: {
            commandExecutions: true,
            errorRates: true,
            responseTimes: true,
        },
        alerts: {
            discordConnectionLost: true,
            highErrorRate: true,
            memoryUsage: true,
        },
    },

    // Deployment Strategy
    deployment: {
        strategy: "blue-green",
        maxInstances: 2,
        minInstances: 1,
        scaling: {
            cpuThreshold: 60,
            memoryThreshold: 70,
        },
        restartPolicy: {
            maxRestarts: 5,
            restartDelay: 30000,
        },
    },

    // Discord Bot Specific Configuration
    bot: {
        reconnectAttempts: 5,
        reconnectDelay: 5000,
        commandCooldown: 1000,
        maxConcurrentCommands: 10,
    },
};

export default discordBotConfig;
