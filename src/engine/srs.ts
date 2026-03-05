// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! SRS Engine
//   "the heartbeat of the garden" 💓
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What does this file do? ─────────────────────────────────
// This is the CORE of GenGo!'s spaced repetition system.
// It answers ONE question: "Given a flower at stage X, and
// the user got the answer right/wrong, what happens next?"
//
// It's pure math. No database, no UI, no framework.
// Just: stage in → new stage + next review time out.
//
// 🧠 Java analogy: This is like a static utility class:
//    public class SrsEngine {
//      public static SrsResult processAnswer(int stage, boolean correct) { ... }
//    }
//    Except in TypeScript we just export functions directly.
//    No need for a class wrapper when there's no state to hold!

import type { SrsStage, SrsTransitionResult, SrsIntervalConfig } from "./types";
import {
  MIN_STAGE,
  MAX_STAGE,
  BURN_STAGE,
  DEFAULT_SRS_INTERVALS,
} from "./constants";

// ═══════════════════════════════════════════════════════════════
//  HELPER: clampStage
// ═══════════════════════════════════════════════════════════════

// ── What is "clamping"? ─────────────────────────────────────
// Clamping means "keep a number within a range."
// If a flower drops below stage 0, clamp it to 0 (can't go negative).
// If it goes above stage 9, clamp it to 9 (can't exceed max).
//
// 🧠 Java equivalent:
//    Math.max(MIN, Math.min(MAX, value))
//
// In TypeScript, we do the same thing -- and we CAST the result
// to SrsStage so TypeScript knows it's a valid stage (0-9).

function clampStage(stage: number): SrsStage {
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, stage)) as SrsStage;
}

// ═══════════════════════════════════════════════════════════════
//  HELPER: getIntervalConfig
// ═══════════════════════════════════════════════════════════════

// Gets the SRS interval config for a specific stage.
// If custom configs are provided (from the database, per-language),
// use those. Otherwise, fall back to the defaults.
//
// 🧠 This is the "configurable per language" part from the PRD.
//    Japanese might have 4-hour first review.
//    Spanish might have 2-hour first review.
//    The engine doesn't care -- it just reads the config.

function getIntervalConfig(
  stage: SrsStage,
  customConfigs?: SrsIntervalConfig[]
): SrsIntervalConfig {
  const configs = customConfigs ?? DEFAULT_SRS_INTERVALS;

  // .find() searches the array for the first matching item.
  // It's like a Java stream: configs.stream().filter(c -> c.stage == stage).findFirst()
  const config = configs.find((c) => c.stage === stage);

  // If we somehow don't have a config for this stage, fall back to defaults.
  // The ?? operator means "if the left side is null/undefined, use the right side."
  return config ?? DEFAULT_SRS_INTERVALS[stage];
}

// ═══════════════════════════════════════════════════════════════
//  CORE: processAnswer
// ═══════════════════════════════════════════════════════════════

// ── The main function! ──────────────────────────────────────
// Given the current stage and whether the answer was correct,
// calculate the new stage and when to review next.
//
// This is called every time a user submits a review answer.
//
// Flow:
//   correct → stage goes UP by 1 → flower grows 🌱→🌸
//   wrong   → stage goes DOWN by penalty → flower wilts 🥀
//
// Parameters:
//   currentStage: the flower's current stage (0-9)
//   isCorrect:    did the user answer correctly?
//   now:          current timestamp (we pass this in instead of
//                 using Date.now() so the function is "pure" --
//                 easier to test because the output is predictable)
//   customConfigs: optional per-language interval overrides

export function processAnswer(
  currentStage: SrsStage,
  isCorrect: boolean,
  now: Date = new Date(),
  customConfigs?: SrsIntervalConfig[]
): SrsTransitionResult {

  // ── CORRECT ANSWER: flower grows! ──────────────────────
  if (isCorrect) {
    const newStage = clampStage(currentStage + 1);
    const nextReviewAt = calculateNextReviewDate(newStage, now, customConfigs);
    const isBurned = newStage === BURN_STAGE;

    return {
      newStage,
      // If burned (stage 9), no more reviews needed -- flower is eternal!
      nextReviewAt: isBurned ? null : nextReviewAt,
      stageChange: newStage - currentStage,
      isBurned,
    };
  }

  // ── WRONG ANSWER: flower wilts 🥀 ─────────────────────
  const config = getIntervalConfig(currentStage, customConfigs);
  const penalty = config.penaltyStages;
  const newStage = clampStage(currentStage - penalty);
  const nextReviewAt = calculateNextReviewDate(newStage, now, customConfigs);

  return {
    newStage,
    nextReviewAt,
    stageChange: newStage - currentStage,  // will be negative (e.g., -2)
    isBurned: false,                        // wrong answer never burns
  };
}

// ═══════════════════════════════════════════════════════════════
//  CORE: calculateNextReviewDate
// ═══════════════════════════════════════════════════════════════

// ── When should the next review happen? ─────────────────────
// Takes a stage number and returns a Date in the future.
//
// Example: stage 1 has intervalHours = 4
//   now = March 4, 2026 at 2:00 PM
//   next review = March 4, 2026 at 6:00 PM (+4 hours)
//
// Example: stage 5 has intervalHours = 168 (1 week)
//   now = March 4, 2026 at 2:00 PM
//   next review = March 11, 2026 at 2:00 PM (+168 hours)

export function calculateNextReviewDate(
  stage: SrsStage,
  now: Date = new Date(),
  customConfigs?: SrsIntervalConfig[]
): Date {
  const config = getIntervalConfig(stage, customConfigs);

  // If intervalHours is 0 (stage 0 or burned), review immediately
  // or not at all -- the caller decides.
  if (config.intervalHours === 0) {
    return now;
  }

  // Create a new Date object (don't mutate the original!)
  // Then add the interval hours to it.
  //
  // 🧠 Java equivalent:
  //    LocalDateTime.now().plusHours(config.intervalHours)
  //
  // In JavaScript, dates are in milliseconds since 1970 (Unix epoch).
  // 1 hour = 60 minutes × 60 seconds × 1000 milliseconds = 3,600,000 ms

  const nextReview = new Date(now.getTime());
  nextReview.setHours(nextReview.getHours() + config.intervalHours);

  return nextReview;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: getStagePenalty
// ═══════════════════════════════════════════════════════════════

// Exported so other modules can check "how many stages would
// this flower drop if the user gets it wrong?"
// Useful for UI hints like "careful, this one drops 2 stages!"

export function getStagePenalty(
  stage: SrsStage,
  customConfigs?: SrsIntervalConfig[]
): number {
  const config = getIntervalConfig(stage, customConfigs);
  return config.penaltyStages;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: isBurnable
// ═══════════════════════════════════════════════════════════════

// Can this flower be burned (reach eternal) with one more correct?
// True if the flower is at stage 8 (one step away from 9/burned).

export function isBurnable(stage: SrsStage): boolean {
  return stage === (BURN_STAGE - 1) as SrsStage;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: isBurned
// ═══════════════════════════════════════════════════════════════

// Is this flower already eternal / pressed?

export function isBurned(stage: SrsStage): boolean {
  return stage === BURN_STAGE;
}
