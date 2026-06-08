# Brainstorm Document — Game đoán từ tiếng Việt giống Contexto, không dùng Cloud Functions, Gemini gọi trực tiếp từ frontend

> Mục tiêu: xây dựng MVP website game đoán từ tiếng Việt chơi realtime nhiều người, dùng Vite + React + shadcn/ui + Tailwind + Motion + Zustand + Firebase, **không dùng Cloud Functions** để giảm chi phí vận hành. Admin có màn hình Settings để nhập Gemini API key, sau đó bấm **Create New Game** để frontend gọi Gemini trực tiếp tạo keyword + 1000 từ liên quan. Dự án cá nhân, không public, nên chấp nhận rủi ro lộ API key ở browser.

---

## 1. Kết luận nhanh

Có thể làm bản MVP **không dùng Cloud Functions** và vẫn cho admin bấm nút tạo game bằng Gemini, nếu chấp nhận để frontend gọi Gemini trực tiếp bằng API key admin nhập trong app.

Hướng kiến trúc cập nhật:

```txt
Vite + React + TypeScript
shadcn/ui + Tailwind + Motion
Zustand
Firebase Auth Anonymous
Cloud Firestore realtime
Firestore Security Rules
Admin Settings nhập Gemini API key
Frontend gọi Gemini trực tiếp khi admin bấm Create New Game
```

### Quyết định chính

- Không dùng Cloud Functions.
- Không cần backend riêng trong MVP.
- Admin có màn hình `/admin/settings` để nhập Gemini API key.
- Gemini key chỉ phục vụ phía admin, không yêu cầu player nhập key.
- Frontend admin gọi Gemini trực tiếp để tạo dữ liệu round.
- Sau khi Gemini trả JSON, app validate dữ liệu, normalize, hash, rồi lưu xuống Firestore.
- Player vẫn chỉ đọc/chơi thông qua Firestore realtime.

### Rủi ro được chấp nhận

Vì gọi Gemini trực tiếp từ browser:

- API key có thể bị thấy trong DevTools/network request.
- Người có quyền truy cập máy/browser admin có thể lấy key.
- Nếu app bị public, key có thể bị abuse quota/cost.
- Không nên dùng key quan trọng hoặc có quyền quá rộng.

Vì đây là dự án cá nhân, không public, hướng này hợp lý để làm nhanh MVP. Khi muốn public hoặc chống cheat nghiêm túc, lúc đó nên thêm backend/serverless để proxy Gemini và tính điểm authoritative.

---

## 2. Kiến trúc tổng thể không Cloud Functions

```txt
Admin Browser
  ├─ Admin Settings: nhập Gemini API key
  ├─ Create New Game button
  ├─ Gọi Gemini Developer API trực tiếp từ frontend
  ├─ Validate JSON response
  ├─ Normalize + hash keyword/terms
  └─ Ghi room/round/termIndex/hints/secret vào Firestore

Player Browser
  ├─ Anonymous Auth
  ├─ Join room bằng name
  ├─ Submit guess
  ├─ Hash guess
  ├─ getDoc(termIndex/{hash})
  └─ Listen realtime result/leaderboard từ Firestore

Firebase
  ├─ Authentication Anonymous
  ├─ Cloud Firestore
  ├─ Firestore Security Rules
  └─ Firebase Hosting
```

Luồng quan trọng:

1. Admin vào trang admin.
2. Admin nhập Gemini API key ở Settings.
3. Admin bấm **Create New Game**.
4. Frontend gọi Gemini trực tiếp bằng key đó.
5. Gemini trả về keyword + 1000 related terms + 3 hints.
6. Frontend validate dữ liệu.
7. Frontend hash keyword/terms rồi ghi vào Firestore.
8. Player join room và chơi realtime.

Không có backend trung gian. Browser đọc/ghi Firestore trực tiếp, được kiểm soát bằng Security Rules.

---

## 3. Stack công nghệ

## 3.1 Frontend

- Vite + React + TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Motion for React / Framer Motion.
- Zustand.
- Lucide React.
- Firebase Web SDK.

## 3.2 Firebase

- Firebase Hosting: deploy frontend.
- Firebase Authentication Anonymous Auth: tạo danh tính tạm thời cho admin/player.
- Cloud Firestore: lưu dữ liệu game và realtime sync.
- Firestore Security Rules: phân quyền admin/player, kiểm soát đọc/ghi.

## 3.3 Gemini AI

Bản cập nhật này chọn cách: **frontend gọi Gemini trực tiếp bằng API key do admin nhập trong màn Settings**.

Đây không phải hướng an toàn cho production, nhưng phù hợp với điều kiện hiện tại:

- Dự án cá nhân.
- Không public rộng rãi.
- Muốn tránh Cloud Functions để không phát sinh phí.
- Muốn admin tạo game trực tiếp bằng button trong web.
- Chấp nhận rủi ro API key có thể bị lộ trong browser.

### Cách hoạt động

```txt
Admin Settings
  → nhập Gemini API key
  → lưu tạm trong browser
  → admin bấm Create New Game
  → frontend gọi Gemini
  → nhận JSON
  → validate
  → ghi Firestore
```

### Nơi lưu Gemini key

Khuyến nghị MVP:

- Ưu tiên lưu trong React/Zustand runtime state nếu chỉ dùng trong phiên hiện tại.
- Có tùy chọn “Remember on this device” để lưu vào `localStorage` nếu admin muốn tiện hơn.
- Không lưu Gemini key vào Firestore.
- Không hardcode Gemini key vào source code.
- Không đưa Gemini key vào `.env` nếu repo có khả năng share/public.

Gợi ý type:

```ts
type AdminSettings = {
  geminiApiKey: string;
  rememberGeminiKey: boolean;
  geminiModel: "gemini-2.5-flash" | "gemini-2.5-pro";
};
```

