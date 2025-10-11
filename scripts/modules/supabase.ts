/**
 * Supabase Setup Module
 * Ensures Supabase is running locally with correct environment variables
 * Works backwards from failures: tries start → checks Docker → checks init
 */

import * as fs from 'fs';
import * as path from 'path';
import * as clack from '@clack/prompts';
import { Module, ModuleResult } from './base';
import { pnpx, exec } from '../utils/exec';
import { readEnvLocal, updateEnvLocal } from '../utils/env';
import type { SupabaseCredentials } from '../types';

/**
 * Helper function for nested logging with indentation
 */
function logNested(level: number, message: string, symbol: string = '◆') {
    const indent = '  '.repeat(level);
    console.log(`${indent}${symbol}  ${message}`);
}

export class SupabaseModule extends Module {
    readonly name = 'Supabase';
    readonly description = 'Local Supabase instance with PostgreSQL database';

    async isComplete(): Promise<boolean> {
        try {
            // Check 1: Is Supabase running?
            const statusResult = await pnpx('supabase', ['status'], { timeout: 10000 });
            if (statusResult.exitCode !== 0) return false;

            // Check 2: Do credentials match .env.local?
            const credentials = this.parseSupabaseStatus(statusResult.output);
            const envVars = readEnvLocal();
            if (!this.credentialsMatch(credentials, envVars)) return false;

            // Check 3: Are migrations applied?
            const migrationResult = await pnpx('supabase', ['migration', 'list'], { timeout: 5000 });
            if (migrationResult.output.includes('pending')) return false;

            return true;
        } catch {
            return false;
        }
    }

