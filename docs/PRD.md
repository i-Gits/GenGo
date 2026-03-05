# GenGo! -- Product Requirements Document (PRD)
# ╭───────────────────────────────· · ୨୧ · · ───────────────────────────────╮
#   version: 1.0.0 (MVP)  |  status: APPROVED  |  author: i-Gits
# ╰───────────────────────────────· · ୨୧ · · ───────────────────────────────╯

---

## 1. Product Overview

### 1.1 What Is GenGo!?

GenGo! (言語!) is a level-based spaced repetition language learning app,
starting with Japanese. It teaches kanji, vocabulary, and readings through
a structured 100-level progression system where items unlock based on
mastery ^^ not just time spent.

Think of it as: **WaniKani's brain + my own personality + extensibility for
any language.**

### 1.2 Who Is It For?

- **Primary user (V1):** Author! A JLPT N3 learner who wants a structured,
  cute, and motivating way to solidify and grow Japanese knowledge.
- **Future users:** Language learners who want SRS with personality,
  progression with purpose, not expensive, and a UI that doesn't feel
  like a spreadsheet. (Accessibility note: WaniKani and similar tools are
  cost-prohibitive for learners in many parts of the world. GenGo! is
  designed to be free and open.)

### 1.3 Why Build It?

- Existing SRS tools (Anki, WaniKani) are either too dry, too rigid,
  too unrelatable, or very expensive -- especially for learners in
  developing countries.
- I want full control over content, pacing, and aesthetics.
- I want to learn software development BY building something meaningful.
- The engine should be language-agnostic so Mandarin, Hebrew, Spanish
  can be added later without rewriting the core~

---

## 2. Core Concepts (The Mental Model)

### 2.1 How Learning Works in GenGo!

```
   ╭─────────────╮     ╭─────────────╮     ╭─────────────╮
   |   LESSONS    | --> |   REVIEWS   | --> |  LEVEL UP!  |
   |  (learn new  |     | (SRS quiz   |     | (unlock new |
   |   items)     |     |  over time) |     |  content)   |
   ╰─────────────╯     ╰─────────────╯     ╰─────────────╯
```

1. **Lessons**: User learns new items (kanji, vocab, readings)
2. **Reviews**: Items come back at increasing intervals (SRS)
3. **Level Up**: When enough items reach "Guru" stage, next level unlocks

### 2.2 Item Types (Japanese V1)

| Type      | Example    | Description                            | When      |
|-----------|------------|----------------------------------------|-----------|
| Component | 亻         | Radicals -- building blocks of kanji   | V1        |
| Character | 人         | Kanji -- the core characters           | V1        |
| Vocabulary| 人口       | Words built from learned kanji         | V1        |
| Phrase    | お元気ですか | Common expressions and sentences      | V2        |
| Grammar   | てform     | Grammar patterns (e.g. て-form rules)  | V2        |

**JLPT tagging:** Every item will have an optional `jlpt_level` field
(N5 / N4 / N3 / N2 / N1 / null). This is just metadata -- it doesn't
affect the engine, only helps users understand real-world relevance.

**Dependency chain:** Components --> Characters --> Vocabulary
(You learn the parts before the whole. Like OOP inheritance!)

### 2.3 SRS Stages

Each item progresses through stages as you answer correctly.

**Internal numbers (in the database):** always 0–9. Numbers are clean,
engine-friendly, and language-agnostic. The *display names* shown in
the UI are a separate, decorative layer -- so they can be themed!

| Stage | Internal # | Interval      | Flower Theme 🌸          | Visual State       |
|-------|-----------|---------------|--------------------------|-------------------|
| 0     | 0         | Immediate     | 🌰 Seed                 | Tiny seed in soil  |
| 1     | 1         | 4 hours       | 🌱 Sprout               | First green shoot  |
| 2     | 2         | 8 hours       | 🪴 Seedling             | Small stem + leaves|
| 3     | 3         | 1 day         | 🌿 Young Plant          | Growing taller     |
| 4     | 4         | 3 days        | 🌷 Budding              | Flower bud appears!|
| 5     | 5         | 1 week        | 🌸 Blooming             | First petals open  |
| 6     | 6         | 2 weeks       | 🌺 Full Bloom           | Beautiful flower   |
| 7     | 7         | 1 month       | 💐 Flourishing          | Vibrant and strong |
| 8     | 8         | 4 months      | 🌳 Deeply Rooted        | Practically a tree |
| 9     | 9         | Forever        | 🪻 Eternal (Pressed)    | Preserved in a book|

