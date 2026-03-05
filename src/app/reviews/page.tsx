// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Reviews Page -- "time to water the garden!"
//   "the core gameplay loop" 💧
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── Review flow ─────────────────────────────────────────────────
// 1. Fetch review queue (GET /api/reviews)
// 2. Ask MEANING then READING per item
// 3. Grade LOCALLY for instant feedback (processAnswer runs client-side!)
// 4. POST to API in background to persist SRS state
// 5. Show answer key with collapsible sections
// 6. User can override incorrect → "Mark as Learned"
// 7. Session summary when done

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FLOWER_STAGE_EMOJI, FLOWER_STAGE_NAMES } from "@/engine/constants";
import { romajiToKana, romajiToKanaFinal } from "@/lib/kana-converter";
import { processAnswer } from "@/engine/srs";
import {
  getCorrectMessage,
  getIncorrectMessage,
  getSessionCompleteMessage,
} from "@/lib/encouragement";
import type { SrsStage, EncouragementMode } from "@/engine/types";

// ── Types ─────────────────────────────────────────────────────
interface QueueItem {
  itemId: string;
  primaryDisplay: string;
  type: string;
  srsStage: number;
  meanings: { meaning: string; isPrimary: boolean }[];
  readings: { reading: string; readingType: string; isPrimary: boolean }[];
  mnemonics: { type: string; text: string }[];
  dependencies: { itemId: string; display: string; meaning: string }[];
  usedBy: { itemId: string; display: string; meaning: string }[];
  userNote: string;
}

interface ReviewResult {
  isCorrect: boolean;
  correctAnswers: string[];
  previousStage: number;
  newStage: number;
  stageChange: number;
  isBurned: boolean;
  levelUp: { previousLevel: number; newLevel: number; guruPercentage: number } | null;
}

interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  burned: number;
  levelUp: ReviewResult["levelUp"];
}

type QuestionType = "meaning" | "reading";

