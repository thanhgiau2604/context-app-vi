import { buildVietnameseContextoPrompt } from "./vietnamese-contexto-prompt-builder";
import {
  GeneratedRoundSchema,
  validateGeneratedRound,
  type GeneratedRound,
} from "./generated-round-zod-schema";
import { TARGET_TERM_COUNT, MAX_GEMINI_ATTEMPTS } from "@/lib/config/game-limits-config";

type GenerateInput = {
  apiKey: string;
  model: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

// HTTP-level failure (bad key, quota, server error) — NOT retryable, won't fix on retry.
class GeminiHttpError extends Error {}

// Generates a round, retrying on bad format (spec §6.1). Each attempt: call → sanitize →
// truncate to exactly TARGET_TERM_COUNT → validate. Short/invalid output retries; all
// attempts exhausted throws a clear admin-facing error.
export async function generateRoundWithGemini(input: GenerateInput): Promise<GeneratedRound> {
  const prompt = buildVietnameseContextoPrompt({
    topic: input.topic,
    difficulty: input.difficulty,
  });

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
    try {
      const parsed = await callGeminiOnce(input, prompt);
      const sanitized = sanitizeRelatedTerms(parsed);
      const normalized = truncateToTargetCount(sanitized);

      const result = GeneratedRoundSchema.safeParse(normalized);
      if (!result.success) {
        lastError = result.error.issues.map((i) => i.message).join(", ");
        continue;
      }
      if (result.data.relatedTerms.length !== TARGET_TERM_COUNT) {
        lastError = `Chỉ nhận ${result.data.relatedTerms.length}/${TARGET_TERM_COUNT} từ hợp lệ.`;
        continue;
      }
      const extraErrors = validateGeneratedRound(result.data);
      if (extraErrors.length > 0) {
        lastError = extraErrors.join("; ");
        continue;
      }
      return result.data;
    } catch (e) {
      // Bad key / quota / server error won't fix on retry — surface immediately.
      if (e instanceof GeminiHttpError) throw e;
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(`Gemini thất bại sau ${MAX_GEMINI_ATTEMPTS} lần. Lỗi cuối: ${lastError}`);
}

// One Gemini round-trip: fetch + extract + JSON.parse. Throws on HTTP/parse failure.
async function callGeminiOnce(input: GenerateInput, prompt: string): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });

  if (!response.ok)
    throw new GeminiHttpError(`Gemini lỗi ${response.status}. Kiểm tra API key và quota.`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung hợp lệ.");

  return JSON.parse(text);
}

// Keeps the lowest TARGET_TERM_COUNT ranks (already sorted asc by sanitizer); drops excess.
// If fewer than target remain, leaves as-is so the caller's count check fails → retry.
function truncateToTargetCount(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.relatedTerms)) return parsed;
  if (p.relatedTerms.length <= TARGET_TERM_COUNT) return parsed;
  return { ...p, relatedTerms: p.relatedTerms.slice(0, TARGET_TERM_COUNT) };
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
