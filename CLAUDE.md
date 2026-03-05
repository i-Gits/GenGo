# GenGo! Project Memory

## Quick Reference
- **Stack**: Next.js 16 + React 19 + Tailwind CSS v4 + Prisma 7 + Supabase PostgreSQL
- **Node**: fnm v24.14.0 at `/Users/arc/.fnm/node-versions/v24.14.0/installation/bin/`
- **DB Region**: ap-southeast-2 (Sydney) -- user is in Philippines, expect latency
- **Font**: Josefin Sans (display), Courier (mono). NO other fonts.
- **Theme**: Garden/flower metaphor throughout. Sakura pink primary, garden green secondary.

## Mistakes Log (update after every correction!)
1. **Always run `npx prisma db seed` after schema changes** -- forgetting caused "0 lessons"
2. **fnm PATH**: Must prepend `eval "$(/Users/arc/.fnm/fnm env)"` to commands
3. **Dark mode CSS needs BOTH**: `[data-theme="dark"]` AND `html.dark` selectors
4. **ThemeProvider**: Use `useCallback` + functional state updates to avoid stale closures
5. **Enter key on disabled inputs**: Use `document.addEventListener('keydown')` not `onKeyDown`
6. **Supabase latency**: Use `Promise.all()` for all parallel-safe queries
7. **NO ROMAJI in UI**: Readings shown in kana only. Romaji for input conversion only
8. **Reduce English**: Don't show type labels ("Component") -- teach during lessons
9. **Prisma seed config**: `seed` goes in `prisma.config.ts` under `migrations.seed`
10. **Personality must actually work**: Fetch encouragementMode and use it in reviews/lessons
11. **F/E/R must be TOGGLES**: Press F to open meaning/reading, press F again to close. Same for E. NOT one-way.
12. **User notes auto-save on blur**: Don't require a save button. textarea onBlur → PUT /api/notes

## Architecture Rules
- SRS engine (`src/engine/`) is PURE TypeScript -- no framework deps, can run client-side
- API routes translate between Prisma models and engine DTOs
- "use client" components fetch from API routes, never import Prisma directly
- Single-table inheritance for items (component/character/vocabulary via type field)
- Dev user pattern until Supabase Auth (Phase 12)

## File Structure
```
src/engine/     -- Pure SRS engine (srs, levels, review-queue, types, constants)
src/app/api/    -- API routes (progress, lessons, reviews, user)
src/app/        -- Pages (dashboard, lessons, reviews, settings)
src/components/ -- Shared (Navigation, ThemeProvider, FlowerStage)
src/lib/        -- Utils (prisma, dev-user, kana-converter, encouragement)
prisma/         -- Schema + seed data
notes/          -- Project changelog (check after every change)
```

## Commands
```bash
npm run dev          # Start dev server
npx prisma db seed   # Seed database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev # Run migrations
```

## Current Phase
Phases 1-7 complete. Working on: personality system, review UX, lesson gallery, API speed.

## Notes Directory
Always check `notes/` for the latest project changelog before making changes.
