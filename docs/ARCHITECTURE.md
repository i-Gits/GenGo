# GenGo! -- Architecture Document
# ╭───────────────────────────────· · ୨୧ · · ───────────────────────────────╮
#   version: 1.0.0  |  status: DRAFT  |  phase: 2  |  author: i-Gits
# ╰───────────────────────────────· · ୨୧ · · ───────────────────────────────╯

---

## 1. System Architecture -- The Big Picture

GenGo! is a **3-layer application** with a separate **content layer**.
Each layer has ONE job and talks to the others through clean contracts.

```
╭──────────────────────────────────────────────────────────────────╮
|                                                                  |
|   🌸 PRESENTATION LAYER (UI)                                    |
|   ┌──────────────────────────────────────────────────────────┐  |
|   | Next.js App Router (React + Tailwind)                    |  |
|   | Pages: Dashboard, Lessons, Reviews, Settings             |  |
|   | Components: Cards, Buttons, ReviewInput, StageIndicator  |  |
|   └──────────────────┬───────────────────────────────────────┘  |
|                       | calls API routes                        |
|                       v                                          |
|   🍽️  API LAYER (Waiter)                                        |
|   ┌──────────────────────────────────────────────────────────┐  |
|   | Next.js API Routes (server-side)                         |  |
|   | /api/lessons, /api/reviews, /api/progress, /api/user     |  |
|   | Validates input, calls engine, returns JSON              |  |
|   └──────────────────┬───────────────────────────────────────┘  |
|                       | calls engine functions                   |
|                       v                                          |
|   🧑‍🍳 ENGINE LAYER (Kitchen)                                    |
|   ┌──────────────────────────────────────────────────────────┐  |
|   | Pure TypeScript -- NO framework dependencies             |  |
|   | SRS Engine: stage transitions, interval calculation       |  |
|   | Level System: unlock logic, dependency resolution         |  |
|   | Review Queue: what's due, priority sorting                |  |
|   └──────────────────┬───────────────────────────────────────┘  |
|                       | reads/writes data                        |
|                       v                                          |
|   📋 DATA LAYER (Recipe Book)                                   |
|   ┌──────────────────────────────────────────────────────────┐  |
|   | Prisma ORM --> Supabase (PostgreSQL)                     |  |
|   | Tables: items, users, user_item_states, review_logs...   |  |
|   | Seed data: Japanese Levels 1-5                           |  |
|   └──────────────────────────────────────────────────────────┘  |
|                                                                  |
╰──────────────────────────────────────────────────────────────────╯
```

### Why This Matters (The Spaghetti Prevention Plan)

| Rule | What it means | Why |
|------|--------------|-----|
| UI never touches the database directly | Dashboard calls `/api/progress`, NOT `prisma.user.find()` | If we swap databases later, UI doesn't change |
| Engine has ZERO framework code | No `import React`, no `import next` in engine files | Engine can be reused in a mobile app, CLI tool, etc. |
| API routes are thin | They validate input, call engine, return result. No business logic here. | Easy to test, easy to read |
| Database is accessed ONLY through Prisma | No raw SQL in engine or API code | Type safety, auto-completion, migration support |

> 🧠 **Java analogy:** This is like the MVC pattern (Model-View-Controller)
> you may have learned:
> - **Model** = Data Layer (Prisma + DB)
> - **View** = Presentation Layer (React UI)
> - **Controller** = API + Engine Layers
>
> We split "Controller" into two parts (API + Engine) because GenGo!'s
> engine logic is complex enough to deserve its own layer. This is a
> common evolution of MVC in real-world apps.

---

## 2. Folder Structure

