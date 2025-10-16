import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./packages/database/src/schema/index.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
    dbCredentials: {
        // Use the same DATABASE_URL that Supabase provides
        url:
            process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    },
    verbose: true,
    strict: true,
});
