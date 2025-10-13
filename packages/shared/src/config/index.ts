/**
 * Shared Configuration Utilities
 *
 * Common configuration management utilities used across applications.
 */

export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateConfig<T extends Record<string, unknown>>(
    config: T,
    requiredKeys: (keyof T)[]
): ConfigValidationResult {
    const errors: string[] = [];

    for (const key of requiredKeys) {
        if (!config[key]) {
            errors.push(`Missing required configuration: ${String(key)}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function getConfigValue<T = string>(key: string, defaultValue?: T): T {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return (value as T) || defaultValue!;
}
