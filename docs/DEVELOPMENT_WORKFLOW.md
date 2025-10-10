# Development Workflow: Supabase + Drizzle

This guide shows the complete day-to-day workflow for developing with Supabase and Drizzle ORM.

---

## 🚀 Initial Setup (One-Time)

### New Developer Onboarding

```bash
# 1. Clone the repository
git clone <repo-url>
cd bitcraft-nexus

# 2. Install dependencies (automatically sets up everything!)
pnpm install

# What happens automatically:
# ✅ Installs all npm packages
# ✅ Initializes Supabase local instance
# ✅ Starts Supabase containers (Docker)
# ✅ Generates .env.local with credentials
# ✅ Sets up git hooks for conventional commits

# 3. Start development
pnpm dev
```

**That's it!** You're ready to code. No manual configuration needed.

---

## 📋 Daily Development Workflow

### Starting Your Day

```bash
# Check if Supabase is running
pnpm supabase:status

# If not running, start it
pnpm supabase:start

# Start Next.js dev server
pnpm dev
```

Now you have:

- ✅ Next.js running on `http://localhost:3000`
- ✅ Supabase Studio on `http://127.0.0.1:54323`
- ✅ Supabase API on `http://127.0.0.1:54321`
- ✅ PostgreSQL on `127.0.0.1:54322`

---

## 🗄️ Database Development Workflow

### Scenario 1: Adding a New Feature with a New Table

Let's say you're adding a blog feature with posts and comments.

#### Step 1: Define Your Schema

Edit `lib/db/schema.ts`:

```typescript
import {
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
    varchar,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define the posts table
export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    content: text("content"),
    excerpt: text("excerpt"),
    published: boolean("published").default(false).notNull(),
    authorId: uuid("author_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define the comments table
export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    postId: uuid("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations (for easier queries)
export const postsRelations = relations(posts, ({ many }) => ({
    comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
}));

// Export types for use in your app
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;
export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;
```

#### Step 2: Push to Database

```bash
# For quick iteration during development
pnpm db:push
```

Output:

```
✓ Pushing schema...
✓ Created table "posts"
✓ Created table "comments"
✓ Done!
```

#### Step 3: Verify in Supabase Studio

Open `http://127.0.0.1:54323` and you'll see:

- ✅ Your new `posts` table
- ✅ Your new `comments` table
- Can browse data, run SQL, etc.

Or use Drizzle Studio:

```bash
pnpm db:studio
```

Opens at `https://local.drizzle.studio/`

#### Step 4: Use in Your App

Create a server component `app/blog/page.tsx`:

```typescript
import { db } from '@/lib/db';
import { posts, comments } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export default async function BlogPage() {
  // Get published posts with comment counts
  const publishedPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  return (
    <div>
      <h1>Blog Posts</h1>
      {publishedPosts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <time>{post.createdAt.toLocaleDateString()}</time>
        </article>
      ))}
    </div>
  );
}
```

Create a server action `app/blog/actions.ts`:

```typescript
"use server";

import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
    // Get authenticated user
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Must be logged in to create posts");
    }

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const slug = title.toLowerCase().replace(/\s+/g, "-");

    // Create post with Drizzle
    const [newPost] = await db
        .insert(posts)
        .values({
            title,
            content,
            slug,
            excerpt: content.substring(0, 200),
            authorId: user.id,
        })
        .returning();

    revalidatePath("/blog");
    redirect(`/blog/${newPost.slug}`);
}
```

#### Step 5: Generate Migration for Production

When you're ready to deploy:

```bash
# Generate migration file
pnpm db:generate
```

Output:

```
✓ Generating migration...
✓ Migration created: supabase/migrations/0001_add_blog_tables.sql
```

Review the generated SQL:

```sql
-- supabase/migrations/0001_add_blog_tables.sql
CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "content" text,
  "excerpt" text,
  "published" boolean DEFAULT false NOT NULL,
  "author_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "post_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE cascade;
```

#### Step 6: Commit

```bash
git add lib/db/schema.ts supabase/migrations/
git commit -m "feat(blog): add posts and comments tables"
```

