# GenGo! 言語! 🌸

A level-based spaced repetition language learning app, starting with Japanese.

GenGo! teaches kanji, vocabulary, and readings through a structured 100-level progression system where items unlock based on mastery — not just time spent.

**WaniKani's brain + my own personality + extensibility for any language.**

---

## Features

- **SRS Engine** — Custom spaced repetition with 10-stage flower lifecycle (Seed → Sprout → Bloom → Eternal)
- **Level System** — 100 levels with dependency-based unlocking (components → characters → vocabulary)
- **Personality Modes** — 7 companion personalities that change all feedback text (Playful, Teacher, Tsundere, Yandere, Boring, Wildcard, CrazyHana)
- **Silent Kana Input** — Type romaji, see kana instantly. Romaji is never displayed
- **Flower Garden Dashboard** — Your progress is a garden. Each kanji is a flower. You're the gardener
- **Dark/Light Mode** — Deep midnight or soft blush pink
- **User Notes** — Personal memory hooks per item, auto-saved

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| ORM | Prisma 7 |
| Language | TypeScript |
| Font | Josefin Sans |

## Architecture

```
src/engine/     — Pure TypeScript SRS engine (no framework deps, portable)
src/app/api/    — Next.js API routes (thin wrappers around engine)
src/app/        — Pages (dashboard, lessons, reviews, settings)
src/components/ — Shared UI components
src/lib/        — Utilities (prisma client, kana converter, encouragement)
prisma/         — Database schema + seed data
```

The SRS engine is framework-agnostic by design — it can run client-side in the browser, server-side in Node, or be extracted into a separate package for mobile apps.

## Development

```bash
npm install
npm run dev
npx prisma db seed
```

## Roadmap

- [x] Core SRS engine with configurable intervals
- [x] Level & dependency system (100 levels)
- [x] API routes with parallel query optimization
- [x] Lesson system with gallery multi-select + diligent mode
- [x] Review system with instant grading + keyboard shortcuts
- [x] 7 personality modes with full dialogue sets
- [x] Dashboard with flower garden visualization
- [ ] Seed data expansion (KANJIDIC, JMdict, Tatoeba pipelines)
- [ ] Welcome page + onboarding flow
- [ ] Review summary + streak tracking
- [ ] Audio pronunciation
- [ ] Multi-language support (Mandarin, Hebrew, Spanish)
- [ ] Mobile responsive / PWA
- [ ] Deploy to production

---

## License

© 2026 GenGo!
Cultivated with care by [i-Gits](https://github.com/i-Gits) 🌱

Product Architect · System Designer · Creative Director

All rights reserved.
This repository is provided for viewing and portfolio purposes only.
The code may not be copied, modified, redistributed, or used
commercially without explicit written permission.
