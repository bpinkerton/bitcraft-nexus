#!/usr/bin/env node

/**
 * Modular postinstall setup script
 * 
 * This script orchestrates various setup tasks that run after `pnpm install`.
 * Each setup task is in its own module in the setup/ directory.
 * 
 * To add a new setup task:
 * 1. Create a new file in scripts/setup/ (e.g., database.js)
 * 2. Export an async function that returns true/false for success/failure
 * 3. Add it to the SETUP_TASKS array below
 */

const path = require('path');
const fs = require('fs');

// Import setup modules
const { setupSupabase } = require('./supabase');

// Define setup tasks
const SETUP_TASKS = [
    {
        name: 'Supabase',
        fn: setupSupabase,
        options: { skipIfExists: true },
        required: false, // If true, postinstall will fail if this task fails
    },
    // Add more setup tasks here in the future:
    // {
    //   name: 'Database Migrations',
    //   fn: setupMigrations,
    //   options: {},
    //   required: false,
    // },
    // {
    //   name: 'Environment Variables',
    //   fn: setupEnvVars,
    //   options: {},
    //   required: true,
    // },
];

async function runPostInstall() {
    console.log('🚀 Running post-install setup...\n');
    console.log('━'.repeat(60));
    console.log('\n');

    const results = [];

    for (const task of SETUP_TASKS) {
        console.log(`📋 Task: ${task.name}`);
        console.log('─'.repeat(60));

        try {
            const success = await task.fn(task.options);
            results.push({ name: task.name, success, required: task.required });

            if (!success && task.required) {
                console.error(`\n❌ Required task "${task.name}" failed. Aborting setup.\n`);
                process.exit(1);
            }

            console.log('─'.repeat(60));
            console.log('\n');
        } catch (error) {
            console.error(`\n❌ Error in task "${task.name}":`, error.message);
            results.push({ name: task.name, success: false, required: task.required });

            if (task.required) {
                console.error('\nAborting setup due to required task failure.\n');
                process.exit(1);
            }

            console.log('─'.repeat(60));
            console.log('\n');
        }
    }

    // Print summary
    console.log('━'.repeat(60));
    console.log('📊 Setup Summary\n');

    let allSuccessful = true;
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const label = result.required ? '[REQUIRED]' : '[OPTIONAL]';
        console.log(`${icon} ${result.name} ${label}`);
        if (!result.success) allSuccessful = false;
    });

    console.log('\n━'.repeat(60));

    if (allSuccessful) {
        console.log('\n🎉 All setup tasks completed successfully!\n');
        console.log('💡 Next steps:');
        console.log('   pnpm dev - Start the development server\n');
    } else {
        console.log('\n⚠️  Some optional tasks failed. You can run them manually:');
        results
            .filter(r => !r.success && !r.required)
            .forEach(r => {
                const scriptName = r.name.toLowerCase().replace(/\s+/g, '-');
                console.log(`   pnpm run setup:${scriptName}`);
            });
        console.log();
    }
}

// Run if called directly
if (require.main === module) {
    runPostInstall().catch(error => {
        console.error('Fatal error during postinstall:', error);
        process.exit(1);
    });
}

module.exports = { runPostInstall };