// ── Collapsible Section Component ─────────────────────────────
function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-all text-sm font-medium text-left"
      >
        <span>{title}</span>
        <span
          className={`text-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 text-sm space-y-1">{children}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ReviewsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── State ───────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>("meaning");
  const [userInput, setUserInput] = useState("");
  const [rawRomaji, setRawRomaji] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    total: 0, correct: 0, incorrect: 0, burned: 0, levelUp: null,
  });
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // ── Personality state ───────────────────────────────────────
  const [encouragementMode, setEncouragementMode] = useState<EncouragementMode>("playful");
  const [personalityMessage, setPersonalityMessage] = useState("");

  // ── Answer key collapsible sections ─────────────────────────
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});

  // ── Fetch review queue + user preferences ───────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/reviews").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ])
      .then(([reviewData, userData]) => {
        setQueue(reviewData.queue ?? []);
        setEncouragementMode(
          (userData.preferences?.encouragementMode as EncouragementMode) ?? "playful"
        );
        setLoading(false);
        if (reviewData.queue?.length > 0) setStartTime(Date.now());
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Focus input ─────────────────────────────────────────────
  useEffect(() => {
    if (!sessionDone && !result) {
      inputRef.current?.focus();
    }
  }, [currentIndex, questionType, result, sessionDone]);

  // ── Current item ────────────────────────────────────────────
  const currentItem = queue[currentIndex] ?? null;
  const hasReadings = currentItem ? currentItem.readings.length > 0 : false;

  // ── Move to next question ───────────────────────────────────
  const moveToNext = useCallback(() => {
    setResult(null);
    setUserInput("");
    setRawRomaji("");
    setPersonalityMessage("");
    setOpenSections(new Set());

    if (questionType === "meaning" && hasReadings && currentItem?.type !== "component") {
      setQuestionType("reading");
    } else {
      if (currentIndex + 1 >= queue.length) {
        setSessionDone(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setQuestionType("meaning");
      }
    }
    setStartTime(Date.now());
  }, [questionType, hasReadings, currentItem?.type, currentIndex, queue.length]);

  // ── Document-level keyboard shortcuts ───────────────────────
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in an active input
      const isInputActive =
        document.activeElement?.tagName === "INPUT" && !result;
      if (isInputActive) return;

      // Enter: submit or continue
      if (e.key === "Enter") {
        if (result) {
          e.preventDefault();
          moveToNext();
        }
        return;
      }

      // F/E/R shortcuts only when answer key is showing
      if (result) {
        const key = e.key.toLowerCase();
        if (key === "f") {
          e.preventDefault();
          // Toggle: if meaning+reading open, close them; else open them
          setOpenSections((prev) => {
            if (prev.has("meaning") && prev.has("reading")) {
              const next = new Set(prev);
              next.delete("meaning");
              next.delete("reading");
              return next;
            }
            return new Set([...prev, "meaning", "reading"]);
          });
        } else if (key === "e") {
          e.preventDefault();
          // Toggle: if extras open, close them; else open all
          setOpenSections((prev) => {
            const extras = ["mnemonic", "components", "related", "notes"];
            const allOpen = extras.every((s) => prev.has(s));
            if (allOpen) {
              const next = new Set(prev);
              extras.forEach((s) => next.delete(s));
              return next;
            }
            return new Set([...prev, "meaning", "reading", ...extras]);
          });
        } else if (key === "r") {
          e.preventDefault();
          setOpenSections(new Set());
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [result, moveToNext]);

  // ── Submit answer (instant local grading) ───────────────────
  async function submitAnswer() {
    if (!currentItem || submitting || !userInput.trim()) return;
    setSubmitting(true);

    const responseTimeMs = Date.now() - startTime;
    const answer =
      questionType === "reading"
        ? romajiToKanaFinal(rawRomaji || userInput)
        : userInput.trim();

    // ── LOCAL grading (instant!) ────────────────────────────
    const userAnswer = answer.toLowerCase();
    let isCorrect = false;
    let correctAnswers: string[] = [];

    if (questionType === "meaning") {
      correctAnswers = currentItem.meanings.map((m) => m.meaning);
      isCorrect = correctAnswers.some(
        (c) => c.toLowerCase() === userAnswer
      );
    } else {
      correctAnswers = currentItem.readings.map((r) => r.reading);
      isCorrect = correctAnswers.some((c) => c === answer.trim());
    }

    // ── LOCAL SRS calculation (instant stage change!) ────────
    const srsResult = processAnswer(
      currentItem.srsStage as SrsStage,
      isCorrect
    );

    const instantResult: ReviewResult = {
      isCorrect,
      correctAnswers,
      previousStage: currentItem.srsStage,
      newStage: srsResult.newStage,
      stageChange: srsResult.stageChange,
      isBurned: srsResult.isBurned,
      levelUp: null,
    };

    setResult(instantResult);
    setPersonalityMessage(
      isCorrect
        ? getCorrectMessage(encouragementMode)
        : getIncorrectMessage(encouragementMode)
    );
    setOpenSections(new Set(["meaning", "reading"]));

    // Update stats immediately
    setStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      burned: prev.burned + (srsResult.isBurned ? 1 : 0),
      levelUp: prev.levelUp,
    }));

    setSubmitting(false);

    // ── BACKGROUND API call to persist ───────────────────────
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: currentItem.itemId,
          questionType,
          answer,
          responseTimeMs,
        }),
      });
      const apiResult = await res.json();

      // Update with server-side level-up info
      if (apiResult.levelUp) {
        setResult((prev) =>
          prev ? { ...prev, levelUp: apiResult.levelUp } : prev
        );
        setStats((prev) => ({ ...prev, levelUp: apiResult.levelUp }));
      }
    } catch (err) {
      console.error("Review POST failed:", err);
    }
  }

  // ── Override: Mark as Learned ───────────────────────────────
  async function handleOverride() {
    if (!currentItem || !result) return;

    // Recalculate locally as correct
    const srsCorrect = processAnswer(
      result.previousStage as SrsStage,
      true
    );

    // Update local display
    setResult((prev) =>
      prev
        ? {
            ...prev,
            isCorrect: true,
            newStage: srsCorrect.newStage,
            stageChange: srsCorrect.stageChange,
            isBurned: srsCorrect.isBurned,
          }
        : prev
    );
    setPersonalityMessage(getCorrectMessage(encouragementMode));
    setStats((prev) => ({
      ...prev,
      correct: prev.correct + 1,
      incorrect: Math.max(0, prev.incorrect - 1),
      burned: prev.burned + (srsCorrect.isBurned ? 1 : 0),
    }));

    // Fire override API call
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: currentItem.itemId,
          questionType,
          answer: currentItem.meanings[0]?.meaning ?? "",
          override: true,
          previousStage: result.previousStage,
        }),
      });
    } catch (err) {
      console.error("Override failed:", err);
    }
  }

  // ── Handle reading input (romaji → kana) ────────────────────
  function handleReadingInput(value: string) {
    setRawRomaji(value);
    const { kana, pending } = romajiToKana(value);
    setUserInput(kana + pending);
  }

  // ── Handle keypress on input ────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (result) {
        moveToNext();
      } else {
        submitAnswer();
      }
    }
  }

  // Toggle a section open/closed
  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl animate-soft-pulse">💧</span>
          <p className="mt-4 text-muted-foreground">Checking the garden...</p>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <span className="text-6xl">✨</span>
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p className="text-muted-foreground">
            No flowers need watering right now. Come back later~
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
          >
            Back to Garden
          </button>
        </div>
      </div>
    );
  }

  // ── Session complete ────────────────────────────────────────
  if (sessionDone) {
    const accuracy =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="max-w-md mx-auto py-8 space-y-6 text-center">
        <span className="text-6xl">
          {accuracy >= 80 ? "🎉" : accuracy >= 50 ? "🌿" : "💪"}
        </span>
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <p className="text-muted-foreground italic">
          {getSessionCompleteMessage(encouragementMode)}
        </p>

        {stats.levelUp && (
          <div className="bg-accent/20 border-2 border-accent rounded-2xl p-4 animate-burn-glow">
            <span className="text-4xl">🏆</span>
            <p className="text-lg font-bold mt-2">
              Level Up! {stats.levelUp.previousLevel} →{" "}
              {stats.levelUp.newLevel}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-card border-2 border-border p-4">
            <p className="text-3xl font-bold">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">accuracy</p>
          </div>
          <div className="rounded-xl bg-card border-2 border-border p-4">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">answered</p>
          </div>
          <div className="rounded-xl bg-secondary/10 border-2 border-secondary/30 p-4">
            <p className="text-3xl font-bold text-secondary-hover">
              {stats.correct}
            </p>
            <p className="text-sm text-muted-foreground">correct</p>
          </div>
          <div className="rounded-xl bg-destructive/10 border-2 border-destructive/30 p-4">
            <p className="text-3xl font-bold text-destructive">
              {stats.incorrect}
            </p>
            <p className="text-sm text-muted-foreground">incorrect</p>
          </div>
        </div>

        {stats.burned > 0 && (
          <p className="text-sm">
            {stats.burned} flower{stats.burned > 1 ? "s" : ""} reached Eternal!
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
          >
            Back to Garden
          </button>
          <button
            onClick={() => router.push("/lessons")}
            className="px-6 py-3 border-2 border-border rounded-full font-medium hover:bg-muted"
          >
            Go to Lessons
          </button>
        </div>
      </div>
    );
  }

  // ── Active review question ──────────────────────────────────
  if (!currentItem) return null;
  const isReadingQ = questionType === "reading";

  // Group readings by type for the answer key
  const onyomi = currentItem.readings.filter((r) => r.readingType === "onyomi");
  const kunyomi = currentItem.readings.filter((r) => r.readingType === "kunyomi");
  const nanori = currentItem.readings.filter((r) => r.readingType === "nanori");
  const meaningMnemonic = currentItem.mnemonics?.find((m) => m.type === "meaning");
  const readingMnemonic = currentItem.mnemonics?.find((m) => m.type === "reading");

  return (
    <div className="max-w-xl mx-auto py-4 space-y-4">
      {/* Personality quick-toggle */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            const modes: EncouragementMode[] = [
              "playful", "teacher", "tsundere", "yandere",
              "boring", "bipolar", "crazydave",
            ];
            const idx = modes.indexOf(encouragementMode);
            const next = modes[(idx + 1) % modes.length];
            setEncouragementMode(next);
            fetch("/api/user", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encouragementMode: next }),
            }).catch(() => {});
          }}
          className="px-3 py-1 text-xs rounded-full border transition-all hover:bg-muted"
          style={{ borderColor: "var(--border)" }}
          title="Click to cycle personality"
        >
          {encouragementMode === "playful" && "🌸 Playful"}
          {encouragementMode === "teacher" && "📖 Teacher"}
          {encouragementMode === "tsundere" && "😤 Tsundere"}
          {encouragementMode === "yandere" && "🔪 Yandere"}
          {encouragementMode === "boring" && "📋 Boring"}
          {encouragementMode === "bipolar" && "🎭 Bipolar"}
          {encouragementMode === "crazydave" && "🤪 CrazyDave"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{queue.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / queue.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {stats.correct}✓ {stats.incorrect}✗
        </span>
      </div>

      {/* Question card */}
      <div
        className={`rounded-2xl border-2 p-8 text-center space-y-4 transition-all ${
          result
            ? result.isCorrect
              ? "border-secondary bg-secondary/5 animate-correct"
              : "border-destructive bg-destructive/5 animate-incorrect"
            : "border-border bg-card"
        }`}
      >
        {/* Stage indicator */}
        <div className="flex items-center justify-center gap-2">
          <span>
            {FLOWER_STAGE_EMOJI[currentItem.srsStage as SrsStage]}
          </span>
          <span className="text-xs text-muted-foreground">
            {FLOWER_STAGE_NAMES[currentItem.srsStage as SrsStage]}
          </span>
        </div>

        {/* Item display */}
        <div className="py-6">
          <span className="jp-text-xl font-bold">
            {currentItem.primaryDisplay}
          </span>
        </div>

        {/* Question type label */}
        <div
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
            isReadingQ
              ? "bg-violet-100 text-violet-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {isReadingQ ? "Reading" : "Meaning"}
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => {
            if (isReadingQ) {
              handleReadingInput(e.target.value);
            } else {
              setUserInput(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={!!result}
          placeholder={
            isReadingQ ? "Type reading in romaji..." : "Type the meaning..."
          }
          className={`w-full px-6 py-4 text-lg text-center rounded-xl border-2 outline-none transition-all ${
            isReadingQ ? "jp-text" : ""
          } ${
            result
              ? result.isCorrect
                ? "border-secondary bg-secondary/5"
                : "border-destructive bg-destructive/5"
              : "border-border focus:border-primary bg-card"
          } disabled:opacity-70`}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          lang={isReadingQ ? "ja" : "en"}
        />

        {/* Result feedback with personality */}
        {result && (
          <div className="text-center space-y-2">
            <p
              className={`font-semibold text-lg ${
                result.isCorrect
                  ? "text-secondary-hover"
                  : "text-destructive"
              }`}
            >
              {personalityMessage}
            </p>

            {!result.isCorrect && (
              <p className="text-sm text-muted-foreground">
                Correct answer
                {result.correctAnswers.length > 1 ? "s" : ""}:{" "}
                <span
                  className={`font-medium ${isReadingQ ? "jp-text" : ""}`}
                >
                  {result.correctAnswers.join(", ")}
                </span>
              </p>
            )}

            {/* Stage change */}
            <p className="text-sm">
              {FLOWER_STAGE_EMOJI[result.previousStage as SrsStage]}
              {" → "}
              {FLOWER_STAGE_EMOJI[result.newStage as SrsStage]}{" "}
              <span
                className={
                  result.stageChange > 0
                    ? "text-secondary-hover"
                    : "text-destructive"
                }
              >
                ({result.stageChange > 0 ? "+" : ""}
                {result.stageChange})
              </span>
            </p>

            {result.isBurned && (
              <p className="text-purple-600 font-bold animate-burn-glow">
                Eternal! This flower is forever yours!
              </p>
            )}

            {result.levelUp && (
              <p className="text-accent-hover font-bold text-lg">
                Level Up! → Level {result.levelUp.newLevel}!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {result ? (
          <>
            {!result.isCorrect && (
              <button
                onClick={handleOverride}
                className="px-6 py-3 border-2 border-secondary rounded-full font-medium text-secondary-hover hover:bg-secondary/10 transition-all"
              >
                Mark as Learned ✓
              </button>
            )}
            <button
              onClick={moveToNext}
              className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
            >
              Next →
            </button>
          </>
        ) : (
          <button
            onClick={submitAnswer}
            disabled={submitting || !userInput.trim()}
            className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover disabled:opacity-40"
          >
            {submitting ? "..." : "Submit"}
          </button>
        )}
      </div>

      {/* ── Answer Key (collapsible sections) ──────────────────── */}
      {result && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Answer Key
            </p>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setOpenSections((prev) => {
                    if (prev.has("meaning") && prev.has("reading")) {
                      const next = new Set(prev);
                      next.delete("meaning");
                      next.delete("reading");
                      return next;
                    }
                    return new Set([...prev, "meaning", "reading"]);
                  })
                }
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-border transition-all"
                title="Toggle meaning & reading (F)"
              >
                F
              </button>
              <button
                onClick={() =>
                  setOpenSections((prev) => {
                    const extras = ["mnemonic", "components", "related", "notes"];
                    const allOpen = extras.every((s) => prev.has(s));
                    if (allOpen) {
                      const next = new Set(prev);
                      extras.forEach((s) => next.delete(s));
                      return next;
                    }
                    return new Set([...prev, "meaning", "reading", ...extras]);
                  })
                }
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-border transition-all"
                title="Toggle all (E)"
              >
                E
              </button>
              <button
                onClick={() => setOpenSections(new Set())}
                className="px-2 py-0.5 text-xs rounded bg-muted hover:bg-border transition-all"
                title="Collapse all (R)"
              >
                R
              </button>
            </div>
          </div>

          {/* Meaning section */}
          <CollapsibleSection
            title="Meaning"
            isOpen={openSections.has("meaning")}
            onToggle={() => toggleSection("meaning")}
          >
            <p className="font-semibold">
              {currentItem.meanings
                .filter((m) => m.isPrimary)
                .map((m) => m.meaning)
                .join(", ")}
            </p>
            {currentItem.meanings.filter((m) => !m.isPrimary).length > 0 && (
              <p className="text-muted-foreground text-xs">
                Also:{" "}
                {currentItem.meanings
                  .filter((m) => !m.isPrimary)
                  .map((m) => m.meaning)
                  .join(", ")}
              </p>
            )}
            {meaningMnemonic && (
              <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs">
                <span className="font-medium">Mnemonic: </span>
                {meaningMnemonic.text}
              </div>
            )}
          </CollapsibleSection>

          {/* Reading section */}
          {currentItem.readings.length > 0 && (
            <CollapsibleSection
              title="Readings"
              isOpen={openSections.has("reading")}
              onToggle={() => toggleSection("reading")}
            >
              {onyomi.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    On'yomi:{" "}
                  </span>
                  <span className="jp-text font-medium">
                    {onyomi.map((r) => r.reading).join("、")}
                  </span>
                </div>
              )}
              {kunyomi.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Kun'yomi:{" "}
                  </span>
                  <span className="jp-text font-medium">
                    {kunyomi.map((r) => r.reading).join("、")}
                  </span>
                </div>
              )}
              {nanori.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Nanori:{" "}
                  </span>
                  <span className="jp-text font-medium">
                    {nanori.map((r) => r.reading).join("、")}
                  </span>
                </div>
              )}
              {readingMnemonic && (
                <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs">
                  <span className="font-medium">Mnemonic: </span>
                  {readingMnemonic.text}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Mnemonics section (if both exist as combined) */}
          {(meaningMnemonic || readingMnemonic) && (
            <CollapsibleSection
              title="Mnemonics"
              isOpen={openSections.has("mnemonic")}
              onToggle={() => toggleSection("mnemonic")}
            >
              {meaningMnemonic && (
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Meaning
                  </p>
                  <p>{meaningMnemonic.text}</p>
                </div>
              )}
              {readingMnemonic && (
                <div className="bg-muted/50 rounded-lg p-2 mt-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Reading
                  </p>
                  <p>{readingMnemonic.text}</p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Components / Built from */}
          {currentItem.dependencies && currentItem.dependencies.length > 0 && (
            <CollapsibleSection
              title="Components"
              isOpen={openSections.has("components")}
              onToggle={() => toggleSection("components")}
            >
              <div className="flex flex-wrap gap-2">
                {currentItem.dependencies.map((dep) => (
                  <span
                    key={dep.itemId}
                    className="px-2 py-1 rounded-lg bg-muted text-xs"
                  >
                    <span className="jp-text text-base font-medium">
                      {dep.display}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      ({dep.meaning})
                    </span>
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Related kanji / Used in */}
          {currentItem.usedBy && currentItem.usedBy.length > 0 && (
            <CollapsibleSection
              title="Used In"
              isOpen={openSections.has("related")}
              onToggle={() => toggleSection("related")}
            >
              <div className="flex flex-wrap gap-2">
                {currentItem.usedBy.map((rel) => (
                  <span
                    key={rel.itemId}
                    className="px-2 py-1 rounded-lg bg-muted text-xs"
                  >
                    <span className="jp-text text-base font-medium">
                      {rel.display}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      ({rel.meaning})
                    </span>
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* User Notes */}
          <CollapsibleSection
            title="My Notes"
            isOpen={openSections.has("notes")}
            onToggle={() => toggleSection("notes")}
          >
            <textarea
              value={
                userNotes[currentItem.itemId] !== undefined
                  ? userNotes[currentItem.itemId]
                  : currentItem.userNote
              }
              onChange={(e) =>
                setUserNotes((prev) => ({
                  ...prev,
                  [currentItem.itemId]: e.target.value,
                }))
              }
              onBlur={() => {
                const note =
                  userNotes[currentItem.itemId] ?? currentItem.userNote;
                fetch("/api/notes", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemId: currentItem.itemId,
                    note,
                  }),
                }).catch((err) =>
                  console.error("Failed to save note:", err)
                );
              }}
              placeholder="Add personal notes... (saved automatically)"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background resize-none outline-none focus:border-primary"
              style={{ borderColor: "var(--border)", minHeight: "60px" }}
              rows={2}
            />
          </CollapsibleSection>
        </div>
      )}

      {/* Keyboard hints */}
      <p className="text-center text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">
          Enter
        </kbd>{" "}
        submit/next
        {result && (
          <>
            {" · "}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">
              F
            </kbd>{" "}
            meaning/reading{" · "}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">
              E
            </kbd>{" "}
            expand all{" · "}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">
              R
            </kbd>{" "}
            collapse
          </>
        )}
      </p>
    </div>
  );
}
