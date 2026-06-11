# Phase 03 — Leaderboard + Podium Redesign

**Priority:** Medium · **Status:** pending

## Problem (user point 6)

- Leaderboard "not pretty". Rank 1 bar shorter than rank 2 (height bug).
- Always shows 3 ranks → padding/empty slots when fewer players.
- Want: table style, medal/badge icons, bigger font, colorful UI, dynamic count (2 players → 2 items).

## Affected Files

- `src/features/results/leaderboard/cumulative-score-leaderboard-panel.tsx` (in-game right panel, width-bars)
- `src/features/results/leaderboard/final-game-podium-page.tsx` (end screen, vertical podium)

## Issues Found

### Podium ([final-game-podium-page.tsx](../../src/features/results/leaderboard/final-game-podium-page.tsx))

- `top3 = PODIUM_ORDER.map(idx => sorted[idx] ?? null)` → always 3 slots, renders "—" placeholders. **Fix:** build slot list from actual player count.
- `PODIUM_ORDER`/`PODIUM_POSITIONS` both `[1,0,2]` — confusing dup. Heights indexed by `rankIdx`: 1st `h-28`, 2nd `h-20`, 3rd `h-16` (correct). The user-seen "rank1 shorter" likely from the **cumulative panel** (below) or from null-slot rendering — verify visually.
- 1 player → show single centered winner card, no podium steps. 2 players → 2 steps.

### Cumulative panel ([cumulative-score-leaderboard-panel.tsx](../../src/features/results/leaderboard/cumulative-score-leaderboard-panel.tsx))

- Width-bar `width: (totalScore/maxScore)*100%`. If rank1 score==0 (start of game) all bars 0 → looks broken. Tie scores → equal bars regardless of rank. This is the "rank1 bar lower" report. **Fix:** redesign as table rows.

## Redesign Spec

Shared visual language (use `DESIGN.md` tokens):

- **Table rows**, one per existing player (dynamic — `players.length`, no fixed 3).
- **Medal icons** for top 3: `Trophy`/`Medal` (lucide), colors gold `text-yellow-400`, silver `text-slate-300`, bronze `text-amber-600`; rank ≥4 shows `#n` mono.
- **Bigger font**: name `text-base font-semibold`, score `text-lg font-bold tabular-nums`.
- **Colorful**: top-1 row `game-glow` / subtle gold gradient bg; use semantic tokens, no hard hex beyond existing medal palette already in codebase.
- Keep score bar optional as thin accent under row (or drop) — prioritize readable table.
- Animate row enter with `listItem` preset, keep <500ms.

### Podium

- Dynamic slots: `const winners = sorted.slice(0, Math.min(3, sorted.length))`.
- 1 player: centered champion card. 2: two steps (1st taller). 3: full podium.
- Bigger medals + score font. Overflow list (`slice(3)`) unchanged but restyle to match table.

## Todo

- [ ] Rewrite cumulative panel as dynamic medal table (2 players → 2 rows)
- [ ] Fix podium dynamic slot count (no null placeholders)
- [ ] Apply medals, bigger fonts, colorful top-1 highlight via tokens
- [ ] Verify rank1 always visually first/highest
- [ ] `npx tsc -b` clean

## Success Criteria

Leaderboard renders exactly N rows for N players, top-1 visually dominant, medal icons + larger colorful styling, no empty/placeholder slots.
