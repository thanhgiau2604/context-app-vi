# UI Enhancement — Leaderboard, Scoring, Focus, Prominence

**Date:** 2026-06-11
**Type:** UI/UX polish + scoring fix
**Mode:** auto (fast — codebase well understood, no external research)

## Goal

Enhance gameplay UI after flow correctness confirmed. 6 user-reported points across scoring, leaderboard design, UI prominence, admin cards, input focus.

## Design Contract

`DESIGN.md` = source of truth. Use semantic tokens (`bg-primary`, `text-foreground`, rank vars), game utilities (`game-card`, `game-glow`, `text-gradient-brand`), rank classes via `getRankClass`/`getRankLabel`. No hard-coded hex. No rainbow/neon. Never reveal other players' guess words (only rank/score).

## Phases

| #   | Phase                                                        | Status  | File                                           |
| --- | ------------------------------------------------------------ | ------- | ---------------------------------------------- |
| 1   | Integer scoring fix                                          | pending | [phase-01](phase-01-integer-scoring.md)        |
| 2   | Live score on results board (not closeness rank)             | pending | [phase-02](phase-02-live-score-board.md)       |
| 3   | Leaderboard + podium redesign (table, medals, dynamic count) | pending | [phase-03](phase-03-leaderboard-redesign.md)   |
| 4   | Persistent guess-input focus                                 | pending | [phase-04](phase-04-input-focus.md)            |
| 5   | UI prominence + admin card sizing                            | pending | [phase-05](phase-05-prominence-admin-cards.md) |

## Dependencies

- Phase 2 depends on Phase 1 (uses rounded score helper).
- Phases 3, 4, 5 independent — can run after 1.

## Key Decisions

- **Scoring:** round final score to integer in `calculateRoundScore` (`Math.round`). Constants already integer; only fractional `durationSec` leaks decimals. Single-point fix, DRY.
- **Live score:** extend `liveProgress` doc with projected `liveScore` (computed client-side per guess). Board shows points, keeps rank badge as secondary. No guess word leaked (spec §9/§273).
- **Leaderboard:** table-style rows, medal icons (gold/silver/bronze), bigger font, colorful tier accents. Render only existing players (2 players → 2 rows). Podium renders dynamic slot count, fixes always-3 padding.

## Validation

- `npx tsc -b` → 0 errors
- `npm test` → all pass
- Manual: 2-player round → leaderboard shows 2 rows + real integer scores; input stays focused after submit.
