#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ENV_FILE = path.join(__dirname, "..", "..", ".env.local");
const SUPABASE_DIR = path.join(__dirname, "..", "..", "supabase");

/**
 * Removes a previously inserted "Supabase Local Development" block from a .env file
 * without accidentally deleting unrelated variables or comments.
 * The block is identified by the header line:
 *   # Supabase Local Development
 * and includes only known Supabase-related comments and variables written by this script.
 */
function removeOldSupabaseConfig(content) {
    if (!content) return content;

    const isSupabaseComment = line => {
        const trimmed = line.trim();
        return (
            trimmed.startsWith("# Supabase") ||
            trimmed.startsWith("# Generated automatically") ||
            trimmed.startsWith("# Supabase API") ||
            trimmed.startsWith("# Database connection") ||
            trimmed.startsWith("# This connects directly")
        );
    };

    const isSupabaseEnvVar = line =>
        /^NEXT_PUBLIC_SUPABASE_URL=/.test(line) ||
        /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/.test(line) ||
        /^DATABASE_URL=/.test(line);

    let text = content;
    // Remove all occurrences if the block is duplicated
    // Loop until no more Supabase block headers are found
    // to ensure idempotency across runs.
    // No heavy regexes that can overmatch.
    while (true) {
        const lines = text.split(/\r?\n/);
        const startIdx = lines.findIndex(
            line => line.trim() === "# Supabase Local Development"
        );
        if (startIdx === -1) break;

        let endIdx = startIdx + 1;
        while (endIdx < lines.length) {
            const current = lines[endIdx];
            if (
                current.trim() === "" ||
                isSupabaseComment(current) ||
                isSupabaseEnvVar(current)
            ) {
                endIdx += 1;
                continue;
            }
            break;
        }

        lines.splice(startIdx, endIdx - startIdx);
        text = lines.join("\n").replace(/\n{3,}/g, "\n\n");
    }

    return text;
}

/**
 * Sets up Supabase local development environment
 * @param {Object} options - Setup options
 * @param {boolean} options.skipIfExists - Skip if .env.local already exists
 * @param {boolean} options.force - Force setup even if already configured
 * @returns {Promise<boolean>} - Returns true if setup was successful
 */
async function setupSupabase(options = {}) {
    const { skipIfExists = true, force = false } = options;

    console.log("📦 Setting up Supabase...\n");

    // Check if .env.local already exists
    if (fs.existsSync(ENV_FILE) && skipIfExists && !force) {
        console.log("✅ Supabase already configured (.env.local exists)");
        console.log("   Run with --force to reconfigure\n");
        return true;
    }

    // Check if supabase directory exists (init already ran)
    const supabaseInitialized =
        fs.existsSync(SUPABASE_DIR) &&
        fs.existsSync(path.join(SUPABASE_DIR, "config.toml"));

    if (!supabaseInitialized) {
        console.log("🔧 Initializing Supabase...");
        try {
            execSync("pnpx supabase init", {
                stdio: "pipe",
                cwd: path.join(__dirname, "..", ".."),
            });
            console.log("✅ Supabase initialized\n");
        } catch (error) {
            console.error("❌ Failed to initialize Supabase:", error.message);
            return false;
        }
    } else {
        console.log("✅ Supabase already initialized\n");
    }

    console.log("🐳 Starting Supabase local containers...");
    console.log("   This may take a few minutes on first run...\n");

    try {
        // Start Supabase and capture output
        const output = execSync("pnpx supabase start", {
            cwd: path.join(__dirname, "..", ".."),
            encoding: "utf-8",
            stdio: "pipe",
        });

        // Parse the output to extract credentials
        const apiUrlMatch = output.match(/API URL: (http:\/\/[^\s]+)/);
        const anonKeyMatch = output.match(/anon key: ([^\s]+)/);
        const dbUrlMatch = output.match(
            /Database URL: (postgresql:\/\/[^\s]+)/
        );

        if (apiUrlMatch && anonKeyMatch && dbUrlMatch) {
            const apiUrl = apiUrlMatch[1];
            const anonKey = anonKeyMatch[1];
            const dbUrl = dbUrlMatch[1];

            // Read existing .env.local or create new
            let envContent = "";
            if (fs.existsSync(ENV_FILE)) {
                envContent = fs.readFileSync(ENV_FILE, "utf-8");

                // Remove old Supabase config if it exists (safe, bounded)
                envContent = removeOldSupabaseConfig(envContent);
            }

            // Add Supabase config
            const supabaseConfig = `# Supabase Local Development
# Generated automatically - Run 'pnpm run setup:supabase' to regenerate

# Supabase API (for @supabase/supabase-js client)
NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}

# Database connection (used by both Supabase and Drizzle ORM)
# This connects directly to the Supabase PostgreSQL database
DATABASE_URL=${dbUrl}
`;

            envContent = envContent.trim() + "\n\n" + supabaseConfig;
            fs.writeFileSync(ENV_FILE, envContent.trim() + "\n");

            console.log(
                "\n✅ Successfully configured Supabase credentials in .env.local"
            );
            console.log("\n📝 Environment variables set:");
            console.log(`   NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`);
            console.log(
                `   NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.substring(0, 20)}...`
            );
            console.log("\n💡 Supabase Studio: http://127.0.0.1:54323\n");

            return true;
        } else {
            console.error(
                "❌ Could not parse Supabase credentials from output"
            );
            return false;
        }
    } catch (error) {
        console.error("\n❌ Failed to start Supabase:", error.message);
        console.log("\n💡 You can manually set up Supabase later by running:");
        console.log("   pnpm run setup:supabase\n");
        return false;
    }
}

// Allow running directly
if (require.main === module) {
    const force = process.argv.includes("--force");
    setupSupabase({ skipIfExists: true, force })
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error("Error:", error);
            process.exit(1);
        });
}

module.exports = { setupSupabase };
