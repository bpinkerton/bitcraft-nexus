/**
 * Shared types for setup scripts
 */

export interface EnvVars {
    [key: string]: string | undefined;
}

export interface SupabaseCredentials {
    apiUrl: string;
    anonKey: string;
    databaseUrl?: string;
}

export interface BindingsMetadata {
    sha: string;
    bindingType: "global" | "regional";
    lastUpdated: string;
    source: string;
}

export interface GitHubFileInfo {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    download_url: string | null;
    type: "file" | "dir";
}

export interface ExecResult {
    exitCode: number;
    output: string;
    error: string;
}
