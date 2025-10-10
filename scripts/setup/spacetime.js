#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SPACETIME_DIR = path.join(__dirname, "..", "..", "spacetime_bindings");
const ENV_FILE = path.join(__dirname, "..", "..", ".env.local");
const REPO_URL = "https://github.com/BitCraftToolBox/BitCraft_Bindings.git";
// change this to the branch you want to use
// const BRANCH = "ts-region"; // region specifc schema
const BRANCH = "ts-global"; // global schema

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

/**
 * Sets up SpacetimeDB bindings
 * @param {Object} options - Setup options
 * @param {boolean} options.skipIfExists - Skip if bindings already exist
 * @param {boolean} options.force - Force regeneration even if bindings exist
 * @returns {Promise<boolean>} - Returns true if setup was successful
 */
async function setupSpacetime(options = {}) {
    const { skipIfExists = true, force = false } = options;

    console.log("🚀 Setting up SpacetimeDB bindings...\n");

    // Check if bindings already exist
    const bindingsExist = fs.existsSync(path.join(SPACETIME_DIR, "index.ts"));

    if (bindingsExist && skipIfExists && !force) {
        console.log("✅ SpacetimeDB bindings already exist");
        console.log("   Run with --force to update\n");
        return true;
    }

    try {
        // Remove existing bindings if forcing update
        if (force && fs.existsSync(SPACETIME_DIR)) {
            console.log("🗑️  Removing existing bindings...");
            fs.rmSync(SPACETIME_DIR, { recursive: true, force: true });
        }

        // Clone the public bindings repo
        console.log("📥 Cloning SpacetimeDB bindings from public repo...");

        const tempDir = path.join(__dirname, "..", "..", ".temp_spacetime");

        // Clean temp directory if it exists
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        // Clone the repo (suppress output for cleaner logs)
        execSync(
            `git clone --depth 1 --branch ${BRANCH} ${REPO_URL} "${tempDir}"`,
            {
                stdio: "pipe",
                cwd: path.join(__dirname, "..", ".."),
            }
        );

        // Move bindings to the correct location
        console.log("📦 Installing bindings...");

        // The bindings are in the src directory of the repo
        const sourceDir = path.join(tempDir, "src");

        if (!fs.existsSync(sourceDir)) {
            throw new Error("src directory not found in cloned repo");
        }

        fs.renameSync(sourceDir, SPACETIME_DIR);

        // Download schema.json for the SQL Explorer
        console.log("📥 Downloading schema.json for SQL Explorer...");
        const schemaUrl =
            "https://bitcraft-early-access.spacetimedb.com/v1/database/bitcraft-global/schema?version=9";
        const schemaData = execSync(`curl -s "${schemaUrl}"`, {
            encoding: "utf-8",
        });
        const schemaObj = { V9: JSON.parse(schemaData) };
        fs.writeFileSync(
            path.join(SPACETIME_DIR, "schema.json"),
            JSON.stringify(schemaObj, null, 2)
        );
        console.log("✅ Schema saved\n");

        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log("✅ SpacetimeDB bindings installed successfully!\n");
        console.log("📁 Bindings location: spacetime_bindings/");
        console.log("   Import from: @/spacetime_bindings\n");

        // Step 4: Setup authentication (interactive)
        await setupAuthentication();

        return true;
    } catch (error) {
        console.error("\n❌ Failed to setup SpacetimeDB:", error.message);
        console.log("\n💡 Make sure you have:");
        console.log("   - git installed");
        console.log("   - Internet connection to clone the repo\n");
        console.log(`   Repo: ${REPO_URL}\n`);
        return false;
    }
}

/**
 * Setup Bitcraft authentication and get SpacetimeDB token
 */
async function setupAuthentication() {
    console.log("🔐 Setting up Bitcraft authentication...\n");

    // Check if token already exists in .env.local
    if (fs.existsSync(ENV_FILE)) {
        const envContent = fs.readFileSync(ENV_FILE, "utf-8");
        if (envContent.includes("SPACETIME_AUTH_TOKEN=")) {
            const skip = await question(
                "Auth token already exists in .env.local. Skip auth setup? (Y/n): "
            );
            if (skip.toLowerCase() !== "n") {
                console.log("✅ Skipping auth setup\n");
                rl.close();
                return;
            }
        }
    }

    try {
        // Step 1: Get email
        const email = await question("📧 Enter your Bitcraft email address: ");

        if (!email || !email.includes("@")) {
            console.log("⚠️  Invalid email. Skipping auth setup.");
            console.log(
                "   You can run this later with: pnpm run setup:spacetime --force\n"
            );
            rl.close();
            return;
        }

        // Step 2: Request access code
        console.log("\n📨 Requesting access code...");
        const encodedEmail = encodeURIComponent(email);

        execSync(
            `curl -X POST "https://api.bitcraftonline.com/authentication/request-access-code?email=${encodedEmail}"`,
            { stdio: "pipe" }
        );

        console.log("✅ Access code sent to your email!\n");

        // Step 3: Get access code from user
        const accessCode = await question(
            "🔑 Enter the access code from your email: "
        );

        if (!accessCode || accessCode.length < 4) {
            console.log("⚠️  Invalid access code. Skipping auth setup.");
            console.log(
                "   You can run this later with: pnpm run setup:spacetime --force\n"
            );
            rl.close();
            return;
        }

        // Step 4: Exchange for auth token
        console.log("\n🔄 Exchanging access code for auth token...");

        const authResponse = execSync(
            `curl -X POST "https://api.bitcraftonline.com/authentication/authenticate?email=${encodedEmail}&accessCode=${accessCode.trim()}"`,
            { encoding: "utf-8", stdio: "pipe" }
        );

        let authToken;
        try {
            const authData = JSON.parse(authResponse);
            authToken =
                authData.token || authData.authToken || authResponse.trim();
        } catch {
            authToken = authResponse.trim();
        }

        if (!authToken || authToken.length < 10) {
            console.log(
                "❌ Failed to get auth token. Invalid response from server."
            );
            console.log(
                "   You can manually add SPACETIME_AUTH_TOKEN to .env.local\n"
            );
            rl.close();
            return;
        }

        // Step 5: Add to .env.local
        let envContent = "";
        if (fs.existsSync(ENV_FILE)) {
            envContent = fs.readFileSync(ENV_FILE, "utf-8");
            // Remove old token if exists
            envContent = envContent.replace(/SPACETIME_AUTH_TOKEN=.*\n?/g, "");
        }

        envContent =
            envContent.trim() +
            "\n\n# SpacetimeDB Authentication\nSPACETIME_AUTH_TOKEN=" +
            authToken +
            "\n";
        fs.writeFileSync(ENV_FILE, envContent);

        console.log("✅ Auth token saved to .env.local!");
        console.log(`   Token: ${authToken.substring(0, 20)}...\n`);
    } catch (error) {
        console.log("⚠️  Auth setup failed:", error.message);
        console.log(
            "   You can manually add SPACETIME_AUTH_TOKEN to .env.local"
        );
        console.log("   Or run: pnpm run setup:spacetime --force\n");
    }

    rl.close();
}

// Allow running directly
if (require.main === module) {
    const force = process.argv.includes("--force");
    setupSpacetime({ skipIfExists: true, force })
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error("Error:", error);
            process.exit(1);
        });
}

module.exports = { setupSpacetime };
