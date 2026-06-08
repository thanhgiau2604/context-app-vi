import { buildVietnameseContextoPrompt } from "./vietnamese-contexto-prompt-builder";
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

  if (!response.ok) throw new Error(`Gemini lỗi ${response.status}. Kiểm tra API key và quota.`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung hợp lệ.");

  const parsed = JSON.parse(text);
  const sanitized = sanitizeRelatedTerms(parsed);
  const result = GeneratedRoundSchema.safeParse(sanitized);
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Dữ liệu Gemini không hợp lệ: ${issues}`);
  }

  const extraErrors = validateGeneratedRound(result.data);
  if (extraErrors.length > 0) throw new Error(extraErrors.join("\n"));

  return result.data;
}

// Deduplicates relatedTerms by normalized term text and by rank before Zod validation.
// Gemini occasionally returns duplicate entries; this sanitizer salvages the output
// rather than throwing and forcing a costly retry.
function sanitizeRelatedTerms(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.relatedTerms)) return parsed;

  const seenTerms = new Set<string>();
  const seenRanks = new Set<number>();
  const deduped: unknown[] = [];

  for (const item of p.relatedTerms) {
    if (!item || typeof item !== "object") continue;
    const t = item as { term?: unknown; rank?: unknown };
    if (typeof t.term !== "string" || typeof t.rank !== "number") continue;

    const normalized = t.term.trim().toLowerCase();
    if (!normalized || seenTerms.has(normalized)) continue;
    if (seenRanks.has(t.rank)) continue;

    seenTerms.add(normalized);
    seenRanks.add(t.rank);
    deduped.push(item);
  }

  // Sort by rank ascending to preserve game semantics
  deduped.sort((a, b) => (a as { rank: number }).rank - (b as { rank: number }).rank);

  return { ...p, relatedTerms: deduped };
}

// Test connection with a trivial prompt — no game data generated
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