Gợi ý localStorage key:

```ts
const GEMINI_KEY_STORAGE = "viet-contexto.admin.geminiApiKey";
```

### Model đề xuất

Cho MVP nên dùng model nhanh/chi phí thấp trước:

```txt
gemini-2.5-flash
```

Chỉ dùng model mạnh hơn khi chất lượng 1000 từ liên quan chưa đạt.

### Tùy chọn fallback

Dù frontend có thể gọi Gemini trực tiếp, vẫn nên giữ thêm chức năng **Import JSON thủ công** để xử lý khi:

- Gemini trả JSON lỗi.
- Rate limit/quota API.
- Admin muốn tự chỉnh dữ liệu trước khi tạo round.
- Muốn test game không cần gọi AI.

---

## 3.4 Admin Settings screen

Màn Settings chỉ dành cho admin.

Route đề xuất:

```txt
/admin/settings
```

Hoặc tab trong Admin Panel:

```txt
AdminPanel
  ├─ Overview
  ├─ Create Game
  ├─ Players
  ├─ Rounds
  └─ Settings
```

### Trường cần có

- Gemini API Key.
- Model Gemini.
- Remember key on this device.
- Test connection button.
- Clear saved key button.

### UI đề xuất

```txt
Card: AI Generation Settings
  - Input type password: Gemini API Key
  - Button icon Eye/EyeOff để show/hide key
  - Select: Gemini model
  - Switch: Remember on this device
  - Button: Test Gemini Connection
  - Button: Clear Saved Key
```

### UX khi chưa có key

Nếu admin chưa nhập key mà bấm Create New Game:

```txt
Toast warning:
“Vui lòng nhập Gemini API key trong Settings trước khi tạo game.”
```

CTA:

```txt
Go to Settings
```

### Lưu key an toàn nhất có thể trong MVP

```ts
function saveGeminiKey(apiKey: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
}

function loadSavedGeminiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE) ?? "";
}

function clearGeminiKey() {
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}
```

Lưu ý: `localStorage` không phải nơi bảo mật cao. Nó chỉ phù hợp vì dự án cá nhân và admin chấp nhận rủi ro.

---

## 3.5 Frontend Gemini service

Có thể gọi Gemini bằng REST API trực tiếp để giảm dependency.

### Service interface

```ts
type GenerateRoundInput = {
  apiKey: string;
  model: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

type GeneratedRound = {
  keyword: string;
  relatedTerms: Array<{
    term: string;
    rank: number;
  }>;
  // Không có hints — hintPool được tạo tự động từ relatedTerms sau khi validate
};
```

### REST call phác thảo

```ts
export async function generateRoundWithGemini(input: GenerateRoundInput) {
  const prompt = buildVietnameseContextoPrompt({
    topic: input.topic,
    difficulty: input.difficulty ?? "medium",
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini không trả về nội dung hợp lệ.");
  }

  return JSON.parse(text) as GeneratedRound;
}
```

### Lưu ý quan trọng

- Không log API key ra console.
- Không đưa API key vào error message.
- Khi request lỗi, chỉ show message ngắn cho admin.
- Nên có loading state rõ vì tạo 1000 từ có thể mất một lúc.
- Nên validate JSON kỹ bằng Zod sau khi parse.

---

## 4. Phạm vi MVP không Cloud Functions

### Có trong MVP

- Một room active tại một thời điểm.
- Admin tạo room.
- Admin có màn hình Settings để nhập Gemini API key.
- Admin bấm **Create New Game** để frontend gọi Gemini tạo dữ liệu round.
- App tự validate output từ Gemini.
- App tự normalize, hash và lưu dữ liệu xuống Firestore.
- Có fallback Import JSON thủ công nếu Gemini lỗi.
- Player join bằng room ID/link và nhập tên.
- Người chơi không cần đăng ký tài khoản.
- Tất cả player chơi cùng một round.
- Mỗi player có lịch sử đoán riêng ở client.
- Không hiển thị từ đoán của người khác.
- Realtime hiển thị kết quả người đã solved/surrendered.
- Chỉ admin được start game, next round, end game.
- Mỗi round có 1000 từ liên quan đã hash.
- Từ không tồn tại trong 1000 từ liên quan sẽ báo message nhỏ.
- Mỗi player tối đa 3 hint.
- Hint bị trừ điểm.
- Khi best rank đang là `2`, không cho mở hint nữa.
- Khi surrender, player được xem đáp án và bị xếp cuối round hiện tại.
- End room tổng kết điểm cộng dồn.

### Chưa nên làm trong MVP

- Nhiều room song song.
- Public game quy mô lớn.
- Chống cheat nâng cao.
- Backend proxy Gemini an toàn.
- Lưu lịch sử tài khoản lâu dài.
- Global leaderboard.
- Payment/quota management cho AI usage.

---

## 5. Game lifecycle

## 5.1 Room lifecycle

```txt
created → lobby → active → ended
```

### `created`

Admin tạo room. Firestore lưu `adminUid` là UID anonymous của admin.

### `lobby`

Player join room, nhập name, chờ admin start.

### `active`

Round đang chạy. Player submit guess, nhận rank, mở hint, solved hoặc surrender.

### `ended`

Admin kết thúc room. UI hiển thị final leaderboard.

---

## 5.2 Round lifecycle

```txt
draft → ready → playing → locked → revealed → completed
```

### `draft`

Admin đang import dữ liệu round.

### `ready`

Round đã có keyword hash, term index, hint data.

### `playing`

Player đang đoán.

### `locked`

Tất cả player active đã solved hoặc surrendered.

### `revealed`

Hiển thị đáp án và bảng kết quả round.

