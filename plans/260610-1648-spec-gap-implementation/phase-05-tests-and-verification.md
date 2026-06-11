# Phase 05 — Tests & Verification

**Priority:** HIGH | **Status:** Todo
**Depends:** Phases 01–04.

## Scope

Unit test logic thuần (scoring, hint, normalize, validation) + verify flow chính. Game nhỏ, ưu tiên test pure functions (deterministic), không test Firestore realtime (cần emulator — out of scope v1).

## Test targets

| Module                         | Test                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `round-score-calculator.ts`    | solved/surrendered, proximity both, time-penalty grace+cap, hint penalty, floor 0, các case ở phase-01 success criteria |
| `hint-logic-service.ts`        | max 3, disabled bestRank≤2, random trong [bestRank-5, bestRank-1] clamp≥2                                               |
| `normalize-vietnamese-text.ts` | dấu, hoa/thường, khoảng trắng                                                                                           |
| gemini normalize-to-499        | truncate >499, reject <499, dedupe                                                                                      |
| player cap                     | joinGame transaction reject khi ≥ MAX_PLAYERS                                                                           |

## Steps

1. Xác định test runner (kiểm tra `package.json` — vitest?). Nếu chưa có, thêm vitest tối thiểu.
2. Viết unit tests cho 5 module trên.
3. Chạy `vp check` (typecheck + lint) — nhớ `/opt/homebrew/bin/node` trong PATH cho hook.
4. Chạy test suite, fix tới khi pass (KHÔNG ignore fail).
5. Manual smoke (optional, dùng preview): admin tạo game → player join → đoán → leaderboard.

## Todo

- [ ] test runner sẵn sàng
- [ ] scoring tests pass (đủ case spec §8)
- [ ] hint tests pass
- [ ] normalize tests pass
- [ ] gemini validation tests pass
- [ ] cap test pass
- [ ] `vp check` clean
- [ ] manual smoke (optional)

## Success Criteria

- Tất cả unit test pass.
- Typecheck + lint clean.
- 5 gap đóng, khớp spec.

## Risks

- Firestore-dependent code (joinGame transaction, openSession reset) khó unit test thuần → tách pure logic (cap check) ra hàm testable, hoặc test bằng emulator nếu có. KISS: test phần pure, verify phần Firestore thủ công.
