# Contextto VI — Đặc tả Yêu cầu Dự án (Project Specification)

> **Trạng thái:** Draft v1.0 — chuyển hóa từ bản brainstorm sang spec có cấu trúc.
> **Ngày:** 2026-06-10
> **Nguồn:** Bản draft yêu cầu + data model thực tế trong `src/types/game-firestore-types.ts`.
> **Tài liệu liên quan:** [`DESIGN.md`](../DESIGN.md) (UI contract), [`README.md`](../README.md), [`firestore.rules`](../firestore.rules).

---

## 1. Tổng quan (Overview)

Contextto VI là ứng dụng game đoán từ tiếng Việt nhiều người chơi (multiplayer), lấy ý tưởng từ game **Contexto**. Một **Admin** duy nhất điều hành toàn bộ luồng game; nhiều **Người chơi** join vào không cần đăng nhập. Trạng thái game đồng bộ **realtime** giữa tất cả client qua Firestore.

### 1.1 Mục tiêu

- Cho phép Admin tạo game (keyword + 499 từ liên quan, xếp hạng độ liên quan giảm dần).
- Cho phép nhiều người chơi đồng thời tham gia theo điều hành của 1 Admin.
- Tính điểm tích lũy thông minh qua nhiều ván trong 1 phiên game.
- Đồng bộ realtime các màn hình quan trọng (lobby, leaderboard ván, leaderboard tổng kết).

### 1.2 Phạm vi (Scope)

| Trong phạm vi                                        | Ngoài phạm vi (v1)                            |
| ---------------------------------------------------- | --------------------------------------------- |
| 1 Admin duy nhất, đăng nhập Firebase Auth            | Nhiều admin / nhiều room song song            |
| Người chơi ẩn danh (nickname + localStorage)         | Tài khoản người chơi, lịch sử cá nhân lâu dài |
| Realtime lobby + leaderboard                         | Chat trong game                               |
| Sinh game bằng Gemini (client-side) hoặc import JSON | Backend server riêng / Cloud Functions        |
| Tối đa 10 người chơi đồng thời                       | Quy mô lớn (> 10 người)                       |
| Tính điểm tích lũy, hint, bỏ cuộc                    | Xử lý disconnect/reconnect nâng cao (xem §11) |

### 1.3 Công nghệ (Tech Stack)

- **Frontend:** Bun + Vite + React + TypeScript + TailwindCSS v4 + shadcn/ui + Framer Motion + Zustand.
- **Backend/DB:** Firebase Firestore (realtime listeners).
- **Auth:** Firebase Authentication (chỉ cho Admin).
- **AI sinh từ:** Google Gemini — **gọi client-side trực tiếp** từ trình duyệt Admin (xem §6.1 về bảo mật key).

---

## 2. Thuật ngữ & Mô hình khái niệm (Glossary)

| Thuật ngữ                     | Định nghĩa                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phiên game (Game Session)** | Toàn bộ vòng đời từ lúc Admin `start game` đến khi Admin `kết thúc game`. Điểm tích lũy qua nhiều ván trong phiên này. Quản lý bởi singleton `gameState/main`. |
| **Ván (Round)**               | Một keyword + bộ 500 từ. Một phiên gồm nhiều ván liên tiếp.                                                                                                    |
| **Keyword**                   | Từ đáp án (rank 1). Lưu riêng, không bao giờ lộ ra client trước khi đoán trúng.                                                                                |
| **Term**                      | 1 trong 499 từ liên quan (rank 2–500), xếp hạng độ liên quan giảm dần. Tổng cộng 500 từ + keyword = corpus 500 (keyword rank 1).                               |
| **Rank**                      | Vị trí xếp hạng độ liên quan: 1 = keyword (gần nhất), số càng lớn càng xa.                                                                                     |
| **Hint (gợi ý)**              | Một từ "có lợi" nằm gần keyword hơn từ tốt nhất người chơi đã đoán.                                                                                            |
| **Leaderboard ván**           | Bảng xếp hạng kết quả 1 ván (điểm, số lần đoán, thời gian).                                                                                                    |
| **Leaderboard tổng kết**      | Bảng xếp hạng điểm tích lũy toàn phiên.                                                                                                                        |

