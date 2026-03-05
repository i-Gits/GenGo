// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/lessons
//   "what new seeds can I plant today?" 🌰
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this route do? ──────────────────────────────────
//
// GET  /api/lessons → "What items are available to learn?"
//   Returns items the user hasn't started yet, whose
//   dependencies are all at Guru+ (stage 5+).
//   Ordered: components first, then characters, then vocabulary.
//
// POST /api/lessons → "I want to start learning these items!"
//   Creates UserItemState records for the given item IDs.
//   Sets them to stage 0 (Seed) with immediate review.
//
// 🧠 Java analogy:
//   GET  = @GetMapping("/api/lessons") → findAvailableLessons(userId)
//   POST = @PostMapping("/api/lessons") → startLessons(userId, itemIds)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";
import { getUnlockableItems } from "@/engine/levels";

// ═══════════════════════════════════════════════════════════════
//  GET: What lessons are available?
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getDevUser();
    const { searchParams } = new URL(request.url);
    const diligent = searchParams.get("diligent") === "true";

    // ── Get user's current level ──────────────────────────────
    const userStates = await prisma.userItemState.findMany({
      where: { userId: user.id },
      select: { itemId: true, srsStage: true },
    });

    // Current level = highest level with started items, or 1
    let currentLevel = 1;
    if (userStates.length > 0) {
      const startedItems = await prisma.item.findMany({
        where: { id: { in: userStates.map((s) => s.itemId) } },
        select: { level: true },
      });
      currentLevel = Math.max(...startedItems.map((i) => i.level), 1);
    }

    // ── Get items -- diligent mode expands the pool ───────────
    // Normal mode: only items in current level
    // Diligent mode: current level + next level (study ahead!)

    const levelFilter = diligent
      ? { level: { lte: currentLevel + 1 } }
      : { level: currentLevel };

    const levelItems = await prisma.item.findMany({
      where: levelFilter,
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
      },
      orderBy: [
        { level: "asc" },
        { type: "asc" },
        { primaryDisplay: "asc" },
      ],
    });

    const startedIds = new Set(userStates.map((s) => s.itemId));

    // ── Filter available items ────────────────────────────────
    let availableItems;

    if (diligent) {
      // Diligent mode: ALL unstarted items (ignore dependency check)
      availableItems = levelItems.filter((item) => !startedIds.has(item.id));
    } else {
      // Normal mode: only unlockable items (dependencies met)
      const itemsForEngine = levelItems.map((item) => ({
        id: item.id,
        type: item.type,
        level: item.level,
        dependsOnItemIds: item.dependsOn.map((d) => d.dependsOnItemId),
      }));

      const statesForEngine = userStates.map((s) => ({
        itemId: s.itemId,
        srsStage: s.srsStage,
      }));

      const unlockable = getUnlockableItems(itemsForEngine, statesForEngine);
      const unlockableIds = new Set(unlockable.map((u) => u.id));
      availableItems = levelItems.filter((item) => unlockableIds.has(item.id));
    }

    // ── Build the response ────────────────────────────────────
    const lessons = availableItems.map((item) => ({
      id: item.id,
      type: item.type,
      level: item.level,
      primaryDisplay: item.primaryDisplay,
      meanings: item.meanings.map((m) => ({
        meaning: m.meaning,
        isPrimary: m.isPrimary,
      })),
      readings: item.readings.map((r) => ({
        reading: r.reading,
        readingType: r.readingType,
        isPrimary: r.isPrimary,
      })),
      mnemonics: item.mnemonics.map((m) => ({
        type: m.mnemonicType,
        text: m.text,
      })),
      dependencies: item.dependsOn.map((d) => ({
        itemId: d.dependsOnItemId,
        display: d.dependsOnItem.primaryDisplay,
        meaning: d.dependsOnItem.meanings.find((m) => m.isPrimary)?.meaning ?? "",
      })),
    }));

    return NextResponse.json({
      currentLevel,
      totalAvailable: lessons.length,
      lessons,
      isDiligent: diligent,
    });

  } catch (error) {
    console.error("❌ GET /api/lessons error:", error);
    return NextResponse.json(
      { error: "Failed to load lessons" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  POST: Start learning new items
// ═══════════════════════════════════════════════════════════════

// ── Request body ──────────────────────────────────────────────
// { "itemIds": ["comp-一", "comp-｜", ...] }
//
// The user selected which items to learn. We create a
// UserItemState for each, setting stage to 0 (Seed) with
// an immediate review time (so they can practice right away).

export async function POST(request: NextRequest) {
  try {
    const user = await getDevUser();
    const body = await request.json();

    // ── Validate input ────────────────────────────────────────
    // Always validate what the client sends! Never trust client data.
    // 🧠 Java: @Valid @RequestBody LessonStartRequest request

    const itemIds: string[] = body.itemIds;
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds must be a non-empty array" },
        { status: 400 }  // 400 = Bad Request
      );
    }

    // ── Verify items exist ────────────────────────────────────
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: "Some item IDs are invalid" },
        { status: 400 }
      );
    }

    // ── Check if user already started any of these ────────────
    const existingStates = await prisma.userItemState.findMany({
      where: {
        userId: user.id,
        itemId: { in: itemIds },
      },
    });

    const alreadyStartedIds = new Set(existingStates.map((s) => s.itemId));
    const newItemIds = itemIds.filter((id) => !alreadyStartedIds.has(id));

    if (newItemIds.length === 0) {
      return NextResponse.json(
        { message: "All items already started", started: 0 },
        { status: 200 }
      );
    }

    // ── Create UserItemState for each new item ────────────────
    // Stage 0 (Seed) with immediate review.
    //
    // createMany is like a batch INSERT in SQL.
    // Much more efficient than inserting one by one!
    // 🧠 Java: jdbcTemplate.batchUpdate(sql, batchArgs)

    const now = new Date();
    await prisma.userItemState.createMany({
      data: newItemIds.map((itemId) => ({
        userId: user.id,
        itemId,
        srsStage: 0,           // Seed stage
        correctStreak: 0,
        incorrectCount: 0,
        nextReviewAt: now,      // Immediate first review!
        unlockedAt: now,
      })),
    });

    return NextResponse.json({
      message: `Started ${newItemIds.length} new lessons!`,
      started: newItemIds.length,
      skipped: alreadyStartedIds.size,
      itemIds: newItemIds,
    });

  } catch (error) {
    console.error("❌ POST /api/lessons error:", error);
    return NextResponse.json(
      { error: "Failed to start lessons" },
      { status: 500 }
    );
  }
}
