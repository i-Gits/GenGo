// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   User Helper -- Cookie-Based Anonymous Users
//   "every visitor gets their own garden" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── How it works ─────────────────────────────────────────────
//
// 1. Middleware (src/middleware.ts) sets a "gengo-uid" cookie
//    on every visitor's first request.
// 2. This function reads that cookie to identify the user.
// 3. On first API call, it creates a User + UserPreference row.
// 4. All subsequent calls just return the cookie-based ID.
//
// 🧠 Java analogy: HttpSession.getId() -- each browser session
//    gets a unique ID without requiring login.
//
// ── When real auth comes (Phase 12) ─────────────────────────
// Replace this with Supabase Auth. Optionally let users
// "claim" their anonymous progress by linking it to a real account.

import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ── In-memory cache ───────────────────────────────────────────
// Track which user IDs we've already confirmed exist in the DB.
// This prevents redundant upserts on every API call.
// Keyed by user ID → true if confirmed.
const ensuredUsers = new Set<string>();

export async function getDevUser() {
  // Read the anonymous user cookie
  const cookieStore = await cookies();
  const uid = cookieStore.get("gengo-uid")?.value;

  if (!uid) {
    // Fallback for edge cases (shouldn't happen if middleware is running)
    throw new Error("No gengo-uid cookie found. Middleware may not be running.");
  }

  // Already confirmed this user exists? Skip DB!
  if (ensuredUsers.has(uid)) {
    return { id: uid };
  }

  // First API call for this user: create User + Preferences if needed
  await prisma.user.upsert({
    where: { id: uid },
    update: {},
    create: {
      id: uid,
      email: `${uid.slice(0, 8)}@anon.gengo.garden`,
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: uid },
    update: {},
    create: { userId: uid },
  });

  ensuredUsers.add(uid);
  return { id: uid };
}

export function getDevUserId(): string {
  // This synchronous version can't read cookies.
  // Use getDevUser() instead for all new code.
  throw new Error("Use getDevUser() instead -- it reads the cookie.");
}
