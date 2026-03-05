// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Review Queue
//   "which flowers need watering today?" 💧
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this file do? ─────────────────────────────────
// When you open GenGo! and see "12 flowers need watering!",
// this file decided WHICH 12 flowers and in WHAT ORDER.
//
// It answers three questions:
// 1. Which items are DUE for review? (nextReviewAt <= now)
// 2. Which ones are MOST urgent? (more overdue = higher priority)
// 3. How many should we show? (respect the daily limit)
//
// Priority logic:
//   - More overdue items come first (neglected flowers first!)
//   - Lower-stage items come first (baby plants need more care)
//   - Burned items (stage 9) are NEVER in the queue
//
// 🧠 This is like a priority queue / min-heap in data structures.
//    In Java: PriorityQueue<ReviewItem> with a custom Comparator.
//    In TypeScript: we use Array.sort() with a comparison function.

import type { SrsStage, ReviewQueueItem, FlowerHealth } from "./types";
import { BURN_STAGE } from "./constants";

// ═══════════════════════════════════════════════════════════════
//  TYPE: Raw review item from the database
// ═══════════════════════════════════════════════════════════════

// What the API layer gives us (a simplified view of user_item_states
// joined with items). The engine doesn't talk to the DB directly.

export interface RawReviewItem {
  itemId: string;
  primaryDisplay: string;       // "人"
  type: string;                 // "component" | "character" | "vocabulary"
  srsStage: number;
  nextReviewAt: Date;
}

// ═══════════════════════════════════════════════════════════════
//  CORE: calculateOverdueness
// ═══════════════════════════════════════════════════════════════

// ── How overdue is this flower? ─────────────────────────────
// Returns a number representing how "late" a review is.
// Higher number = more overdue = higher priority.
//
// Formula: (now - nextReviewAt) / intervalForCurrentStage
//
// But simplified: we just use the raw millisecond difference.
// An item due 3 days ago is more urgent than one due 1 hour ago.
//
// If the item isn't due yet (future date), overdueness is 0.

export function calculateOverdueness(
  nextReviewAt: Date,
  now: Date = new Date()
): number {
  const diffMs = now.getTime() - nextReviewAt.getTime();

  // Not due yet? Overdueness is 0.
  if (diffMs <= 0) return 0;

  // Convert to hours for a human-readable scale.
  // 1 hour overdue = 1.0, 1 day overdue = 24.0, etc.
  return diffMs / (1000 * 60 * 60);
}

// ═══════════════════════════════════════════════════════════════
//  CORE: filterDueItems
// ═══════════════════════════════════════════════════════════════

// ── Which items need watering RIGHT NOW? ────────────────────
// Filters to only items where:
//   - nextReviewAt is in the past (or now)
//   - srsStage is NOT burned (stage 9)
//
// Returns them with overdueness calculated.

export function filterDueItems(
  items: RawReviewItem[],
  now: Date = new Date()
): ReviewQueueItem[] {
  return items
    .filter((item) => {
      // Skip burned/eternal items -- they're done forever!
      if (item.srsStage >= BURN_STAGE) return false;

      // Only include items that are due (nextReviewAt <= now)
      return item.nextReviewAt.getTime() <= now.getTime();
    })
    .map((item) => ({
      itemId: item.itemId,
      primaryDisplay: item.primaryDisplay,
      type: item.type as ReviewQueueItem["type"],
      srsStage: item.srsStage as SrsStage,
      nextReviewAt: item.nextReviewAt,
      overdueness: calculateOverdueness(item.nextReviewAt, now),
    }));
}

// ═══════════════════════════════════════════════════════════════
//  CORE: sortByPriority
// ═══════════════════════════════════════════════════════════════

// ── What order should we show reviews in? ───────────────────
// Priority rules (highest priority first):
//   1. More overdue items first (wilting flowers need water NOW)
//   2. If equally overdue, lower stage items first
//      (baby plants are more fragile than mature ones)
//
// 🧠 Java equivalent:
//    Collections.sort(items, Comparator
//      .comparing(ReviewItem::getOverdueness).reversed()
//      .thenComparing(ReviewItem::getSrsStage));
//
// In TypeScript, .sort() takes a comparison function:
//   negative = a comes first
//   positive = b comes first
//   zero = equal

export function sortByPriority(
  items: ReviewQueueItem[]
): ReviewQueueItem[] {
  // Create a copy so we don't mutate the original array.
  // The spread operator [...array] makes a shallow copy.
  // 🧠 Java: new ArrayList<>(items) -- same idea.
  return [...items].sort((a, b) => {
    // Primary sort: more overdue first (descending)
    const overdueDiff = b.overdueness - a.overdueness;
    if (overdueDiff !== 0) return overdueDiff;

    // Secondary sort: lower stage first (ascending)
    // Baby plants (stage 1) before mature plants (stage 6)
    return a.srsStage - b.srsStage;
  });
}

// ═══════════════════════════════════════════════════════════════
//  CORE: applyDailyLimit
// ═══════════════════════════════════════════════════════════════

// ── Don't let the user drown in reviews! ────────────────────
// If the user has set a daily review limit (e.g., 100),
// we cap the queue to that number.
// Limit of 0 means unlimited.
//
// .slice() is like Java's subList(): returns a portion of the array.

export function applyDailyLimit(
  items: ReviewQueueItem[],
  dailyLimit: number
): ReviewQueueItem[] {
  if (dailyLimit <= 0) return items;  // 0 = unlimited
  return items.slice(0, dailyLimit);
}

// ═══════════════════════════════════════════════════════════════
//  COMBINED: buildReviewQueue
// ═══════════════════════════════════════════════════════════════

// ── The "one function to rule them all" ─────────────────────
// Chains together: filter → sort → limit.
// This is what the API route will call.
//
// 🧠 Java equivalent using streams:
//    items.stream()
//      .filter(this::isDue)
//      .sorted(priorityComparator)
//      .limit(dailyLimit)
//      .collect(Collectors.toList())
//
// In TypeScript, we do the same thing with our helper functions:

export function buildReviewQueue(
  items: RawReviewItem[],
  dailyLimit: number = 0,
  now: Date = new Date()
): ReviewQueueItem[] {
  const dueItems = filterDueItems(items, now);
  const sorted = sortByPriority(dueItems);
  return applyDailyLimit(sorted, dailyLimit);
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: getFlowerHealth
// ═══════════════════════════════════════════════════════════════

// ── How is this flower doing? ───────────────────────────────
// Calculates the visual health state of a flower based on
// whether its review is overdue and by how much.
//
// This powers the wilting mechanic in the UI:
//   🌸 thriving  = reviewed on time, correct streak
//   🌿 healthy   = reviewed on time
//   🥀 wilting   = slightly overdue (< 24 hours late)
//   🏜️  dry       = very overdue (> 24 hours late)
//   💧 watered   = just completed an overdue review (temporary)

export function getFlowerHealth(
  nextReviewAt: Date | null,
  srsStage: number,
  correctStreak: number,
  now: Date = new Date()
): FlowerHealth {
  // Burned flowers are always thriving (they're eternal!)
  if (srsStage >= BURN_STAGE) return "thriving";

  // No review scheduled yet (brand new item)
  if (!nextReviewAt) return "healthy";

  const overdueHours = calculateOverdueness(nextReviewAt, now);

  // Not overdue at all
  if (overdueHours <= 0) {
    return correctStreak >= 3 ? "thriving" : "healthy";
  }

  // Slightly overdue (less than 24 hours)
  if (overdueHours < 24) return "wilting";

  // Very overdue (more than 24 hours)
  return "dry";
}