### `completed`

Round đã xong, admin có thể next round hoặc end room.

---

## 6. Ý tưởng bảo mật khi không có backend

Không có backend thì không thể bảo mật tuyệt đối. Tuy nhiên có thể giảm cheat bằng 4 lớp:

1. Không lưu plaintext của 1000 terms ở nơi player có thể list toàn bộ.
2. Hash normalized term thành document ID.
3. Chỉ cho phép `get` từng term hash, không cho phép `list` toàn bộ term index.
4. Dùng Security Rules để giới hạn quyền admin/player.

---

## 6.1 Cơ chế term hash

Thay vì lưu:

```json
{
  "keyword": "bánh mì",
  "terms": [
    { "term": "ổ bánh", "rank": 2 },
    { "term": "bột mì", "rank": 3 }
  ]
}
```

Ta lưu dạng hash:

```txt
rooms/{roomId}/rounds/{roundId}/termIndex/{termHash}
```

Ví dụ document:

```json
{
  "rank": 27,
  "type": "related"
}
```

Keyword cũng là một term có rank `1`:

```json
{
  "rank": 1,
  "type": "keyword"
}
```

Client flow khi đoán:

1. User nhập từ.
2. Client normalize từ.
3. Client hash normalized text.
4. Client `getDoc(termIndex/{hash})`.
5. Nếu document tồn tại → lấy rank.
6. Nếu không tồn tại → báo “Từ này chưa có trong dữ liệu round”.

Ưu điểm:

- Player không tải toàn bộ đáp án xuống client.
- Không thấy danh sách 1000 từ bằng DevTools thông thường.
- Không cần backend để kiểm tra rank.

Nhược điểm:

- Người rất kỹ thuật vẫn có thể brute-force bằng wordlist tiếng Việt.
- Đây chỉ là chống cheat mức casual, không phải bảo mật tuyệt đối.

---

## 6.2 Normalize tiếng Việt

Cần normalize để tránh sai khác do viết hoa, khoảng trắng, dấu câu.

Đề xuất:

```ts
function normalizeVietnamese(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()\[\]{}"']/g, "")
    .replace(/\s+/g, " ");
}
```

Không nên bỏ dấu tiếng Việt ở MVP vì:

- “ma” và “má” là hai từ khác nhau.
- Bỏ dấu có thể tạo nhiều nhập nhằng.
- Game tiếng Việt nên khuyến khích nhập đúng dấu.

Có thể thêm alias nếu cần:

```json
{
  "term": "bánh mì",
  "aliases": ["banh mi"]
}
```

Nhưng ở MVP nên giữ đơn giản: yêu cầu nhập có dấu.

---

## 6.3 Hash function phía client

Có thể dùng Web Crypto API:

```ts
async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

Có thể thêm `roundSalt`:

```ts
const hashInput = `${roundSalt}:${normalizedGuess}`;
const termHash = await sha256(hashInput);
```

Lưu ý: nếu `roundSalt` nằm ở client thì vẫn không phải secret tuyệt đối. Nó chủ yếu giúp hash mỗi round khác nhau, giảm khả năng dùng lại bảng hash cũ.

---

## 7. Firestore data model đề xuất

## 7.1 rooms

Path:

```txt
rooms/{roomId}
```

Document:

```ts
type Room = {
  roomId: string;
  adminUid: string;
  status: "created" | "lobby" | "active" | "ended";
  currentRoundId?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  playerCount: number;
};
```

---

## 7.2 players

Path:

```txt
rooms/{roomId}/players/{uid}
```

Document:

```ts
type Player = {
  uid: string;
  name: string;
  joinedAt: Timestamp;
  isActive: boolean;
  totalScore: number;
  lastSeenAt: Timestamp;
};
```

---

## 7.3 rounds

Path:

```txt
rooms/{roomId}/rounds/{roundId}
```

Document:

```ts
type Round = {
  roundId: string;
  status: "draft" | "ready" | "playing" | "locked" | "revealed" | "completed";
  roundNumber: number;
  roundSalt: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  termCount: number;
  hintCount: number;
  createdBy: string;
};
```

Không lưu `keyword` plaintext ở đây.

---

## 7.4 termIndex

Path:

```txt
rooms/{roomId}/rounds/{roundId}/termIndex/{termHash}
```

Document:

```ts
type TermIndexDoc = {
  rank: number;
  type: "keyword" | "related";
};
```

Rules:

- Player được `get` document nếu biết hash.
- Không cho player `list` toàn bộ collection.
- Chỉ admin được create/update/delete.

---

## 7.5 roundSecret

Path:

```txt
rooms/{roomId}/rounds/{roundId}/private/secret
```

Document:

```ts
type RoundSecret = {
  keyword: string;
  normalizedKeyword: string;
};
```

Rules đọc:

- Admin được đọc.
- Player chỉ được đọc nếu:
  - player đã solved, hoặc
  - player đã surrendered, hoặc
  - round đã revealed/completed.

Lưu ý: khi một player surrender và thấy đáp án, họ có thể nói cho người khác. Không có backend thì không thể ngăn triệt để.

---

## 7.6 hintPool

Path:

```txt
rooms/{roomId}/rounds/{roundId}/hintPool/{rank}
```

Document:

```ts
type HintPoolEntry = {
  rank: number;
  term: string; // plaintext để hiện cho player khi gợi ý
};
```

`hintPool` lưu một tập con ~20–30 từ liên quan có plaintext, trải đều từ rank cao đến thấp (ví dụ rank 2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300, 400, 500, 700, 1000). Document ID là rank dạng string zero-padded (`"0100"`, `"0010"`, ...) để query dễ.

Admin ghi hintPool khi tạo round, lấy trực tiếp từ `relatedTerms` của Gemini (không cần Gemini tự chọn hint nữa).

Không lưu 3 hint cố định — hint là dynamic theo bestRank của từng player.

---

## 7.7 playerRounds

Path:

```txt
rooms/{roomId}/rounds/{roundId}/playerRounds/{uid}
```

Document:

```ts
type PlayerRound = {
  uid: string;
  status: "playing" | "solved" | "surrendered";
  startedAt: Timestamp;
  finishedAt?: Timestamp;
  guessCount: number;
  bestRank: number | null;
  usedHints: number;
  hintPenalty: number;
  roundScore: number;
};
```

---

## 7.8 publicResults

Path:

```txt
rooms/{roomId}/rounds/{roundId}/publicResults/{uid}
```

Document:

```ts
type PublicRoundResult = {
  uid: string;
  name: string;
  status: "solved" | "surrendered";
  finishOrder: number;
  guessCount: number;
  bestRank: number | null;
  durationMs: number;
  usedHints: number;
  roundScore: number;
  createdAt: Timestamp;
};
```

Public result không chứa guess text.

---

## 8. Luồng chơi không Cloud Functions

## 8.1 Admin tạo room

1. Admin vào trang `/admin`.
2. App gọi Firebase Anonymous Auth.
3. App tạo room doc với `adminUid = auth.currentUser.uid`.
4. Room có status `lobby`.
5. App hiển thị room code/link.

---

## 8.2 Admin tạo game / tạo round bằng Gemini trực tiếp từ frontend

Admin flow cập nhật:

1. Admin vào `/admin/settings`.
2. Admin nhập Gemini API key.
3. Admin chọn model, ví dụ `gemini-2.5-flash`.
4. Admin quay lại màn Admin Panel.
5. Admin click **Create New Game**.
6. Frontend kiểm tra đã có Gemini key chưa.
7. Frontend gọi Gemini trực tiếp từ browser.
8. Gemini trả về JSON gồm:
   - `keyword`
   - `relatedTerms` 1000 item
9. App parse JSON.
10. App validate bằng Zod.
11. App normalize keyword và terms.
12. App tạo `roundSalt`.
13. App hash keyword và từng related term.
14. App ghi `termIndex` vào Firestore.
15. App ghi `private/secret` chứa keyword plaintext.
16. App tự động chọn ~20–30 terms trải đều theo rank để ghi `hintPool` vào Firestore (không cần Gemini pick hints).
17. App tạo/cập nhật room status về `lobby` hoặc round status `ready`.
18. App hiển thị room code/link cho player join.

### Flow UI đề xuất

```txt
Admin Dashboard
  → Create New Game
  → Modal: Game Generation Options
      - Topic optional
      - Difficulty optional
      - Model
      - Generate button
  → Loading: Gemini đang tạo dữ liệu
  → Preview generated data
      - Keyword chỉ admin thấy
      - Top 20 related terms
      - 3 hints
      - Validation status
  → Confirm Create Room/Round
  → Firestore write
  → Room Lobby
