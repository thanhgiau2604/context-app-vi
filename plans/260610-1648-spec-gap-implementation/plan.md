# Plan: Spec Gap Implementation — Contextto VI

**Mục tiêu:** Đóng 5 gap giữa code hiện tại và spec ([docs/.../requirements-specification.md](../../docs/contextto-vi-multiplayer-game-requirements-specification.md)).
**Bối cảnh:** Codebase ~5k LoC, 9/14 feature area đã DONE. Plan này chỉ xử lý phần PARTIAL/MISSING.
**Nguồn gap:** Explore gap report (session 2026-06-10).

## Quyết định đã chốt

- **Scoring:** Rewrite `round-score-calculator.ts` theo đúng formula spec §8 (guess-count based) + tách `scoring-config.ts`. Bỏ rank-tier base score cũ.
- **Proximity bonus:** Áp cho **cả** solved + surrendered (one-time theo bestRank trong cửa sổ thời gian).
- **Player cap 10:** Enforce **client (UX) + firestore.rules (an toàn)**.
- **totalScore reset:** Reset 0 khi vào phiên mới.
- **Gemini:** Retry-on-bad-format + validate exact 500 terms.

## Phases

| #   | Phase                               | Trạng thái | File                                                          |
| --- | ----------------------------------- | ---------- | ------------------------------------------------------------- |
| 1   | Scoring formula alignment + config  | ✅ Done    | [phase-01](phase-01-scoring-formula-alignment.md)             |
| 2   | Session totalScore reset            | ✅ Done    | [phase-02](phase-02-session-totalscore-reset.md)              |
| 3   | Player 10-cap enforcement           | ✅ Done    | [phase-03](phase-03-player-cap-enforcement.md)                |
| 4   | Gemini retry + exact-499 validation | ✅ Done    | [phase-04](phase-04-gemini-retry-and-exact-500-validation.md) |
| 5   | Tests & verification                | ✅ Done    | [phase-05](phase-05-tests-and-verification.md)                |

## Dependencies

- Phase 1 → Phase 5 (test scoring sau khi rewrite).
- Phase 2 phụ thuộc hiểu session lifecycle (`game-state-singleton-firestore-repository.ts`).
- Phase 3 đụng `firestore.rules` + join flow.
- Phase 4 độc lập (Gemini layer).
- Phases 1–4 song song được (file ownership tách biệt); Phase 5 cuối.

## Out of scope

- Disconnect/reconnect nâng cao (spec §11 known limitation).
- Backend/Cloud Functions.
- UI redesign (theo DESIGN.md hiện có).

## Principles

YAGNI/KISS/DRY. File < 200 LoC. kebab-case. Không tạo file "enhanced" — sửa trực tiếp file hiện có. Typecheck pass trước commit (`/opt/homebrew/bin/node` trong PATH cho hook `vp`).