```
GenGo!/
├── docs/                          # 📄 Project documentation
│   ├── PRD.md                     #    Product requirements (Phase 1 ✅)
│   └── ARCHITECTURE.md            #    This file (Phase 2)
│
├── prisma/                        # 📋 Database layer
│   ├── schema.prisma              #    DB schema definition
│   ├── seed.ts                    #    Seed data (Japanese Levels 1-5)
│   └── migrations/                #    Auto-generated DB migrations
│
├── src/                           # 🏠 All source code lives here
│   │
│   ├── engine/                    # 🧑‍🍳 Core Engine (pure TypeScript, no framework)
│   │   ├── srs.ts                 #    SRS stage transitions + interval calc
│   │   ├── levels.ts              #    Level unlock logic + dependency checks
│   │   ├── review-queue.ts        #    "What's due?" query builder + priority sort
│   │   ├── types.ts               #    Shared TypeScript types/interfaces
│   │   └── constants.ts           #    SRS intervals, stage names, thresholds
│   │
│   ├── app/                       # 🌸 Next.js App Router (pages + API)
│   │   ├── layout.tsx             #    Root layout (wraps every page)
│   │   ├── page.tsx               #    Home/Dashboard page
│   │   ├── globals.css            #    Global styles + Tailwind
│   │   │
│   │   ├── lessons/
│   │   │   └── page.tsx           #    Lesson screen
│   │   │
│   │   ├── reviews/
│   │   │   └── page.tsx           #    Review/quiz screen
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx           #    User preferences screen
│   │   │
│   │   └── api/                   # 🍽️  API routes (server-side)
│   │       ├── lessons/
│   │       │   └── route.ts       #    GET: available lessons
│   │       ├── reviews/
│   │       │   ├── route.ts       #    GET: review queue | POST: submit answer
│   │       │   └── summary/
│   │       │       └── route.ts   #    GET: session summary stats
│   │       ├── progress/
│   │       │   └── route.ts       #    GET: dashboard data (level, counts)
│   │       └── user/
│   │           └── route.ts       #    GET/PUT: user preferences
│   │
│   ├── components/                # 🧩 Reusable UI components
│   │   ├── ui/                    #    Generic: Button, Card, Input, Modal
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   ├── review-input.tsx       #    The kana input box (silent convert)
│   │   ├── flower-stage.tsx        #    Shows flower lifecycle state (seed→bloom→eternal)
│   │   ├── encouragement.tsx      #    Displays companion feedback message
│   │   ├── item-card.tsx          #    Shows a kanji/vocab item with details
│   │   └── progress-bar.tsx       #    Visual level progress indicator
│   │
│   ├── lib/                       # 🔧 Utilities + shared helpers
│   │   ├── prisma.ts              #    Prisma client singleton
│   │   ├── kana-converter.ts      #    Romaji → kana silent conversion
│   │   ├── encouragement-data.ts  #    All companion mode dialogue strings
│   │   ├── stage-display.ts       #    Maps stage numbers → flower names/icons
│   │   └── flower-health.ts      #    Calculates wilt state (overdue? missed?)
│   │
│   └── hooks/                     # 🪝 React hooks (custom logic for components)
│       ├── use-review-session.ts  #    Manages review flow state
│       └── use-user-prefs.ts      #    Loads/saves user preferences
│
├── public/                        # 🖼️  Static files (images, fonts, icons)
│   └── (mascot art, pixel flowers, etc. -- added during UI phase)
│
├── .env.local                     # 🔒 Environment variables (Supabase keys etc.)
├── package.json                   # 📦 Dependencies + scripts
├── tsconfig.json                  # ⚙️  TypeScript configuration
├── tailwind.config.ts             # 🎨 Tailwind theme + custom colors
├── next.config.ts                 # ⚙️  Next.js configuration
└── README.md                      # (will write when project is ready)
```

### Reading the Folder Structure (Teaching Moment!)

> 🧠 **Think of folders like Java packages:**
>
> ```java
> // Java style:
> com.gengo.engine.SrsEngine        → src/engine/srs.ts
> com.gengo.models.Item             → src/engine/types.ts
> com.gengo.controllers.ReviewCtrl  → src/app/api/reviews/route.ts
> com.gengo.views.Dashboard         → src/app/page.tsx
> ```
>
> In Java, you organize by `com.company.layer.ClassName`.
> In Next.js, you organize by `src/layer/feature/file.ts`.
> Same idea, different syntax!

### Key Design Decisions in the Folder Layout

| Decision | Why |
|----------|-----|
| `engine/` has NO imports from `app/` or `components/` | Engine stays pure -- portable, testable, framework-free |
| `app/api/` routes are thin wrappers | They just validate → call engine → return JSON |
| `components/` is flat, not nested by page | Components are REUSABLE across pages |
| `lib/` holds utility functions | Shared code that doesn't belong to engine or UI |
| `hooks/` holds React-specific logic | Keeps component files clean and focused |

---

## 3. Database Schema (Prisma)

This is the full data model. Every table, every column, every relationship.

> 🧠 **What is Prisma?**
> Think of it as a translator between TypeScript and PostgreSQL.
> Instead of writing raw SQL like `SELECT * FROM items WHERE level = 1`,
> you write `prisma.item.findMany({ where: { level: 1 } })`.
>
> It also generates TypeScript types automatically -- so if your DB has
> a column called `srs_stage`, TypeScript will KNOW it exists and what
> type it is. No guessing. No typos. Like Java's strong typing but for
> your database.