### 2.1 Trạng thái (State machines)

**GameStatus** (`gameState/main`):

```
idle ──(admin: Mở phòng chờ)──► waiting ──(admin: Start game)──► playing ──(admin: Kết thúc game)──► ended
                                                                     ▲    │
                                                                     └────┘  (ván mới trong cùng phiên)
```

**RoundStatus:**

```
draft (đang soạn) ──► ready (trong thư viện) ──► playing (đang chơi) ──► completed (xong)
```

- "Open lại game đã chơi" = chuyển `completed` → `ready`.

**PlayerRoundStatus:** `playing` → `solved` | `surrendered`.

---

## 3. Vai trò & Quyền (Roles & Permissions)

### 3.1 Admin

- Duy nhất 1 Admin (1 Firebase Auth user). Đăng nhập username/password.
- **Quyền:**
  - Tạo game mới (Gemini hoặc import JSON).
  - Open lại game đã chơi (`completed` → `ready`).
  - Mở phòng chờ (`idle`/`ended` → `waiting`) — **chỉ hợp lệ khi có ≥ 1 ván status `ready`**.
  - Start game (`waiting` → `playing`) — sau đó **không nhận người chơi mới**.
  - Chơi game cùng người chơi (Admin cũng là 1 player entity).
  - Trong khi chơi: **Kết thúc ván này** (→ leaderboard ván); **Kết thúc cả game** (→ leaderboard tổng kết).
  - Sau leaderboard ván: bấm **Tiếp tục** để start ván kế tiếp.

### 3.2 Người chơi (Player)

- **Không đăng nhập.** Chỉ nhập nickname (bắt buộc).
- Chỉ join được khi GameStatus = `waiting`.
- Không có quyền tạo room / điều hành. Chỉ có đặc quyền in-game: **Bỏ cuộc**, **Lật gợi ý**.
- Dữ liệu cá nhân lưu localStorage (playerId, nickname, lịch sử đoán); doc Firestore tạm thời chỉ phục vụ realtime (xem §5.2).

---

## 4. Luồng nghiệp vụ chính (Core Flows)

### 4.1 Luồng Admin tạo & mở game

1. Admin đăng nhập.
2. Tạo ván mới (Gemini / import JSON) → ván lưu Firestore status `ready`.
3. (Tùy chọn) Open lại ván cũ: `completed` → `ready`.
4. Bấm **Mở phòng chờ** → `gameState.status = waiting`. (Chặn nếu không có ván `ready`.)
5. Admin chuyển vào màn hình **Chờ** (giống player).

### 4.2 Luồng Player join

1. Player mở app, nhập nickname (chỉ khi `waiting`).
2. Tạo player entity (ephemeral Firestore doc + localStorage id). **Chặn nếu `playerCount` ≥ 10** (§15.6).
3. Vào màn hình **Chờ**, thấy danh sách người chơi realtime (gồm cả Admin).

### 4.3 Luồng chơi ván

1. Admin bấm **Start game** → `playing`, chọn ván `ready` đầu tiên → ván `playing`.
2. Tất cả client (gồm Admin) vào màn hình chơi.
3. Người chơi đoán từ:
   - Lookup local trong corpus 500 từ → trả về rank (hoặc "quá xa" nếu không có trong corpus).
   - Trúng keyword (rank 1) → `solved`.
   - Bấm **Bỏ cuộc** → `surrendered`.
   - Bấm **Lật gợi ý** (tối đa 3) → §7.
