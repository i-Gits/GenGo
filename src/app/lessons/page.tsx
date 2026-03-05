// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Lessons Page -- "planting new seeds"
//   "discover what's ready to learn" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── Features ────────────────────────────────────────────────────
// 1. Gallery overview: select individual items (like selecting photos)
// 2. Card-by-card lesson view with collapsible sections
// 3. F/E/R keyboard shortcuts for sections
// 4. Return to lessons after finishing
// 5. No English type labels -- reduce non-target language exposure

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FLOWER_STAGE_EMOJI } from "@/engine/constants";

// ── Types ─────────────────────────────────────────────────────
interface LessonItem {
  id: string;
  type: string;
  level: number;
  primaryDisplay: string;
  meanings: { meaning: string; isPrimary: boolean }[];
  readings: { reading: string; readingType: string; isPrimary: boolean }[];
  mnemonics: { type: string; text: string }[];
  dependencies: { itemId: string; display: string; meaning: string }[];
}

interface LessonsData {
  currentLevel: number;
  totalAvailable: number;
  lessons: LessonItem[];
}

// ── Subtle background colors per type (no labels!) ────────────
const TYPE_BG: Record<string, string> = {
  component: "color-mix(in srgb, var(--primary) 8%, transparent)",
  character: "color-mix(in srgb, var(--accent) 8%, transparent)",
  vocabulary: "color-mix(in srgb, var(--secondary) 8%, transparent)",
};

const TYPE_BORDER_SELECTED: Record<string, string> = {
  component: "var(--primary)",
  character: "var(--accent)",
  vocabulary: "var(--secondary)",
};

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
        <span className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {isOpen && <div className="px-3 pb-3 text-sm space-y-1">{children}</div>}
    </div>
  );
}