```

### Vì sao nên có bước preview?

Gemini có thể tạo dữ liệu chưa ổn:

- Từ quá hiếm.
- Có duplicate.
- Không đủ 1000 item.
- Rank bị thiếu hoặc trùng.
- Keyword không đúng 2 từ.
- Related term dài quá 3 từ.

Preview giúp admin kiểm tra nhanh trước khi player vào chơi.

### Button states

```txt
Create New Game
  - disabled nếu thiếu Gemini key
  - loading khi đang gọi Gemini
  - disabled khi đang ghi Firestore
  - success khi round ready
  - error nếu Gemini/validate/Firestore lỗi
```

### Fallback Import JSON

Trong Create Game modal nên có tab:

```txt
Tab 1: Generate with Gemini
Tab 2: Import JSON manually
```

Tab Import JSON giúp admin vẫn tạo game được khi API bị lỗi hoặc muốn dùng dữ liệu tự chuẩn bị.

---

## 8.3 Player join room

1. Player mở link room.
2. App gọi Anonymous Auth.
3. Player nhập name.
4. App tạo doc `players/{uid}`.
5. Player vào lobby.

Không cần login thật, nhưng vẫn có uid để Security Rules phân quyền.

---

## 8.4 Admin start game

Admin click Start:

1. App kiểm tra current user là `adminUid`.
2. Update room status `active`.
3. Update round status `playing`.
4. Set `startedAt`.
5. Tạo playerRound cho các player active nếu cần.

---

## 8.5 Player submit guess

Flow:

```txt
Input text
  → normalize
  → sha256(roundSalt + normalizedText)
  → getDoc(termIndex/{hash})
  → nếu có rank: update local guesses + playerRound
  → nếu rank = 1: mark solved + write publicResult
  → nếu không có: show toast message