4. **Ván hoàn thành khi:** tất cả người chơi `solved` hoặc `surrendered`, **HOẶC** Admin bấm **Kết thúc ván này**.
5. Hiển thị **leaderboard ván** đồng bộ realtime.
6. Admin bấm **Tiếp tục** → ván kế (nếu còn ván `ready`), lặp lại.

### 4.4 Luồng kết thúc phiên

- Admin bấm **Kết thúc cả game** (bất kỳ lúc nào trong `playing`) → `ended`.
- Hiển thị **leaderboard tổng kết** (điểm tích lũy) đồng bộ cho mọi người.
- Ván đã chơi đánh dấu `completed`, ghi `HistoryGame`.

---

## 5. Mô hình dữ liệu (Data Model — Firestore)

> Khớp với `src/types/game-firestore-types.ts`.

### 5.1 Singleton & Round

- **`gameState/main`** (`GameState`): `adminUid`, `status`, `currentRoundId?`, `playerCount`, timestamps. Một bản ghi duy nhất điều phối toàn hệ thống.
- **`rounds/{roundId}`** (`Round`): `status`, `roundNumber`, `roundSalt`, `keywordHash`, `termCount`, `terms: RoundTerm[]` (499 từ rank 2–500 nhúng sẵn để lookup local), metadata.
- **`rounds/{roundId}/private/secret`** (`RoundSecret`): `keyword`, `normalizedKeyword` — **chỉ Admin đọc** (firestore.rules).

**Cơ chế chống lộ keyword:** Client KHÔNG có plaintext keyword. Phát hiện đoán trúng bằng so sánh `hash(roundSalt + normalizedGuess) === keywordHash`. Keyword chỉ load từ `private/secret` (Admin) hoặc reveal sau khi trúng.

### 5.2 Player (ephemeral)

- **`players/{uid}`** (`Player`): `name`, `joinedAt`, `isActive`, `totalScore`, `lastSeenAt`.
  - `uid` sinh client-side (anonymous), lưu localStorage để reconnect cơ bản.
  - Doc tồn tại trong vòng đời phiên; có thể archive/clear khi `ended`.
- **`rounds/{roundId}/playerRounds/{uid}`** (`PlayerRound`): tiến trình private 1 player/ván — `status`, `guessCount`, `bestRank`, `usedHints`, `hintPenalty`, `roundScore`, timestamps.
- **`rounds/{roundId}/publicResults/{uid}`** (`PublicRoundResult`): kết quả PUBLIC khi player hoàn thành — `name`, `status`, `finishOrder`, `guessCount`, `bestRank`, `durationMs`, `usedHints`, `roundScore`. **Đây là nguồn realtime cho leaderboard ván.**

### 5.3 History & Local

- **`historyGames/{roundId}`** (`HistoryGame`): tóm tắt ván đã hoàn thành (`keyword`, `playerCount`, `completedAt`).
- **`LocalGuess`** (client-only, Zustand + localStorage): `text`, `normalizedText`, `rank`, `createdAt`, `notFound`. **Lịch sử đoán của 1 người KHÔNG đồng bộ cho người khác.**

---

## 6. Tạo game (Game Creation)

### 6.1 Sinh bằng Gemini (client-side)

- Admin nhập 1 keyword → gọi Gemini từ browser sinh 499 từ liên quan, xếp hạng giảm dần.
- **Prompt template đã implement trong source.** Khi output sai format → validate, từ chối, **gen lại (retry)** tới khi đúng structure.
- **Bảo mật key:** API key gọi client-side ⇒ **bắt buộc** dùng key đã restrict (HTTP referrer / API restriction về Gemini), key riêng của Admin, KHÔNG commit vào repo (dùng `.env`, gitignore). Ghi nhận đây là rủi ro chấp nhận được vì chỉ Admin dùng.
- Output validate đúng structure trước khi lưu (đủ 500, không trùng, không rỗng).

### 6.2 Import JSON thủ công

- Admin paste JSON đúng structure → validate → lưu ván `ready`.
- Cung cấp **prompt mẫu** để Admin tự nhờ AI ngoài generate đúng format.

