// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/user/reset
//   "sometimes a garden needs to start fresh" 🔥
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this route do? ──────────────────────────────────
//
// DELETE /api/user/reset → "Burn my garden to the ground!"
//   Deletes ALL user progress (SRS states, review logs)
//   but KEEPS the user account and preferences.
//
//   This is like pulling up all the flowers but keeping
//   the garden plot and your gardening tools.
//
// 🧠 Java analogy:
//   @DeleteMapping("/api/user/reset") → resetProgress(userId)
//
// Why DELETE? Because we're destroying data. POST would work
// too, but DELETE semantically says "remove something."

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";

export async function DELETE() {
  try {
    const user = await getDevUser();

    // ── Delete all user progress ──────────────────────────────
    // Order matters! Delete dependent records first.
    // ReviewLog references UserItemState, so delete logs first.
    //
    // 🧠 Java: cascading deletes, but we do it explicitly
    //    for clarity and control.

    const [deletedLogs, deletedStates] = await Promise.all([
      // Delete all review history
      prisma.reviewLog.deleteMany({
        where: { userId: user.id },
      }),
      // Delete all SRS progress (stages, notes, review times)
      prisma.userItemState.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    // Level is computed dynamically from progress, so deleting
    // all UserItemStates automatically puts the user back to Level 1.
    // No need to update anything else!

    return NextResponse.json({
      message: "Garden reset complete. A fresh start awaits! 🌱",
      deleted: {
        reviewLogs: deletedLogs.count,
        itemStates: deletedStates.count,
      },
    });

  } catch (error) {
    console.error("❌ DELETE /api/user/reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset progress" },
      { status: 500 }
    );
  }
}