```prisma
// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Database Schema (Prisma)
//   "every garden needs good soil" -- the data layer
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── LANGUAGES ──────────────────────────────────────────────
// Extensibility layer: Japanese now, Mandarin next, anything later.
// The engine reads this table to know what languages exist --
// it never hardcodes "ja" or "zh" anywhere.

model Language {
  id                String   @id @default(cuid())
  code              String   @unique          // "ja", "zh", "he", "es"
  displayName       String                    // "Japanese", "Mandarin Chinese"
  writingSystemType String                    // "logographic", "syllabary", "alphabetic", "abjad"
  createdAt         DateTime @default(now())

  items             Item[]                    // one language has many items
  srsConfigs        SrsConfig[]               // SRS intervals can differ per language

  @@map("languages")                          // table name in PostgreSQL
}

// ─── ITEMS ──────────────────────────────────────────────────
// The core content unit. Everything the user learns is an "item":
// a radical (component), a kanji (character), or a word (vocabulary).
//
// 🧠 Java analogy: Item is like an abstract superclass.
//    Component, Character, and Vocabulary are like subclasses --
//    but instead of inheritance, we use a "type" field (this pattern
//    is called "single table inheritance" or "discriminator pattern").

model Item {
  id               String   @id @default(cuid())
  languageId       String
  type             String                     // "component" | "character" | "vocabulary" | "phrase"
  level            Int                        // 1-100, which level this item belongs to
  primaryDisplay   String                     // the main display: "人", "人口", "亻"
  difficultyWeight Float    @default(1.0)     // multiplier for SRS intervals (harder = more reviews)
  jlptLevel        String?                    // "N5" | "N4" | "N3" | "N2" | "N1" | null
  createdAt        DateTime @default(now())

  language         Language       @relation(fields: [languageId], references: [id])
  meanings         ItemMeaning[]
  readings         ItemReading[]
  mnemonics        ItemMnemonic[]
  dependsOn        Dependency[]   @relation("item_depends")      // items this depends ON
  requiredBy       Dependency[]   @relation("item_required_by")  // items that depend on THIS
  userStates       UserItemState[]
  reviewLogs       ReviewLog[]

  @@index([languageId, level])               // fast queries: "all items for Japanese level 3"
  @@index([languageId, type, level])          // fast queries: "all characters for Japanese level 3"
  @@map("items")
}

// ─── ITEM MEANINGS ──────────────────────────────────────────
// One item can have multiple English meanings.
// Example: 人 → "person", "human", "people"
// is_primary marks the main meaning used for grading answers.

model ItemMeaning {
  id        String  @id @default(cuid())
  itemId    String
  meaning   String                            // "person", "human"
  isPrimary Boolean @default(false)           // the "main" answer

  item      Item    @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_meanings")
}

// ─── ITEM READINGS ──────────────────────────────────────────
// One item can have multiple readings (pronunciations).
// Example: 人 → じん (on), にん (on), ひと (kun)
//
// readingType distinguishes reading categories per language:
//   Japanese: "onyomi" | "kunyomi"
//   Chinese:  "pinyin"
//   Hebrew:   "transliteration"
//   Spanish:  "pronunciation"
//
// 🚫 NO ROMAJI ANYWHERE -- readings are stored in native script only.

model ItemReading {
  id          String  @id @default(cuid())
  itemId      String
  reading     String                          // "じん", "ひと" (NEVER "jin", "hito")
  readingType String                          // "onyomi" | "kunyomi" | "pinyin" | etc.
  isPrimary   Boolean @default(false)

  item        Item    @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_readings")
}

// ─── ITEM MNEMONICS ─────────────────────────────────────────
// Memory aids for learning. Each item can have:
//   - A meaning mnemonic ("how to remember what it means")
//   - A reading mnemonic ("how to remember how to say it")
//
// Hand-crafted in GenGo!'s voice -- cute, garden-coded,
// occasionally chaotic. Each one reviewed for quality.

model ItemMnemonic {
  id           String @id @default(cuid())
  itemId       String
  mnemonicType String                         // "meaning" | "reading"
  text         String                         // the actual mnemonic story

  item         Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_mnemonics")
}

// ─── DEPENDENCIES ───────────────────────────────────────────
// Defines prerequisite relationships between items.
// "You must learn 亻(radical) before 人 (kanji)"
// "You must learn 人 (kanji) before 人口 (vocab)"
//
// 🧠 Java analogy: This is like a dependency graph / DAG
//    (Directed Acyclic Graph). Same concept as Maven dependencies
//    or Java import chains -- no circular dependencies allowed!

model Dependency {
  id              String @id @default(cuid())
  itemId          String                      // the item that HAS dependencies
  dependsOnItemId String                      // the item it REQUIRES

  item            Item   @relation("item_depends", fields: [itemId], references: [id], onDelete: Cascade)
  dependsOnItem   Item   @relation("item_required_by", fields: [dependsOnItemId], references: [id], onDelete: Cascade)

  @@unique([itemId, dependsOnItemId])         // prevent duplicate dependency entries
  @@map("dependencies")
}

// ─── SRS CONFIG ─────────────────────────────────────────────
// Configurable SRS intervals per language.
// Japanese might use different timings than Spanish.
// This makes the engine truly language-agnostic.

model SrsConfig {
  id             String @id @default(cuid())
  languageId     String
  stage          Int                          // 0-9
  intervalHours  Int                          // hours until next review at this stage
  penaltyStages  Int    @default(2)           // how many stages to drop on wrong answer

  language       Language @relation(fields: [languageId], references: [id])

  @@unique([languageId, stage])               // one config per stage per language
  @@map("srs_configs")
}

// ─── USERS ──────────────────────────────────────────────────
// Managed by Supabase Auth. We store the Supabase user ID here
// and link all progress data to it.

model User {
  id        String   @id                      // Supabase Auth UID
  email     String?  @unique
  createdAt DateTime @default(now())

  preferences UserPreference?
  itemStates  UserItemState[]
  reviewLogs  ReviewLog[]

  @@map("users")
}

// ─── USER PREFERENCES ───────────────────────────────────────
// All the personal settings: title, name, companion mode, theme, etc.
// One-to-one with User (every user has exactly one preferences row).

model UserPreference {
  id                String @id @default(cuid())
  userId            String @unique
  honorific         String @default("勇者")    // 王女, 王子, 王, 女王, 勇者, 魔王, 旅人, 博士, 先生, or custom
  preferredName     String @default("")        // display name
  encouragementMode String @default("playful") // "playful" | "teacher" | "tsundere" | "yandere" | "boring" | "bipolar" | "crazyhana"
  theme             String @default("light")   // "light" | "dark"
  lessonBatchSize   Int    @default(5)         // 5, 10, or custom number
  dailyReviewLimit  Int    @default(100)       // max reviews per day (0 = unlimited)

  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

// ─── USER ITEM STATE ────────────────────────────────────────
// The heart of SRS tracking. One row per user per item.
// Tracks: what stage you're at, when your next review is,
// your streak, and your personal notes.
//
// 🧠 Java analogy: If Item is the class definition,
//    UserItemState is an INSTANCE of that class -- it's the
//    specific, personal state of that item for one specific user.

model UserItemState {
  id             String    @id @default(cuid())
  userId         String
  itemId         String
  srsStage       Int       @default(0)        // 0-9 (engine number, UI shows butterfly name)
  correctStreak  Int       @default(0)        // consecutive correct answers
  incorrectCount Int       @default(0)        // total wrong answers ever
  nextReviewAt   DateTime?                    // null = not yet in review cycle
  unlockedAt     DateTime  @default(now())    // when this item became available
  burnedAt       DateTime?                    // null unless stage 9 (eternal/burned)
  userNote       String?                      // personal notes -- "reminds me of..."

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  item           Item      @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([userId, itemId])                  // one state per user per item
  @@index([userId, nextReviewAt])             // fast query: "what's due for review?"
  @@index([userId, srsStage])                 // fast query: "count items per stage"
  @@map("user_item_states")
}

// ─── REVIEW LOGS ────────────────────────────────────────────
// Every single review answer ever. Never deleted.
// Used for: accuracy stats, analytics, "how long did this take?"
// Also useful for future adaptive algorithm improvements.
//
// 🧠 This is an "append-only" table -- we only INSERT, never
//    UPDATE or DELETE. It's like a journal/diary of every answer.

model ReviewLog {
  id             String   @id @default(cuid())
  userId         String
  itemId         String
  result         String                       // "correct" | "incorrect"
  questionType   String                       // "meaning" | "reading"
  previousStage  Int                          // stage BEFORE this review
  newStage       Int                          // stage AFTER this review
  responseTimeMs Int?                         // how long user took to answer (milliseconds)
  reviewedAt     DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  item           Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([userId, reviewedAt])               // fast query: "recent review history"
  @@index([userId, itemId])                   // fast query: "all reviews for this item"
  @@map("review_logs")
}
```

