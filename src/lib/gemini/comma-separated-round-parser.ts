import {
  GeneratedRoundSchema,
  validateGeneratedRound,
  type GeneratedRound,
} from "./generated-round-zod-schema";
import { TARGET_TERM_COUNT } from "@/lib/config/game-limits-config";

/**
 * Parses the simplified comma-separated round format into a GeneratedRound.
 *
 * Format: `keyword, từ1, từ2, …, từ499`
 * - First token = keyword (rank 1, stored separately).
 * - Each following token = related term; rank inferred by position (token i → rank i + 1).
 * - Tokens separated by commas; surrounding whitespace trimmed; empty tokens dropped.
 *
 * Returns the validated round or a list of human-facing (Vietnamese) error messages.
 */
export function parseCommaSeparatedRound(text: string): {
  data: GeneratedRound | null;
  errors: string[];
} {
  const round = buildRawRoundFromCommaText(text);
  if (!round) {
    return {
      data: null,
      errors: ["Cần ít nhất 1 keyword và 1 từ liên quan, cách nhau bởi dấu phẩy."],
    };
  }

  const result = GeneratedRoundSchema.safeParse(round);
  if (!result.success) {
    return { data: null, errors: result.error.issues.map((i) => i.message) };
  }

  const extra = validateGeneratedRound(result.data);
  if (extra.length > 0) {
    return { data: null, errors: extra };
  }

  return { data: result.data, errors: [] };
}

/**
 * Splits comma-separated text into a raw (unvalidated) round shape.
 * Used by the Gemini service before its sanitize/truncate/validate pipeline.
 * Returns null when fewer than 2 non-empty tokens are present.
 */
export function buildRawRoundFromCommaText(
  text: string,
): { keyword: string; relatedTerms: { term: string; rank: number }[] } | null {
  const tokens = text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length < 2) return null;

  // Keyword occupies rank 1; keep at most TARGET_TERM_COUNT related terms, drop the excess.
  const [keyword, ...rest] = tokens;
  const terms = rest.slice(0, TARGET_TERM_COUNT);
  return {
    keyword,
    // First related term sits at rank 2 (keyword occupies rank 1).
    relatedTerms: terms.map((term, i) => ({ term, rank: i + 2 })),
  };
}
