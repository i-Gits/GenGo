// ╭───────────────────────────────· · ୨╧ · · ─────────────────╮
//   Dashboard Page -- "Your Garden"
//   "welcome back to your garden" 🌸
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FLOWER_STAGE_EMOJI, FLOWER_STAGE_NAMES } from "@/engine/constants";

interface ProgressData {
  currentLevel: number;
  totalItems: number;
  stageCounts: Record<number, number>;
  reviewsAvailable: number;
  lessonsAvailable: number;
  overallAccuracy: number;
  levelProgress: {
    total: number;
    guruPlus: number;
    percentage: number;
  };
  encouragementMode: string;
  preferredName: string;
  honorific: string;
}

// Encouragement modes
const MODES = [
  { value: "playful",   label: "Playful Tease",       desc: "Cute and teasing~" },
  { value: "teacher",   label: "Encouraging Teacher",  desc: "Patient and supportive" },
  { value: "tsundere",  label: "Tsundere",             desc: "It's not like I want you to learn..." },
  { value: "yandere",   label: "Yandere",              desc: "I'll never let you forget~" },
  { value: "boring",    label: "Boring & Straight",    desc: "Just the facts." },
  { value: "bipolar",   label: "Bipolar",              desc: "Wildly switches between modes" },
  { value: "crazydave", label: "CrazyDave",            desc: "WABBY WABBO?!" },
];

