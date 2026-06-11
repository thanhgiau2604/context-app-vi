# Phase 01 — Scoring Formula Alignment + Config

**Priority:** HIGH | **Status:** Todo
**Spec:** §8 (scoring), §15.4 (proximity both)
**Gap:** Code dùng rank-tier base score + speedBonus, KHÁC formula spec. Proximity chỉ áp surrendered. Không có config file.

## Context

- `src/lib/utils/round-score-calculator.ts` — calculator hiện tại (rank-tier).
- `src/features/gameplay/round/round-completion-firestore-service.ts` — caller, đã có `durationSec`, `guessCount`, `bestRank`, `usedHints`, `firstNearMissWithin60s`.

## Requirements

Rewrite calculator theo spec §8:

```
solveScore  = max(MIN_SOLVE_SCORE, SOLVE_BASE - (guessCount-1)*GUESS_PENALTY)   // chỉ khi solved
timePenalty = min(TIME_PENALTY_CAP, max(0, elapsedSec - TIME_GRACE_SEC) * TIME_PENALTY_PER_SEC)
proximityBonus = bestRank<=PROX_THRESHOLD && within window ? (PROX_THRESHOLD - bestRank)*PROX_FACTOR : 0   // BOTH solved+surrendered
hintPenalty = Σ HINT_PENALTIES[0..usedHints-1]   // leo thang [25,45,70] — CHỐT (không flat)
roundScore(solved)      = max(0, solveScore + proximityBonus - timePenalty - hintPenalty)
roundScore(surrendered) = max(0, proximityBonus - hintPenalty)
```

## Files

**Create:**

- `src/lib/config/scoring-config.ts` — export constants: `SOLVE_BASE=1000`, `GUESS_PENALTY=10`, `MIN_SOLVE_SCORE=200`, `TIME_GRACE_SEC=60`, `TIME_PENALTY_PER_SEC=1`, `TIME_PENALTY_CAP=400`, `PROX_WINDOW_SEC=60`, `PROX_THRESHOLD=50`, `PROX_FACTOR=2`, `HINT_PENALTIES=[25,45,70]` (leo thang — CHỐT; hint 1=−25, 2=−45, 3=−70, đủ 3=−140).

**Modify:**

- `src/lib/utils/round-score-calculator.ts` — rewrite dùng config; xóa `getBaseScore`/`getSpeedBonus`/`solvedBonus`/`surrenderPenalty`. Proximity cho cả 2 status.
- `round-completion-firestore-service.ts` — đảm bảo truyền đủ param (đã có; đổi `firstNearMissWithin60s` → vẫn dùng làm cờ proximity-in-window).

## Steps

1. Tạo `scoring-config.ts` với constants + comment `// TBD-tunable sau playtest`.
2. Rewrite `calculateRoundScore`: import config, áp 2 nhánh solved/surrendered, proximity cho cả 2.
3. Cập nhật JSDoc đầu file khớp formula mới.
4. Verify caller không cần đổi signature (giữ `firstNearMissWithin60s`).
5. Typecheck.

## Todo

- [ ] `scoring-config.ts` created
- [ ] calculator rewritten per §8
- [ ] proximity applies to solved + surrendered
- [ ] old tier/speed/surrender logic removed
- [ ] typecheck pass

## Success Criteria

- Solved 1 guess, 0 hint, <60s → ~1000 (+ proximity nếu bestRank=1 → cap tại threshold logic; bestRank=1 ⇒ (50-1)\*2=98 bonus).
- Surrendered, bestRank 30 trong 60s, 0 hint → (50-30)\*2 = 40.
- Hết grace 60s, mỗi giây -1, cap -400.
- Score floor 0.

## Risks

- Proximity cho bestRank=1 (solved) tạo bonus lớn — review xem có muốn cap proximity riêng cho solved. **Quyết:** chấp nhận, nhỏ so với solveScore.
- `firstNearMissWithin60s` đang track client-side — xác nhận vẫn set đúng khi đạt bestRank≤50 trong window.

## Next

→ Phase 05 test scoring.
