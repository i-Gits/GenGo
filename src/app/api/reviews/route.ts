// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/reviews
//   "time to water the garden!" 💧
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this route do? ──────────────────────────────────
//
// GET  /api/reviews → "What items need reviewing right now?"
//   Builds a priority-sorted review queue using the engine.
//   Returns items with meanings/readings/mnemonics/deps for the answer key.
//
// POST /api/reviews → "I just answered a question!"
//   Takes the user's answer, grades it, runs SRS engine, updates DB.
//   Supports override=true for "Mark as Learned" feature.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";
import { buildReviewQueue } from "@/engine/review-queue";
import { processAnswer } from "@/engine/srs";
import { checkLevelUnlock } from "@/engine/levels";
import { BURN_STAGE } from "@/engine/constants";
import type { SrsStage } from "@/engine/types";

// ═══════════════════════════════════════════════════════════════
//  GET: Build the review queue
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const user = await getDevUser();

    // ── Parallel fetch: preferences + item states ─────────────
    const [prefs, itemStates] = await Promise.all([
      prisma.userPreference.findUnique({
        where: { userId: user.id },
      }),
      prisma.userItemState.findMany({
        where: {
          userId: user.id,
          srsStage: { lt: BURN_STAGE },
        },
        include: {
          item: {
            include: {
              meanings: true,
              readings: true,
              mnemonics: true,
              dependsOn: {
                include: {
                  dependsOnItem: {
                    include: { meanings: true },
                  },
                },
              },
              requiredBy: {
                include: {
                  item: {
                    include: { meanings: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const dailyLimit = prefs?.dailyReviewLimit ?? 100;

    // ── Transform into engine-friendly format ─────────────────
    const rawItems = itemStates
      .filter((s) => s.nextReviewAt !== null)
      .map((s) => ({
        itemId: s.itemId,
        primaryDisplay: s.item.primaryDisplay,
        type: s.item.type,
        srsStage: s.srsStage,
        nextReviewAt: s.nextReviewAt!,
      }));

    // ── Let the engine build the queue! ───────────────────────
    const queue = buildReviewQueue(rawItems, dailyLimit);

    // ── Enrich with all data for the answer key ───────────────
    const enrichedQueue = queue.map((queueItem) => {
      const state = itemStates.find((s) => s.itemId === queueItem.itemId);
      if (!state) return queueItem;

      return {
        ...queueItem,
        meanings: state.item.meanings.map((m) => ({
          meaning: m.meaning,
          isPrimary: m.isPrimary,
        })),
        readings: state.item.readings.map((r) => ({
          reading: r.reading,
          readingType: r.readingType,
          isPrimary: r.isPrimary,
        })),
        mnemonics: state.item.mnemonics.map((m) => ({
          type: m.mnemonicType,
          text: m.text,
        })),
        dependencies: state.item.dependsOn.map((d) => ({
          itemId: d.dependsOnItemId,
          display: d.dependsOnItem.primaryDisplay,
          meaning: d.dependsOnItem.meanings.find((m) => m.isPrimary)?.meaning ?? "",
        })),
        usedBy: state.item.requiredBy.map((d) => ({
          itemId: d.itemId,
          display: d.item.primaryDisplay,
          meaning: d.item.meanings.find((m) => m.isPrimary)?.meaning ?? "",
        })),
        userNote: state.userNote ?? "",
      };
    });

    return NextResponse.json({
      totalDue: enrichedQueue.length,
      dailyLimit,
      queue: enrichedQueue,
    });

  } catch (error) {
    console.error("❌ GET /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to load review queue" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  POST: Submit a review answer (or override)
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const user = await getDevUser();
    const body = await request.json();

    const { itemId, questionType, answer, responseTimeMs } = body;
    const isOverride = body.override === true;
    const overridePreviousStage = body.previousStage;

    // ── Validate input ────────────────────────────────────────
    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    if (!questionType || !["meaning", "reading"].includes(questionType)) {
      return NextResponse.json(
        { error: "questionType must be 'meaning' or 'reading'" },
        { status: 400 }
      );
    }

    if (!isOverride && (!answer || typeof answer !== "string")) {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 }
      );
    }

    // ── Get the item and user state ───────────────────────────
    const [item, userState] = await Promise.all([
      prisma.item.findUnique({
        where: { id: itemId },
        include: {
          meanings: true,
          readings: true,
        },
      }),
      prisma.userItemState.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId,
          },
        },
      }),
    ]);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (!userState) {
      return NextResponse.json(
        { error: "You haven't started learning this item yet" },
        { status: 400 }
      );
    }

    // ── Grade the answer ──────────────────────────────────────
    let isCorrect = false;
    let correctAnswers: string[] = [];

    if (questionType === "meaning") {
      correctAnswers = item.meanings.map((m) => m.meaning);
      isCorrect = correctAnswers.some(
        (correct) => correct.toLowerCase() === (answer ?? "").trim().toLowerCase()
      );
    } else {
      correctAnswers = item.readings.map((r) => r.reading);
      isCorrect = correctAnswers.some(
        (correct) => correct === (answer ?? "").trim()
      );
    }

    // ── Handle override: force correct ────────────────────────
    if (isOverride) {
      isCorrect = true;
    }

    // ── Determine the base stage for SRS calculation ──────────
    // For overrides, use the previous stage (before the incorrect penalty)
    // For normal answers, use the current stage from DB
    const baseStage = (isOverride && overridePreviousStage !== undefined)
      ? (overridePreviousStage as SrsStage)
      : (userState.srsStage as SrsStage);

    const now = new Date();
    const result = processAnswer(baseStage, isCorrect, now);

    // ── Update the database ───────────────────────────────────
    await prisma.$transaction([
      prisma.userItemState.update({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId,
          },
        },
        data: {
          srsStage: result.newStage,
          nextReviewAt: result.nextReviewAt,
          correctStreak: isCorrect
            ? (isOverride ? 1 : userState.correctStreak + 1)
            : 0,
          incorrectCount: isCorrect
            ? userState.incorrectCount
            : userState.incorrectCount + 1,
          burnedAt: result.isBurned ? now : null,
        },
      }),
      prisma.reviewLog.create({
        data: {
          userId: user.id,
          itemId,
          result: isCorrect ? "correct" : "incorrect",
          questionType,
          previousStage: baseStage,
          newStage: result.newStage,
          responseTimeMs: responseTimeMs ?? null,
        },
      }),
    ]);

    // ── Check for level unlock ────────────────────────────────
    let levelUp = null;

    if (item.type === "character" && isCorrect) {
      const allUserStates = await prisma.userItemState.findMany({
        where: { userId: user.id },
        include: { item: true },
      });

      const currentLevel = item.level;
      const levelCheck = checkLevelUnlock(
        allUserStates.map((s) => ({
          id: s.itemId,
          type: s.item.type,
          level: s.item.level,
        })),
        allUserStates.map((s) => ({
          itemId: s.itemId,
          srsStage: s.srsStage,
        })),
        currentLevel
      );

      if (levelCheck.shouldUnlock) {
        levelUp = {
          previousLevel: currentLevel,
          newLevel: currentLevel + 1,
          guruPercentage: levelCheck.guruPercentage,
        };
      }
    }

    return NextResponse.json({
      isCorrect,
      correctAnswers,
      previousStage: baseStage,
      newStage: result.newStage,
      stageChange: result.stageChange,
      isBurned: result.isBurned,
      nextReviewAt: result.nextReviewAt,
      levelUp,
    });

  } catch (error) {
    console.error("❌ POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 }
    );
  }
}
