// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   API Route: /api/notes
//   "personal thoughts on each flower" 📝
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// PUT /api/notes → Save user note for an item
// { "itemId": "char-人", "note": "Looks like a person walking!" }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevUser } from "@/lib/dev-user";

export async function PUT(request: NextRequest) {
  try {
    const user = await getDevUser();
    const { itemId, note } = await request.json();

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    if (typeof note !== "string") {
      return NextResponse.json(
        { error: "note must be a string" },
        { status: 400 }
      );
    }

    await prisma.userItemState.update({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId,
        },
      },
      data: {
        userNote: note.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ PUT /api/notes error:", error);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }
}
