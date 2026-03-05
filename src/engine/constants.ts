// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Engine -- Constants
//   "the rules of the garden" 🌿
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What are constants? ─────────────────────────────────────
// Constants are values that NEVER change while the app runs.
// In Java: public static final int MAX_STAGE = 9;
// In TypeScript: export const MAX_STAGE = 9;
//
// We put them all in one file so they're easy to find and
// update. If you want to change "4 hours" to "3 hours" for
// stage 1, you change it HERE -- not scattered across 10 files.
// That's the DRY principle: Don't Repeat Yourself.

import type { SrsStage, SrsIntervalConfig } from "./types";

// ── SRS Stage boundaries ────────────────────────────────────
export const MIN_STAGE: SrsStage = 0;
export const MAX_STAGE: SrsStage = 9;
export const BURN_STAGE: SrsStage = 9;  // "eternal" / "pressed flower"
export const GURU_STAGE: SrsStage = 5;  // items at this stage count toward level unlock

// ── Default SRS intervals (Japanese) ────────────────────────
// These are the DEFAULT intervals. The srs_configs table in the
// database can override these per language. But if no DB config
// exists, we fall back to these.
//
// 🌱 The flower grows at these intervals:

export const DEFAULT_SRS_INTERVALS: SrsIntervalConfig[] = [
  { stage: 0, intervalHours: 0,      penaltyStages: 0 },  // 🌰 Seed     -- just learned
  { stage: 1, intervalHours: 4,      penaltyStages: 1 },  // 🌱 Sprout   -- 4 hours
  { stage: 2, intervalHours: 8,      penaltyStages: 1 },  // 🪴 Seedling -- 8 hours
  { stage: 3, intervalHours: 24,     penaltyStages: 1 },  // 🌿 Young    -- 1 day
  { stage: 4, intervalHours: 72,     penaltyStages: 2 },  // 🌷 Budding  -- 3 days
  { stage: 5, intervalHours: 168,    penaltyStages: 2 },  // 🌸 Blooming -- 1 week
  { stage: 6, intervalHours: 336,    penaltyStages: 2 },  // 🌺 Full     -- 2 weeks
  { stage: 7, intervalHours: 720,    penaltyStages: 2 },  // 💐 Flourish -- 1 month
  { stage: 8, intervalHours: 2880,   penaltyStages: 2 },  // 🌳 Rooted   -- 4 months
  { stage: 9, intervalHours: 0,      penaltyStages: 0 },  // 🪻 Eternal  -- never again
];

// ── Level unlock threshold ──────────────────────────────────
// What % of a level's characters need to be at Guru (stage 5+)
// before the next level unlocks.
export const LEVEL_UNLOCK_THRESHOLD = 0.90;  // 90%

// ── Lesson batch sizes (user picks in settings) ─────────────
export const LESSON_BATCH_OPTIONS = [5, 10, 15, 20] as const;
export const DEFAULT_LESSON_BATCH_SIZE = 5;

// ── Daily review limit ──────────────────────────────────────
export const DEFAULT_DAILY_REVIEW_LIMIT = 100;  // 0 = unlimited

// ── Flower stage display names ──────────────────────────────
// Maps internal stage numbers → cute display names.
// This lives in constants (not UI) because it's used by the
// API layer too (for sending stage names in API responses).

export const FLOWER_STAGE_NAMES: Record<SrsStage, string> = {
  0: "Seed",
  1: "Sprout",
  2: "Seedling",
  3: "Young Plant",
  4: "Budding",
  5: "Blooming",
  6: "Full Bloom",
  7: "Flourishing",
  8: "Deeply Rooted",
  9: "Eternal",
};

export const FLOWER_STAGE_EMOJI: Record<SrsStage, string> = {
  0: "🌰",
  1: "🌱",
  2: "🪴",
  3: "🌿",
  4: "🌷",
  5: "🌸",
  6: "🌺",
  7: "💐",
  8: "🌳",
  9: "🪻",
};