**JSON structure (đề xuất):**

```json
{
  "keyword": "biển",
  "terms": ["đại dương", "sóng", "cát", "..."]
}
```

- `terms`: mảng 499 phần tử, index 0 = liên quan nhất. Hệ thống gán rank 2..500, keyword rank 1.
- Validate: đúng 499 terms, không trùng keyword, không trùng nhau, normalize tiếng Việt.

---

## 7. Logic Gợi ý (Hint)

- Tối đa **3 hint** mỗi player mỗi ván.
- Mỗi hint trả về 1 từ có rank **tốt hơn** (gần keyword hơn) từ tốt nhất hiện tại của player: chọn ngẫu nhiên rank trong khoảng `[bestRank - 5, bestRank - 1]` (random 1–5 bậc trên best hiện tại), clamp ≥ 2.
- **Không được lộ keyword:** nếu `bestRank <= 2` (đã đoán tới sát keyword), nút Hint **disabled** (vì hint sẽ phải là rank 1 = keyword).
- Hint **không lưu DB** — tính on-the-fly từ corpus đã load local.
- Mỗi hint dùng → tăng `usedHints`, cộng `hintPenalty` (§8).

---

## 8. Tính điểm (Scoring) — Đề xuất formula (tunable)

> Toàn bộ hằng số đặt trong file config (`scoring-config.ts`) dạng constants, **TBD-tunable** sau playtest.

### 8.1 Hằng số đề xuất

| Hằng số                | Giá trị đề xuất | Ý nghĩa                                  |
| ---------------------- | --------------- | ---------------------------------------- |
| `SOLVE_BASE`           | 1000            | Điểm gốc khi đoán trúng keyword          |
| `GUESS_PENALTY`        | 10              | Trừ mỗi lần đoán (khuyến khích đoán ít)  |
| `MIN_SOLVE_SCORE`      | 200             | Sàn điểm khi trúng (dù đoán nhiều)       |
| `TIME_GRACE_SEC`       | 60              | Thời gian ân hạn, chưa phạt              |
| `TIME_PENALTY_PER_SEC` | 1               | Trừ mỗi giây sau grace                   |
| `TIME_PENALTY_CAP`     | 400             | Trần phạt thời gian                      |
| `PROX_WINDOW_SEC`      | 60              | Cửa sổ thưởng "đoán gần" tính từ đầu ván |
| `PROX_THRESHOLD`       | 50              | Chỉ thưởng khi bestRank ≤ 50             |
| `PROX_FACTOR`          | 2               | Hệ số thưởng gần                         |
| `HINT_PENALTY`         | 50              | Trừ mỗi hint dùng                        |

### 8.2 Công thức

**Điểm trúng keyword (`solved`):**

```
solveScore = max(MIN_SOLVE_SCORE, SOLVE_BASE - (guessCount - 1) * GUESS_PENALTY)
timePenalty = min(TIME_PENALTY_CAP, max(0, elapsedSec - TIME_GRACE_SEC) * TIME_PENALTY_PER_SEC)
roundScore = solveScore + proximityBonus - timePenalty - hintPenalty
```

**Thưởng "đoán gần" (proximity, one-time):**

- Trao **một lần** cho `bestRank` đạt được trong `PROX_WINDOW_SEC` đầu, nếu `bestRank ≤ PROX_THRESHOLD`:

```
proximityBonus = (PROX_THRESHOLD - bestRank) * PROX_FACTOR   // càng gần càng nhiều, nhỏ thôi
```

- Mục tiêu: điểm nhỏ, không lấn át điểm chung cuộc.

**Bỏ cuộc (`surrendered`):**

```
roundScore = max(0, proximityBonus - hintPenalty)   // không có solveScore
```

**Hint penalty:**

```
hintPenalty = usedHints * HINT_PENALTY
```

