/**
 * Shared Utilities Package
 *
 * This package contains common utility functions
 * used across both the web application and Discord bot.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// CSS Class Utilities
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// String Utilities
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + "...";
}

// Date Utilities
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function isToday(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
}

// Object Utilities
export function deepMerge<T extends Record<string, unknown>>(
    target: T,
    source: Partial<T>
): T {
    const result = { ...target };

    for (const key in source) {
        if (source[key] !== undefined) {
            if (
                typeof source[key] === "object" &&
                source[key] !== null &&
                !Array.isArray(source[key])
            ) {
                result[key] = deepMerge(
                    (result[key] as Record<string, unknown>) || {},
                    source[key] as Record<string, unknown>
                ) as T[Extract<keyof T, string>];
            } else {
                result[key] = source[key] as T[Extract<keyof T, string>];
            }
        }
    }

    return result;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}

// Array Utilities
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

export function groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return array.reduce(
        (groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        },
        {} as Record<K, T[]>
    );
}

export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Validation Utilities
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function isValidUuid(uuid: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Error Utilities
export function createErrorResponse(
    code: string,
    message: string,
    details?: unknown
) {
    return {
        success: false as const,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date(),
    };
}

export function createSuccessResponse<T>(data: T) {
    return {
        success: true as const,
        data,
        timestamp: new Date(),
    };
}

// Environment Utilities
export function getEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${name} is required`);
    }
    return value || defaultValue!;
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
    const value = process.env[name];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${name} is required`);
    }
    const parsed = value ? parseInt(value, 10) : defaultValue!;
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
}

// Logging Utilities
export const logger = {
    info: (message: string, ...args: unknown[]) =>
        console.log(`[INFO] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) =>
        console.error(`[ERROR] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) =>
        console.warn(`[WARN] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) =>
        console.debug(`[DEBUG] ${message}`, ...args),
};