```

Không lưu guess text của người chơi khác vào public result.

Local player có thể thấy lịch sử guess của chính mình trong Zustand/local state.

---

## 8.6 Player surrender

Khi click Bỏ cuộc:

1. Update `playerRounds/{uid}.status = surrendered`.
2. Tính điểm theo best rank hiện tại.
3. Apply surrender penalty.
4. Ghi public result.
5. Cho phép player đọc `private/secret` để thấy keyword.
6. Trên bảng round, player bị xếp sau nhóm solved.

---

## 8.7 Điều kiện next round

Admin chỉ được next round khi tất cả player active có status:

- `solved`, hoặc
- `surrendered`.

Không có backend thì có 2 cách kiểm tra:

### Cách đơn giản

Client admin listen `playerRounds` rồi tự kiểm tra.

Nếu đủ điều kiện, enable button Next Round.

### Cách chặt hơn

Security Rules giới hạn update round status chỉ khi điều kiện tài liệu thỏa mãn. Tuy nhiên Firestore Rules không phù hợp để quét toàn bộ player trong collection, nên MVP nên dùng cách đơn giản ở client.

---

## 9. Scoring system đề xuất

Mục tiêu:

- Thưởng cao cho người đoán đúng.
- Vẫn cộng điểm cho người đoán gần, ví dụ best rank `< 100`.
- Phạt nhẹ khi đoán quá nhiều.
- Phạt khi dùng hint.
- Người surrender vẫn có thể có điểm nếu đã đoán gần, nhưng bị xếp dưới người solved.

---

## 9.1 Base score theo best rank

```ts
function getBaseScore(bestRank: number | null) {
  if (!bestRank) return 0;
  if (bestRank === 1) return 1000;
  if (bestRank <= 3) return 750;
  if (bestRank <= 10) return 500;
  if (bestRank <= 50) return 250;
  if (bestRank <= 100) return 120;
  if (bestRank <= 300) return 40;
  if (bestRank <= 1000) return 10;
  return 0;
}
```

---

## 9.2 Bonus solved

```ts
const solvedBonus = status === "solved" ? 300 : 0;
```

---

## 9.3 Bonus thời gian

Chỉ cộng cho người solved.

```ts
function getSpeedBonus(status: "solved" | "surrendered", durationSec: number) {
  if (status !== "solved") return 0;
  return Math.max(0, 200 - Math.floor(durationSec * 1.5));
}
```

---

## 9.4 Penalty số lần đoán

```ts
const guessPenalty = Math.min(guessCount * 3, 120);
```

---

## 9.5 Penalty hint

```ts
const hintPenalties = [25, 45, 70];
const hintPenalty = usedHintIndexes.reduce((sum, index) => sum + hintPenalties[index - 1], 0);
```

---

## 9.6 Penalty surrender

```ts
const surrenderPenalty = status === "surrendered" ? 80 : 0;
```

---

## 9.7 Công thức tổng

```ts
function calculateRoundScore(params: {
  status: "solved" | "surrendered";
  bestRank: number | null;
  durationSec: number;
  guessCount: number;
  usedHintIndexes: number[];
}) {
  const base = getBaseScore(params.bestRank);
  const solvedBonus = params.status === "solved" ? 300 : 0;
  const speedBonus = getSpeedBonus(params.status, params.durationSec);
  const guessPenalty = Math.min(params.guessCount * 3, 120);
  const hintPenalties = [25, 45, 70];
  const hintPenalty = params.usedHintIndexes.reduce(
    (sum, index) => sum + hintPenalties[index - 1],
    0,
  );
  const surrenderPenalty = params.status === "surrendered" ? 80 : 0;

  return Math.max(
    0,
    base + solvedBonus + speedBonus - guessPenalty - hintPenalty - surrenderPenalty,
  );
}
```

---

## 9.8 Xếp hạng round

Thứ tự ưu tiên:

1. Solved trước surrendered.
2. Solved sắp theo finish time nhanh hơn.
3. Nếu cùng thời gian, ít guess hơn đứng trên.
4. Nếu surrendered, best rank nhỏ hơn đứng trên.
5. Nếu cùng best rank, ít hint hơn đứng trên.

---

## 10. Hint system

## 10.1 Mục tiêu

Hint giúp người chơi đang bí có thêm hướng đoán bằng cách tự động tiết lộ một từ **gần hơn** so với từ đoán tốt nhất hiện tại của họ. Không làm lộ keyword trực tiếp.

## 10.2 Cơ chế hint động

Khi player bấm nút hint:

1. Lấy `bestRank` hiện tại của player.
2. Kiểm tra điều kiện block (xem 10.3).
3. Chọn ngẫu nhiên `step = random(1..5)`.
4. Tính `targetRank = max(2, bestRank - step)`.
5. Tra `hintPool` lấy entry có rank gần nhất ≤ `targetRank` (tìm rank thấp nhất có sẵn trong pool mà ≤ targetRank).
6. Hiện term đó cho player kèm rank của nó.
7. Ghi nhận hint đã dùng, trừ điểm.

**Ví dụ:** bestRank = 200, step = 2 → targetRank = 198. Pool có rank 150, 200 → lấy 150 (rank thấp nhất ≤ 198 trong pool).

Nếu `bestRank` đã bằng `null` (chưa đoán lần nào), không cho dùng hint.

## 10.3 Điều kiện mở hint

Player được mở hint nếu:

- Round đang `playing`.
- Player chưa solved/surrendered.
- Player dùng ít hơn 3 hint.
- `bestRank != null` và `bestRank > 2`.

Nếu `bestRank <= 2`, UI hiển thị:

> Bạn đã rất gần đáp án. Không thể mở thêm gợi ý ở vị trí này — hãy đoán keyword cuối cùng!

## 10.4 Trừ điểm hint

- Lần hint 1: -25 điểm.
- Lần hint 2: -45 điểm.
- Lần hint 3: -70 điểm.

Penalty tính theo thứ tự sử dụng, không phụ thuộc vào rank của từ được gợi ý.

---

## 11. UI/UX direction

## 11.1 Phong cách tổng thể

- Hiện đại, tối, có chiều sâu.
- Không quá lòe loẹt.
- Nên dùng gradient nhẹ, glassmorphism vừa phải.
- Card bo góc lớn.
- Icon nhiều nhưng không rối.
- Animation mượt, vui, có phản hồi ngay sau mỗi guess.

## 11.2 Màu theo độ gần của từ

Gợi ý mapping:

|     Rank | Ý nghĩa         | UI                         |
| -------: | --------------- | -------------------------- |
|        1 | Chính xác       | xanh lá / vàng chiến thắng |
|     2–10 | Rất gần         | xanh lá mạnh               |
|    11–50 | Gần             | xanh ngọc                  |
|   51–100 | Có liên quan    | xanh dương                 |
|  101–300 | Trung bình      | tím                        |
|  301–600 | Xa              | cam                        |
| 601–1000 | Rất xa          | xám / đỏ nhẹ               |
| Không có | Chưa có dữ liệu | muted / warning toast      |

## 11.3 Animation nên có

- Guess input shake nhẹ khi từ không tồn tại.
- Result row slide-in khi có người solved/surrendered.
- Leaderboard count-up điểm.
- Hint reveal flip card.
- Correct answer confetti nhẹ.
- Round transition bằng motion fade/scale.
- Final winner podium animation.

## 11.4 Component chính

```txt
AppShell
RoomLobby
AdminPanel
RoundHeader
GuessInput
GuessHistoryList
RankBadge
HintPanel
RealtimeResultBoard
Leaderboard
RoundRevealModal
FinalPodium
```

---

## 12. Zustand store đề xuất

```ts
type GameStore = {
  roomId: string | null;
  uid: string | null;
  playerName: string | null;
  isAdmin: boolean;

  currentRoundId: string | null;
  localGuesses: LocalGuess[];
  bestRank: number | null;
  usedHints: number;

  setRoom: (roomId: string) => void;
  setPlayer: (uid: string, name: string) => void;
  addLocalGuess: (guess: LocalGuess) => void;
  resetRoundLocalState: () => void;
};

