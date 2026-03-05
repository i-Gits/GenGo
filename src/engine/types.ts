// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Engine -- Type Definitions
//   "the blueprint before the garden" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What are "types"? ──────────────────────────────────────
// In Java, you declare types with classes and interfaces:
//   public class Item { String display; int level; }
//
// In TypeScript, we use `type` and `interface` for the same thing:
//   type Item = { display: string; level: number; }
//
// They describe the SHAPE of data -- what fields exist and
// what kind of value each field holds. This prevents bugs
// because TypeScript catches mistakes BEFORE you run the code.
//
// 🧠 Think of types like a form template:
//    The template says "name: _____, age: _____"
//    The filled form says "name: arc, age: 25"
//    Types are the template. Actual data is the filled form.

// ── SRS Stage: just a number 0-9 in the engine ─────────────
// The flower names (Seed, Sprout, Bloom...) live in the UI layer.
// The engine only deals with numbers. Clean separation!

export type SrsStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// ── The result of processing a review answer ────────────────
// When the engine calculates what happens after an answer,
// it returns this object. The API layer then saves it to the DB.

export interface SrsTransitionResult {
  newStage: SrsStage;             // the stage after this answer
  nextReviewAt: Date | null;      // when to review next (null = burned/eternal)
  stageChange: number;            // +1 for correct, -1 or -2 for wrong
  isBurned: boolean;              // did this item just reach stage 9?
}

// ── SRS interval config (from the srs_configs table) ────────
export interface SrsIntervalConfig {
  stage: SrsStage;
  intervalHours: number;          // hours until next review
  penaltyStages: number;          // how many stages to drop on wrong answer
}

// ── Item types ──────────────────────────────────────────────
// These match the "type" field in the items table.
// Using a union type means TypeScript will yell at you if
// you accidentally write "kanji" instead of "character".

export type ItemType = "component" | "character" | "vocabulary" | "phrase" | "grammar";

// ── Review answer input ─────────────────────────────────────
export interface ReviewAnswer {
  itemId: string;
  userId: string;
  answer: string;                  // what the user typed
  questionType: "meaning" | "reading";
  responseTimeMs?: number;         // how long they took
}

// ── Level unlock check result ───────────────────────────────
export interface LevelCheckResult {
  currentLevel: number;
  shouldUnlock: boolean;           // is the next level ready?
  guruPercentage: number;          // % of characters at Guru+ (stage 5+)
  requiredPercentage: number;      // the threshold (default 90%)
  newlyUnlockedItems: string[];    // item IDs that just became available
}

// ── Review queue item ───────────────────────────────────────
export interface ReviewQueueItem {
  itemId: string;
  primaryDisplay: string;          // "人"
  type: ItemType;
  srsStage: SrsStage;
  nextReviewAt: Date;
  overdueness: number;             // how overdue (for priority sorting)
}

// ── Dashboard stats ─────────────────────────────────────────
export interface DashboardStats {
  currentLevel: number;
  totalItems: number;
  stageCounts: Record<SrsStage, number>;  // how many items at each stage
  reviewsAvailable: number;
  lessonsAvailable: number;
  overallAccuracy: number;         // lifetime correct %
}

// ── Encouragement mode ──────────────────────────────────────
export type EncouragementMode =
  | "playful"      // 🌸 Playful Tease
  | "teacher"      // 📖 Encouraging Teacher
  | "tsundere"     // 😤 Tsundere
  | "yandere"      // 🔪 Yandere
  | "boring"       // 📋 Boring & Straight
  | "wildcard"     // 🃏 Wildcard
  | "crazyhana";   // 🤪 CrazyHana

// ── Flower health state (for the wilting mechanic) ──────────
export type FlowerHealth = "thriving" | "healthy" | "wilting" | "dry" | "watered";
