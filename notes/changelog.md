# GenGo! Project Changelog

## 2026-03-05 -- Session 4: Diligent Mode, Toggles, Notes

### Changes Made
- Added "I'm feeling diligent today!" mode to lessons (shows ALL unstarted items, ignores deps)
- Lessons API: `GET /api/lessons?diligent=true` returns current + next level items
- Fixed F/E/R keyboard shortcuts to be proper toggles (press again to close)
- Added personality quick-toggle button in reviews (cycles through modes)
- Added user notes textarea in review answer key (auto-saves on blur via PUT /api/notes)
- Created `/api/notes` route for saving per-item user notes
- Reviews API now returns `userNote` field in queue items
- Redesigned homepage personality as round toggle button with ◀ ▶ arrows
- Updated F/E button clicks to match toggle behavior (both lessons + reviews)

### Architecture Decisions
- Diligent mode bypasses dependency checks but still requires items be unstarted
- User notes saved to existing `userNote` field on `UserItemState` model (no schema change needed)
- Personality toggle persists immediately via PUT /api/user (no save button needed)
- F key: toggles meaning+reading. E key: toggles extras. R key: always close all.

---

## 2026-03-04 -- Session 3: UX Overhaul

### Changes Made
- Created CLAUDE.md for project memory
- Created notes/ directory for changelog tracking
- Created `src/lib/encouragement.ts` -- personality message system
- Fixed Reviews: Enter key, instant grading, answer key sections, F/E/R shortcuts
- Fixed personality system: now actually works during reviews
- Added "Mark as Learned" override button (reviews)
- Added multi-select gallery mode for lessons
- Added feedback style dropdown to homepage
- Removed emoji from nav (Lessons, Reviews, Settings)
- Optimized API routes with Promise.all for parallel queries

### Architecture Decisions
- Client-side grading for instant review feedback (processAnswer runs in browser)
- API POST deferred until user advances -- enables override without double-calls
- Encouragement messages stored in `src/lib/encouragement.ts`, fetched via user prefs
- F/E/R keyboard shortcuts: document-level listener, only active when answer key showing

---

## 2026-03-04 -- Session 2: Bug Fixes & Polish

### Changes Made
- Fixed dark mode toggle (ThemeProvider rewrite with useCallback)
- Fixed seed data pipeline (prisma.config.ts + tsx install)
- Changed font to Josefin Sans
- Made flower garden collapsible
- Made level number prominent on dashboard
- Simplified level progress to "X% to Level Y"
- Cached dev user to reduce DB round trips

---

## 2026-03-03 -- Session 1: Phase 6-7 Build

### Changes Made
- Built all 4 API routes (progress, lessons, reviews, user)
- Built all 4 pages (dashboard, lessons, reviews, settings)
- Created Navigation, FlowerStage, ThemeProvider components
- Created kana converter (romaji to hiragana)
- Set up globals.css with garden theme + dark mode vars
