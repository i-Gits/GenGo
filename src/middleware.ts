// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Middleware -- Anonymous User Cookie
//   "every gardener gets their own plot" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is middleware? ──────────────────────────────────────────
//
// Middleware runs BEFORE every request hits your API routes or pages.
// It's like a bouncer at the door -- it checks if you have a cookie
// (your garden membership card) and gives you one if you don't.
//
// 🧠 Java analogy: This is like a Servlet Filter or Spring Interceptor.
//    request → [middleware] → [API route / page]
//
// ── Why cookies for anonymous users? ─────────────────────────────
//
// Each visitor gets a unique ID stored in a cookie (gengo-uid).
// This ID maps to their own User row in the database.
// No login required! Their progress is tied to their browser.
//
// When we add real auth later (Supabase Auth), we can:
// 1. Let users "claim" their anonymous progress by linking it to a real account
// 2. Or just start fresh with a new authenticated user

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Already has a user cookie? Pass through
  if (request.cookies.get("gengo-uid")) {
    return response;
  }

  // First visit → generate anonymous ID
  const uid = crypto.randomUUID();
  response.cookies.set("gengo-uid", uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return response;
}

// Only run middleware on API routes and pages (not static files)
export const config = {
  matcher: [
    "/",
    "/lessons",
    "/reviews",
    "/settings",
    "/api/:path*",
  ],
};
