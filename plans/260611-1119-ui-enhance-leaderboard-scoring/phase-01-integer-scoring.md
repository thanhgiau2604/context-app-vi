# Phase 01 — Integer Scoring Fix

**Priority:** High · **Status:** pending

## Problem (user point 2)

Scores show many decimals. Range up to ~1000. Should be integers.

## Root Cause

All `scoring-config.ts` constants are integers. Only fractional input is
`durationSec = durationMs / 1000` in [round-completion-firestore-service.ts:22](../../src/features/gameplay/round/round-completion-firestore-service.ts).
`timePenalty = max(0, durationSec - GRACE) * PER_SEC` → fractional → final score fractional.

## Fix

Round the final result inside `calculateRoundScore` (single source of truth — every score path flows through it).

**File:** `src/lib/utils/round-score-calculator.ts`

```ts
// line 55
return Math.round(Math.max(0, solveScore + proximityBonus - timePenalty - hintPenalty));
```

Update header comment to note final score is integer-rounded.

## Why not floor durationSec

Rounding final score covers all current + future fractional inputs (DRY). Flooring duration only patches one source.

## Display audit

Confirm all displays render `roundScore`/`totalScore` directly (already integers after fix):

- `realtime-round-results-board.tsx` `+{r.roundScore}đ`
- `cumulative-score-leaderboard-panel.tsx` `{p.totalScore}đ`
- `final-game-podium-page.tsx` `{player.totalScore}đ`

No `toFixed`/format change needed — `totalScore` is `increment(roundScore)` so stays integer.

## Tests

`src/lib/utils/round-score-calculator.test.ts` exists. Add case: fractional `durationSec` (e.g. 75.4) → integer result.

## Todo

- [ ] `Math.round` final return in calculator
- [ ] Update comment
- [ ] Add fractional-duration test case
- [ ] `npm test` green

## Success Criteria

All displayed scores are integers; tests pass; no display-layer formatting hacks.
