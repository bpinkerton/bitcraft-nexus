/**
 * Shared Types Package
 *
 * This package contains common TypeScript types and interfaces
 * used across both the web application and Discord bot.
 */

// Workspace Management Types
export interface Workspace {
    name: string;
    type: "app" | "package";
    path: string;
    status: "active" | "inactive" | "building" | "deploying";
    lastBuilt?: Date;
    dependencies: string[];
}

export interface BuildConfiguration {
    workspaceId: string;
    buildCommand: string;
    testCommand: string;
    deployCommand: string;
    environment: Record<string, string>;
    dependencies: string[];
}

export interface SharedPackage {
    name: string;
    version: string;
    type: "utility" | "config" | "types" | "database";
    usedBy: string[]; // workspace names
    lastUpdated: Date;
}

// Discord Integration Types
export interface DiscordCommand {
    name: string;
    description: string;
    type: "slash" | "message" | "user" | "message";
    options?: CommandOption[];
    enabled: boolean;
}

export interface CommandOption {
    name: string;
    description: string;
    type: "string" | "integer" | "boolean" | "user" | "channel";
    required?: boolean;
    choices?: { name: string; value: string | number | boolean }[];
}

export interface DiscordWebhookRequest {
    type: "interaction" | "message" | "command";
    data: Record<string, unknown>; // Discord API payload
    signature: string;
    timestamp: string;
}

export interface DiscordWebhookResponse {
    success: boolean;
    response?: Record<string, unknown>; // Discord API response
    error?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Build and Deployment Types
export interface BuildLog {
    id: string;
    workspace: string;
    status: "success" | "failed" | "building";
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    logs: string[];
    error?: string;
}

export interface DeployRequest {
    environment: "development" | "staging" | "production";
    force?: boolean;
}

export interface DeployResponse {
    deploymentId: string;
    status: "started" | "deploying" | "success" | "failed";
    url?: string;
    logs: string[];
    error?: string;
}

// Environment Configuration Types
export interface EnvironmentConfig {
    NODE_ENV: "development" | "staging" | "production";
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    DISCORD_BOT_TOKEN?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    DISCORD_WEBHOOK_SECRET?: string;
}

// Utility Types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
