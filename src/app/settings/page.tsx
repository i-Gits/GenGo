// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Settings Page -- "customize your garden"
//   "every gardener has their own style" ⚙️
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

// ── Types ─────────────────────────────────────────────────────
interface UserPreferences {
  honorific: string;
  preferredName: string;
  encouragementMode: string;
  theme: string;
  lessonBatchSize: number;
  dailyReviewLimit: number;
}

interface UserData {
  email: string;
  preferences: UserPreferences;
}

// ── Encouragement modes ───────────────────────────────────────
const MODES = [
  { value: "playful",   label: "Playful Tease",       emoji: "🌸", desc: "Cute and teasing~" },
  { value: "teacher",   label: "Encouraging Teacher",  emoji: "📖", desc: "Patient and supportive" },
  { value: "tsundere",  label: "Tsundere",             emoji: "😤", desc: "It's not like I want you to learn..." },
  { value: "yandere",   label: "Yandere",              emoji: "🔪", desc: "I'll never let you forget~" },
  { value: "boring",    label: "Boring & Straight",    emoji: "📋", desc: "Just the facts." },
  { value: "bipolar",   label: "Bipolar",              emoji: "🎭", desc: "Wildly switches between modes" },
  { value: "crazyhana", label: "CrazyHana",             emoji: "🤪", desc: "WABBY WABBO?!" },
];

// ── Honorifics ────────────────────────────────────────────────
const HONORIFICS = [
  { value: "勇者", label: "勇者 (Hero)" },
  { value: "王女", label: "王女 (Princess)" },
  { value: "王子", label: "王子 (Prince)" },
  { value: "王", label: "王 (King)" },
  { value: "女王", label: "女王 (Queen)" },
  { value: "魔王", label: "魔王 (Demon King)" },
  { value: "旅人", label: "旅人 (Traveler)" },
  { value: "博士", label: "博士 (Doctor)" },
  { value: "先生", label: "先生 (Teacher)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────
  const [preferredName, setPreferredName] = useState("");
  const [honorific, setHonorific] = useState("勇者");
  const [encouragementMode, setEncouragementMode] = useState("playful");
  const [lessonBatchSize, setLessonBatchSize] = useState(5);
  const [dailyReviewLimit, setDailyReviewLimit] = useState(100);

  // ── Fetch user data ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((json: UserData) => {
        setData(json);
        setPreferredName(json.preferences.preferredName);
        setHonorific(json.preferences.honorific);
        setEncouragementMode(json.preferences.encouragementMode);
        setLessonBatchSize(json.preferences.lessonBatchSize);
        setDailyReviewLimit(json.preferences.dailyReviewLimit);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Save preferences ────────────────────────────────────────
  async function savePreferences() {
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName,
          honorific,
          encouragementMode,
          lessonBatchSize,
          dailyReviewLimit,
        }),
      });

      if (res.ok) {
        setSaveMessage("Saved! ✨");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("Failed to save 😢");
      }
    } catch {
      setSaveMessage("Failed to save 😢");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl animate-soft-pulse">⚙️</span>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Garden Settings ⚙️</h1>
        <p className="text-muted-foreground">
          Customize your learning experience~
        </p>
      </div>

      {/* ── Profile Section ──────────────────────────────────── */}
      <section className="rounded-2xl border-2 border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile 🌸</h2>

        {/* Preferred name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Display Name
          </label>
          <input
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="What should we call you?"
            className="w-full px-4 py-2 rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
          />
        </div>

        {/* Honorific */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Title / Honorific
          </label>
          <div className="grid grid-cols-3 gap-2">
            {HONORIFICS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHonorific(h.value)}
                className={`
                  px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all
                  ${honorific === h.value
                    ? "border-primary bg-primary/10 text-primary-hover"
                    : "border-border hover:border-primary/40"
                  }
                `}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Theme Section ──────────────────────────────────────── */}
      <section className="rounded-2xl border-2 border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Theme 🎨</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`
              flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
              ${theme === "light"
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent/40"
              }
            `}
          >
            <span className="text-2xl">☀️</span>
            <span className="font-medium">Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`
              flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
              ${theme === "dark"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40"
              }
            `}
          >
            <span className="text-2xl">🌙</span>
            <span className="font-medium">Dark</span>
          </button>
        </div>
      </section>

      {/* ── Encouragement Mode Section ───────────────────────── */}
      <section className="rounded-2xl border-2 border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Companion Personality 🎭</h2>
        <p className="text-sm text-muted-foreground">
          How should GenGo! talk to you during reviews?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setEncouragementMode(mode.value)}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                ${encouragementMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
                }
              `}
            >
              <span className="text-2xl">{mode.emoji}</span>
              <div>
                <p className="font-medium text-sm">{mode.label}</p>
                <p className="text-xs text-muted-foreground">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Study Settings Section ───────────────────────────── */}
      <section className="rounded-2xl border-2 border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Study Settings 📚</h2>

        {/* Lesson batch size */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Lessons per session
          </label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((size) => (
              <button
                key={size}
                onClick={() => setLessonBatchSize(size)}
                className={`
                  flex-1 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all
                  ${lessonBatchSize === size
                    ? "border-secondary bg-secondary/10 text-secondary-hover"
                    : "border-border hover:border-secondary/40"
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Daily review limit */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Daily review limit (0 = unlimited)
          </label>
          <input
            type="number"
            value={dailyReviewLimit}
            onChange={(e) => setDailyReviewLimit(Number(e.target.value))}
            min={0}
            max={1000}
            className="w-full px-4 py-2 rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
          />
        </div>
      </section>

      {/* ── Save Button ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover disabled:opacity-50 transition-all"
        >
          {saving ? "Saving..." : "Save Settings 💾"}
        </button>
        {saveMessage && (
          <span className="text-sm font-medium animate-soft-pulse">
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}
