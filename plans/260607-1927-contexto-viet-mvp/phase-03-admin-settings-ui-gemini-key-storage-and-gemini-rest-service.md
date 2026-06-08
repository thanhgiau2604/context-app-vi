# Phase 03 — Admin Settings UI, Gemini Key Storage & Gemini REST Service

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** M (2–3h)  
**Requires:** Phase 02

---

## Overview

Admin Settings page + Gemini key management + Gemini REST call service + prompt builder.

---

## Files to create

### `src/lib/gemini/gemini-prompt-builder.ts`

```ts
type PromptOptions = {
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export function buildVietnameseContextoPrompt(options: PromptOptions = {}): string {
  const topicLine = options.topic ? `Chủ đề gợi ý: ${options.topic}.` : "";
  const diffLine =
    options.difficulty === "easy"
      ? "Chọn keyword phổ biến, dễ nhận biết."
      : options.difficulty === "hard"
        ? "Chọn keyword ít phổ biến hơn, thú vị hơn."
        : "";

  return `Bạn là hệ thống tạo dữ liệu cho game đoán từ tiếng Việt giống Contexto.

${topicLine}
${diffLine}

Hãy tạo 1 keyword bí mật và 1000 từ/cụm từ tiếng Việt liên quan, sắp xếp theo mức độ liên quan giảm dần.

Yêu cầu:
- Keyword phải gồm đúng 2 từ tiếng Việt.
- Keyword phải thông dụng, không quá chuyên ngành, không phản cảm.
- Mỗi related term dài tối đa 3 từ (1, 2 hoặc 3 từ đều được).
- Related terms phải thông dụng trong tiếng Việt.
- Không trùng lặp.
- Không dùng từ tiếng Anh nếu không thật sự phổ biến ở Việt Nam.
- Không đưa keyword vào relatedTerms.
- Rank càng nhỏ càng gần keyword. relatedTerms bắt đầu từ rank 2.
- relatedTerms phải có đúng 1000 item.

Output JSON hợp lệ, không giải thích gì thêm:

{
  "keyword": "...",
  "relatedTerms": [
    { "term": "...", "rank": 2 },
    { "term": "...", "rank": 3 }
  ]
}`;
}
```

---

### `src/lib/gemini/generated-round-zod-schema.ts`

```ts
import { z } from "zod";

export const RelatedTermSchema = z.object({
  term: z.string().min(1).max(50),
  rank: z.number().int().min(2).max(1001),
});

export const GeneratedRoundSchema = z.object({
  keyword: z.string().min(1),
  relatedTerms: z.array(RelatedTermSchema).length(1000),
});

export type GeneratedRound = z.infer<typeof GeneratedRoundSchema>;

// Validate extra constraints beyond schema
export function validateGeneratedRound(data: GeneratedRound): string[] {
  const errors: string[] = [];
  const words = data.keyword.trim().split(/\s+/);
  if (words.length !== 2) errors.push(`Keyword phải đúng 2 từ, hiện có ${words.length} từ.`);

  const ranks = data.relatedTerms.map((t) => t.rank);
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size !== ranks.length) errors.push("Rank bị trùng trong relatedTerms.");

  const terms = data.relatedTerms.map((t) => t.term.trim().toLowerCase());
  const uniqueTerms = new Set(terms);
  if (uniqueTerms.size !== terms.length) errors.push("Có term trùng nhau sau normalize.");

  const kwNorm = data.keyword.trim().toLowerCase();
  if (terms.includes(kwNorm)) errors.push("Keyword xuất hiện trong relatedTerms.");

  const longTerms = data.relatedTerms.filter((t) => t.term.trim().split(/\s+/).length > 3);
  if (longTerms.length > 0) errors.push(`${longTerms.length} term dài hơn 3 từ.`);

  if (!ranks.includes(2)) errors.push("relatedTerms phải bắt đầu từ rank 2.");

  return errors;
}
```

---

### `src/lib/gemini/gemini-round-generation-service.ts`

```ts
import { buildVietnameseContextoPrompt } from "./gemini-prompt-builder";
import {
  GeneratedRoundSchema,
  validateGeneratedRound,
  type GeneratedRound,
} from "./generated-round-zod-schema";

type GenerateInput = {
  apiKey: string;
  model: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export async function generateRoundWithGemini(input: GenerateInput): Promise<GeneratedRound> {
  const prompt = buildVietnameseContextoPrompt({
    topic: input.topic,
    difficulty: input.difficulty,
  });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini lỗi ${response.status}. Kiểm tra API key và quota.`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung hợp lệ.");

  const parsed = JSON.parse(text);
  const result = GeneratedRoundSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Dữ liệu Gemini không hợp lệ: ${issues}`);
  }

  const extraErrors = validateGeneratedRound(result.data);
  if (extraErrors.length > 0) throw new Error(extraErrors.join("\n"));

  return result.data;
}

// Test connection only — no game data generated
export async function testGeminiConnection(apiKey: string, model: string): Promise<void> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Trả lời một từ: xin chào" }] }],
      generationConfig: { temperature: 0 },
    }),
  });
  if (!response.ok) throw new Error(`Kết nối thất bại: ${response.status}`);
}
```

---

### `src/features/admin/settings/admin-gemini-settings-page.tsx`

UI layout:

```
Card: AI Generation Settings
  ├─ Input (password): Gemini API Key  [Eye/EyeOff toggle]
  ├─ Select: Gemini Model (gemini-2.5-flash / gemini-2.5-pro)
  ├─ Switch: Remember key on this device
  ├─ Button: Test Gemini Connection  [loading state]
  ├─ Button: Clear Saved Key
  └─ Toast: success / error feedback
```

Key behaviors:

- On mount: call `useAdminStore.loadSavedSettings()`
- Save button: `setGeminiApiKey(key, rememberKey)`
- Test button: call `testGeminiConnection()`, show toast result
- Clear button: `clearGeminiKey()`, clear input field

---

## Todo checklist

- [ ] Create `src/lib/gemini/gemini-prompt-builder.ts`
- [ ] Create `src/lib/gemini/generated-round-zod-schema.ts`
- [ ] Create `src/lib/gemini/gemini-round-generation-service.ts`
- [ ] Create `src/features/admin/settings/admin-gemini-settings-page.tsx`
- [ ] Wire `/admin/settings` route
- [ ] Test: call `testGeminiConnection()` with valid key → success toast
- [ ] Test: call `testGeminiConnection()` with invalid key → error toast
- [ ] Test: key persists on page reload when "remember" checked

---

## Success criteria

- Settings page renders at `/admin/settings`
- Test Connection shows success/failure toast
- Key saved to localStorage when remember enabled
- Key cleared from localStorage on Clear
- Gemini service throws descriptive errors (not raw API error)