The commit hook validates your message follows conventional commits!

---

### Scenario 2: Modifying an Existing Table

You want to add a `viewCount` field to posts.

#### Step 1: Update Schema

```typescript
// lib/db/schema.ts
export const posts = pgTable("posts", {
    // ... existing fields
    viewCount: integer("view_count").default(0).notNull(), // ← Add this
});
```

#### Step 2: Push to Database

```bash
pnpm db:push
```

Drizzle detects the change and alters the table!

#### Step 3: Use the New Field

```typescript
// Increment view count
await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.slug, slug));
```

---

### Scenario 3: Working with Supabase Auth

Create a user profile system that links to Supabase auth.

#### Step 1: Define Profile Schema

```typescript
// lib/db/schema.ts
export const userProfiles = pgTable("user_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Link to Supabase auth.users
    authUserId: uuid("auth_user_id").notNull().unique(),
    displayName: varchar("display_name", { length: 100 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    website: varchar("website", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### Step 2: Push to Database

```bash
pnpm db:push
```

#### Step 3: Create Profile on Signup

```typescript
// app/auth/signup/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

export async function signUp(
    email: string,
    password: string,
    displayName: string
) {
    const supabase = await createClient();

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;

    // Create profile in database
    if (data.user) {
        await db.insert(userProfiles).values({
            authUserId: data.user.id,
            displayName,
        });
    }

    return data;
}
```

#### Step 4: Query User Profile

```typescript
// app/profile/[userId]/page.tsx
import { db } from '@/lib/db';
import { userProfiles, posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  // Get profile
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, params.userId))
    .limit(1);

  // Get user's posts
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, params.userId));

  return (
    <div>
      <h1>{profile.displayName}</h1>
      <p>{profile.bio}</p>
      <h2>Posts by {profile.displayName}</h2>
      {/* ... */}
    </div>
  );
}
```

---

### Scenario 4: Using Supabase Storage with Drizzle Metadata

Upload files to Supabase Storage, track metadata with Drizzle.

#### Step 1: Define Schema

```typescript
// lib/db/schema.ts
export const uploads = pgTable("uploads", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

```bash
pnpm db:push
```

#### Step 2: Upload File

```typescript
// app/upload/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";

export async function uploadFile(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    const fileName = file.name;
    const storagePath = `${user.id}/${Date.now()}-${fileName}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
        .from("uploads")
        .upload(storagePath, file);

    if (storageError) throw storageError;

    // Save metadata to database
    await db.insert(uploads).values({
        userId: user.id,
        fileName,
        storagePath: storageData.path,
        mimeType: file.type,
        sizeBytes: file.size,
    });

    return { success: true };
}
```

---

## 🔄 Common Daily Tasks

### Task: Query with Relations

```typescript
import { db } from "@/lib/db";
import { posts, comments, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Get post with all comments and author info
const postWithDetails = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
        comments: {
            orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
    },
});
```

### Task: Complex Join Query

```typescript
// Get posts with author profiles and comment counts
const postsWithAuthors = await db
    .select({
        post: posts,
        author: {
            id: userProfiles.id,
            displayName: userProfiles.displayName,
            avatarUrl: userProfiles.avatarUrl,
        },
        commentCount: sql<number>`count(${comments.id})`,
    })
    .from(posts)
    .leftJoin(userProfiles, eq(posts.authorId, userProfiles.authUserId))
    .leftJoin(comments, eq(posts.id, comments.postId))
    .groupBy(posts.id, userProfiles.id)
    .orderBy(desc(posts.createdAt));
```

### Task: Transaction

```typescript
import { db } from "@/lib/db";

await db.transaction(async tx => {
    // Create post
    const [post] = await tx
        .insert(posts)
        .values({
            title: "New Post",
            content: "Content",
            authorId: userId,
        })
        .returning();

    // Create initial comment
    await tx.insert(comments).values({
        postId: post.id,
        authorId: userId,
        content: "First!",
    });

    // If anything fails, both rollback
});
```

### Task: Debugging with Studio

```bash
# Open Drizzle Studio
pnpm db:studio