export default function LessonsPage() {
  const router = useRouter();
  const [data, setData] = useState<LessonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = gallery overview
  const [starting, setStarting] = useState(false);
  const [diligent, setDiligent] = useState(false);

  // ── Gallery multi-select state ──────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Collapsible sections for lesson cards ───────────────────
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["meaning", "reading"])
  );

  // ── Fetch available lessons ─────────────────────────────────
  function fetchLessons(isDiligent: boolean) {
    setLoading(true);
    const url = isDiligent ? "/api/lessons?diligent=true" : "/api/lessons";
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
        if (json.lessons) {
          setSelectedIds(new Set(json.lessons.map((l: LessonItem) => l.id)));
        }
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchLessons(false);
  }, []);

  function toggleDiligent() {
    const next = !diligent;
    setDiligent(next);
    fetchLessons(next);
  }

  // ── Toggle item selection in gallery ────────────────────────
  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (data) {
      setSelectedIds(new Set(data.lessons.map((l) => l.id)));
    }
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // ── Start lessons for selected items ────────────────────────
  async function startLessons() {
    if (selectedIds.size === 0) return;
    setStarting(true);
    try {
      await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: Array.from(selectedIds) }),
      });
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to start lessons:", err);
    }
    setStarting(false);
  }

  // ── Section toggle helpers ──────────────────────────────────
  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Keyboard shortcuts (F/E/R) ──────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (currentIndex < 0) return; // Only in lesson card view
      if (document.activeElement?.tagName === "INPUT") return;

      const key = e.key.toLowerCase();
      if (key === "f") {
        e.preventDefault();
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
      } else if (key === "arrowright" || key === "arrowdown") {
        e.preventDefault();
        if (data && currentIndex < data.lessons.filter((l) => selectedIds.has(l.id)).length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setOpenSections(new Set(["meaning", "reading"]));
        }
      } else if (key === "arrowleft" || key === "arrowup") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setOpenSections(new Set(["meaning", "reading"]));
        }
      }
    },
    [currentIndex, data, selectedIds]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl animate-soft-pulse">🌱</span>
          <p className="mt-4 text-muted-foreground">Finding new seeds...</p>
        </div>
      </div>
    );
  }

  if (!data || data.totalAvailable === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <span className="text-6xl">🌿</span>
          <h2 className="text-xl font-semibold">No new lessons available</h2>
          <p className="text-muted-foreground max-w-md">
            Keep reviewing your current flowers! Once enough reach Blooming (stage 5+),
            new items will unlock~
          </p>
          <button
            onClick={() => router.push("/reviews")}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
          >
            Go to Reviews
          </button>
        </div>
      </div>
    );
  }

  // Filter to only selected items for lesson view
  const selectedLessons = data.lessons.filter((l) => selectedIds.has(l.id));

  // ── Gallery overview: select items like photos ──────────────
  if (currentIndex === -1) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">New Seeds to Plant!</h1>
          <p className="text-muted-foreground">
            Level {data.currentLevel} -- tap to select which items to learn
          </p>
        </div>

        {/* Select all / Deselect all / Diligent mode */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={selectAll}
            className="px-4 py-1.5 text-sm rounded-full border-2 border-border hover:bg-muted transition-all"
          >
            Select All ({data.totalAvailable})
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-1.5 text-sm rounded-full border-2 border-border hover:bg-muted transition-all"
          >
            Deselect All
          </button>
          <button
            onClick={toggleDiligent}
            className={`px-4 py-1.5 text-sm rounded-full border-2 transition-all ${
              diligent
                ? "border-accent bg-accent/10 text-accent-hover font-semibold"
                : "border-border hover:bg-muted hover:border-accent/40"
            }`}
          >
            {diligent ? "Diligent Mode ON!" : "I'm feeling diligent today!"}
          </button>
        </div>

        {/* Item gallery grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {data.lessons.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`
                  relative flex flex-col items-center p-4 rounded-xl border-2 transition-all
                  ${isSelected
                    ? "border-opacity-100 scale-[1.02] shadow-sm"
                    : "border-border opacity-60 hover:opacity-80"
                  }
                `}
                style={{
                  borderColor: isSelected
                    ? TYPE_BORDER_SELECTED[item.type] ?? "var(--primary)"
                    : "var(--border)",
                  backgroundColor: isSelected
                    ? TYPE_BG[item.type] ?? "var(--card)"
                    : "var(--card)",
                }}
              >
                {/* Selection checkmark */}
                {isSelected && (
                  <span className="absolute top-1 right-1 text-xs bg-primary text-white w-5 h-5 flex items-center justify-center rounded-full">
                    ✓
                  </span>
                )}
                <span className="jp-text-lg font-bold">{item.primaryDisplay}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {item.meanings.find((m) => m.isPrimary)?.meaning}
                </span>
              </button>
            );
          })}
        </div>

        {/* Start button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={startLessons}
            disabled={starting || selectedIds.size === 0}
            className="px-8 py-4 bg-secondary text-white rounded-full font-bold text-lg hover:bg-secondary-hover disabled:opacity-50 transition-all hover:shadow-lg"
          >
            {starting
              ? "Planting seeds..."
              : selectedIds.size === 0
              ? "Select items to learn"
              : `Start ${selectedIds.size} Lesson${selectedIds.size > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Lesson card view ────────────────────────────────────────
  const item = selectedLessons[currentIndex];
  if (!item) {
    // Done with all lessons!
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold">All seeds planted!</h2>
          <p className="text-muted-foreground">
            Your new flowers are ready for their first review~
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/reviews")}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
            >
              Start Reviews
            </button>
            <button
              onClick={() => {
                setCurrentIndex(-1);
                setSelectedIds(new Set());
              }}
              className="px-6 py-3 border-2 border-border rounded-full font-medium hover:bg-muted"
            >
              Back to Lessons
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 border-2 border-border rounded-full font-medium hover:bg-muted"
            >
              Garden
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryMeaning = item.meanings.find((m) => m.isPrimary)?.meaning ?? "";
  const meaningMnemonic = item.mnemonics.find((m) => m.type === "meaning")?.text ?? "";
  const readingMnemonic = item.mnemonics.find((m) => m.type === "reading")?.text ?? "";
  const onyomi = item.readings.filter((r) => r.readingType === "onyomi");
  const kunyomi = item.readings.filter((r) => r.readingType === "kunyomi");
  const nanori = item.readings.filter((r) => r.readingType === "nanori");

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{selectedLessons.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / selectedLessons.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main display */}
      <div className="rounded-2xl border-2 border-border bg-card p-8 text-center">
        <div className="py-4">
          <span className="jp-text-xl font-bold">{item.primaryDisplay}</span>
        </div>
        <p className="text-xl font-semibold">{primaryMeaning}</p>
        {item.meanings.filter((m) => !m.isPrimary).length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Also: {item.meanings.filter((m) => !m.isPrimary).map((m) => m.meaning).join(", ")}
          </p>
        )}
      </div>

      {/* F/E/R shortcut buttons */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Details
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

      {/* Collapsible sections */}
      <div className="space-y-2">
        {/* Meaning section */}
        <CollapsibleSection
          title="Meaning"
          isOpen={openSections.has("meaning")}
          onToggle={() => toggleSection("meaning")}
        >
          <p className="font-semibold">{primaryMeaning}</p>
          {item.meanings.filter((m) => !m.isPrimary).length > 0 && (
            <p className="text-muted-foreground text-xs">
              Also: {item.meanings.filter((m) => !m.isPrimary).map((m) => m.meaning).join(", ")}
            </p>
          )}
          {meaningMnemonic && (
            <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs">
              <span className="font-medium">{FLOWER_STAGE_EMOJI[0]} Mnemonic: </span>
              {meaningMnemonic}
            </div>
          )}
        </CollapsibleSection>

        {/* Reading section */}
        {item.readings.length > 0 && (
          <CollapsibleSection
            title="Readings"
            isOpen={openSections.has("reading")}
            onToggle={() => toggleSection("reading")}
          >
            {onyomi.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">On&apos;yomi: </span>
                <span className="jp-text font-medium">
                  {onyomi.map((r) => r.reading).join("、")}
                </span>
              </div>
            )}
            {kunyomi.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Kun&apos;yomi: </span>
                <span className="jp-text font-medium">
                  {kunyomi.map((r) => r.reading).join("、")}
                </span>
              </div>
            )}
            {nanori.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Nanori: </span>
                <span className="jp-text font-medium">
                  {nanori.map((r) => r.reading).join("、")}
                </span>
              </div>
            )}
            {readingMnemonic && (
              <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs">
                <span className="font-medium">{FLOWER_STAGE_EMOJI[1]} Mnemonic: </span>
                {readingMnemonic}
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Mnemonics combined */}
        {(meaningMnemonic || readingMnemonic) && (
          <CollapsibleSection
            title="Mnemonics"
            isOpen={openSections.has("mnemonic")}
            onToggle={() => toggleSection("mnemonic")}
          >
            {meaningMnemonic && (
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Meaning</p>
                <p>{meaningMnemonic}</p>
              </div>
            )}
            {readingMnemonic && (
              <div className="bg-muted/50 rounded-lg p-2 mt-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Reading</p>
                <p>{readingMnemonic}</p>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Components / Built from */}
        {item.dependencies.length > 0 && (
          <CollapsibleSection
            title="Components"
            isOpen={openSections.has("components")}
            onToggle={() => toggleSection("components")}
          >
            <div className="flex flex-wrap gap-2">
              {item.dependencies.map((dep) => (
                <span
                  key={dep.itemId}
                  className="px-2 py-1 rounded-lg bg-muted text-xs"
                >
                  <span className="jp-text text-base font-medium">{dep.display}</span>
                  <span className="text-muted-foreground ml-1">({dep.meaning})</span>
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* User Notes (placeholder) */}
        <CollapsibleSection
          title="My Notes"
          isOpen={openSections.has("notes")}
          onToggle={() => toggleSection("notes")}
        >
          <p className="text-muted-foreground italic text-xs">
            Personal notes coming soon~
          </p>
        </CollapsibleSection>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => {
            setCurrentIndex(Math.max(0, currentIndex - 1));
            setOpenSections(new Set(["meaning", "reading"]));
          }}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-full border-2 border-border text-sm font-medium disabled:opacity-30 hover:bg-muted"
        >
          ← Previous
        </button>

        <button
          onClick={() => {
            if (currentIndex < selectedLessons.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setOpenSections(new Set(["meaning", "reading"]));
            } else {
              setCurrentIndex(currentIndex + 1); // triggers "done" view
            }
          }}
          className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover"
        >
          {currentIndex < selectedLessons.length - 1 ? "Next →" : "Done!"}
        </button>
      </div>

      {/* Keyboard hints */}
      <p className="text-center text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">←</kbd>{" "}
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">→</kbd> navigate
        {" · "}
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">F</kbd> meaning/reading
        {" · "}
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">E</kbd> expand all
        {" · "}
        <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">R</kbd> collapse
      </p>
    </div>
  );
}