    async run(): Promise<ModuleResult> {
        try {
            // Step 1: Check if Supabase is running
            logNested(0, 'Checking Supabase status...');
            const statusResult = await pnpx('supabase', ['status'], { timeout: 10000 });

            if (statusResult.exitCode === 0) {
                // RUNNING PATH
                logNested(1, 'Supabase is running ✓', '◇');

                // Validate credentials and migrations
                await this.validateAndMigrate(statusResult.output);

                return { status: 'complete', message: 'Supabase configured' };
            }

            // NOT RUNNING - Work backwards
            logNested(1, 'Supabase not running', '⚠');

            // Step 2: Ensure Supabase is running (handles Docker + Init)
            await this.ensureSupabaseRunning();

            // Step 3: Apply migrations
            await this.ensureMigrations();

            // Step 4: Update environment
            await this.updateEnvironment();

            return { status: 'complete', message: 'Supabase setup complete' };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Ensure Supabase is running - works backwards through failure reasons
     */
    private async ensureSupabaseRunning(): Promise<void> {
        logNested(1, 'Starting Supabase...');
        logNested(2, 'Pulling and building Docker images...');

        let startResult = await this.startWithProgress();

        if (startResult.exitCode === 0) {
            logNested(2, 'Supabase started ✓', '◇');
            return;
        }

        // Start failed - work backwards to find why
        logNested(2, 'Start failed, checking prerequisites...', '⚠');

        // Check 1: Is Docker running?
        if (!await this.ensureDockerRunning()) {
            throw new Error('Docker is required but not available');
        }

        // Check 2: Is Supabase initialized?
        if (!await this.isInitialized()) {
            await this.initializeSupabase();
        }

        // Retry start
        logNested(1, 'Retrying Supabase start...');
        logNested(2, 'Pulling and building Docker images...');

        startResult = await this.startWithProgress();

        if (startResult.exitCode !== 0) {
            throw new Error('Failed to start Supabase after initialization');
        }

        logNested(2, 'Supabase started ✓', '◇');
    }

    /**
     * Start Supabase with progress bar tracking Docker image layers
     */
    private async startWithProgress(): Promise<{ exitCode: number; output: string; error?: string }> {
        const { spawn } = await import('child_process');

        return new Promise((resolve) => {
            // Track layer progress
            const layers = new Set<string>();
            const completedLayers = new Set<string>();
            let progressBar: ReturnType<typeof clack.spinner> | null = null;

            // Use pnpm/npm to run supabase
            const isWindows = process.platform === 'win32';

            // On Windows, we need to use cmd.exe to run pnpm
            const command = isWindows ? 'cmd.exe' : 'pnpm';
            const args = isWindows
                ? ['/c', 'pnpm', 'exec', 'supabase', 'start']
                : ['exec', 'supabase', 'start'];

            const supabaseProcess = spawn(command, args, {
                cwd: process.cwd(),
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            // Handle Ctrl+C to kill the child process
            const signalHandler = (signal: string) => {
                if (progressBar) {
                    progressBar.stop();
                }
                supabaseProcess.kill('SIGTERM');

                // Force kill after 2 seconds if still running
                setTimeout(() => {
                    if (!supabaseProcess.killed) {
                        supabaseProcess.kill('SIGKILL');
                    }
                }, 2000);

                resolve({
                    exitCode: 130, // Standard exit code for Ctrl+C
                    output,
                    error: `Process interrupted by ${signal}`
                });
            };

            process.once('SIGINT', () => signalHandler('SIGINT'));
            process.once('SIGTERM', () => signalHandler('SIGTERM'));

            const updateProgress = () => {
                if (layers.size === 0) return;

                // Create a progress bar similar to bindings generation
                const totalBars = 30;
                const percentage = layers.size > 0 ? (completedLayers.size / layers.size) : 0;
                const filledBars = Math.round(totalBars * percentage);
                const emptyBars = totalBars - filledBars;

                const progressBarStr = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
                const percentStr = Math.round(percentage * 100);

                const message = `${progressBarStr} ${percentStr}% (${completedLayers.size}/${layers.size} layers)`;

                if (progressBar) {
                    progressBar.message(message);
                }
            };

            const parseDockerOutput = (data: string) => {
                const lines = data.toString().split('\n');

                for (const line of lines) {
                    // Match layer IDs (e.g., "abc123def456: Pulling fs layer")
                    const layerMatch = line.match(/([a-f0-9]{12}):\s*(Pulling|Waiting|Downloading|Verifying|Download complete|Pull complete|Already exists)/i);

                    if (layerMatch) {
                        const [, layerId, status] = layerMatch;

                        // Add to known layers
                        layers.add(layerId);

                        // Track completed layers
                        if (status.match(/complete|Already exists/i)) {
                            completedLayers.add(layerId);
                        }

                        // Initialize progress bar on first layer
                        if (!progressBar && layers.size > 0) {
                            progressBar = clack.spinner();
                            progressBar.start('Pulling Docker images: 0%');
                        }

                        updateProgress();
                    }
                }
            };

            supabaseProcess.stdout?.on('data', (data) => {
                output += data.toString();
                parseDockerOutput(data.toString());
            });

            supabaseProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
                parseDockerOutput(data.toString());
            });

            supabaseProcess.on('close', (code) => {
                // Clean up
                clearTimeout(timeoutId);
                process.removeListener('SIGINT', signalHandler);
                process.removeListener('SIGTERM', signalHandler);

                if (progressBar) {
                    progressBar.stop();
                }

                resolve({
                    exitCode: code ?? 1,
                    output: output + errorOutput,
                    error: code !== 0 ? errorOutput : undefined
                });
            });

            // Timeout after 5 minutes
            const timeoutId = setTimeout(() => {
                // Remove signal handlers
                process.removeListener('SIGINT', signalHandler);
                process.removeListener('SIGTERM', signalHandler);

                supabaseProcess.kill();
                if (progressBar) {
                    progressBar.stop();
                }
                resolve({
                    exitCode: 1,
                    output,
                    error: 'Timeout: Supabase start took longer than 5 minutes'
                });
            }, 300000);
        });
    }

    /**
     * Ensure Docker daemon is running
     */
    private async ensureDockerRunning(): Promise<boolean> {
        logNested(2, 'Checking Docker daemon...');

        const dockerCheck = await exec('docker', ['info'], { timeout: 5000 });

        if (dockerCheck.exitCode === 0) {
            logNested(3, 'Docker is running ✓', '◇');
            return true;
        }

        // Docker not running - check if installed
        logNested(3, 'Docker daemon not running', '⚠');

        const dockerVersion = await exec('docker', ['--version'], { timeout: 3000 });
        if (dockerVersion.exitCode !== 0) {
            logNested(3, 'Docker not installed', '✗');
            clack.note(
                'Supabase requires Docker Desktop\nDownload: https://www.docker.com/products/docker-desktop',
                'Docker Required'
            );
            return false;
        }

        // Docker installed but not running
        logNested(3, 'Docker is installed but not running');
        clack.note(
            'Please start Docker Desktop and wait for it to be ready',
            'Action Required'
        );

        const shouldWait = await clack.confirm({
            message: 'Wait for Docker to start?',
            initialValue: true
        });

        if (clack.isCancel(shouldWait) || !shouldWait) {
            return false;
        }

        // Poll for Docker to be ready
        return await this.waitForDocker();
    }

    /**
     * Wait for Docker daemon to be ready
     */
    private async waitForDocker(): Promise<boolean> {
        logNested(3, 'Waiting for Docker to start...');

        for (let i = 0; i < 60; i++) { // 2 minutes max
            const result = await exec('docker', ['info'], { timeout: 2000 });

            if (result.exitCode === 0) {
                logNested(4, 'Docker is ready ✓', '◇');
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        logNested(4, 'Docker failed to start in time', '✗');
        return false;
    }

    /**
     * Check if Supabase is initialized
     */
    private async isInitialized(): Promise<boolean> {
        logNested(2, 'Checking if Supabase is initialized...');

        const configExists = fs.existsSync(
            path.join(process.cwd(), 'supabase', 'config.toml')
        );

        if (!configExists) {
            logNested(3, 'Not initialized', '⚠');
            return false;
        }

        logNested(3, 'Already initialized ✓', '◇');
        return true;
    }

    /**
     * Initialize Supabase project
     */
    private async initializeSupabase(): Promise<void> {
        logNested(2, 'Initializing Supabase project...');

        const result = await pnpx('supabase', ['init']);

        if (result.exitCode !== 0) {
            throw new Error(`Supabase init failed: ${result.error}`);
        }

        logNested(3, 'Initialized ✓', '◇');
    }

    /**
     * Ensure migrations are applied
     */
    private async ensureMigrations(): Promise<void> {
        logNested(1, 'Checking migrations...');

        const migrationList = await pnpx('supabase', ['migration', 'list'], { timeout: 10000 });

        // Check if there are pending migrations
        if (!migrationList.output.includes('pending') &&
            !migrationList.output.includes('not applied')) {
            logNested(2, 'No pending migrations ✓', '◇');
            return;
        }

        logNested(2, 'Applying pending migrations...');

        const spinner = clack.spinner();
        spinner.start('Running migrations');

        const pushResult = await pnpx('supabase', ['db', 'push'], {
            timeout: 60000,
            silent: true // Suppress migration output
        });

        spinner.stop();

        if (pushResult.exitCode === 0) {
            logNested(3, 'Migrations applied ✓', '◇');
        } else {
            logNested(3, 'Migration warnings (check manually)', '⚠');
        }
    }

    /**
     * Validate and migrate when Supabase is already running
     */
    private async validateAndMigrate(statusOutput: string): Promise<void> {
        // Check credentials match
        logNested(1, 'Validating credentials...');
        const credentials = this.parseSupabaseStatus(statusOutput);
        const envVars = readEnvLocal();

        if (!this.credentialsMatch(credentials, envVars)) {
            logNested(2, 'Updating .env.local...', '◆');
            await updateEnvLocal({
                NEXT_PUBLIC_SUPABASE_URL: credentials.apiUrl,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: credentials.anonKey,
                ...(credentials.databaseUrl && { DATABASE_URL: credentials.databaseUrl })
            });
            logNested(3, 'Credentials updated ✓', '◇');
        } else {
            logNested(2, 'Credentials match ✓', '◇');
        }

        // Check and apply migrations
        await this.ensureMigrations();
    }

    /**
     * Update environment after fresh start
     */
    private async updateEnvironment(): Promise<void> {
        logNested(1, 'Updating .env.local...');

        // Get fresh status
        const statusResult = await pnpx('supabase', ['status'], { timeout: 10000 });
        const credentials = this.parseSupabaseStatus(statusResult.output);

        await updateEnvLocal({
            NEXT_PUBLIC_SUPABASE_URL: credentials.apiUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: credentials.anonKey,
            ...(credentials.databaseUrl && { DATABASE_URL: credentials.databaseUrl })
        });

        logNested(2, 'Environment configured ✓', '◇');
    }

    /**
     * Parse Supabase credentials from status/start command output
     */
    private parseSupabaseStatus(output: string): SupabaseCredentials {
        const lines = output.split('\n');

        let apiUrl = '';
        let anonKey = '';
        let databaseUrl = '';

        for (const line of lines) {
            const trimmed = line.trim();

            // Look for API URL
            if (trimmed.includes('API URL') || trimmed.includes('api url')) {
                const match = trimmed.match(/https?:\/\/[^\s]+/);
                if (match) apiUrl = match[0];
            }

            // Look for publishable/anon key
            if (trimmed.includes('Publishable key') ||
                trimmed.includes('anon key') ||
                trimmed.includes('ANON_KEY')) {
                const match = trimmed.match(/:\s*(.+)$/);
                if (match) {
                    anonKey = match[1].trim();
                }
            }

            // Look for Database URL
            if (trimmed.includes('Database URL') ||
                trimmed.includes('DB URL') ||
                trimmed.includes('database url')) {
                const match = trimmed.match(/postgresql:\/\/[^\s]+/);
                if (match) databaseUrl = match[0];
            }
        }

        if (!apiUrl || !anonKey) {
            throw new Error('Failed to parse Supabase credentials from output');
        }

        return {
            apiUrl,
            anonKey,
            ...(databaseUrl && { databaseUrl })
        };
    }

    /**
     * Check if environment variables match Supabase credentials
     */
    private credentialsMatch(
        credentials: SupabaseCredentials,
        envVars: Record<string, string | undefined>
    ): boolean {
        return (
            envVars.NEXT_PUBLIC_SUPABASE_URL === credentials.apiUrl &&
            envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === credentials.anonKey
        );
    }
}

// Allow running this module directly
if (require.main === module) {
    (async () => {
        try {
            const module = new SupabaseModule();
            const result = await module.run();
            console.log(result.message);
            process.exit(result.status === 'complete' ? 0 : 1);
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    })();
}