export default function DashboardPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGarden, setShowGarden] = useState(false);
  const [selectedMode, setSelectedMode] = useState("playful");
  const [savingMode, setSavingMode] = useState(false);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setSelectedMode(json.encouragementMode ?? "playful");
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load garden data");
        setLoading(false);
        console.error(err);
      });
  }, []);

  // Save personality immediately on change
  async function handleModeChange(newMode: string) {
    setSelectedMode(newMode);
    setSavingMode(true);
    try {
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encouragementMode: newMode }),
      });
    } catch (err) {
      console.error("Failed to save personality:", err);
    }
    setSavingMode(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl animate-soft-pulse">🌱</span>
          <p className="mt-4 text-muted-foreground">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl">🥀</span>
          <p className="mt-4 text-destructive">{error ?? "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  const greeting = data.preferredName
    ? `Welcome back, ${data.honorific} ${data.preferredName}!`
    : "Welcome back to your garden!";

  return (
    <div className="space-y-6 py-4">
      {/* ── Greeting + Level Display ─────────────────────────── */}
      <div className="text-center space-y-3 py-6">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Current Level
        </p>
        <div className="relative inline-block">
          <span className="text-8xl font-bold" style={{ color: "var(--primary)" }}>
            {data.currentLevel}
          </span>
        </div>
        {/* Level progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${data.levelProgress.percentage}%`,
                background: "linear-gradient(to right, var(--secondary), var(--primary), var(--accent))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {data.levelProgress.percentage}% to Level {data.currentLevel + 1}
          </p>
        </div>
      </div>

      {/* ── Quick Action Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reviews Card */}
        <Link
          href="/reviews"
          className="group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300"
          style={{
            borderColor: data.reviewsAvailable > 0 ? "var(--primary)" : "var(--border)",
            backgroundColor: data.reviewsAvailable > 0 ? "color-mix(in srgb, var(--primary) 5%, transparent)" : "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reviews</p>
              <p className="text-4xl font-bold mt-1">{data.reviewsAvailable}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.reviewsAvailable > 0 ? "flowers need watering!" : "all flowers happy~"}
              </p>
            </div>
            <span className="text-5xl group-hover:scale-110 transition-transform">
              {data.reviewsAvailable > 0 ? "💧" : "✨"}
            </span>
          </div>
        </Link>

        {/* Lessons Card */}
        <Link
          href="/lessons"
          className="group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300"
          style={{
            borderColor: data.lessonsAvailable > 0 ? "var(--secondary)" : "var(--border)",
            backgroundColor: data.lessonsAvailable > 0 ? "color-mix(in srgb, var(--secondary) 5%, transparent)" : "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lessons</p>
              <p className="text-4xl font-bold mt-1">{data.lessonsAvailable}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.lessonsAvailable > 0 ? "new seeds to plant!" : "keep reviewing to unlock~"}
              </p>
            </div>
            <span className="text-5xl group-hover:scale-110 transition-transform">
              {data.lessonsAvailable > 0 ? "🌱" : "🌰"}
            </span>
          </div>
        </Link>
      </div>

      {/* ── Companion Personality Toggle ──────────────────────── */}
      <div className="flex items-center justify-center gap-3 py-2">
        {/* Left arrow */}
        <button
          onClick={() => {
            const idx = MODES.findIndex((m) => m.value === selectedMode);
            const prev = MODES[(idx - 1 + MODES.length) % MODES.length];
            handleModeChange(prev.value);
          }}
          className="p-2 rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          aria-label="Previous personality"
        >
          ◀
        </button>

        {/* Round personality button */}
        <button
          onClick={() => {
            const idx = MODES.findIndex((m) => m.value === selectedMode);
            const next = MODES[(idx + 1) % MODES.length];
            handleModeChange(next.value);
          }}
          className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-3 transition-all hover:scale-105 active:scale-95"
          style={{
            borderColor: "var(--primary)",
            backgroundColor: "color-mix(in srgb, var(--primary) 10%, var(--card))",
          }}
          title="Click to cycle personality"
        >
          <span className="text-2xl">
            {selectedMode === "playful" && "🌸"}
            {selectedMode === "teacher" && "📖"}
            {selectedMode === "tsundere" && "😤"}
            {selectedMode === "yandere" && "🔪"}
            {selectedMode === "boring" && "📋"}
            {selectedMode === "bipolar" && "🎭"}
            {selectedMode === "crazydave" && "🤪"}
          </span>
          <span className="text-[9px] font-bold mt-0.5" style={{ color: "var(--primary-hover)" }}>
            {MODES.find((m) => m.value === selectedMode)?.label ?? ""}
          </span>
          {savingMode && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-soft-pulse" />
          )}
        </button>

        {/* Right arrow */}
        <button
          onClick={() => {
            const idx = MODES.findIndex((m) => m.value === selectedMode);
            const next = MODES[(idx + 1) % MODES.length];
            handleModeChange(next.value);
          }}
          className="p-2 rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          aria-label="Next personality"
        >
          ▶
        </button>
      </div>

      {/* Personality description */}
      <p className="text-center text-xs text-muted-foreground -mt-4">
        {MODES.find((m) => m.value === selectedMode)?.desc ?? ""}
      </p>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {Math.round(data.overallAccuracy * 100)}%
          </p>
          <p>accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {data.totalItems}
          </p>
          <p>items learned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {data.stageCounts[9] ?? 0}
          </p>
          <p>eternal</p>
        </div>
      </div>

      {/* ── Collapsible Flower Garden ──────────────────────────── */}
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <button
          onClick={() => setShowGarden(!showGarden)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all"
        >
          <h2 className="text-lg font-semibold">Your Flower Garden</h2>
          <span className={`text-xl transition-transform ${showGarden ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {showGarden && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((stage) => {
                const count = data.stageCounts[stage] ?? 0;
                return (
                  <div
                    key={stage}
                    className="text-center p-3 rounded-xl border transition-all"
                    style={{
                      borderColor: count > 0 ? "var(--border)" : "transparent",
                      backgroundColor: count > 0 ? "var(--muted)" : "color-mix(in srgb, var(--muted) 30%, transparent)",
                      opacity: count > 0 ? 1 : 0.5,
                    }}
                  >
                    <span className="text-2xl">{FLOWER_STAGE_EMOJI[stage as keyof typeof FLOWER_STAGE_EMOJI]}</span>
                    <p className="text-lg font-bold mt-1">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {FLOWER_STAGE_NAMES[stage as keyof typeof FLOWER_STAGE_NAMES]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