type LocalGuess = {
  text: string;
  normalizedText: string;
  rank: number | null;
  createdAt: number;
};
```

Lưu ý:

- Guess text của chính player có thể giữ local trong Zustand hoặc localStorage.
- Không cần publish guess text lên Firestore.

---

## 13. Firestore listeners

## 13.1 Room listener

Listen:

```txt
rooms/{roomId}
```

Dùng để cập nhật:

- room status.
- current round.
- admin state.

## 13.2 Players listener

Listen:

```txt
rooms/{roomId}/players
```

Dùng cho lobby và admin dashboard.

## 13.3 Public results listener

Listen:

```txt
rooms/{roomId}/rounds/{roundId}/publicResults
```

Dùng để realtime show ai đã hoàn thành.

## 13.4 Leaderboard listener

Có thể dùng `players` vì mỗi player có `totalScore`.

---

## 14. Firestore Security Rules phác thảo

> Đây là bản phác thảo để định hướng. Khi implement cần test bằng Firebase Emulator.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function roomPath(roomId) {
      return /databases/$(database)/documents/rooms/$(roomId);
    }

    function room(roomId) {
      return get(roomPath(roomId));
    }

    function isAdmin(roomId) {
      return signedIn() && room(roomId).data.adminUid == request.auth.uid;
    }

    function isSelf(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    match /rooms/{roomId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && request.resource.data.adminUid == request.auth.uid;
      allow update: if isAdmin(roomId);
      allow delete: if false;

      match /players/{uid} {
        allow read: if signedIn();
        allow create: if isSelf(uid);
        allow update: if isSelf(uid) || isAdmin(roomId);
        allow delete: if false;
      }

      match /rounds/{roundId} {
        allow read: if signedIn();
        allow create, update: if isAdmin(roomId);
        allow delete: if false;

        match /termIndex/{termHash} {
          // Player có thể get một hash cụ thể khi submit guess.
          allow get: if signedIn();
          // Không cho list toàn bộ 1000 terms.
          allow list: if false;
          allow create, update, delete: if isAdmin(roomId);
        }

        match /hintPool/{rank} {
          // Player được get entry theo rank khi cần gợi ý động
          allow get: if signedIn();
          // Không cho list toàn bộ hintPool để tránh lộ quá nhiều plaintext
          allow list: if false;
          allow create, update, delete: if isAdmin(roomId);
        }

        match /private/{docId} {
          allow read: if isAdmin(roomId);
          allow create, update, delete: if isAdmin(roomId);
        }

        match /playerRounds/{uid} {
          allow read: if isSelf(uid) || isAdmin(roomId);
          allow create, update: if isSelf(uid);
          allow delete: if false;
        }

        match /publicResults/{uid} {
          allow read: if signedIn();
          allow create, update: if isSelf(uid) || isAdmin(roomId);
          allow delete: if false;
        }
      }
    }
  }
}
```

Cần cải tiến thêm khi implement:

- Validate field names bằng `keys().hasOnly([...])`.
- Validate type dữ liệu.
- Validate range của `rank`, `score`, `guessCount`, `usedHints`.
- Tách quyền đọc `private/secret` cho player đã solved/surrendered.
- Chặn player update trường không thuộc quyền của mình.

---

## 15. Prompt mẫu tạo dữ liệu bằng Gemini

```md
Bạn là hệ thống tạo dữ liệu cho game đoán từ tiếng Việt giống Contexto.

Hãy tạo 1 keyword bí mật và 1000 từ/cụm từ tiếng Việt liên quan, sắp xếp theo mức độ liên quan giảm dần.

Yêu cầu:

- Keyword phải gồm đúng 2 từ tiếng Việt.
- Keyword phải thông dụng, không quá chuyên ngành, không phản cảm.
- Mỗi related term dài tối đa 3 từ.
- Related terms phải thông dụng trong tiếng Việt.
- Không trùng lặp.
- Không dùng từ tiếng Anh nếu không thật sự phổ biến ở Việt Nam.
- Không đưa keyword vào relatedTerms.
- Rank càng nhỏ càng gần keyword.
- relatedTerms phải có đúng 1000 item.

Output JSON hợp lệ theo schema:

{
"keyword": "...",
"relatedTerms": [
{ "term": "...", "rank": 2 },
{ "term": "...", "rank": 3 }
]
}

Lưu ý:

- relatedTerms bắt đầu từ rank 2.
- Không cần sinh hints — hệ thống sẽ tự tạo hintPool từ relatedTerms sau khi nhận JSON.
- Không giải thích thêm bên ngoài JSON.
```

