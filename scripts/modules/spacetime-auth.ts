/**
 * SpacetimeDB Auth Module
 * Generates and stores valid SPACETIME_AUTH_TOKEN via BitCraft authentication
 */

import * as clack from '@clack/prompts';
import { Module, ModuleResult } from './base';
import { getEnvVar, updateEnvLocal } from '../utils/env';

const AUTH_API_BASE = 'https://api.bitcraftonline.com/authentication';

export class SpacetimeAuthModule extends Module {
    readonly name = 'SpacetimeDB Auth';
    readonly description = 'Authentication token for SpacetimeDB';
    readonly dependencies = [
        { module: 'SpacetimeDB Bindings', required: false }
    ];

    async isComplete(): Promise<boolean> {
        const token = getEnvVar('SPACETIME_AUTH_TOKEN');

        if (!token) {
            return false;
        }

        return this.validateToken(token);
    }

    async run(): Promise<ModuleResult> {
        const spinner = clack.spinner();

        try {
            // Step 1: Check if token exists and is valid
            const existingToken = getEnvVar('SPACETIME_AUTH_TOKEN');

            if (existingToken) {
                const isValid = this.validateToken(existingToken);

                if (isValid) {
                    return {
                        status: 'complete',
                        message: 'SpacetimeDB auth token is valid'
                    };
                }

                const shouldRegenerate = await clack.confirm({
                    message: 'Existing SpacetimeDB token is invalid. Generate new token?',
                    initialValue: true
                });

                if (clack.isCancel(shouldRegenerate) || !shouldRegenerate) {
                    return {
                        status: 'skipped',
                        message: 'Kept existing token'
                    };
                }
            }

            // Step 2: Display intro
            clack.note(
                'You need a BitCraft account to generate an auth token.\nAn access code will be sent to your email.',
                'SpacetimeDB Authentication'
            );

            // Step 3: Request email
            const email = await clack.text({
                message: 'Enter your BitCraft email:',
                placeholder: 'player@example.com',
                validate: (value) => {
                    if (!value) return 'Email is required';
                    if (!value.includes('@')) return 'Please enter a valid email';
                }
            });

            if (clack.isCancel(email)) {
                return {
                    status: 'skipped',
                    message: 'User cancelled authentication'
                };
            }

            // Step 4: Request access code via email
            spinner.start('Sending access code to your email...');

            const requestResult = await fetch(
                `${AUTH_API_BASE}/request-access-code?email=${encodeURIComponent(email)}`,
                { method: 'POST' }
            );

            if (!requestResult.ok) {
                spinner.stop('Failed to send access code');
                throw new Error(
                    `Failed to request access code: ${requestResult.status} ${requestResult.statusText}`
                );
            }

            spinner.stop('Access code sent! Check your email.');

            // Step 5: Prompt for access code
            const accessCode = await clack.text({
                message: 'Enter the 6-character access code from your email:',
                placeholder: 'ABC123',
                validate: (value) => {
                    if (!value) return 'Access code is required';
                    if (!/^[A-Z0-9]{6}$/i.test(value)) return 'Access code must be 6 alphanumeric characters';
                }
            });

            if (clack.isCancel(accessCode)) {
                return {
                    status: 'skipped',
                    message: 'User cancelled authentication'
                };
            }

            // Step 6: Authenticate and get token
            spinner.start('Authenticating...');

            const authResult = await fetch(
                `${AUTH_API_BASE}/authenticate?email=${encodeURIComponent(email)}&accessCode=${accessCode}`,
                { method: 'POST' }
            );

            if (!authResult.ok) {
                spinner.stop('Authentication failed');

                if (authResult.status === 401 || authResult.status === 403) {
                    throw new Error('Invalid access code. Please try again.');
                }

                throw new Error(
                    `Authentication failed: ${authResult.status} ${authResult.statusText}`
                );
            }

            const authData = await authResult.json();

            // The API returns the token directly as a string, not wrapped in an object
            let token: string;

            if (typeof authData === 'string') {
                // Token returned directly as string
                token = authData;
            } else {
                // Token returned as object - try common field names
                token = authData.token ||
                       authData.authToken ||
                       authData.access_token ||
                       authData.Token ||
                       authData.AccessToken;
            }

            if (!token) {
                spinner.stop('No token received');
                console.error('Full response:', authData);
                throw new Error('No token found in authentication response');
            }

            // Step 7: Store token in .env.local
            await updateEnvLocal({ SPACETIME_AUTH_TOKEN: token });

            spinner.stop('Successfully authenticated!');

            return {
                status: 'complete',
                message: 'Generated and saved SpacetimeDB auth token'
            };

        } catch (error) {
            spinner.stop('Authentication failed');
            throw error;
        }
    }

    /**
     * Validate SpacetimeDB token
     * Checks JWT format and expiration
     */
    private validateToken(token: string): boolean {
        try {
            // Basic JWT structure validation
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // Decode payload
            const payload = JSON.parse(
                Buffer.from(parts[1], 'base64').toString('utf-8')
            );

            // Check expiration if present
            if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp < now) {
                    return false; // Expired
                }
            }

            return true;
        } catch {
            return false; // Invalid JWT format
        }
    }
}

// Allow running this module directly
if (require.main === module) {
    (async () => {
        const module = new SpacetimeAuthModule();
        const result = await module.run();
        console.log(result.message);
        process.exit(result.status === 'complete' ? 0 : 1);
    })();
}