# Or use Supabase Studio
# Already running at: http://127.0.0.1:54323
```

Browse tables, run queries, inspect data visually.

---

## 🚢 Preparing for Production

### Step 1: Review Migrations

```bash
# List all migrations
ls supabase/migrations/

# Review each SQL file
cat supabase/migrations/0001_add_blog_tables.sql
```

### Step 2: Test Migration Locally

```bash
# Reset database and replay all migrations
pnpm supabase:reset

# Verify everything works
pnpm dev
```

### Step 3: Commit Migrations

```bash
git add supabase/migrations/
git commit -m "feat(db): add blog feature migrations"
git push
```

### Step 4: Deploy

When you deploy to production (Vercel, etc.):

1. Supabase automatically runs migrations
2. Set `DATABASE_URL` in production env vars
3. App connects to production Supabase

---

## 🛠️ Useful Commands Reference

```bash
# Development
pnpm dev                      # Start Next.js dev server

# Supabase
pnpm supabase:start          # Start local Supabase
pnpm supabase:stop           # Stop local Supabase
pnpm supabase:restart        # Restart local Supabase
pnpm supabase:status         # Check status
pnpm supabase:reset          # Reset DB and run migrations

# Drizzle
pnpm db:generate             # Generate migration from schema
pnpm db:push                 # Push schema directly (no migration)
pnpm db:studio               # Open Drizzle Studio
pnpm db:drop                 # Drop migration

# Setup
pnpm run setup:supabase      # Re-run Supabase setup
```

---

## 🎯 Best Practices

### 1. **Use `db:push` for Development**

Fast iteration - no migration files needed

```bash
# Edit schema → Push → Test
pnpm db:push
```

### 2. **Use `db:generate` for Production**

Generate migrations, review them, commit to git

```bash
# Edit schema → Generate → Review → Commit
pnpm db:generate
```

### 3. **Always Use Supabase for Auth**

Never try to manage auth yourself

```typescript
// ✅ Good
const supabase = await createClient();
const {
    data: { user },
} = await supabase.auth.getUser();

// ❌ Bad - Don't query auth.users directly
```

### 4. **Use Drizzle for Complex Queries**

Type-safe, better DX

```typescript
// ✅ Good - Drizzle
const posts = await db
    .select()
    .from(posts)
    .leftJoin(comments, eq(posts.id, comments.postId));

// ⚠️ Less ideal - Supabase client for complex joins
```

### 5. **Server-Side Only**

Keep database queries in server components/actions

```typescript
// ✅ app/posts/page.tsx (Server Component)
export default async function PostsPage() {
  const posts = await db.select().from(posts);
  return <PostsList posts={posts} />;
}

// ❌ Don't try to use db in client components
'use client';
const posts = await db.select().from(posts); // Won't work!
```

---

## 🎓 Learning Path

1. **Week 1**: Basic schema, simple queries
2. **Week 2**: Relations, joins, server actions
3. **Week 3**: Transactions, complex queries
4. **Week 4**: Production migrations, optimization

---

## 📚 Quick Reference

| Need to...    | Use...                      | Command                  |
| ------------- | --------------------------- | ------------------------ |
| Add table     | Edit schema → push          | `pnpm db:push`           |
| Query data    | Drizzle in server component | `await db.select()`      |
| Authenticate  | Supabase client             | `supabase.auth`          |
| Upload files  | Supabase storage            | `supabase.storage`       |
| Complex query | Drizzle with joins          | `db.select().leftJoin()` |
| See data      | Drizzle/Supabase Studio     | `pnpm db:studio`         |
| Deploy        | Generate migration          | `pnpm db:generate`       |

---

## 🎉 Summary

**Day-to-day workflow is simple:**

1. **Define schema** in TypeScript (not SQL!)
2. **Push to database** with one command
3. **Use in your app** with full type safety
4. **Generate migrations** when ready for production

Supabase + Drizzle gives you the best of both worlds:

- 🔐 **Supabase** = Auth, Storage, Realtime (the hard stuff)
- 🎯 **Drizzle** = Type-safe queries, schema management (the DX)

Both working on the **same database**, configured automatically! 🚀
