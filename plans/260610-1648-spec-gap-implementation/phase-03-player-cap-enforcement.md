# Phase 03 — Player 10-Cap Enforcement

**Priority:** HIGH | **Status:** Todo
**Spec:** §4.2, §15.6 (tối đa 10 người chơi đồng thời)
**Gap:** `joinGame()` tăng `playerCount` không check cap. Không chặn ở UI lẫn rules.

## Decision

Enforce **cả hai tầng**: client (UX message) + firestore.rules (an toàn chống race).

## Files

**Modify:**

- `src/features/room/join/player-join-room-page.tsx` — trước join, đọc `gameState.playerCount`; nếu ≥10 → hiện thông báo "Phòng đã đủ 10 người", chặn.
- `src/lib/firestore/top-level-player-firestore-repository.ts` — `joinGame()`: dùng transaction đọc `gameState.playerCount`, nếu ≥10 throw; else increment + tạo player doc atomic.
- `firestore.rules` — rule tạo `players/{uid}`: chỉ cho khi `gameState.playerCount < 10` (đọc gameState trong rule). Lưu ý: đếm chính xác cần `playerCount` field tin cậy.

## Constant

`MAX_PLAYERS = 10` → đặt trong config dùng chung (tạo `src/lib/config/game-limits-config.ts` hoặc thêm vào scoring-config? → tách `game-limits-config.ts` cho rõ nghĩa).

## Steps

1. Tạo `src/lib/config/game-limits-config.ts` export `MAX_PLAYERS=10`.
2. `joinGame()` → chuyển sang `runTransaction`: đọc `gameState/main`, check `playerCount < MAX_PLAYERS`, set player doc + `playerCount` increment trong transaction. Throw `RoomFullError` nếu đầy.
3. Join page: catch lỗi đầy phòng → toast/thông báo; cũng pre-check `playerCount` từ realtime gameState để disable nút.
4. firestore.rules: thêm điều kiện `get(/databases/$(db)/documents/gameState/main).data.playerCount < 10` cho create `players/{uid}` (chỉ với non-admin). Admin miễn cap (admin chơi cùng).
5. Typecheck + test rules nếu có emulator.

## Todo

- [ ] `game-limits-config.ts` (MAX_PLAYERS)
- [ ] joinGame transaction + cap check
- [ ] join page UX block + message
- [ ] firestore.rules cap condition
- [ ] admin exempt từ cap
- [ ] typecheck pass

## Success Criteria

- 10 player join OK; người thứ 11 bị chặn (cả khi bypass UI → rule reject).
- Admin vẫn join được khi đã 10 player (hoặc tính admin trong 10? → **chốt:** admin KHÔNG tính vào cap 10 player, admin là người điều hành). Cập nhật spec §15.6 nếu cần làm rõ.

## Risks

- Transaction + rule `get()` tốn read; quy mô nhỏ chấp nhận.
- Race: transaction xử lý đúng; rule là lớp 2.
- **Open:** admin có nằm trong 10 không? Spec §15.6 nói "gồm cả Admin nếu Admin chơi cùng". → MAX bao gồm admin. Điều chỉnh: cap tổng 10 entity. Chốt theo spec: **cap 10 gồm admin**. Bỏ admin-exempt ở bước 4 nếu theo spec.

## Next

→ Phase 05 verify cap.
