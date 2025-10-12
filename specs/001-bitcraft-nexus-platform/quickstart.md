# Quick Start: BitCraft Nexus Platform Development

**Feature**: 001-bitcraft-nexus-platform
**Target**: Developers setting up local development environment
**Time Estimate**: 30-45 minutes (first-time setup)

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))
- **Docker Desktop** (for local Supabase) ([Download](https://www.docker.com/products/docker-desktop))
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Drizzle ORM

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/bitcraft-nexus.git
cd bitcraft-nexus

# Install dependencies (fast with pnpm)
pnpm install
```

**What this does**:
- Installs Next.js 15, React 19, TypeScript, Tailwind 4
- Installs Drizzle ORM, Supabase SDK, SpacetimeDB SDK
- Installs shadcn/ui components and Radix UI primitives
- Sets up dev dependencies (ESLint, Prettier, Husky hooks)

---

## Step 2: Environment Setup

### Create Local Environment File

```bash
# Copy environment template
cp .env.example .env.local
```

### Configure Environment Variables

Edit `.env.local` with your credentials:

```bash
# Supabase (Local Development with Docker)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-start
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# SpacetimeDB (TBD - get from BitCraft team)
SPACETIME_URI=wss://spacetime.bitcraftgame.com
SPACETIME_MODULE=bitcraft_game_data

# BitCraft Verification API (TBD - get from BitCraft team)
BITCRAFT_API_URL=https://api.bitcraftgame.com
BITCRAFT_API_KEY=your-api-key

# Discord OAuth (Create Discord app at https://discord.com/developers/applications)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Platform Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
PILOT_MODE_ENABLED=true

# Rate Limiting (Local development - in-memory, no KV needed)
# For production, configure Vercel KV:
# KV_REST_API_URL=your-kv-url
# KV_REST_API_TOKEN=your-kv-token
```

**Important Notes**:
- Local Supabase runs on ports 54321 (API) and 54322 (Database)
- Discord OAuth requires creating a Discord application
- SpacetimeDB and BitCraft API credentials pending from BitCraft team
- Rate limiting uses in-memory Map for local dev (no Redis required)

---

## Step 3: Start Local Supabase

Supabase provides local development via Docker:

```bash
# Install Supabase CLI (if not already installed)
pnpm install -g supabase

# Start local Supabase services (PostgreSQL, Auth, Storage, etc.)
npx supabase start
```

**What this does**:
- Spins up Docker containers for PostgreSQL, Kong (API Gateway), GoTrue (Auth), and more
- Creates a local database at `localhost:54322`
- Provides Supabase Studio at `http://localhost:54323`
- Outputs `anon key` and `service_role key` (copy to `.env.local`)

**Verify Supabase is running**:
- Open `http://localhost:54323` (Supabase Studio)
- You should see the local database dashboard

---

## Step 4: Configure Discord OAuth Provider

### Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application", name it "BitCraft Nexus (Dev)"
3. Navigate to OAuth2 → General
4. Add redirect URI: `http://localhost:54321/auth/v1/callback`
5. Copy **Client ID** and **Client Secret** to `.env.local`

### Configure Supabase Auth with Discord

```bash
# Open Supabase Studio
open http://localhost:54323

# Navigate to: Authentication → Providers
# Enable Discord provider:
# - Paste Client ID
# - Paste Client Secret
# - Save

# OR configure via SQL:
npx supabase db reset  # Applies auth config from supabase/config.toml
```

**Edit** `supabase/config.toml`:
```toml
[auth.external.discord]
enabled = true
client_id = "your-discord-client-id"
secret = "your-discord-client-secret"
```

---

## Step 5: Initialize Database Schema

### Push Schema to Local Database

```bash
# Push Drizzle schema to local Supabase (dev workflow, no migrations)
pnpm db:push
```

**What this does**:
- Reads `lib/db/schema.ts` (Drizzle schema definitions)
- Generates SQL and applies directly to local database
- No migration files created (use `pnpm db:generate` for production)

### Verify Schema

```bash
# Open Drizzle Studio (visual database browser)
pnpm db:studio
```

- Opens `https://local.drizzle.studio` in your browser
- Browse tables: `users`, `discord_links`, `bitcraft_links`, `api_keys`, `audit_logs`
- Verify schema matches [data-model.md](data-model.md)

---

## Step 6: Seed Development Data (Optional)

For local testing, seed with a test user:

```bash
# Run seed script (if implemented)
pnpm db:seed
```

**Manual Seeding** (if no script yet):

```sql
-- Open Supabase Studio SQL Editor
-- Create test user matching your Discord ID

INSERT INTO users (id) VALUES ('your-supabase-auth-user-id');

INSERT INTO discord_links (user_id, discord_id, discord_username)
VALUES ('your-supabase-auth-user-id', 'your-discord-id', 'yourusername');

INSERT INTO api_keys (name, key_hash, key_prefix, permissions, created_by)
VALUES (
  'Development Web UI',
  'hash-of-test-key',  -- Generate with: echo -n "bcn_test123" | sha256sum
  'bcn_test12',
  '{"scopes": ["read", "write"]}'::jsonb,
  'your-supabase-auth-user-id'
);
```

---

## Step 7: Start Development Server

```bash
# Start Next.js dev server with hot reloading
pnpm dev
```

**What this does**:
- Starts Next.js on `http://localhost:3000`
- Enables hot reloading for instant feedback
- Compiles TypeScript on-the-fly
- Watches for file changes

**Verify it's working**:
- Open `http://localhost:3000`
- You should see the home page
- Click "Sign in with Discord" → OAuth flow starts

---

## Step 8: Verify Authentication Flow

### Test Discord OAuth

1. Navigate to `http://localhost:3000/login`
2. Click "Sign in with Discord"
3. Authorize the application in Discord
4. You should be redirected back to platform with active session
5. Navigate to `http://localhost:3000/profile`
6. Verify your Discord identity is displayed

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get session (requires auth cookie)
curl http://localhost:3000/api/auth/session -H "Cookie: sb-access-token=your-token"
```

---

## Step 9: Set Up Discord Bot (Optional)

If testing Discord bot functionality:

```bash
# Navigate to discord-bot directory
cd discord-bot

# Install bot dependencies
pnpm install

# Create .env for bot
cp .env.example .env

# Configure Discord bot token
DISCORD_BOT_TOKEN=your-bot-token
PLATFORM_API_URL=http://localhost:3000
BOT_API_KEY=your-generated-api-key

# Start bot
pnpm start
```

**Bot Commands**:
- `/profile` - View your BitCraft Nexus profile

---

## Development Workflow

### Daily Development

```bash
# Start Supabase (if not running)
npx supabase start

# Start dev server
pnpm dev

# Open Drizzle Studio (in separate terminal)
pnpm db:studio
```

### Making Schema Changes

```bash
# 1. Edit lib/db/schema.ts
# 2. Push changes to local database
pnpm db:push

# 3. Verify in Drizzle Studio
pnpm db:studio

# 4. When ready for production, generate migration
pnpm db:generate
```

### Installing shadcn/ui Components

```bash
# Add a new component (e.g., Button)
pnpm dlx shadcn-ui@latest add button

# Components are added to components/ui/
```

### Checking TypeScript Errors

```bash
# Type check without building
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format
```

### Committing Changes

Git hooks (Husky) automatically run before commits:
- ESLint checks code quality
- Commitlint validates commit message format

```bash
# Stage changes
git add .

# Commit with conventional commit format
git commit -m "feat(auth): add BitCraft email verification flow"

# Push to feature branch
git push origin 001-bitcraft-nexus-platform
```

---

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm type-check` | Check TypeScript types |
| `pnpm db:push` | Push schema to local database (dev) |
| `pnpm db:generate` | Generate migration files (production) |
| `pnpm db:studio` | Open Drizzle Studio |
| `npx supabase start` | Start local Supabase |
| `npx supabase stop` | Stop local Supabase |
| `npx supabase status` | Check Supabase status |
| `npx supabase db reset` | Reset local database |

---

## Troubleshooting

### "Supabase is not running"

```bash
# Check Docker Desktop is running
docker ps

# Start Supabase
npx supabase start

# If port conflicts, stop conflicting services or change ports in supabase/config.toml
```

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Discord OAuth fails

```bash
# Verify redirect URI matches exactly:
http://localhost:54321/auth/v1/callback

# Check Discord credentials in .env.local and Supabase config
```

### Database connection errors

```bash
# Verify DATABASE_URL in .env.local
# Ensure Supabase is running
npx supabase status

# Reset database if corrupted
npx supabase db reset
pnpm db:push
```

### TypeScript errors after schema changes

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "Restart TypeScript Server"

# Or restart dev server
pnpm dev
```

---

## Next Steps

Once your environment is set up:

1. **Review Architecture Docs**:
   - [data-model.md](data-model.md) - Database schema
   - [research.md](research.md) - Technical decisions
   - [contracts/auth.yaml](contracts/auth.yaml) - API contracts

2. **Implement First Feature**:
   - Start with authentication flow (User Story 1)
   - Follow task breakdown in `tasks.md` (generated by `/speckit.tasks`)

3. **Run Manual Tests**:
   - Test Discord OAuth flow end-to-end
   - Test BitCraft verification flow (when API available)
   - Verify API rate limiting works

4. **Join Team Communication**:
   - Discord server: [link]
   - GitHub Discussions: [link]
   - Weekly sync meetings: [schedule]

---

## Additional Resources

### Documentation
- **Next.js 15 App Router**: https://nextjs.org/docs/app
- **Supabase Auth (SSR)**: https://supabase.com/docs/guides/auth/server-side
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **shadcn/ui**: https://ui.shadcn.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project Docs (to be created in `docs/`)
- `DEVELOPMENT_WORKFLOW.md` - Daily development patterns
- `DATABASE_ARCHITECTURE.md` - Supabase + Drizzle architecture
- `DRIZZLE_GUIDE.md` - ORM reference and patterns
- `SETUP_TROUBLESHOOTING.md` - Extended troubleshooting guide

### Constitution
- [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Project principles and standards

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check existing issues**: [GitHub Issues](https://github.com/your-org/bitcraft-nexus/issues)
2. **Ask in Discord**: #dev-help channel
3. **Create new issue**: Include error messages, environment details, steps to reproduce

**Include in bug reports**:
- Node.js version: `node --version`
- pnpm version: `pnpm --version`
- OS and version
- Full error message / stack trace
- Steps to reproduce

---

**Last Updated**: 2025-10-12
**Maintainer**: [Your Team]
**Estimated Setup Time**: 30-45 minutes
