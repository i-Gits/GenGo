// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Dev User Helper
//   "a placeholder gardener until auth grows" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── Why does this exist? ──────────────────────────────────────
// We don't have Supabase Auth wired up yet (that's Phase 12).
// But our API routes need a user ID to read/write data.
//
// OPTIMIZED: We cache the user creation so we don't hit the DB
// on every single API call. First call creates the user, then
// all subsequent calls just return the cached ID instantly.

import { prisma } from "./prisma";

const DEV_USER_ID = "dev-user-arc";

// ── In-memory cache ───────────────────────────────────────────
// Once the dev user is created, we skip the DB entirely.
// This makes API calls MUCH faster after the first one.
let userEnsured = false;

export async function getDevUser() {
  // Already confirmed the user exists? Skip DB!
  if (userEnsured) {
    return { id: DEV_USER_ID };
  }

  // First call: create the user + preferences if needed
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: "dev@gengo.garden",
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: DEV_USER_ID },
    update: {},
    create: { userId: DEV_USER_ID },
  });

  userEnsured = true;
  return { id: DEV_USER_ID };
}

export function getDevUserId(): string {
  return DEV_USER_ID;
}