> 🌱 **The Wilting Mechanic:**
> - Wrong answer → flower loses petals, droops slightly 🥀
> - Overdue review (not done on time) → flower looks dry/thirsty 🏜️
> - Completing an overdue review → flower gets "watered" and perks back up 💧
> - Burned/Eternal → flower is pressed into a book, preserved forever 📖
>
> Your dashboard IS a garden. Each kanji is a flower. You're the gardener.
> "3 flowers need watering!" hits different than "23 reviews pending."

**Wrong answer?** Drop 1–2 stages, flower loses petals. But GenGo! is kind about it.
The SRS penalty is firm but the *tone* is always gentle (or playfully
chaotic, depending on your mode~).

---

## 3. MVP Feature List (V1)

### 3.1 Must Have (Ship-blocking)

- [ ] **Lesson system**: View and learn new unlocked items
  - Show: character, meaning, reading(s), mnemonic, user notes
  - Mark as "learned" (enters SRS stage 0)
- [ ] **Review system**: Quiz on items due for review
  - Meaning quiz: "What does 人 mean?" → type answer in English
  - Reading quiz: "How do you read 人?" → type in かな (auto-converts from
    romaji input silently -- romaji is NEVER displayed. See Section 4.5.)
  - Correct = advance stage | Wrong = drop stage
- [ ] **SRS engine**: Calculate next review time per item
  - Configurable intervals per stage
  - Handle correct/incorrect state transitions
- [ ] **Level system**: 100 levels with structured content
  - Items assigned to levels
  - Level unlock when 90% of current level's characters reach Guru (stage 5+)
- [ ] **Dependency system**: Items unlock based on prerequisites
  - Vocab unlocks only after its component kanji are Guru+
- [ ] **Dashboard**: At-a-glance progress view
  - Current level
  - Items per SRS stage (counts: Egg / Larva / Cocoon / Butterfly / Burned)
  - Reviews available now (with big inviting button~)
  - Overall accuracy rate