**Điểm tích lũy (totalScore):** `Player.totalScore = Σ roundScore` qua các ván trong phiên. Leaderboard tổng kết sort theo `totalScore` giảm dần. **Reset về 0 mỗi phiên mới** (§15.2).

### 8.3 Tie-break (leaderboard)

Khi bằng điểm: ưu tiên (1) tổng số lần đoán ít hơn → (2) tổng thời gian nhanh hơn → (3) `finishOrder` sớm hơn.

---

## 9. Realtime Sync (Firestore listeners)

| Sự kiện                               | Nguồn realtime                                    | Ai nghe                                     |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Danh sách người chờ (lobby)           | `players` collection (`isActive`)                 | Tất cả (gồm Admin)                          |
| Bắt đầu/đổi trạng thái phiên          | `gameState/main`                                  | Tất cả                                      |
| Chuyển ván / start ván                | `gameState.currentRoundId` + `rounds/{id}.status` | Tất cả                                      |
| Player solved/surrendered             | `rounds/{id}/publicResults/{uid}`                 | Tất cả (cập nhật leaderboard, ván vẫn tiếp) |
| Kết thúc ván → leaderboard ván        | `rounds/{id}.status = completed`                  | Tất cả (đồng bộ chuyển màn)                 |
| Kết thúc phiên → leaderboard tổng kết | `gameState.status = ended`                        | Tất cả                                      |

**KHÔNG realtime:** từ đoán cụ thể của từng người (lịch sử riêng, lưu local).

---

## 10. Màn hình (Screens)

| #   | Màn hình                    | Vai trò | Mô tả                                                                            |
| --- | --------------------------- | ------- | -------------------------------------------------------------------------------- |
| S1  | Đăng nhập Admin             | Admin   | Firebase Auth username/password                                                  |
| S2  | Admin Panel / thư viện game | Admin   | Tạo game (Gemini/JSON), open lại, danh sách ván, nút Mở phòng chờ                |
| S3  | Nhập nickname               | Player  | Chỉ active khi `waiting`                                                         |
| S4  | Phòng chờ (Lobby)           | Cả hai  | Danh sách người chơi realtime; Admin có nút Start game                           |
| S5  | Màn chơi (Gameplay)         | Cả hai  | Ô đoán, lịch sử rank, nút Hint, Bỏ cuộc; Admin thêm Kết thúc ván / Kết thúc game |
| S6  | Leaderboard ván             | Cả hai  | Điểm + số lần đoán + thời gian; Admin có nút Tiếp tục                            |
| S7  | Leaderboard tổng kết        | Cả hai  | Điểm tích lũy, vinh danh                                                         |

> UI tuân thủ tuyệt đối [`DESIGN.md`](../DESIGN.md): semantic tokens, rank classes (`rank-exact`…`rank-far`), không hard-code màu, không lộ từ người khác.

---

## 11. Edge cases & Giới hạn đã biết (v1)

Theo quyết định scope **happy-path**:

- **Disconnect = mất kết nối:** không có cơ chế reconnect/restore nâng cao. Player mất mạng có thể mất tiến trình ván hiện tại. Lịch sử local còn trong localStorage nhưng `playerRound` không tự khôi phục. **Known limitation.**
- **Join trễ:** không nhận người chơi mới sau khi Admin `start game`.
- **Admin disconnect:** không xử lý đặc biệt v1 — phiên có thể kẹt; Admin reload và đọc lại `gameState/main` để tiếp tục (best effort).
- **Refresh trang player:** localStorage giữ playerId/nickname; có thể đọc lại state cơ bản nhưng không đảm bảo khôi phục đầy đủ.
- **Ván cạn:** nếu hết ván `ready` mà Admin bấm Tiếp tục → thông báo, gợi ý tạo/open ván hoặc Kết thúc game.

---

## 12. Bảo mật (Security)

