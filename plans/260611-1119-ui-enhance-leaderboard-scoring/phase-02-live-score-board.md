# Phase 02 — Live Score on Results Board

**Priority:** High · **Status:** pending · **Depends:** Phase 01

## Problem (user point 1)

During play, board shows closeness rank (`#3`, `#5` = rank of guessed word) for in-progress players, not their actual points. User wants real score live on the right-side leaderboard.

## Current

`liveProgress/{uid}` doc holds `{ uid, name, bestRank }`. Board ([realtime-round-results-board.tsx:72-85](../../src/features/results/public-board/realtime-round-results-board.tsx)) renders in-progress players with `RankBadge` + "đang chơi" — no score.

Finished players already show `+{roundScore}đ`. Gap is in-progress players only.

## Approach

Publish a projected live score alongside `bestRank`. Compute client-side per improved guess using the same calculator (provisional, not-yet-solved).

### 1. Extend live progress repo

**File:** `src/lib/firestore/live-round-progress-firestore-repository.ts`

- Add `liveScore: number` to `LiveProgress` type.
- `publishLiveProgress(roundId, uid, name, bestRank, liveScore)` writes `liveScore` too.

### 2. Compute projected score

In `guess-input-form.tsx` on improved guess: projected score = proximity-only estimate
(player hasn't solved). Reuse `calculateRoundScore` with `status: "surrendered"` semantics
(proximity bonus − hint penalty) so the live number reflects what they'd bank if they stopped now.
Needs `firstNearMissWithin60s` + `usedHints` — read from store. Round to integer (Phase 01 makes calculator integer).

Keep it simple: if computing the proximity flag client here is awkward, publish
`liveScore = 0` baseline and only the proximity bonus when `bestRank <= PROX_THRESHOLD`.
Decide during impl — must stay integer, must NOT leak guess word.

### 3. Board display

**File:** `realtime-round-results-board.tsx`

In-progress row: replace "đang chơi" text with `+{p.liveScore}đ` (live, integer) and keep
spinner + rank badge as secondary. Sort in-progress by `liveScore` desc (fallback bestRank asc).

### 4. firestore.rules

`liveProgress` rule already allows self create/update (no field-level constraint) — no change needed. Verify `liveScore` write passes existing `isSelf(uid)` rule.

## Spec Compliance

§9/§273: rank + progress/score CAN be shared; only guess WORDS stay local. `liveScore` carries no word → compliant.

## Todo

- [ ] Add `liveScore` to `LiveProgress` + publish signature
- [ ] Compute projected integer score in `guess-input-form.tsx`
- [ ] Update `publishLiveProgress` call sites
- [ ] Board shows `+{liveScore}đ` for in-progress, sort by score
- [ ] `npx tsc -b` clean

## Success Criteria

In-progress players show live integer points (not closeness rank as the primary metric); no guess word leaked.