- [ ] **Japanese seed data**: Levels 1–5 with real content
  - Components, Characters, Vocabulary per level
  - Meanings, readings, mnemonics (written with GenGo!'s voice)
  - JLPT level tags where applicable

### 3.2 Should Have (V1 polish)

- [ ] **Encouragement mode selector**: Choose your companion's personality
  (see Section 5.4 for full dialogue table)
- [ ] **User notes per item**: Add your own memory hooks, observations,
  or little doodle descriptions to any kanji or vocab 📝
- [ ] **Review summary**: After a session ends, show:
  - Correct/incorrect count + accuracy %
  - Items that advanced or dropped
  - Streak info (days in a row)
- [ ] **Onboarding title selector**: Pick your honorific on first launch
  (see Section 4.1)
- [ ] **Dark mode / Light mode toggle**
- [ ] **Daily review limit**: Configurable cap to prevent burnout
- [ ] **Lesson batch size selector**: 5 / 10 / custom (user preference,
  saved to their profile)

### 3.3 Nice to Have (Post-V1)

- [ ] Expanded mnemonic library (community-contributed)
- [ ] Offline mode
- [ ] Streak / badge system
- [ ] Performance analytics (charts, trends, heatmap)
- [ ] Audio pronunciation (after V1)
- [ ] Second language support (Mandarin Chinese next)
- [ ] Community-contributed content packs
- [ ] Mobile responsive / PWA
- [ ] Phrase and Grammar item types (V2 content expansion)

---

## 4. User Experience Flow

### 4.1 Onboarding (First Launch)

```
1. Land on GenGo! welcome screen ✨
2. GenGo! asks: "What shall I call you?"
   → User picks honorific from presets:
        王女 (おうじょ / Princess)
        王子 (おうじ / Prince)
        王 (おう / Ruler)
        女王 (じょおう / Queen)
        勇者 (ゆうしゃ / Hero)
        魔王 (まおう / Demon Lord)
        旅人 (たびびと / Traveler)
        博士 (はかせ / Scholar)
        先生 (せんせい / Teacher)
        ...or type a custom title!
   → User types preferred name (or username)
   → Both are changeable anytime in Settings
3. GenGo! asks: "What's your review companion like?"
   → User picks encouragement mode (can change anytime in settings)
4. Account setup (or skip for local mode)
5. Arrive at dashboard: Level 1, 0 items learned
```

### 4.2 First-Time Learning

```
1. Dashboard shows big glowing "Start Lessons" button
2. User starts first lesson batch (5 / 10 / custom -- their choice)
3. Learn each item: see character, meaning, reading(s), mnemonic
4. Complete lesson → items enter SRS at Stage 0
5. Wait for first review interval (4 hours at Stage 1)
6. Do reviews → progress through stages
7. When enough items hit Stage 5 (Guru/Butterfly) → Level 2 unlocks! 🦋
8. Repeat forever ꒰awa꒱
```

### 4.3 Returning User Flow

```
1. Open GenGo! → Dashboard
2. See greeting: "おかえり、王女 arc！あなたには 23 件のレビューがあります。"
3. Click "Start Reviews"
4. Answer meaning and reading questions
5. Get companion feedback per answer (based on chosen mode)
6. See session summary
7. Optional: Start more lessons if available
8. Close app and come back when next reviews are due~
```

### 4.4 Lesson Screen (Wireframe)

```
╭──────────────────────────────────────╮
|  Level 1 · Lesson 3 of 10           |
|                                      |
|              人                      |
|           [ person ]                 |
|                                      |
|  Readings:                           |
|    じん · にん  (音読み)              |
|    ひと         (訓読み)              |
|                                      |
|  Mnemonic:                           |
|  "A person walking -- see the two    |
|   legs? Strolling through a garden~" |
|                                      |
|  📝 My note: [                    ]  |
|                                      |
|              [ 次へ →  ]             |
╰──────────────────────────────────────╯
```

> 🚫 **NO ROMAJI RULE (design law, not suggestion):**
> Romaji will NEVER appear anywhere in the UI -- not in readings,
> not in labels, not in hints. Reading labels use 音読み / 訓読み.
> (See Section 4.5 for how reading input works without romaji display.)

### 4.5 Reading Input -- The "Silent Convert" Rule

> ❓ **Decision needed (arc to confirm):**

During reading reviews, the user needs to TYPE their answer in かな.
The recommended approach is **silent romaji-to-kana conversion**:

```
User types:  h → i → t → o
App shows:   ひ → ひ → ひと → ひと
Romaji is:   NEVER displayed, only used as invisible input method
```

This is exactly how your Mac's Japanese keyboard works -- you type
romaji and it silently becomes kana. We replicate this in the app.
Zero romaji ever appears on screen. ✅

Alternative options:
- IME-only input (user manages their own keyboard -- more friction)
- On-screen kana grid (good for mobile, slow for desktop)

**Recommended:** Silent convert. Confirm?

### 4.6 Review Screen (Wireframe)

```
╭──────────────────────────────────────╮
|  レビュー · 残り 14 問               |
|                                      |
|              人                      |
|                                      |
|  この漢字の意味は？                   |
|  ┌──────────────────────────┐       |
|  |  [user types here]       |       |
|  └──────────────────────────┘       |
|                                      |
|  (⊙_⊙) "ehhh?! not quite~"         |
|  正解： Person                       |
|                                      |
|              [ 次へ → ]              |
╰──────────────────────────────────────╯
```

---

## 5. Design Direction

### 5.1 Aesthetic: "Bubbly Garden Cafe with a Clean Desk"

**The concept:** The outer shell (background, navigation, frame) is warm,
pastel, pixel-flower-decorated -- garden party vibes. The inner content
area (lesson cards, review box, dashboard panels) is clean, cream/beige,
and focused -- like a well-organized notebook sitting on a flower-covered
table.

Think of it as: **loud wallpaper + calm workspace**.

| Layer       | Style                                                  |
|-------------|-------------------------------------------------------|
| Background  | Pastel gradient: soft pink → light coral. Pixel flowers. |
| Navigation  | Rounded, warm rose tones, subtle sparkle accents       |
| Content cards | Cream / warm beige, generous padding, soft shadows   |
| Typography  | Rounded sans-serif (e.g. Nunito, Quicksand), clear hierarchy |
| Accents     | Kaomoji, soft drop shadows, pastel highlights          |
| Dark mode   | Deep navy/purple bg, same pastel + cream card accents  |

### 5.2 Color Palette

```
── Light Mode ──────────────────────────────────────────
Page BG:     #FFF0F0  (barely-there blush pink)
Card BG:     #FEF9F2  (warm cream)
Primary:     #F2A7C3  (soft rose pink)
Coral:       #F4937A  (warm coral -- accent)
Secondary:   #A7D8DE  (calm mint -- contrast pop)
Peach:       #FFD6A5  (warm peach glow)
Text:        #2D2D2D  (soft black -- never harsh)
Muted text:  #9E9E9E  (for labels, timestamps)

── Dark Mode ────────────────────────────────────────────
Page BG:     #1A1A2E  (deep midnight)
Card BG:     #16213E  (navy card)
Primary:     #F2A7C3  (same pink -- pops on dark)
Text:        #F5EFE6  (warm white)
```

### 5.3 Mascot: TBD 🎨

**Candidates under consideration:**
- 🐱 Black cat silhouette (mysterious, elegant, classic)
- 🦊 Fox (clever, playful -- ties to Inari / Japanese culture)
- 🌸 Flower character (on-brand with garden theme)
- (｡◕‿◕｡) Kaomoji-only (faces change contextually, no fixed character)
- 🐱+kaomoji Hybrid: simple mascot + kaomoji reactions

**Decision:** UI/UX phase. Does not block architecture or engine work.

### 5.4 Encouragement Mode System

User selects a companion mode that changes ALL feedback text across
the app. Can be changed anytime in settings.

| Mode                 | Correct Answer                        | Wrong Answer                                    |
|----------------------|---------------------------------------|-------------------------------------------------|
| 🌸 Playful Tease     | "Ayy nice one! (>w<)"                | "Ehhh?! (⊙_⊙) close but not quite~"            |
| 📖 Encouraging Teacher| "Beautiful! You're growing so much~" | "Almost! We'll get it next time 🌱"             |
| 😤 Tsundere          | "H-hmph. Fine, you got it. ...good." | "バカ！ That's wrong! ...try again."            |
| 🔪 Yandere           | "Yes~ perfect~ just for me~"         | "Wrong... you're not leaving until it's right~ 🔪" |
| 📋 Boring & Straight | "Correct."                           | "Incorrect. The answer was X."                  |
| 🃏 Wildcard           | *(randomly picks from other modes)*  | *(randomly picks from other modes)*             |
| 🤪 CrazyHana         | "WABBY WABBO!! That answer was so good my SUNFLOWERS started SINGING!" | "The zombies ATE your answer!! It's okay I have a SPARE one somewhere in my TRUNK." |

> 🌮 **CrazyHana** is GenGo!'s chaotic garden spirit -- an unhinged flower
> enthusiast who speaks in non-sequiturs, random CAPS, and unpredictable
> gardening metaphors. Core traits: absolute randomness, garden obsession,
> flower power chaos, time-traveling logic. Tacos appear *occasionally*
> as a treat, not every line. The key is unpredictability --
> no two CrazyHana messages should feel formulaic.

---

## 6. Technical Decisions

| Decision        | Choice               | Why                                        |
|-----------------|----------------------|--------------------------------------------|
| Language        | TypeScript           | Type safety, Java-like OOP, great for learning |
| Framework       | Next.js (App Router) | Full-stack in one project, React-based     |
| Styling         | Tailwind CSS         | Utility-first, fast iteration              |
| Database        | Supabase (Postgres)  | Free, hosted, arc knows PostgreSQL         |
| ORM             | Prisma               | Type-safe DB queries, great dev experience |
| Auth            | Supabase Auth        | Built-in, free, easy onboarding            |
| Hosting (later) | Vercel               | Free tier, purpose-built for Next.js       |

---

## 7. Data Model (High-Level Preview)

```
languages ──< items ──< item_meanings
                    ──< item_readings
                    ──< item_mnemonics
                    ──< dependencies  (item depends_on item)

users ──< user_item_states  (SRS progress + user notes per item)
      ──< review_logs       (full answer history)
      ──< user_preferences  (mode, theme, title, lesson batch size, etc.)
```

**New fields confirmed:**
- `items.jlpt_level` → N5 / N4 / N3 / N2 / N1 / null
- `user_item_states.user_note` → personal note text, nullable
- `user_preferences.honorific` → 王女 / 王子 / 王 / 女王 / 勇者 / 先生 / custom
- `user_preferences.preferred_name` → display name string
- `user_preferences.encouragement_mode` → enum of all modes
- `user_preferences.lesson_batch_size` → 5 / 10 / custom int
- `user_preferences.theme` → light / dark

**Full schema SQL will be defined in Phase 2 (Architecture).**

---

## 8. Project Phases & Roadmap

| Phase | Name                  | Deliverable                       | Status      |
|-------|-----------------------|-----------------------------------|-------------|
| 1     | PRD                   | This document                     | ✅ APPROVED |
| 2     | Architecture & Schema | System design, DB schema, folders | ✅ APPROVED |
| 3     | Environment Setup     | Node, Next.js, Supabase, Prisma   | ✅ COMPLETE |
| 4     | Core SRS Engine       | Stage transitions, intervals      | ✅ COMPLETE |
| 5     | Level & Unlock System | Progression logic, dependencies   | ✅ COMPLETE |
| 6     | API Routes            | Backend endpoints                 | NOT STARTED |
| 7     | UI: Dashboard         | Home screen, progress display     | NOT STARTED |
| 8     | UI: Lessons           | Learn new items flow              | NOT STARTED |
| 9     | UI: Reviews           | Quiz flow + encouragement modes   | NOT STARTED |
| 10    | Seed Data             | Japanese Levels 1–5               | NOT STARTED |
| 11    | Polish & Testing      | Bug fixes, edge cases, QA         | NOT STARTED |
| 12    | Deploy                | Go live on Vercel + Supabase      | NOT STARTED |

---

## 9. Success Metrics (How We Know V1 Works)

- [ ] User can complete a full lesson of 5+ items
- [ ] Items appear for review at correct SRS intervals
- [ ] Wrong answers correctly drop SRS stage
- [ ] Level 2 unlocks only after Level 1 characters reach Guru (Stage 5+)
- [ ] Dashboard accurately reflects per-stage counts
- [ ] Encouragement mode changes feedback text throughout the app
- [ ] NO ROMAJI appears anywhere in the UI (ever)
- [ ] User notes save and load correctly per item
- [ ] Honorific + name appear in all greetings
- [ ] UI feels cute, warm, and motivating ✨ (the arc vibe check)
- [ ] Code is clean, documented, and arc understands every line

---

## 10. Open Questions (Needs arc's input before Phase 2)

| # | Question | Status |
|---|----------|--------|
| 1 | **SRS stage theme** -- Flower lifecycle 🌱→🌸→🪻 with wilting mechanic | ✅ Resolved |
| 2 | **Reading input** -- Silent romaji-to-kana conversion (romaji never displayed) | ✅ Resolved |
| 3 | **CrazyHana** -- Original chaotic garden spirit. Random, unhinged, flower-obsessed, unpredictable | ✅ Resolved |
| 4 | **Mnemonics** -- Hand-crafted in GenGo!'s voice, reviewed and edited to taste | ✅ Resolved |
| 5 | **Honorifics** -- all presets + custom + changeable in settings | ✅ Resolved |

---

## 11. Mnemonic Approach -- Resource Examples

For arc's reference when writing GenGo!'s mnemonics:

**WaniKani style** (story + visual):
> 人 → "This looks like a person walking, seen from the side.
> Two legs, mid-stride, heading somewhere important."

**RTK (Heisig)** (pure imagination, no readings):
> 人 → keyword: "person" → story built from the shape alone.

**KanjiDamage** (chaotic, pop-culture, very memorable):
> 人 → "A stick figure at a party, too cool to stand up straight."

**GenGo! style (what we'll write -- your voice!):**
> 人 → "Two legs, walking through a moonlit garden. No hurry.
> Just a *person*, taking their sweet time~"

Mnemonics in GenGo! are written in YOUR voice -- cute, garden-coded,
occasionally chaotic. Each one hand-crafted and reviewed for quality.

---

# End of PRD v1.0.0
# ╭───────────────────────────────· · ୨୧ · · ───────────────────────────────╮
#   "let's make language learning cuter, one kanji at a time" -- GenGo!
# ╰───────────────────────────────· · ୨୧ · · ───────────────────────────────╯