---

## 16. Validate JSON từ Gemini hoặc import thủ công

Khi Gemini trả JSON hoặc admin dán JSON thủ công vào app, cần validate trước khi ghi Firestore.

Checklist:

- `keyword` tồn tại.
- Keyword đúng 2 từ.
- `relatedTerms` là array.
- Có đúng 1000 related terms.
- Rank bắt đầu từ 2.
- Rank không trùng.
- Term không trùng sau normalize.
- Mỗi term tối đa 3 từ.
- Không có term giống keyword.
- hintPool được tạo tự động từ relatedTerms, không validate từ Gemini output.

Nếu lỗi, show message rõ:

> Dữ liệu round chưa hợp lệ: relatedTerms đang có 983 item, cần đúng 1000 item.

---

## 17. Setup project

## 17.1 Tạo Vite app

```bash
npm create vite@latest contexto-vietnamese-game -- --template react-ts
cd contexto-vietnamese-game
npm install
```

## 17.2 Cài Tailwind + shadcn/ui

```bash
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

## 17.3 Cài thư viện cần thiết

```bash
npm install firebase zustand motion lucide-react clsx tailwind-merge zod nanoid
```

## 17.4 Firebase config

```ts
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Không import `getFunctions` vì bản này không dùng Cloud Functions.

## 17.5 Anonymous Auth

```ts
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}
```

---

## 17.6 Gemini settings service

```ts
// src/features/admin/settings/geminiSettings.ts
const GEMINI_KEY_STORAGE = "viet-contexto.admin.geminiApiKey";

export function getSavedGeminiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE) ?? "";
}

export function saveGeminiKey(apiKey: string) {
  localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
}

export function removeSavedGeminiKey() {
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}
```

## 17.7 Create Game service structure

```txt
src/features/admin/create-game/
  components/
    CreateGameDialog.tsx
    GeneratedRoundPreview.tsx
    GeminiSettingsCard.tsx
  services/
    geminiRoundService.ts
    roundValidationService.ts
    roundFirestoreWriter.ts
    termHashService.ts
  schemas/
    generatedRound.schema.ts
```

Gợi ý tách service:

- `geminiRoundService`: gọi Gemini.
- `roundValidationService`: validate JSON bằng Zod.
- `termHashService`: normalize + sha256.
- `roundFirestoreWriter`: ghi dữ liệu vào Firestore.

---

## 18. Roadmap implement

## Phase 1 — Base setup

- Tạo Vite React TS.
- Setup Tailwind.
- Setup shadcn/ui.
- Setup Firebase Auth + Firestore.
- Setup Zustand.
- Setup route structure.

## Phase 2 — Admin Settings

- Tạo màn `/admin/settings` hoặc tab Settings trong Admin Panel.
- Input Gemini API key dạng password.
- Show/hide key.
- Remember key on this device.
- Clear saved key.
- Chọn Gemini model.
- Test connection button.

## Phase 3 — Room/lobby

- Admin create room.
- Player join room.
- Realtime player list.
- Room code/link UI.

## Phase 4 — Create New Game bằng Gemini

- Admin click Create New Game.
- Check Gemini key.
- Build prompt.
- Gọi Gemini trực tiếp từ frontend.
- Parse JSON response.
- Validate bằng Zod.
- Preview keyword/top related terms/hints cho admin.
- Confirm để ghi Firestore.

## Phase 5 — Round data processing

- Normalize terms.
- Hash terms với `roundSalt`.
- Write termIndex, hints, secret vào Firestore.
- Fallback Import JSON thủ công.

## Phase 6 — Gameplay

- Guess input.
- Hash guess.
- Check Firestore termIndex.
- Show rank/color.
- Local guess history.
- Solved flow.
- Surrender flow.

## Phase 7 — Realtime results

- Public result board.
- Round status.
- Lock round khi tất cả player xong.
- Admin next round.

## Phase 8 — Scoring/leaderboard

- Round score calculation.
- Total score update.
- Final leaderboard.
- Winner podium.

## Phase 9 — UI polish

- Motion animations.
- Confetti.
- Rank color system.
- Hint reveal animation.
- Responsive layout.

## Phase 10 — Security rules + emulator test

- Viết rules.
- Test admin/player permissions.
- Test không list termIndex được.
- Test player không sửa room status.
- Test player không đọc secret trước khi solved/surrendered.

---

## 19. Rủi ro và cách xử lý

## 19.1 Lộ Gemini API key

Rủi ro:

- Vì frontend gọi Gemini trực tiếp, API key có thể bị thấy trong DevTools/network request.
- Nếu deploy public, người khác có thể lấy key để dùng ngoài ý muốn.
- Nếu key gắn billing/quota cao, có thể phát sinh chi phí.

Giảm thiểu:

- Chỉ dùng cho dự án cá nhân/nhóm nhỏ.
- Không public rộng rãi URL admin.
- Không hardcode key trong source.
- Không commit key lên Git.
- Không lưu key vào Firestore.
- Có nút Clear saved key.
- Dùng key riêng cho project này.
- Giới hạn quota/billing ở Google AI Studio/Google Cloud nếu có thể.
- Xoay/thu hồi key nếu nghi ngờ bị lộ.

Khuyến nghị MVP:

> Chấp nhận rủi ro để đổi lấy tốc độ làm nhanh và không cần Cloud Functions. Khi public, chuyển sang backend proxy Gemini.

## 19.2 Player kỹ thuật brute-force hash

