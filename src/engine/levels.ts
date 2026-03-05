// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Level & Unlock System
//   "when the garden grows, new seeds appear" 🌷
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this file do? ─────────────────────────────────
// It decides WHEN new content unlocks. Two kinds of unlocks:
//
// 1. LEVEL UNLOCK: "Have enough flowers in this level bloomed?
//    If 90% of this level's kanji are at Guru (stage 5+),
//    open the next level!"
//
// 2. DEPENDENCY UNLOCK: "Has the user learned the building
//    blocks? If all the radicals for a kanji are Guru+,
//    that kanji becomes available as a lesson."
//
// Think of it like a skill tree in a video game:
// you can't unlock the boss fight until you've cleared
// enough stages. And you can't learn 人口 (population)
// until you've mastered 人 (person) and 口 (mouth).
//
// 🧠 Java analogy: This is like a dependency resolver --
//    Maven checks if all dependencies are satisfied before
//    letting you build. We check if all prerequisites are
//    Guru before letting you learn the next item.

import type { SrsStage, LevelCheckResult } from "./types";
import { GURU_STAGE, LEVEL_UNLOCK_THRESHOLD } from "./constants";

// ═══════════════════════════════════════════════════════════════
//  TYPE: Simplified item state for the engine
// ═══════════════════════════════════════════════════════════════

// The engine doesn't need the full database model -- it only
// needs the fields relevant to level/unlock calculations.
// This keeps the engine decoupled from Prisma.
//
// 🧠 Java analogy: This is like a DTO (Data Transfer Object).
//    The database has a full Item entity with 15 fields.
//    The engine only needs 4 of them. So we create a smaller
//    interface that carries just what's needed.

export interface ItemForLevelCheck {
  id: string;
  type: string;          // "component" | "character" | "vocabulary"
  level: number;
}

export interface UserStateForLevelCheck {
  itemId: string;
  srsStage: number;
}

export interface ItemWithDependencies {
  id: string;
  type: string;
  level: number;
  dependsOnItemIds: string[];  // IDs of prerequisite items
}

// ═══════════════════════════════════════════════════════════════
//  CORE: checkLevelUnlock
// ═══════════════════════════════════════════════════════════════

// ── Should the next level unlock? ───────────────────────────
// Counts how many "character" (kanji) items in the current level
// have reached Guru stage (5+). If that percentage meets the
// threshold (default 90%), the next level opens!
//
// Why only characters and not vocabulary?
// Because characters are the CORE of each level. Vocabulary
// is built FROM characters -- it's a secondary unlock.
// This mirrors WaniKani's approach: kanji progression drives
// level ups, vocabulary comes along for the ride.
//
// Parameters:
//   items:       all items in the current level
//   userStates:  the user's SRS progress for those items
//   currentLevel: which level to check
//   threshold:   what % needs to be Guru+ (default 0.90 = 90%)

export function checkLevelUnlock(
  items: ItemForLevelCheck[],
  userStates: UserStateForLevelCheck[],
  currentLevel: number,
  threshold: number = LEVEL_UNLOCK_THRESHOLD
): LevelCheckResult {

  // Step 1: Filter to only CHARACTER items in the current level.
  // We don't count components (radicals) or vocabulary for level unlock.
  //
  // .filter() is like Java's stream().filter():
  //   items.stream().filter(i -> i.type.equals("character") && i.level == currentLevel)

  const characters = items.filter(
    (item) => item.type === "character" && item.level === currentLevel
  );

  // Edge case: if there are no characters in this level, auto-unlock.
  // This shouldn't happen in practice, but defensive coding is good habit!
  if (characters.length === 0) {
    return {
      currentLevel,
      shouldUnlock: true,
      guruPercentage: 100,
      requiredPercentage: threshold * 100,
      newlyUnlockedItems: [],
    };
  }

  // Step 2: Build a lookup map of user states for fast access.
  // Instead of searching the array every time, we create a Map.
  //
  // 🧠 Java equivalent: Map<String, Integer> stageByItemId = new HashMap<>();
  //    In TypeScript, Map<string, number> works the same way!

  const stageByItemId = new Map<string, number>();
  for (const state of userStates) {
    stageByItemId.set(state.itemId, state.srsStage);
  }

  // Step 3: Count how many characters are at Guru+ (stage 5+).

  const guruCount = characters.filter((char) => {
    const stage = stageByItemId.get(char.id) ?? 0;
    return stage >= GURU_STAGE;
  }).length;

  // Step 4: Calculate the percentage and compare to threshold.

  const guruPercentage = (guruCount / characters.length) * 100;
  const shouldUnlock = guruPercentage >= threshold * 100;

  return {
    currentLevel,
    shouldUnlock,
    guruPercentage: Math.round(guruPercentage * 10) / 10,  // round to 1 decimal
    requiredPercentage: threshold * 100,
    newlyUnlockedItems: [],  // populated by the API layer after checking dependencies
  };
}

