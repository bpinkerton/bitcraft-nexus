#!/usr/bin/env tsx
/**
 * SpacetimeDB Setup - runs both bindings and auth
 */

import { SpacetimeBindingsModule } from './spacetime-bindings';
import { SpacetimeAuthModule } from './spacetime-auth';

async function main() {
    const bindingsModule = new SpacetimeBindingsModule();
    const authModule = new SpacetimeAuthModule();

    console.log('🔧 Setting up SpacetimeDB...\n');

    // Run bindings first
    try {
        const bindingsResult = await bindingsModule.run();
        console.log(`✓ Bindings: ${bindingsResult.message}\n`);
    } catch (error) {
        console.error('✗ Bindings failed:', error);
        process.exit(1);
    }

    // Then run auth
    try {
        const authResult = await authModule.run();
        console.log(`✓ Auth: ${authResult.message}\n`);
    } catch (error) {
        console.error('✗ Auth failed:', error);
        process.exit(1);
    }

    console.log('✨ SpacetimeDB setup complete!');
}

main().catch(console.error);
