# Setup Troubleshooting Guide

This guide helps you resolve common issues with the automated setup process.

## Common Issues

### 1. Postinstall Script Fails

**Symptoms:**

- `pnpm install` fails during postinstall
- Error messages about Supabase or Docker

**Solutions:**

#### Skip postinstall and run manually:

```bash
pnpm install --ignore-scripts
pnpm run setup:supabase
```

#### If Docker is not installed:

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Start Docker Desktop
- Run setup again: `pnpm run setup:supabase`

#### If you don't want to use local Supabase:

1. Create a cloud Supabase project at [database.new](https://database.new)
2. Create `.env.local` manually:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```
3. Run: `pnpm install --ignore-scripts`

### 2. Supabase Containers Won't Start

**Symptoms:**

- "Error starting Supabase"
- Docker daemon not running
- Port conflicts

**Solutions:**

#### Docker not running:

```bash
# Check Docker status
docker ps

# If not running, start Docker Desktop
```

#### Port conflicts:

Check if ports are already in use:

```bash
# Check common Supabase ports
lsof -i :54321  # API
lsof -i :54323  # Studio
lsof -i :54322  # Database
```

Stop the conflicting service or change ports in `supabase/config.toml`

#### Permission issues:

```bash
# Linux/Mac: Add your user to docker group
sudo usermod -aG docker $USER
# Then log out and back in
```

### 3. .env.local Not Generated

**Symptoms:**

- `.env.local` file doesn't exist after install
- App can't connect to Supabase

**Solutions:**

#### Run setup manually:

```bash
pnpm run setup:supabase
```

#### Force regenerate:

```bash
rm .env.local
node scripts/setup/supabase.js --force
```

#### Check Supabase output:

```bash
pnpx supabase status
# Look for API URL and anon key
# Manually create .env.local with these values
```

### 4. "Supabase Already Configured" Message

**Symptoms:**

- Setup skips because `.env.local` exists
- But credentials are wrong or outdated

**Solutions:**

#### Force reconfigure:

```bash
node scripts/setup/supabase.js --force
```

#### Or delete and regenerate:

```bash
rm .env.local
pnpm run setup:supabase
```

### 5. Husky Hooks Not Working

**Symptoms:**

- Commits don't trigger validation
- Pre-commit hooks don't run

**Solutions:**

#### Reinstall hooks:

```bash
pnpm prepare
```

#### Check Git hooks directory:

```bash
ls -la .git/hooks/
# Should see commit-msg and pre-commit
```

#### Manual hook setup:

```bash
chmod +x .husky/commit-msg
chmod +x .husky/pre-commit
```

### 6. Module Not Found Errors

**Symptoms:**

- `Cannot find module` errors in setup scripts
- Import errors

**Solutions:**

#### Clean install:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Check Node.js version:

```bash
node --version
# Should be 20.x or higher
```

### 7. CI/CD Setup Issues

**Problem:** Don't want postinstall to run in CI/CD

**Solutions:**

#### Skip postinstall in CI:

```bash
pnpm install --ignore-scripts
```

#### Or set environment variable:

```yaml
# In your CI config
- run: CI=true pnpm install --ignore-scripts
```

#### Modify setup script to detect CI:

The scripts already skip if `.env.local` exists, which is typical in CI.

## Advanced Debugging

### Enable Verbose Logging

Add debug output to setup scripts:

```bash
# Run setup with Node debug
NODE_DEBUG=* pnpm run setup:supabase

# Or add console.log statements to scripts/setup/supabase.js
```

### Check Supabase Logs

```bash
# View all container logs
pnpx supabase logs

# View specific service logs
pnpx supabase logs api
pnpx supabase logs db
```

### Reset Everything

Start completely fresh:

```bash
# Stop and remove all Supabase containers
pnpx supabase stop --no-backup

# Remove generated files
rm .env.local

# Remove node_modules
rm -rf node_modules pnpm-lock.yaml

# Fresh install
pnpm install
```

## Getting Help

If you're still having issues:

1. Check the [scripts/README.md](../scripts/README.md) for detailed documentation
2. Review [Supabase Local Development docs](https://supabase.com/docs/guides/local-development)
3. Check if Docker is running: `docker ps`
4. Verify Node.js version: `node --version` (should be 20+)
5. Look for existing GitHub issues or create a new one

## Manual Setup Fallback

If automated setup continues to fail, you can always set up manually:

1. **Skip automated setup:**

    ```bash
    pnpm install --ignore-scripts
    ```

2. **Start Supabase manually:**

    ```bash
    pnpx supabase init
    pnpx supabase start
    ```

3. **Copy credentials from output:**
   Look for "API URL" and "anon key" in the terminal output

4. **Create `.env.local`:**

    ```env
    NEXT_PUBLIC_SUPABASE_URL=<your-api-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
    ```

5. **Start development:**
    ```bash
    pnpm dev
    ```