- **firestore.rules:** keyword (`private/secret`) chỉ Admin đọc; client phát hiện trúng qua `keywordHash`. `gameState`/`rounds` ghi chỉ Admin; `players`/`playerRounds`/`publicResults` ghi theo `uid` chủ sở hữu.
- **Gemini key:** client-side, **bắt buộc restrict + để trong `.env` (gitignore)**. Không commit. Rủi ro lộ key chấp nhận do chỉ Admin dùng.
- **Anti-cheat:** corpus 500 từ load về client để lookup nhanh ⇒ kỹ thuật-savvy có thể xem terms. Keyword vẫn ẩn (hash). Chấp nhận trade-off v1 (game vui, không thi đấu cao).

---

## 13. Yêu cầu phi chức năng (Non-functional)

- **Hiệu năng:** lookup đoán < 50ms (local). Animation < 500ms (DESIGN.md). Không animation full-screen liên tục.
- **Khả năng mở rộng:** thiết kế cho quy mô nhỏ (nhóm bạn, tối đa 10 người chơi đồng thời). Firestore listeners đủ đáp ứng.
- **Khả năng bảo trì:** file < 200 LoC, kebab-case mô tả, tách service/hook/component (theo CLAUDE.md & DESIGN.md §17).
- **i18n:** UI tiếng Việt. Chuẩn hóa tiếng Việt (`normalizeVietnamese`) cho mọi so khớp từ.

---

## 14. Tiêu chí nghiệm thu (Acceptance Criteria)

- [ ] Admin đăng nhập, tạo ván bằng Gemini và bằng import JSON, cả hai validate đúng 500 từ.
- [ ] Admin open lại ván đã chơi (`completed`→`ready`).
- [ ] Mở phòng chờ bị chặn khi không có ván `ready`.
- [ ] Nhiều player join, lobby list đồng bộ realtime gồm Admin; chặn join khi đủ 10 người.
- [ ] Sau Start game không nhận người mới.
- [ ] Vào phiên mới `totalScore` reset về 0.
- [ ] Đoán trả rank đúng; trúng keyword phát hiện qua hash, không lộ keyword trước đó.
- [ ] Hint tối đa 3, trả từ gần hơn, disabled khi bestRank ≤ 2, trừ điểm đúng.
- [ ] Điểm ván tính đúng theo formula §8; tích lũy đúng qua nhiều ván.
- [ ] Ván hoàn thành khi tất cả solved/surrendered hoặc Admin kết thúc ván.
- [ ] Leaderboard ván & tổng kết đồng bộ realtime cho mọi người.
- [ ] Kết thúc game → leaderboard tích lũy + ghi `historyGames`.

---

## 15. Quyết định đã chốt (Resolved Decisions)

1. **Số ván / phiên:** Không giới hạn cứng — chơi liên tiếp tới khi Admin **Kết thúc game**.
2. **Reset điểm tích lũy:** Khi vào **phiên mới**, `Player.totalScore` **reset về 0**. Cơ chế: khi `gameState` chuyển sang `waiting` cho phiên mới (hoặc khi player join phiên mới), reset/khởi tạo lại `totalScore`; doc player của phiên cũ clear/archive.
3. **Scoring constants:** Giá trị §8.1 là baseline, tune sau playtest. Đặt trong `scoring-config.ts`.
4. **Proximity bonus:** Áp cho **cả** `solved` lẫn `surrendered` — one-time theo `bestRank` đạt trong `PROX_WINDOW_SEC` đầu, `bestRank ≤ PROX_THRESHOLD`. (= ý "cộng điểm khi đoán gần" trong draft.)
5. **Gemini prompt template:** **Đã implement** trong source. Khi AI trả sai format → **validate, từ chối, gen lại** (retry) cho tới khi đúng structure (đủ 499 terms, không trùng, không rỗng).
6. **Giới hạn người chơi:** **Tối đa 10 người chơi đồng thời** (gồm cả Admin nếu Admin chơi cùng). Chặn join khi `playerCount` đã đạt 10.