---

## 4. Module Boundaries & API Contract

### 4.1 Engine Layer -- What Each File Does

| File | Responsibility | Inputs | Outputs |
|------|---------------|--------|---------|
| `srs.ts` | Calculate next stage + review time | current stage, was answer correct? | new stage, next review timestamp |
| `levels.ts` | Check if level should unlock | user's item states for current level | boolean (unlock yes/no) + newly unlocked items |
| `review-queue.ts` | Get items due for review | user ID, current time | sorted list of items to review |
| `types.ts` | All shared TypeScript interfaces | -- | type definitions |
| `constants.ts` | SRS intervals, stage display names | -- | config objects |

### 4.2 API Routes -- The Menu

| Method | Route | What it does | Calls |
|--------|-------|-------------|-------|
| GET | `/api/lessons` | Get available lessons for user | `levels.ts` → Prisma |
| GET | `/api/reviews` | Get review queue | `review-queue.ts` → Prisma |
| POST | `/api/reviews` | Submit a review answer | `srs.ts` → Prisma |
| GET | `/api/reviews/summary` | Get session stats | Prisma (aggregate) |
| GET | `/api/progress` | Dashboard data (level, counts) | `levels.ts` → Prisma |
| GET | `/api/user` | Get user preferences | Prisma |
| PUT | `/api/user` | Update preferences | Prisma |