// ═══════════════════════════════════════════════════════════════
//  CORE: areDependenciesMet
// ═══════════════════════════════════════════════════════════════

// ── Can this specific item be unlocked? ─────────────────────
// An item can be unlocked if ALL of its prerequisites are at
// Guru stage (5+). If it has no dependencies, it's always unlockable.
//
// Example:
//   人口 (population) depends on 人 (person) and 口 (mouth).
//   If 人 is at stage 6 (Guru) and 口 is at stage 3 (not Guru),
//   then 人口 is NOT unlockable yet.
//
// 🧠 Java analogy: This is like checking Maven dependencies:
//    for (Dependency dep : item.getDependencies()) {
//      if (!isResolved(dep)) return false;
//    }
//    return true;

export function areDependenciesMet(
  item: ItemWithDependencies,
  userStates: UserStateForLevelCheck[]
): boolean {
  // No dependencies? Always unlockable!
  if (item.dependsOnItemIds.length === 0) {
    return true;
  }

  // Build lookup map for fast access
  const stageByItemId = new Map<string, number>();
  for (const state of userStates) {
    stageByItemId.set(state.itemId, state.srsStage);
  }

  // Check EVERY dependency. ALL must be at Guru+.
  // .every() returns true only if ALL items pass the test.
  // It's like Java's stream().allMatch(predicate).
  return item.dependsOnItemIds.every((depId) => {
    const stage = stageByItemId.get(depId) ?? 0;
    return stage >= GURU_STAGE;
  });
}

// ═══════════════════════════════════════════════════════════════
//  CORE: getUnlockableItems
// ═══════════════════════════════════════════════════════════════

// ── Which items can the user learn next? ────────────────────
// Filters a list of items to only those whose dependencies
// are ALL met AND that the user hasn't started yet.
//
// "Not started" means the item has no entry in userStates
// (the user has never seen this item).

export function getUnlockableItems(
  items: ItemWithDependencies[],
  userStates: UserStateForLevelCheck[]
): ItemWithDependencies[] {

  // Build a Set of item IDs the user already has progress on.
  // A Set is like Java's HashSet -- fast .has() lookups.
  const startedItemIds = new Set(userStates.map((s) => s.itemId));

  return items.filter((item) => {
    // Skip items the user has already started
    if (startedItemIds.has(item.id)) {
      return false;
    }

    // Check if all dependencies are met
    return areDependenciesMet(item, userStates);
  });
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: getLevelProgress
// ═══════════════════════════════════════════════════════════════

// Returns a summary of progress within a level.
// Useful for the dashboard: "Level 3: 7/10 kanji at Guru+"

export function getLevelProgress(
  items: ItemForLevelCheck[],
  userStates: UserStateForLevelCheck[],
  level: number
): { total: number; guruPlus: number; percentage: number } {

  const levelItems = items.filter((i) => i.level === level);
  if (levelItems.length === 0) {
    return { total: 0, guruPlus: 0, percentage: 0 };
  }

  const stageByItemId = new Map<string, number>();
  for (const state of userStates) {
    stageByItemId.set(state.itemId, state.srsStage);
  }

  const guruPlus = levelItems.filter((item) => {
    const stage = stageByItemId.get(item.id) ?? 0;
    return stage >= GURU_STAGE;
  }).length;

  return {
    total: levelItems.length,
    guruPlus,
    percentage: Math.round((guruPlus / levelItems.length) * 100),
  };
}
