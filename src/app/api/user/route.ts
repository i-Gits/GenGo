// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/user
//   "every gardener has their own style" ✨
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this route do? ──────────────────────────────────
//
// GET  /api/user → "Who am I and what are my settings?"
//   Returns the user's profile and preferences.
//
// PUT  /api/user → "I want to change my settings!"
//   Updates user preferences (honorific, theme, lesson batch
//   size, daily review limit, encouragement mode).
//
// 🧠 Java analogy:
//   GET = @GetMapping("/api/user") → getUserProfile(userId)
//   PUT = @PutMapping("/api/user") → updatePreferences(userId, prefs)
//
// Why PUT instead of POST?
//   PUT = "replace/update an existing resource"
//   POST = "create a new resource"
//   Since preferences already exist (created with the user),
//   we UPDATE them with PUT. Same as PATCH but simpler.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";
import type { EncouragementMode } from "@/engine/types";

// Valid encouragement modes (from types.ts)
const VALID_MODES: EncouragementMode[] = [
  "playful", "teacher", "tsundere", "yandere",
  "boring", "wildcard", "crazyhana",
];

// ═══════════════════════════════════════════════════════════════
//  GET: Get user profile and preferences
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const user = await getDevUser();

    // Fetch user with their preferences in one query
    // 🧠 This is like a LEFT JOIN -- user + preferences together
    const userWithPrefs = await prisma.user.findUnique({
      where: { id: user.id },
      include: { preferences: true },
    });

    if (!userWithPrefs) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ── Shape the response ──────────────────────────────────
    // We don't expose internal IDs or raw DB fields.
    // Instead, we return a clean, frontend-friendly object.
    // 🧠 Java: ResponseEntity<UserProfileDTO>

    return NextResponse.json({
      email: userWithPrefs.email,
      createdAt: userWithPrefs.createdAt,
      preferences: {
        honorific: userWithPrefs.preferences?.honorific ?? "勇者",
        preferredName: userWithPrefs.preferences?.preferredName ?? "",
        encouragementMode: userWithPrefs.preferences?.encouragementMode ?? "playful",
        theme: userWithPrefs.preferences?.theme ?? "light",
        lessonBatchSize: userWithPrefs.preferences?.lessonBatchSize ?? 5,
        dailyReviewLimit: userWithPrefs.preferences?.dailyReviewLimit ?? 100,
      },
    });

  } catch (error) {
    console.error("❌ GET /api/user error:", error);
    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  PUT: Update user preferences
// ═══════════════════════════════════════════════════════════════

// ── Request body (all fields optional) ────────────────────────
// {
//   "honorific": "王女",
//   "preferredName": "Arc",
//   "encouragementMode": "tsundere",
//   "theme": "dark",
//   "lessonBatchSize": 10,
//   "dailyReviewLimit": 50
// }
//
// Only send the fields you want to change!
// This is called a "partial update" pattern.

export async function PUT(request: NextRequest) {
  try {
    const user = await getDevUser();
    const body = await request.json();

    // ── Validate each field if present ────────────────────────
    // We only update fields that are provided AND valid.
    // This prevents bad data from sneaking in!
    //
    // 🧠 Java: @Valid with custom validators
    //    We do it manually here for clarity.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    // Honorific (title)
    if (body.honorific !== undefined) {
      if (typeof body.honorific !== "string" || body.honorific.length > 50) {
        return NextResponse.json(
          { error: "Honorific must be a string under 50 characters" },
          { status: 400 }
        );
      }
      updateData.honorific = body.honorific;
    }

    // Preferred name
    if (body.preferredName !== undefined) {
      if (typeof body.preferredName !== "string" || body.preferredName.length > 100) {
        return NextResponse.json(
          { error: "Preferred name must be a string under 100 characters" },
          { status: 400 }
        );
      }
      updateData.preferredName = body.preferredName;
    }

    // Encouragement mode
    if (body.encouragementMode !== undefined) {
      if (!VALID_MODES.includes(body.encouragementMode)) {
        return NextResponse.json(
          { error: `Encouragement mode must be one of: ${VALID_MODES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.encouragementMode = body.encouragementMode;
    }

    // Theme
    if (body.theme !== undefined) {
      if (!["light", "dark"].includes(body.theme)) {
        return NextResponse.json(
          { error: "Theme must be 'light' or 'dark'" },
          { status: 400 }
        );
      }
      updateData.theme = body.theme;
    }

    // Lesson batch size
    if (body.lessonBatchSize !== undefined) {
      const size = Number(body.lessonBatchSize);
      if (!Number.isInteger(size) || size < 1 || size > 50) {
        return NextResponse.json(
          { error: "Lesson batch size must be an integer between 1 and 50" },
          { status: 400 }
        );
      }
      updateData.lessonBatchSize = size;
    }

    // Daily review limit
    if (body.dailyReviewLimit !== undefined) {
      const limit = Number(body.dailyReviewLimit);
      if (!Number.isInteger(limit) || limit < 0 || limit > 1000) {
        return NextResponse.json(
          { error: "Daily review limit must be 0-1000 (0 = unlimited)" },
          { status: 400 }
        );
      }
      updateData.dailyReviewLimit = limit;
    }

    // ── Nothing to update? ────────────────────────────────────
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // ── Save to database ──────────────────────────────────────
    const updated = await prisma.userPreference.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Preferences updated!",
      preferences: {
        honorific: updated.honorific,
        preferredName: updated.preferredName,
        encouragementMode: updated.encouragementMode,
        theme: updated.theme,
        lessonBatchSize: updated.lessonBatchSize,
        dailyReviewLimit: updated.dailyReviewLimit,
      },
    });

  } catch (error) {
    console.error("❌ PUT /api/user error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
