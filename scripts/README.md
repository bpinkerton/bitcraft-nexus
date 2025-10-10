# Scripts Directory

This directory contains automation scripts for project setup and maintenance.

## Directory Structure

```
scripts/
├── setup/              # Modular setup scripts
│   ├── index.js       # Main postinstall orchestrator
│   └── supabase.js    # Supabase setup module
└── README.md          # This file
```

## Setup Scripts

### Postinstall (`setup/index.js`)

The main postinstall script that runs automatically after `pnpm install`. It orchestrates all setup tasks in a modular way.

**Features:**

- Runs multiple setup tasks sequentially
- Each task can be marked as required or optional
- Provides a summary of all tasks at the end
- Gracefully handles failures

**Adding a new setup task:**

1. Create a new file in `scripts/setup/` (e.g., `database.js`)
2. Export an async function that returns `true` for success, `false` for failure:

```javascript
#!/usr/bin/env node

async function setupDatabase(options = {}) {
    console.log("🗄️  Setting up database...\n");

    try {
        // Your setup logic here
        console.log("✅ Database setup complete\n");
        return true;
    } catch (error) {
        console.error("❌ Database setup failed:", error.message);
        return false;
    }
}

// Allow running directly
if (require.main === module) {
    setupDatabase()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error("Error:", error);
            process.exit(1);
        });
}

module.exports = { setupDatabase };
```

3. Add it to the `SETUP_TASKS` array in `setup/index.js`:

```javascript
const { setupDatabase } = require("./database");

const SETUP_TASKS = [
    // ... existing tasks
    {
        name: "Database",
        fn: setupDatabase,
        options: {},
        required: false, // Set to true if this task must succeed
    },
];
```

4. Add a corresponding npm script in `package.json`:

```json
{
    "scripts": {
        "setup:database": "node scripts/setup/database.js"
    }
}
```

## Available Setup Modules

### Supabase (`setup/supabase.js`)

Sets up Supabase local development environment.

**What it does:**

1. Checks if `.env.local` already exists (skips if found)
2. Initializes Supabase if not already initialized
3. Starts Supabase local containers
4. Extracts API URL and anon key from output
5. Creates/updates `.env.local` with credentials

**Options:**

- `skipIfExists` (default: `true`) - Skip if `.env.local` exists
- `force` (default: `false`) - Force setup even if configured

**Run manually:**

```bash
pnpm run setup:supabase          # Normal setup
node scripts/setup/supabase.js   # Direct execution
```

**Run with force:**

```bash
node scripts/setup/supabase.js --force
```

## Environment Variables

Setup scripts may create or modify `.env.local`. This file is gitignored and contains:

- Supabase credentials (API URL, anon key)
- Any other local development secrets

## CI/CD Considerations

In CI/CD environments, you may want to skip certain setup tasks. You can do this by:

1. Setting environment variables to skip tasks
2. Modifying the postinstall script to detect CI environment
3. Using `--ignore-scripts` flag during `pnpm install` in CI

Example:

```bash
# Skip postinstall in CI
CI=true pnpm install --ignore-scripts
```

## Troubleshooting

### Postinstall fails

If postinstall fails, you can:

1. Run individual setup tasks manually:

    ```bash
    pnpm run setup:supabase
    ```

2. Skip postinstall and run it later:

    ```bash
    pnpm install --ignore-scripts
    pnpm run postinstall
    ```

3. Check the logs for which task failed and run it directly:
    ```bash
    node scripts/setup/supabase.js
    ```

### Reset everything

To reset your local setup:

1. Delete `.env.local`
2. Stop Supabase: `pnpm supabase:stop`
3. Run postinstall: `node scripts/setup/index.js`

Or use the force flag:

```bash
node scripts/setup/supabase.js --force
```

## Best Practices

1. **Idempotent**: Setup scripts should be safe to run multiple times
2. **Informative**: Provide clear console output about what's happening
3. **Graceful failures**: Handle errors and provide helpful messages
4. **Skip when appropriate**: Don't redo work that's already done
5. **Modular**: Keep each setup task in its own file
6. **Testable**: Each module can be run independently