### 4.3 Data Flow Example: "User answers a review"

```
1. User types "person" for the kanji 人
         |
         v
2. UI component sends POST /api/reviews
   body: { itemId: "abc", answer: "person", questionType: "meaning" }
         |
         v
3. API route validates input, fetches item from DB
         |
         v
4. API calls engine: srs.processAnswer(currentStage, isCorrect)
         |
         v
5. Engine returns: { newStage: 3, nextReviewAt: "2026-03-05T14:00:00Z" }
   (pure math -- engine doesn't touch the database!)
         |
         v
6. API writes to DB:
   - Update user_item_states (new stage, next review time)
   - Insert review_log (the full record of this answer)
         |
         v
7. API returns JSON to UI: { correct: false, newStage: 3, feedback: "..." }
         |
         v
8. UI shows: (⊙_⊙) "Ehhh?! close but not quite~"
```

> 🧠 **Notice:** The engine (step 5) is just pure math.
> It doesn't know about databases, APIs, or React.
> It receives numbers, it returns numbers.
> This is the **single responsibility principle** from OOP --
> each part does ONE thing well.

---

## 5. Key Architecture Principles

| Principle | Java Term You Know | How It Applies |
|-----------|-------------------|----------------|
| **Separation of Concerns** | "each class has one job" | Engine doesn't know about UI. UI doesn't know about DB. |
| **Single Responsibility** | `SRP` from SOLID | `srs.ts` only does SRS math. `levels.ts` only does unlock logic. |
| **Dependency Inversion** | "depend on interfaces, not implementations" | Engine depends on *types* not on Prisma/Supabase directly |
| **Open/Closed** | "open for extension, closed for modification" | Adding Mandarin = new seed data, NOT changing engine code |
| **DRY** | "Don't Repeat Yourself" | Shared types in `types.ts`, shared UI in `components/` |
| **KISS** | "Keep It Simple, Stupid" | No over-engineering. Build what we need NOW. |

---

## 6. What Gets Built in What Order

```
Phase 3: Environment Setup
  └── install Node.js, create Next.js project, connect Supabase, run Prisma

Phase 4: Core SRS Engine
  └── srs.ts + constants.ts + types.ts (pure TypeScript, no DB yet)

Phase 5: Level & Unlock System
  └── levels.ts + review-queue.ts (still pure TypeScript)

Phase 6: API Routes
  └── Wire engine to database through /api/ routes

Phase 7-9: UI
  └── Dashboard → Lessons → Reviews (each page, one at a time)

Phase 10: Seed Data
  └── Japanese Levels 1-5 content in prisma/seed.ts
```

Each phase builds ON the previous one. No skipping. No spaghetti.

---

# End of Architecture Document v1.0.0
# ╭───────────────────────────────· · ୨୧ · · ───────────────────────────────╮
#   "every garden needs good soil" 🌱
# ╰───────────────────────────────· · ୨୧ · · ───────────────────────────────╯
