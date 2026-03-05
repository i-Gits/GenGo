// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   FlowerStage Component
//   "watch your flower grow" 🌱→🌸→🪻
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is this? ─────────────────────────────────────────────
// A visual indicator showing an item's SRS stage as a flower.
// Shows the emoji + stage name + optional progress bar.
//
// Stage 0 = 🌰 Seed
// Stage 5 = 🌸 Blooming (Guru!)
// Stage 9 = 🪻 Eternal (Burned!)

import { FLOWER_STAGE_EMOJI, FLOWER_STAGE_NAMES } from "@/engine/constants";
import type { SrsStage } from "@/engine/types";

interface FlowerStageProps {
  stage: SrsStage;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// Color for each stage (for progress bar / badge background)
const STAGE_COLORS: Record<number, string> = {
  0: "bg-amber-100 text-amber-800",      // Seed
  1: "bg-lime-100 text-lime-800",         // Sprout
  2: "bg-green-100 text-green-800",       // Seedling
  3: "bg-emerald-100 text-emerald-800",   // Young Plant
  4: "bg-pink-100 text-pink-800",         // Budding
  5: "bg-rose-100 text-rose-800",         // Blooming (GURU)
  6: "bg-fuchsia-100 text-fuchsia-800",   // Full Bloom
  7: "bg-violet-100 text-violet-800",     // Flourishing
  8: "bg-indigo-100 text-indigo-800",     // Deeply Rooted
  9: "bg-purple-100 text-purple-800",     // Eternal
};

const SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function FlowerStage({ stage, size = "md", showLabel = true }: FlowerStageProps) {
  const emoji = FLOWER_STAGE_EMOJI[stage] ?? "🌰";
  const name = FLOWER_STAGE_NAMES[stage] ?? "Unknown";
  const colorClass = STAGE_COLORS[stage] ?? "bg-gray-100 text-gray-800";
  const sizeClass = SIZE_CLASSES[size];
  const isBurned = stage === 9;

  return (
    <div className={`inline-flex items-center gap-1.5 ${isBurned ? "animate-burn-glow" : ""}`}>
      <span className={sizeClass} role="img" aria-label={name}>
        {emoji}
      </span>
      {showLabel && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
          {name}
        </span>
      )}
    </div>
  );
}

// ── FlowerStageBar ────────────────────────────────────────────
// A horizontal progress bar showing stage 0-9.
// Useful for the dashboard to show progression at a glance.

export function FlowerStageBar({ stage }: { stage: SrsStage }) {
  const progress = (stage / 9) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <FlowerStage stage={stage} size="sm" />
        <span className="text-xs text-muted-foreground">{stage}/9</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-secondary to-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
