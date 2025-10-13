# Quick Start: Workspace Restructuring

**Feature**: Workspace Restructuring  
**Date**: 2024-12-19  
**Purpose**: Guide for setting up and using the monorepo structure

## Prerequisites

- Node.js 20+ installed
- pnpm package manager installed
- Git repository cloned
- Supabase CLI installed (for database operations)

## Initial Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify workspace configuration
pnpm list --depth=0
```

### 2. Environment Setup

```bash
# Set up environment variables
pnpm env:setup

# Initialize Supabase (if not already done)
pnpm env:setup:supabase
```

### 3. Database Setup

```bash
# Push schema to local database
pnpm db:push

# Open Drizzle Studio to inspect database
pnpm db:studio
```

## Workspace Structure

After restructuring, your project will have this structure:

```
bitcraft-nexus/
├── apps/
│   ├── web/                 # Next.js web application (moved from root)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── discord-bot/        # Discord integration bot
│       ├── src/
│       ├── commands/
│       └── package.json
├── packages/
│   ├── shared/             # Shared utilities and types
│   │   ├── src/
│   │   └── package.json
│   └── database/           # Centralized database schema
│       ├── schema/
│       ├── migrations/
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## Development Workflow

### Running Applications

```bash
# Run web application
cd apps/web
pnpm dev

# Run Discord bot (in separate terminal)
cd apps/discord-bot
pnpm dev

# Run both applications simultaneously
pnpm --filter web dev &
pnpm --filter discord-bot dev
```

### Building Applications

```bash
# Build specific workspace
pnpm --filter web build
pnpm --filter discord-bot build

# Build all workspaces
pnpm -r build

# Build with dependencies
pnpm --filter web... build
```

### Testing

```bash
# Run tests for specific workspace
pnpm --filter web test
pnpm --filter discord-bot test

# Run all tests
pnpm -r test

# Run tests with coverage
pnpm -r test --coverage
```

## Working with Shared Packages

### Creating a Shared Package

```bash
# Create new shared package
mkdir packages/new-package
cd packages/new-package

# Initialize package.json
pnpm init

# Add to workspace root package.json dependencies
```

### Using Shared Packages

```typescript
// In apps/web or apps/discord-bot
import { sharedUtility } from '@bitcraft/shared';
import { DatabaseSchema } from '@bitcraft/database';
```

### Updating Shared Dependencies

```bash
# Update shared package version
cd packages/shared
pnpm version patch

# Update all dependent workspaces
pnpm -r update @bitcraft/shared
```

## Database Management

### Schema Changes

```bash
# Make changes to packages/database/schema/
# Push changes to local database
pnpm db:push

# Generate migration files for production
pnpm db:generate

# Review generated migrations
ls supabase/migrations/
```

### Schema Synchronization

```bash
# Check schema status across workspaces
pnpm --filter web db:status
pnpm --filter discord-bot db:status

# Sync schema to all workspaces
pnpm -r db:sync
```

## Discord Bot Development

### Setting Up Discord Bot

1. Create Discord application at https://discord.com/developers/applications
2. Copy bot token to environment variables
3. Set up webhook endpoint for interactions

```bash
# Install Discord.js dependencies
pnpm --filter discord-bot add discord.js

# Set up environment variables
echo "DISCORD_BOT_TOKEN=your_token_here" >> apps/discord-bot/.env.local
echo "DISCORD_CLIENT_ID=your_client_id_here" >> apps/discord-bot/.env.local
```

### Creating Discord Commands

```typescript
// apps/discord-bot/src/commands/example.ts
import { SlashCommandBuilder } from 'discord.js';
import { DatabaseSchema } from '@bitcraft/database';

export const exampleCommand = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command'),
  async execute(interaction) {
    // Use shared database schema
    const data = await DatabaseSchema.exampleTable.findMany();
    await interaction.reply(`Found ${data.length} records`);
  },
};
```

### Testing Discord Integration

```bash
# Run bot in development mode
cd apps/discord-bot
pnpm dev

# Test webhook endpoint
curl -X POST http://localhost:3001/api/discord/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "interaction", "data": {...}}'
```

## Deployment

### Individual Workspace Deployment

```bash
# Deploy web application
pnpm --filter web deploy

# Deploy Discord bot
pnpm --filter discord-bot deploy

# Deploy shared packages (if needed)
pnpm --filter shared deploy
```

### Production Database Migrations

```bash
# Generate production migrations
pnpm db:generate

# Review migrations
cat supabase/migrations/*.sql

# Apply migrations to production
pnpm db:migrate
```

## Troubleshooting

### Common Issues

**Workspace not found:**
```bash
# Verify workspace configuration
cat pnpm-workspace.yaml
pnpm list --depth=0
```

**Dependency conflicts:**
```bash
# Check dependency tree
pnpm list --depth=1

# Resolve conflicts
pnpm dedupe
```

**Database connection issues:**
```bash
# Check Supabase status
pnpm supabase status

# Reset local database
pnpm supabase:reset
```

**Build failures:**
```bash
# Clean all builds
pnpm -r clean

# Rebuild from scratch
pnpm -r build
```

### Getting Help

- Check the [Development Workflow Guide](../../docs/DEVELOPMENT_WORKFLOW.md)
- Review [Database Architecture](../../docs/DATABASE_ARCHITECTURE.md)
- See [Setup Troubleshooting](../../docs/SETUP_TROUBLESHOOTING.md)

## Next Steps

1. **Explore the codebase**: Familiarize yourself with the new structure
2. **Create your first feature**: Use the shared packages for common functionality
3. **Set up Discord commands**: Integrate bot functionality with web app features
4. **Contribute**: Follow the [Contributing Guide](../../CONTRIBUTING.md)

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm -r <command>` | Run command in all workspaces |
| `pnpm --filter <workspace> <command>` | Run command in specific workspace |
| `pnpm --filter <workspace>... <command>` | Run command in workspace and dependencies |
| `pnpm db:push` | Push schema changes to local database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:studio` | Open database visual interface |
| `pnpm -r build` | Build all workspaces |
| `pnpm -r test` | Run tests in all workspaces |
