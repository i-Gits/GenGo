// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/progress
//   "how is my garden doing?" 🌸
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// Returns dashboard data + user personality for the homepage.
// Optimized with Promise.all for parallel DB queries.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";
import { getLevelProgress } from "@/engine/levels";
import { BURN_STAGE, GURU_STAGE } from "@/engine/constants";
import type { SrsStage } from "@/engine/types";

export async function GET() {
  try {
    const user = await getDevUser();

    // ── Step 1: Parallel fetch -- user states + preferences ───
    const [userStates, prefs] = await Promise.all([
      prisma.userItemState.findMany({
        where: { userId: user.id },
        include: { item: true },
      }),
      prisma.userPreference.findUnique({
        where: { userId: user.id },
      }),
    ]);

    // ── Step 2: Stage counts ──────────────────────────────────
    const stageCounts: Record<number, number> = {};
    for (let i = 0; i <= 9; i++) stageCounts[i] = 0;
    for (const state of userStates) {
      stageCounts[state.srsStage] = (stageCounts[state.srsStage] ?? 0) + 1;
    }

    // ── Step 3: Reviews available ─────────────────────────────
    const now = new Date();
    const reviewsAvailable = userStates.filter((s) => {
      if (s.srsStage >= BURN_STAGE) return false;
      if (!s.nextReviewAt) return false;
      return s.nextReviewAt <= now;
    }).length;

    // ── Step 4: Current level ─────────────────────────────────
    const currentLevel = userStates.length > 0
      ? Math.max(...userStates.map((s) => s.item.level))
      : 1;

    // ── Step 5: Parallel fetch -- level items + accuracy ──────
    const [levelItems, correctCount, totalCount] = await Promise.all([
      prisma.item.findMany({
        where: { level: currentLevel },
        include: { dependsOn: true },
      }),
      prisma.reviewLog.count({
        where: { userId: user.id, result: "correct" },
      }),
      prisma.reviewLog.count({
        where: { userId: user.id },
      }),
    ]);

    // ── Step 6: Lessons available ─────────────────────────────
    const startedItemIds = new Set(userStates.map((s) => s.itemId));
    const stageByItemId = new Map<string, number>();
    for (const state of userStates) {
      stageByItemId.set(state.itemId, state.srsStage);
    }

    const lessonsAvailable = levelItems.filter((item) => {
      if (startedItemIds.has(item.id)) return false;
      return item.dependsOn.every((dep) => {
        const depStage = stageByItemId.get(dep.dependsOnItemId) ?? 0;
        return depStage >= GURU_STAGE;
      });
    }).length;

    // ── Step 7: Accuracy ──────────────────────────────────────
    const overallAccuracy = totalCount > 0
      ? Math.round((correctCount / totalCount) * 100) / 100
      : 0;

    // ── Step 8: Level progress ────────────────────────────────
    const levelProgress = getLevelProgress(
      levelItems.map((i) => ({ id: i.id, type: i.type, level: i.level })),
      userStates.map((s) => ({ itemId: s.itemId, srsStage: s.srsStage })),
      currentLevel
    );

    // ── Step 9: Return with personality info ──────────────────
    return NextResponse.json({
      currentLevel,
      totalItems: userStates.length,
      stageCounts: stageCounts as Record<SrsStage, number>,
      reviewsAvailable,
      lessonsAvailable,
      overallAccuracy,
      levelProgress,
      // User personality (for homepage dropdown)
      encouragementMode: prefs?.encouragementMode ?? "playful",
      preferredName: prefs?.preferredName ?? "",
      honorific: prefs?.honorific ?? "勇者",
    });

  } catch (error) {
    console.error("❌ /api/progress error:", error);
    return NextResponse.json(
      { error: "Failed to load progress data" },
      { status: 500 }
    );
  }
}