Rủi ro:

- Có thể dùng wordlist tiếng Việt để hash và dò termIndex.

Giảm thiểu:

- Dùng `roundSalt` khác nhau mỗi round.
- Không cho list termIndex.
- Giới hạn số request/read bằng App Check nếu sau này cần.
- Chấp nhận cho MVP casual.

## 19.3 Player tự sửa điểm

Rủi ro:

- Không có backend tính điểm authoritative.

Giảm thiểu:

- Security Rules validate range dữ liệu.
- UI chỉ ghi score theo formula chuẩn.
- Admin có thể reset/kick nếu thấy bất thường.
- Bản production nên chuyển scoring sang backend.

## 19.4 Lộ đáp án sau khi có người surrender

Rủi ro:

- Người đã surrender có thể nói đáp án cho người khác.

Giảm thiểu:

- Surrender xếp cuối round.
- Có thể chỉ reveal keyword khi round locked, thay vì reveal ngay sau surrender.
- Nếu vẫn muốn reveal riêng cho surrendered player, chấp nhận rủi ro social cheating.

Khuyến nghị MVP:

> Khi player surrender, UI của họ hiện đáp án. Với nhóm chơi nhỏ, chấp nhận được.

## 19.5 Gemini output chất lượng thấp

Rủi ro:

- Từ liên quan không tự nhiên.
- Có duplicate.
- Có từ quá hiếm.

Giảm thiểu:

- Validate JSON.
- Cho admin preview top 50 terms trước khi start.
- Cho admin regenerate bên ngoài app.
- Sau này có thể xây thêm tool local để kiểm tra chất lượng.

---

## 20. Khi nào nên thêm backend sau này?

Nên thêm backend/serverless khi:

- Muốn admin bấm button tạo game nhưng không muốn lộ Gemini API key ở browser.
- Không muốn lộ keyword/related terms bằng bất kỳ cách nào ở client.
- Muốn scoring chống cheat tốt.
- Muốn nhiều room public.
- Muốn leaderboard toàn hệ thống.
- Có người chơi lạ ngoài nhóm bạn bè/nội bộ.
- Cần rate limit submit guess.
- Cần kiểm soát chi phí AI.

Backend lúc đó có thể là:

- Cloud Functions.
- Cloud Run.
- Vercel Serverless Functions.
- Netlify Functions.
- Một Node.js server nhỏ.
- Supabase Edge Functions.

---

## 21. Quyết định kiến trúc khuyên dùng

Với yêu cầu hiện tại, nên chọn:

```txt
Vite + React + shadcn/ui + Tailwind + Motion + Zustand
Firebase Auth Anonymous
Cloud Firestore realtime
Firestore Security Rules
Admin Settings nhập Gemini API key
Frontend gọi Gemini trực tiếp
Create New Game tự generate keyword + 1000 related terms
Hashed termIndex
Client-side scoring cho MVP
Fallback Import JSON thủ công
```

Đây là hướng thực tế nhất để:

- Giữ scope nhỏ.
- Không cần Cloud Functions.
- Không cần backend riêng.
- Admin vẫn tạo game bằng một button trong UI.
- Player vẫn chơi realtime được.
- Trải nghiệm gần giống Contexto.
- Có thể nâng cấp backend sau mà không phải đập đi làm lại toàn bộ.

Điểm cần luôn ghi nhớ:

> Gemini API key nhập ở frontend **không phải secret tuyệt đối**. Cách này chỉ phù hợp dự án cá nhân/không public.

---

## 22. Checklist MVP hoàn thành

- [ ] Admin tạo room được.
- [ ] Player join room bằng name được.
- [ ] Anonymous Auth hoạt động.
- [ ] Admin Settings nhập/lưu/xóa Gemini key được.
- [ ] Admin click Create New Game gọi Gemini trực tiếp được.
- [ ] App validate JSON Gemini trả về được.
- [ ] Có fallback import JSON thủ công.
- [ ] App hash terms và ghi Firestore được.
- [ ] Player submit guess và nhận rank được.
- [ ] Từ không tồn tại hiện toast message.
- [ ] Không thấy guess của người khác.
- [ ] Public result realtime hoạt động.
- [ ] Hint tối đa 3 lần.
- [ ] Hint động: tiết lộ từ có rank = bestRank - random(1..5).
- [ ] Hint bị trừ điểm theo thứ tự dùng (25/45/70).
- [ ] Block hint nếu bestRank null hoặc bestRank <= 2.
- [ ] hintPool tự động tạo từ relatedTerms khi admin tạo round.
- [ ] Surrender hiển thị đáp án.
- [ ] Next round chỉ enable khi tất cả player xong.
- [ ] End room hiển thị final leaderboard.
- [ ] Security Rules chặn player sửa room status.
- [ ] Security Rules chặn list termIndex.
- [ ] UI có animation, màu rank, leaderboard, final podium.

---

## 23. Ghi chú cuối

Bản không Cloud Functions + Gemini gọi trực tiếp từ frontend phù hợp để bắt đầu nhanh và tiết kiệm chi phí. Điểm cần nhớ là: **Firestore + Security Rules không thay thế hoàn toàn backend**, và **Gemini API key ở browser không phải secret tuyệt đối**. Hướng này đủ tốt cho MVP/casual game cá nhân, nhưng không đủ để chống cheat nghiêm túc hoặc bảo vệ key khi public.

Vì vậy, hãy thiết kế code theo hướng dễ nâng cấp:

- Tách `gameService` khỏi UI.
- Tách `scoreService` riêng.
- Tách `roundImportService` riêng.
- Tách `firebaseRepository` riêng.

Sau này nếu cần backend, chỉ thay implementation trong service layer, UI vẫn giữ lại được phần lớn.
