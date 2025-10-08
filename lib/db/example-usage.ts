/**
 * Example usage of Drizzle ORM with this setup
 * 
 * This file demonstrates common patterns for using Drizzle in your app.
 * Delete this file once you're familiar with the patterns.
 */

import { db } from './index';
// Import your tables from schema
// import { users, posts } from './schema';
// import { eq, and, or, desc, asc } from 'drizzle-orm';

/**
 * Example: Insert a user
 */
export async function createUserExample() {
    // Uncomment when you have a users table defined
    /*
    const newUser = await db.insert(users).values({
      email: 'user@example.com',
      name: 'John Doe',
    }).returning();
    
    return newUser[0];
    */
}

/**
 * Example: Get all users
 */
export async function getAllUsersExample() {
    /*
    const allUsers = await db.select().from(users);
    return allUsers;
    */
}

/**
 * Example: Get user by email
 */
export async function getUserByEmailExample(email: string) {
    /*
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user[0];
    */
}

/**
 * Example: Update user
 */
export async function updateUserExample(userId: string, name: string) {
    /*
    const updated = await db
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return updated[0];
    */
}

/**
 * Example: Delete user
 */
export async function deleteUserExample(userId: string) {
    /*
    await db.delete(users).where(eq(users.id, userId));
    */
}

/**
 * Example: Join tables
 */
export async function getPostsWithAuthorsExample() {
    /*
    const postsWithAuthors = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));
    
    return postsWithAuthors;
    */
}

/**
 * Example: Complex where clause
 */
export async function searchUsersExample(searchTerm: string) {
    /*
    import { like, or } from 'drizzle-orm';
    
    const results = await db
      .select()
      .from(users)
      .where(
        or(
          like(users.name, `%${searchTerm}%`),
          like(users.email, `%${searchTerm}%`)
        )
      );
    
    return results;
    */
}

/**
 * Example: Transaction
 */
export async function createUserWithPostExample() {
    /*
    return await db.transaction(async (tx) => {
      // Create user
      const user = await tx.insert(users).values({
        email: 'user@example.com',
        name: 'John Doe',
      }).returning();
      
      // Create post
      const post = await tx.insert(posts).values({
        title: 'My First Post',
        content: 'Hello World',
        authorId: user[0].id,
      }).returning();
      
      return { user: user[0], post: post[0] };
    });
    */
}

/**
 * Example: Count
 */
export async function countUsersExample() {
    /*
    import { count } from 'drizzle-orm';
    
    const result = await db
      .select({ count: count() })
      .from(users);
    
    return result[0].count;
    */
}

/**
 * Example: Pagination
 */
export async function getPaginatedUsersExample(page: number, pageSize: number) {
    /*
    const offset = (page - 1) * pageSize;
    
    const users = await db
      .select()
      .from(users)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(users.createdAt));
    
    return users;
    */
}

// Next steps:
// 1. Define your schema in lib/db/schema.ts
// 2. Run: pnpm db:generate
// 3. Run: pnpm db:push
// 4. Uncomment and use these examples!

