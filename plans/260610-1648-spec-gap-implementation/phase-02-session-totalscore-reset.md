# Phase 02 — Session totalScore Reset

**Priority:** MEDIUM | **Status:** Todo
**Spec:** §15.2 (reset điểm tích lũy mỗi phiên mới)
**Gap:** `joinGame()` init `totalScore:0` cho player MỚI, nhưng player từ phiên cũ giữ nguyên điểm khi phiên mới mở. Không có logic wipe.

## Context

- `src/lib/firestore/game-state-singleton-firestore-repository.ts` — `openSession()`, `resetSession()`, `closeSession()`.
- `src/lib/firestore/top-level-player-firestore-repository.ts` — `joinGame()` set `totalScore:0`.

## Decision

"Phiên mới bắt đầu" = khi `openSession()` (idle/ended → waiting). Tại điểm này reset toàn bộ player còn tồn tại về `totalScore:0` (hoặc clear hẳn doc cũ).

**Chọn cơ chế (KISS):** Khi `openSession()`, batch reset `totalScore:0` + `isActive:false` cho mọi player doc cũ (hoặc delete). Player join lại tự tạo doc mới `totalScore:0`. → tránh điểm cũ bleed.

## Files

**Modify:**

- `game-state-singleton-firestore-repository.ts` — trong `openSession()`: query `players`, batch reset `totalScore:0` (hoặc delete docs cũ). Cân nhắc giới hạn batch (≤10 player → an toàn 1 batch).

## Steps

1. Trong `openSession()`: đọc collection `players`, batch update `{ totalScore: 0, isActive: false }` cho từng doc, hoặc `batch.delete` nếu muốn lobby sạch.
2. Quyết clear vs reset: **delete** sạch hơn (lobby phiên mới rỗng, player join lại). Chọn delete.
3. Đảm bảo `playerCount` về 0 trong `gameState` khi openSession.
4. Typecheck.

## Todo

- [ ] openSession wipes/reset old players
- [ ] playerCount reset 0
- [ ] join phiên mới bắt đầu từ 0
- [ ] typecheck pass

## Success Criteria

- Kết thúc phiên A (player có điểm) → openSession phiên B → lobby rỗng, playerCount=0, player join lại totalScore=0.

## Risks

- Nếu admin openSession giữa chừng nhầm → mất điểm. Chấp nhận (admin action có chủ đích).
- firestore.rules phải cho admin delete/write player docs. Verify rule `players/{uid}` cho phép admin write.

## Next

→ độc lập. Phase 05 verify reset.
