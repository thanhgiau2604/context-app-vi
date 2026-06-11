# Phase 04 — Gemini Retry + Exact-500 Validation

**Priority:** HIGH | **Status:** Todo
**Spec:** §6.1 (retry on bad format), §2 (corpus 500), §6.2 (validate)
**Gap:** Không có retry; schema chấp nhận 400–510 terms (không exact 500).

## Context

- `src/lib/gemini/gemini-round-generation-service.ts` — gọi Gemini, validate, throw on bad.
- `src/lib/gemini/generated-round-zod-schema.ts` — Zod (400–510, sanitize dedupe).
- `src/features/admin/create-game/create-game-orchestration-service.ts` — orchestration.

## Decision

- **Retry:** loop tối đa `MAX_GEMINI_ATTEMPTS=3`. Mỗi lần fail validate → gọi lại (có thể thêm hint vào prompt: "trả đúng N từ, không trùng"). Hết attempt → throw lỗi rõ cho admin.
- **Exact count:** target 499 terms (+ keyword = 500). Sau sanitize/dedupe nếu < 499 → fail attempt (retry). Nếu > 499 → truncate xuống 499 (giữ rank cao nhất). Không nới schema lỏng.

## Files

**Modify:**

- `gemini-round-generation-service.ts` — wrap call trong retry loop; sau parse, normalize về đúng 499 (truncate thừa; thiếu → retry).
- `generated-round-zod-schema.ts` — siết min hợp lý (vd min 480 để còn truncate; nhưng đích cuối phải đúng 499 sau normalize). Hoặc giữ schema rộng, enforce exact ở service layer (KISS: enforce ở service).
- `create-game-orchestration-service.ts` — surface progress/retry state cho UI (optional toast "Đang thử lại…").

**Optionally create:**

- `src/lib/config/game-limits-config.ts` (dùng chung Phase 03) — thêm `TARGET_TERM_COUNT=499`, `MAX_GEMINI_ATTEMPTS=3`.

## Steps

1. Thêm constants vào `game-limits-config.ts`.
2. `generateRound()`: `for attempt in 1..MAX`: call → parse → normalize-to-499 → nếu hợp lệ return; else continue. Hết loop throw.
3. Normalize: dedupe (giữ thứ tự rank), nếu length>499 slice(0,499), nếu <499 → invalid (retry).
4. Prompt builder: thêm câu nhấn "chính xác 499 từ, không lặp, không gồm keyword".
5. UI: hiển thị attempt đang chạy (optional, KISS có thể bỏ).
6. Typecheck.

## Todo

- [ ] config constants (TARGET_TERM_COUNT, MAX_GEMINI_ATTEMPTS)
- [ ] retry loop in generateRound
- [ ] normalize-to-499 (truncate thừa, retry thiếu)
- [ ] prompt nhấn exact count
- [ ] throw rõ ràng khi hết attempt
- [ ] typecheck pass

## Success Criteria

- Gemini trả 510 từ → truncate 499, lưu OK.
- Trả 450 từ → retry; nếu cả 3 lần thiếu → báo lỗi admin (không lưu round hỏng).
- Round lưu luôn đúng 500 entity (keyword + 499).

## Risks

- Retry tốn quota Gemini; cap 3 lần đủ.
- Truncate có thể bỏ từ rank thấp (xa) — chấp nhận, vẫn đủ 499.

## Next

→ Phase 05 verify creation flow.
