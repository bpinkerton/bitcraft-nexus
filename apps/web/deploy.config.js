/**
 * Web Application Deployment Configuration
 *
 * Configuration for deploying the web application independently.
 */

export const webAppConfig = {
    // Build Configuration
    build: {
        command: "pnpm --filter web build",
        outputDir: "apps/web/.next",
        staticDir: "apps/web/public",
    },

    // Environment Configuration
    environments: {
        development: {
            NODE_ENV: "development",
            PORT: 3000,
            DATABASE_URL:
                "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
        staging: {
            NODE_ENV: "staging",
            PORT: 3000,
            DATABASE_URL: process.env.STAGING_DATABASE_URL,
        },
        production: {
            NODE_ENV: "production",
            PORT: process.env.PORT || 3000,
            DATABASE_URL: process.env.DATABASE_URL,
        },
    },

    // Health Check Configuration
    healthCheck: {
        endpoint: "/api/health",
        timeout: 5000,
        interval: 30000,
    },

    // Monitoring Configuration
    monitoring: {
        enabled: true,
        metricsEndpoint: "/api/metrics",
        logLevel: "info",
    },

    // Deployment Strategy
    deployment: {
        strategy: "rolling",
        maxInstances: 3,
        minInstances: 1,
        scaling: {
            cpuThreshold: 70,
            memoryThreshold: 80,
        },
    },
};

export default webAppConfig;
